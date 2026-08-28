import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { 
  ClientMessage, 
  ServerMessage, 
  GameState, 
  CustomLobbyPlayer, 
  CustomRoomLobbyState 
} from '@card-battler/shared';
import { RoomManager } from '../engine/room-manager.js';
import { Matchmaker, QueueEntry } from '../matchmaking/matchmaker.js';
import { AiBotController, AI_PLAYER_ID, AI_PLAYER_NAME, AI_AVATAR } from '../engine/ai-bot.js';
import { nanoid } from 'nanoid';

interface ExtendedWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  playerId?: string;
  playerName?: string;
  currentRoomCode?: string;
}

interface CustomLobby {
  roomCode: string;
  host: CustomLobbyPlayer;
  guest?: CustomLobbyPlayer;
}

export function createGameWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const roomManager = new RoomManager();
  const aiBotController = new AiBotController(roomManager);

  const clients = new Map<string, ExtendedWebSocket>();
  const customLobbies = new Map<string, CustomLobby>();

  function send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Quick Matchmaking Hub
  const matchmaker = new Matchmaker((roomId, p1, p2) => {
    const ws1 = clients.get(p1.socketId);
    const ws2 = clients.get(p2.socketId);

    const broadcastRoom = (state: GameState) => {
      const socket1 = clients.get(p1.socketId);
      const socket2 = clients.get(p2.socketId);
      if (socket1) send(socket1, { type: 'GAME_STATE', payload: state });
      if (socket2) send(socket2, { type: 'GAME_STATE', payload: state });
    };

    const handleGameOver = (rId: string, winnerId: string | null) => {
      console.log(`[Game Over] Room: ${rId}, Winner: ${winnerId || 'Draw'}`);
    };

    const room = roomManager.createRoom(
      roomId,
      {
        id: p1.playerId,
        name: p1.playerName,
        avatar: p1.avatar,
        rating: p1.rating,
        deckId: p1.deckId,
        socketId: p1.socketId,
      },
      {
        id: p2.playerId,
        name: p2.playerName,
        avatar: p2.avatar,
        rating: p2.rating,
        deckId: p2.deckId,
        socketId: p2.socketId,
      },
      broadcastRoom,
      handleGameOver
    );

    if (ws1) {
      send(ws1, {
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          opponentName: p2.playerName,
          opponentAvatar: p2.avatar,
          opponentRating: p2.rating,
        },
      });
      send(ws1, { type: 'GAME_STATE', payload: room.state });
    }

    if (ws2) {
      send(ws2, {
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          opponentName: p1.playerName,
          opponentAvatar: p1.avatar,
          opponentRating: p1.rating,
        },
      });
      send(ws2, { type: 'GAME_STATE', payload: room.state });
    }
  });

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (!extWs.isAlive) {
        extWs.terminate();
        return;
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    matchmaker.destroy();
  });

  wss.on('connection', (ws: WebSocket) => {
    const extWs = ws as ExtendedWebSocket;
    extWs.id = `sock_${nanoid(8)}`;
    extWs.isAlive = true;
    clients.set(extWs.id, extWs);

    extWs.on('pong', () => {
      extWs.isAlive = true;
    });

    extWs.on('message', async (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'PING': {
            send(extWs, { type: 'PONG', payload: { timestamp: Date.now() } });
            break;
          }

          // Quick Matchmaking
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

            const result = matchmaker.addToQueue(entry);
            send(extWs, {
              type: 'QUEUE_STATUS',
              payload: { inQueue: true, queuePosition: result.queuePosition, timeInQueue: 0 },
            });
            break;
          }

          case 'LEAVE_QUEUE': {
            matchmaker.removeFromQueue(extWs.id);
            send(extWs, {
              type: 'QUEUE_STATUS',
              payload: { inQueue: false, timeInQueue: 0 },
            });
            break;
          }

          // ================= PLAY WITH COMPUTER (AI) =================
          case 'START_AI_MATCH': {
            const playerId = extWs.playerId || `p_${nanoid(6)}`;
            extWs.playerId = playerId;
            extWs.playerName = message.payload.playerName;

            const roomId = `room_ai_${nanoid(8)}`;
            const aiDeckId = message.payload.aiDeckId || 'anime-allstars';

            const broadcastRoom = (state: GameState) => {
              const socket = clients.get(extWs.id);
              if (socket) send(socket, { type: 'GAME_STATE', payload: state });
              // Check if AI turn triggered
              aiBotController.checkAndExecuteAiTurn(roomId, state);
            };

            const handleGameOver = (rId: string) => {
              aiBotController.cleanupRoom(rId);
            };

            const room = roomManager.createRoom(
              roomId,
              {
                id: playerId,
                name: message.payload.playerName,
                avatar: message.payload.avatar || 'cyber-runner',
                rating: 1200,
                deckId: message.payload.deckId,
                socketId: extWs.id,
              },
              {
                id: AI_PLAYER_ID,
                name: AI_PLAYER_NAME,
                avatar: AI_AVATAR,
                rating: 1250,
                deckId: aiDeckId,
                socketId: 'sock_ai_bot',
              },
              broadcastRoom,
              handleGameOver
            );

            send(extWs, {
              type: 'MATCH_FOUND',
              payload: {
                roomId,
                opponentName: AI_PLAYER_NAME,
                opponentAvatar: AI_AVATAR,
                opponentRating: 1250,
              },
            });
            send(extWs, { type: 'GAME_STATE', payload: room.state });
            break;
          }

          // ================= PLAY WITH FRIENDS (CUSTOM ROOMS) =================
          case 'CREATE_CUSTOM_ROOM': {
            const playerId = extWs.playerId || `p_${nanoid(6)}`;
            extWs.playerId = playerId;
            extWs.playerName = message.payload.playerName;

            // Generate 6-digit room code: ARENA-XXXX
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

            customLobbies.set(roomCode, lobby);

            send(extWs, {
              type: 'CUSTOM_ROOM_STATE',
              payload: {
                roomCode,
                host: lobby.host,
                guest: undefined,
                isHost: true,
              },
            });
            break;
          }

          case 'JOIN_CUSTOM_ROOM': {
            const formattedCode = message.payload.roomCode.trim().toUpperCase();
            const lobby = customLobbies.get(formattedCode);

            if (!lobby) {
              send(extWs, {
                type: 'ERROR',
                payload: { message: `Room code "${formattedCode}" not found. Please check and try again.` },
              });
              return;
            }

            if (lobby.guest && lobby.guest.socketId !== extWs.id) {
              send(extWs, {
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

            const hostWs = clients.get(lobby.host.socketId);
            if (hostWs) {
              send(hostWs, {
                type: 'CUSTOM_ROOM_STATE',
                payload: {
                  roomCode: formattedCode,
                  host: lobby.host,
                  guest: lobby.guest,
                  isHost: true,
                },
              });
            }

            send(extWs, {
              type: 'CUSTOM_ROOM_STATE',
              payload: {
                roomCode: formattedCode,
                host: lobby.host,
                guest: lobby.guest,
                isHost: false,
              },
            });
            break;
          }

          case 'START_CUSTOM_MATCH': {
            const lobby = customLobbies.get(message.payload.roomCode);
            if (!lobby || !lobby.guest) {
              send(extWs, {
                type: 'ERROR',
                payload: { message: 'Waiting for friend to join before starting battle.' },
              });
              return;
            }

            const hostWs = clients.get(lobby.host.socketId);
            const guestWs = clients.get(lobby.guest.socketId);
            const roomId = `room_custom_${nanoid(8)}`;

            const broadcastRoom = (state: GameState) => {
              if (hostWs) send(hostWs, { type: 'GAME_STATE', payload: state });
              if (guestWs) send(guestWs, { type: 'GAME_STATE', payload: state });
            };

            const handleGameOver = () => {
              customLobbies.delete(lobby.roomCode);
            };

            const room = roomManager.createRoom(
              roomId,
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
              },
              broadcastRoom,
              handleGameOver
            );

            if (hostWs) {
              send(hostWs, {
                type: 'MATCH_FOUND',
                payload: {
                  roomId,
                  opponentName: lobby.guest.playerName,
                  opponentAvatar: lobby.guest.avatar,
                  opponentRating: 1200,
                },
              });
              send(hostWs, { type: 'GAME_STATE', payload: room.state });
            }

            if (guestWs) {
              send(guestWs, {
                type: 'MATCH_FOUND',
                payload: {
                  roomId,
                  opponentName: lobby.host.playerName,
                  opponentAvatar: lobby.host.avatar,
                  opponentRating: 1200,
                },
              });
              send(guestWs, { type: 'GAME_STATE', payload: room.state });
            }

            customLobbies.delete(lobby.roomCode);
            break;
          }

          case 'LEAVE_CUSTOM_ROOM': {
            if (extWs.currentRoomCode) {
              const lobby = customLobbies.get(extWs.currentRoomCode);
              if (lobby) {
                if (lobby.host.socketId === extWs.id) {
                  // Host left -> inform guest & delete lobby
                  if (lobby.guest) {
                    const guestWs = clients.get(lobby.guest.socketId);
                    if (guestWs) {
                      send(guestWs, {
                        type: 'ERROR',
                        payload: { message: 'Host closed the private room.' },
                      });
                    }
                  }
                  customLobbies.delete(extWs.currentRoomCode);
                } else if (lobby.guest?.socketId === extWs.id) {
                  // Guest left
                  lobby.guest = undefined;
                  const hostWs = clients.get(lobby.host.socketId);
                  if (hostWs) {
                    send(hostWs, {
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

          // Game Combat Actions
          case 'GAME_ACTION': {
            const room = roomManager.getRoomBySocketId(extWs.id);
            if (!room) {
              send(extWs, {
                type: 'ACTION_REJECTED',
                payload: { reason: 'You are not in an active game room' },
              });
              return;
            }

            const playerId = extWs.playerId;
            if (!playerId) {
              send(extWs, {
                type: 'ACTION_REJECTED',
                payload: { reason: 'Unauthenticated player socket' },
              });
              return;
            }

            const result = await roomManager.dispatchAction(room.roomId, playerId, message.payload);
            if (!result.success) {
              send(extWs, {
                type: 'ACTION_REJECTED',
                payload: { reason: result.error || 'Action failed', actionType: message.payload.type },
              });
            } else {
              send(extWs, {
                type: 'ACTION_CONFIRMED',
                payload: { actionType: message.payload.type, timestamp: Date.now() },
              });
              // Check if AI turn should trigger
              aiBotController.checkAndExecuteAiTurn(room.roomId, room.state);
            }
            break;
          }
        }
      } catch (err: unknown) {
        console.error('Error handling WebSocket message:', err);
        send(extWs, {
          type: 'ERROR',
          payload: { message: 'Invalid message payload' },
        });
      }
    });

    extWs.on('close', () => {
      matchmaker.removeFromQueue(extWs.id);
      roomManager.handleSocketDisconnect(extWs.id);

      if (extWs.currentRoomCode) {
        const lobby = customLobbies.get(extWs.currentRoomCode);
        if (lobby) {
          if (lobby.host.socketId === extWs.id) {
            customLobbies.delete(extWs.currentRoomCode);
          } else if (lobby.guest?.socketId === extWs.id) {
            lobby.guest = undefined;
          }
        }
      }

      clients.delete(extWs.id);
    });
  });

  return { wss, roomManager, matchmaker, customLobbies };
}
