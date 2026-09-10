import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { nanoid } from 'nanoid';
import { 
  ClientMessage, 
  ServerMessage, 
  CustomLobbyPlayer, 
  CustomRoomLobbyState 
} from '@card-battler/shared';
import { IRedisService, QueueEntry, redisService } from '../redis/redis-service.js';
import { MatchmakerService } from './matchmaker.service.js';
import { GameEngineService, OutboundEventMessage } from './game-engine.service.js';

export interface ExtendedWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  playerId?: string;
  playerName?: string;
  currentRoomCode?: string;
}

export interface CustomLobby {
  roomCode: string;
  host: CustomLobbyPlayer;
  guest?: CustomLobbyPlayer;
}

export class GatewayService {
  private wss: WebSocketServer;
  private redis: IRedisService;
  private matchmaker: MatchmakerService;
  private gameEngine: GameEngineService;
  private clients = new Map<string, ExtendedWebSocket>();
  private customLobbies = new Map<string, CustomLobby>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private outboundUnsub: (() => void) | null = null;

  constructor(
    httpServer: HttpServer,
    options: {
      redis?: IRedisService;
      matchmaker?: MatchmakerService;
      gameEngine?: GameEngineService;
    } = {}
  ) {
    this.redis = options.redis || redisService;
    this.matchmaker = options.matchmaker || new MatchmakerService(this.redis);
    this.gameEngine = options.gameEngine || new GameEngineService(this.redis);
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    this.setupOutboundListener();
    this.setupWebSocketServer();
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public getCustomLobbiesCount(): number {
    return this.customLobbies.size;
  }

  public send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public sendToSocketId(socketId: string, message: ServerMessage) {
    const ws = this.clients.get(socketId);
    if (ws) {
      this.send(ws, message);
    }
  }

  public broadcastToRoom(roomId: string, message: ServerMessage) {
    const room = this.gameEngine.getRoomManager().getRoom(roomId);
    if (!room) return;

    if (room.p1SocketId) this.sendToSocketId(room.p1SocketId, message);
    if (room.p2SocketId) this.sendToSocketId(room.p2SocketId, message);
  }

  /**
   * Subscribes to outbound game events from the Redis bus and routes to clients
   */
  private setupOutboundListener() {
    this.outboundUnsub = this.redis.subscribe(
      GameEngineService.OUTBOUND_EVENTS_CHANNEL,
      (data: unknown) => {
        const event = data as OutboundEventMessage;
        if (event.targetSocketId) {
          this.sendToSocketId(event.targetSocketId, event.message);
        } else if (event.roomId) {
          this.broadcastToRoom(event.roomId, event.message);
        }
      }
    );
  }

  /**
   * WebSocket client connection and routing logic
   */
  private setupWebSocketServer() {
    // 30s Heartbeat Check
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const extWs = ws as ExtendedWebSocket;
        if (!extWs.isAlive) {
          extWs.terminate();
          return;
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);

    this.wss.on('connection', (ws: WebSocket) => {
      const extWs = ws as ExtendedWebSocket;
      extWs.id = `sock_${nanoid(8)}`;
      extWs.isAlive = true;
      this.clients.set(extWs.id, extWs);

      extWs.on('pong', () => {
        extWs.isAlive = true;
      });

      extWs.on('message', async (data: Buffer) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());

          switch (message.type) {
            case 'PING': {
              this.send(extWs, { type: 'PONG', payload: { timestamp: Date.now() } });
              break;
            }

            // Quick Matchmaking via Redis Queue
            case 'JOIN_QUEUE': {
              const playerId = extWs.playerId || `p_${nanoid(6)}`;
              extWs.playerId = playerId;
              extWs.playerName = message.payload.playerName;

              const entry: QueueEntry = {
                socketId: extWs.id,
                playerId,
                playerName: message.payload.playerName,
                avatar: message.payload.avatar || 'cyber-runner',
                deckId: message.payload.deckId,
                rating: 1200,
                joinedAt: Date.now(),
              };

              const result = await this.matchmaker.addPlayer(entry);
              this.send(extWs, {
                type: 'QUEUE_STATUS',
                payload: { inQueue: true, queuePosition: result.queuePosition, timeInQueue: 0 },
              });
              break;
            }

            case 'LEAVE_QUEUE': {
              await this.matchmaker.removePlayer(extWs.id);
              this.send(extWs, {
                type: 'QUEUE_STATUS',
                payload: { inQueue: false, timeInQueue: 0 },
              });
              break;
            }

            // Play with Computer (AI Bot)
            case 'START_AI_MATCH': {
              const playerId = extWs.playerId || `p_${nanoid(6)}`;
              extWs.playerId = playerId;
              extWs.playerName = message.payload.playerName;

              await this.gameEngine.createAiMatch(
                playerId,
                message.payload.playerName,
                message.payload.avatar,
                message.payload.deckId,
                extWs.id,
                message.payload.aiDeckId
              );
              break;
            }

            // Play with Friends (Custom Rooms)
            case 'CREATE_CUSTOM_ROOM': {
              const playerId = extWs.playerId || `p_${nanoid(6)}`;
              extWs.playerId = playerId;
              extWs.playerName = message.payload.playerName;

              const roomCode = `ARENA-${Math.floor(1000 + Math.random() * 9000)}`;
              extWs.currentRoomCode = roomCode;

              const lobby: CustomLobby = {
                roomCode,
                host: {
                  socketId: extWs.id,
                  playerId,
                  playerName: message.payload.playerName,
                  avatar: message.payload.avatar,
                  deckId: message.payload.deckId,
                  isReady: true,
                },
              };

              this.customLobbies.set(roomCode, lobby);

              this.send(extWs, {
                type: 'CUSTOM_ROOM_STATE',
                payload: {
                  roomCode,
                  host: lobby.host,
                  guest: undefined,
                  isHost: true,
                  myPlayerId: playerId,
                },
              });
              break;
            }

            case 'JOIN_CUSTOM_ROOM': {
              let rawCode = message.payload.roomCode || '';
              let formattedCode = rawCode.trim().toUpperCase();
              if (formattedCode.includes('ROOM=')) {
                const match = formattedCode.match(/ROOM=([A-Z0-9_-]+)/i);
                if (match) formattedCode = match[1];
              }
              formattedCode = formattedCode.replace(/[^A-Z0-9]/g, '');
              if (formattedCode.startsWith('ARENA')) {
                formattedCode = formattedCode.substring(5);
              }
              if (formattedCode.length > 0) {
                formattedCode = `ARENA-${formattedCode}`;
              }
              const lobby = this.customLobbies.get(formattedCode);

              if (!lobby) {
                this.send(extWs, {
                  type: 'ERROR',
                  payload: { message: `Room code "${formattedCode}" not found. Please check the code and try again.` },
                });
                return;
              }

              if (lobby.guest && lobby.guest.socketId !== extWs.id) {
                this.send(extWs, {
                  type: 'ERROR',
                  payload: { message: 'This private room is already full (2/2 players).' },
                });
                return;
              }

              const playerId = extWs.playerId || `p_${nanoid(6)}`;
              extWs.playerId = playerId;
              extWs.playerName = message.payload.playerName;
              extWs.currentRoomCode = formattedCode;

              lobby.guest = {
                socketId: extWs.id,
                playerId,
                playerName: message.payload.playerName,
                avatar: message.payload.avatar,
                deckId: message.payload.deckId,
                isReady: true,
              };

              const hostWs = this.clients.get(lobby.host.socketId);
              if (hostWs) {
                this.send(hostWs, {
                  type: 'CUSTOM_ROOM_STATE',
                  payload: {
                    roomCode: formattedCode,
                    host: lobby.host,
                    guest: lobby.guest,
                    isHost: true,
                    myPlayerId: lobby.host.playerId,
                  },
                });
              }

              this.send(extWs, {
                type: 'CUSTOM_ROOM_STATE',
                payload: {
                  roomCode: formattedCode,
                  host: lobby.host,
                  guest: lobby.guest,
                  isHost: false,
                  myPlayerId: playerId,
                },
              });
              break;
            }

            case 'START_CUSTOM_MATCH': {
              let code = (message.payload.roomCode || '').trim().toUpperCase();
              if (code.includes('ROOM=')) {
                const match = code.match(/ROOM=([A-Z0-9_-]+)/i);
                if (match) code = match[1];
              }
              code = code.replace(/[^A-Z0-9]/g, '');
              if (code.startsWith('ARENA')) code = code.substring(5);
              if (code.length > 0) code = `ARENA-${code}`;

              const lobby = this.customLobbies.get(code) || this.customLobbies.get(message.payload.roomCode);
              if (!lobby || !lobby.guest) {
                this.send(extWs, {
                  type: 'ERROR',
                  payload: { message: 'Waiting for friend to join before starting battle.' },
                });
                return;
              }

              await this.gameEngine.createCustomMatch(
                {
                  id: lobby.host.playerId,
                  name: lobby.host.playerName,
                  avatar: lobby.host.avatar,
                  rating: 1200,
                  deckId: lobby.host.deckId,
                  socketId: lobby.host.socketId,
                },
                {
                  id: lobby.guest.playerId,
                  name: lobby.guest.playerName,
                  avatar: lobby.guest.avatar,
                  rating: 1200,
                  deckId: lobby.guest.deckId,
                  socketId: lobby.guest.socketId,
                }
              );

              this.customLobbies.delete(lobby.roomCode);
              break;
            }

            case 'LEAVE_CUSTOM_ROOM': {
              if (extWs.currentRoomCode) {
                const lobby = this.customLobbies.get(extWs.currentRoomCode);
                if (lobby) {
                  if (lobby.host.socketId === extWs.id) {
                    if (lobby.guest) {
                      const guestWs = this.clients.get(lobby.guest.socketId);
                      if (guestWs) {
                        this.send(guestWs, {
                          type: 'ERROR',
                          payload: { message: 'Host closed the private room.' },
                        });
                      }
                    }
                    this.customLobbies.delete(extWs.currentRoomCode);
                  } else if (lobby.guest?.socketId === extWs.id) {
                    lobby.guest = undefined;
                    const hostWs = this.clients.get(lobby.host.socketId);
                    if (hostWs) {
                      this.send(hostWs, {
                        type: 'CUSTOM_ROOM_STATE',
                        payload: {
                          roomCode: lobby.roomCode,
                          host: lobby.host,
                          guest: undefined,
                          isHost: true,
                        },
                      });
                    }
                  }
                }
                extWs.currentRoomCode = undefined;
              }
              break;
            }

            // Game Combat Action Forwarding to Redis Bus
            case 'GAME_ACTION': {
              const room = this.gameEngine.getRoomManager().getRoomBySocketId(extWs.id);
              if (!room) {
                this.send(extWs, {
                  type: 'ACTION_REJECTED',
                  payload: { reason: 'You are not in an active game room' },
                });
                return;
              }

              const playerId = extWs.playerId;
              if (!playerId) {
                this.send(extWs, {
                  type: 'ACTION_REJECTED',
                  payload: { reason: 'Unauthenticated player socket' },
                });
                return;
              }

              // Route action to Redis Inbound Action stream
              await this.redis.publish(GameEngineService.INBOUND_ACTIONS_CHANNEL, {
                roomId: room.roomId,
                playerId,
                socketId: extWs.id,
                action: message.payload,
              });
              break;
            }

            // Client State Resynchronization
            case 'SYNC_STATE': {
              const state = await this.gameEngine.syncRoomState(message.payload.roomId);
              if (state) {
                this.send(extWs, { type: 'GAME_STATE', payload: state });
              }
              break;
            }
          }
        } catch (err) {
          console.error('[Gateway] WebSocket message error:', err);
          this.send(extWs, {
            type: 'ERROR',
            payload: { message: 'Malformed message payload' },
          });
        }
      });

      extWs.on('close', async () => {
        await this.matchmaker.removePlayer(extWs.id);
        this.gameEngine.getRoomManager().handleSocketDisconnect(extWs.id);

        if (extWs.currentRoomCode) {
          const lobby = this.customLobbies.get(extWs.currentRoomCode);
          if (lobby) {
            if (lobby.host.socketId === extWs.id) {
              if (lobby.guest) {
                const guestWs = this.clients.get(lobby.guest.socketId);
                if (guestWs) {
                  this.send(guestWs, {
                    type: 'ERROR',
                    payload: { message: 'Host left the private room.' },
                  });
                }
              }
              this.customLobbies.delete(extWs.currentRoomCode);
            } else if (lobby.guest?.socketId === extWs.id) {
              lobby.guest = undefined;
              const hostWs = this.clients.get(lobby.host.socketId);
              if (hostWs) {
                this.send(hostWs, {
                  type: 'CUSTOM_ROOM_STATE',
                  payload: {
                    roomCode: lobby.roomCode,
                    host: lobby.host,
                    guest: undefined,
                    isHost: true,
                    myPlayerId: lobby.host.playerId,
                  },
                });
              }
            }
          }
        }

        this.clients.delete(extWs.id);
      });
    });
  }

  public destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.outboundUnsub) this.outboundUnsub();
    this.wss.close();
  }
}
