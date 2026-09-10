import { 
  GameState, 
  PlayerActionPayload, 
  ServerMessage 
} from '@card-battler/shared';
import { RoomManager, GameRoom } from '../engine/room-manager.js';
import { AiBotController, AI_PLAYER_ID, AI_PLAYER_NAME, AI_AVATAR } from '../engine/ai-bot.js';
import { IRedisService, redisService } from '../redis/redis-service.js';
import { MatchCreatedPayload, MatchmakerService } from './matchmaker.service.js';
import { PlayerInitConfig } from '../engine/state-machine.js';

export interface InboundActionMessage {
  roomId: string;
  playerId: string;
  socketId: string;
  action: PlayerActionPayload;
}

export interface OutboundEventMessage {
  targetSocketId?: string;
  roomId?: string;
  message: ServerMessage;
}

export class GameEngineService {
  private roomManager: RoomManager;
  private aiBotController: AiBotController;
  private redis: IRedisService;
  private unsubs: Array<() => void> = [];

  public static INBOUND_ACTIONS_CHANNEL = 'arena:inbound:actions';
  public static OUTBOUND_EVENTS_CHANNEL = 'arena:outbound:events';

  constructor(redis: IRedisService = redisService, roomManager?: RoomManager) {
    this.redis = redis;
    this.roomManager = roomManager || new RoomManager();
    this.aiBotController = new AiBotController(this.roomManager);
  }

  public getRoomManager(): RoomManager {
    return this.roomManager;
  }

  public getAiBotController(): AiBotController {
    return this.aiBotController;
  }

  /**
   * Starts event listeners for Match Creation and Inbound Actions
   */
  public start() {
    // 1. Subscribe to Matchmaker events
    const matchCreatedUnsub = this.redis.subscribe(
      MatchmakerService.MATCH_CREATED_CHANNEL,
      (data: unknown) => {
        this.handleMatchCreated(data as MatchCreatedPayload);
      }
    );
    this.unsubs.push(matchCreatedUnsub);

    // 2. Subscribe to Inbound player actions
    const actionsUnsub = this.redis.subscribe(
      GameEngineService.INBOUND_ACTIONS_CHANNEL,
      async (data: unknown) => {
        await this.handleInboundAction(data as InboundActionMessage);
      }
    );
    this.unsubs.push(actionsUnsub);

    console.log('⚡ [Game Engine Service] Authoritative Engine & Concurrency Handlers initialized');
  }

  public stop() {
    this.unsubs.forEach((unsub) => unsub());
    this.unsubs = [];
  }

  /**
   * Broadcast an outbound event to the Redis bus for the Gateway to deliver
   */
  private async publishOutbound(event: OutboundEventMessage) {
    await this.redis.publish(GameEngineService.OUTBOUND_EVENTS_CHANNEL, event);
  }

  /**
   * Handles a match created by the Matchmaking Service
   */
  public async handleMatchCreated(payload: MatchCreatedPayload) {
    const { roomId, p1, p2 } = payload;

    const broadcastRoom = async (state: GameState) => {
      // Save state to Redis for persistence and sync
      await this.redis.setRoomState(roomId, state);

      // Broadcast to room
      await this.publishOutbound({
        roomId,
        message: { type: 'GAME_STATE', payload: state },
      });
    };

    const handleGameOver = (rId: string, winnerId: string | null) => {
      console.log(`🏆 [Game Engine Service] Room ${rId} finished. Winner: ${winnerId || 'Draw'}`);
    };

    const room = this.roomManager.createRoom(
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

    // Persist initial state
    await this.redis.setRoomState(roomId, room.state);

    // Notify Player 1
    await this.publishOutbound({
      targetSocketId: p1.socketId,
      message: {
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          opponentName: p2.playerName,
          opponentAvatar: p2.avatar,
          opponentRating: p2.rating,
        },
      },
    });
    await this.publishOutbound({
      targetSocketId: p1.socketId,
      message: { type: 'GAME_STATE', payload: room.state },
    });

    // Notify Player 2
    await this.publishOutbound({
      targetSocketId: p2.socketId,
      message: {
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          opponentName: p1.playerName,
          opponentAvatar: p1.avatar,
          opponentRating: p1.rating,
        },
      },
    });
    await this.publishOutbound({
      targetSocketId: p2.socketId,
      message: { type: 'GAME_STATE', payload: room.state },
    });
  }

  /**
   * Initializes an AI Bot match
   */
  public async createAiMatch(
    playerId: string,
    playerName: string,
    avatar: string,
    deckId: string,
    socketId: string,
    aiDeckId: string = 'anime-allstars'
  ): Promise<GameRoom> {
    const roomId = `room_ai_${Date.now()}`;

    const broadcastRoom = async (state: GameState) => {
      await this.redis.setRoomState(roomId, state);
      await this.publishOutbound({
        targetSocketId: socketId,
        message: { type: 'GAME_STATE', payload: state },
      });
      // Check if AI turn triggered
      this.aiBotController.checkAndExecuteAiTurn(roomId, state);
    };

    const handleGameOver = (rId: string) => {
      this.aiBotController.cleanupRoom(rId);
    };

    const room = this.roomManager.createRoom(
      roomId,
      {
        id: playerId,
        name: playerName,
        avatar: avatar || 'cyber-runner',
        rating: 1200,
        deckId,
        socketId,
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

    await this.redis.setRoomState(roomId, room.state);

    await this.publishOutbound({
      targetSocketId: socketId,
      message: {
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          opponentName: AI_PLAYER_NAME,
          opponentAvatar: AI_AVATAR,
          opponentRating: 1250,
        },
      },
    });
    await this.publishOutbound({
      targetSocketId: socketId,
      message: { type: 'GAME_STATE', payload: room.state },
    });

    return room;
  }

  /**
   * Initializes a private custom match between friends
   */
  public async createCustomMatch(
    hostConfig: PlayerInitConfig & { socketId: string },
    guestConfig: PlayerInitConfig & { socketId: string }
  ): Promise<GameRoom> {
    const roomId = `room_custom_${Date.now()}`;

    const broadcastRoom = async (state: GameState) => {
      await this.redis.setRoomState(roomId, state);
      await this.publishOutbound({
        roomId,
        message: { type: 'GAME_STATE', payload: state },
      });
    };

    const handleGameOver = (rId: string) => {
      console.log(`Private match ${rId} completed`);
    };

    const room = this.roomManager.createRoom(
      roomId,
      hostConfig,
      guestConfig,
      broadcastRoom,
      handleGameOver
    );

    await this.redis.setRoomState(roomId, room.state);

    // Notify Host
    await this.publishOutbound({
      targetSocketId: hostConfig.socketId,
      message: {
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          opponentName: guestConfig.name,
          opponentAvatar: guestConfig.avatar,
          opponentRating: guestConfig.rating,
          yourPlayerId: hostConfig.id,
        },
      },
    });
    await this.publishOutbound({
      targetSocketId: hostConfig.socketId,
      message: { type: 'GAME_STATE', payload: room.state },
    });

    // Notify Guest
    await this.publishOutbound({
      targetSocketId: guestConfig.socketId,
      message: {
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          opponentName: hostConfig.name,
          opponentAvatar: hostConfig.avatar,
          opponentRating: hostConfig.rating,
          yourPlayerId: guestConfig.id,
        },
      },
    });
    await this.publishOutbound({
      targetSocketId: guestConfig.socketId,
      message: { type: 'GAME_STATE', payload: room.state },
    });

    return room;
  }

  /**
   * Processes player combat actions with:
   * 1. Distributed Mutex Lock (SET arena:lock:room:roomId NX PX 3000)
   * 2. Action Idempotency Deduplication (SET arena:action:actionId EX 15 NX)
   * 3. Optimistic Concurrency Control (OCC) stateVersion validation
   */
  public async handleInboundAction(data: InboundActionMessage) {
    const { roomId, playerId, socketId, action } = data;

    // 1. Action Idempotency & Deduplication check
    if (action.actionId) {
      const isFreshAction = await this.redis.checkAndSetIdempotency(action.actionId, 15);
      if (!isFreshAction) {
        console.warn(`⚠️ [Idempotency] Duplicate or retransmitted action ignored: ${action.actionId}`);
        // Return confirmed ack to stop client retries without re-applying game effect
        await this.publishOutbound({
          targetSocketId: socketId,
          message: {
            type: 'ACTION_CONFIRMED',
            payload: {
              actionType: action.type,
              actionId: action.actionId,
              timestamp: Date.now(),
            },
          },
        });
        return;
      }
    }

    // 2. Acquire Distributed Mutex Lock for Room
    const lockKey = `room:${roomId}`;
    const lock = await this.redis.acquireLock(lockKey, 3000);
    if (!lock.acquired) {
      // Room state is currently locked by another concurrent process
      await this.publishOutbound({
        targetSocketId: socketId,
        message: {
          type: 'ACTION_REJECTED',
          payload: {
            reason: 'Room is busy processing a concurrent action. Please try again.',
            actionType: action.type,
            actionId: action.actionId,
          },
        },
      });
      return;
    }

    try {
      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        await this.publishOutbound({
          targetSocketId: socketId,
          message: {
            type: 'ACTION_REJECTED',
            payload: {
              reason: 'Game room not found or has ended',
              actionType: action.type,
              actionId: action.actionId,
            },
          },
        });
        return;
      }

      // 3. Dispatch Action through RoomManager (OCC stateVersion validation happens here)
      const result = await this.roomManager.dispatchAction(roomId, playerId, action);

      if (!result.success) {
        await this.publishOutbound({
          targetSocketId: socketId,
          message: {
            type: 'ACTION_REJECTED',
            payload: {
              reason: result.error || 'Action failed',
              actionType: action.type,
              actionId: action.actionId,
              currentState: result.versionMismatch ? room.state : undefined,
            },
          },
        });
      } else {
        // Confirm action and notify acting client
        await this.publishOutbound({
          targetSocketId: socketId,
          message: {
            type: 'ACTION_CONFIRMED',
            payload: {
              actionType: action.type,
              actionId: action.actionId,
              stateVersion: result.stateVersion,
              timestamp: Date.now(),
            },
          },
        });

        // Check if AI turn should trigger
        this.aiBotController.checkAndExecuteAiTurn(room.roomId, room.state);
      }
    } finally {
      // 4. Safely Release Distributed Lock
      await this.redis.releaseLock(lockKey, lock.token);
    }
  }

  /**
   * Resyncs state for a client that missed packets or reconnected
   */
  public async syncRoomState(roomId: string): Promise<GameState | null> {
    const room = this.roomManager.getRoom(roomId);
    if (room) return room.state;
    return await this.redis.getRoomState(roomId);
  }
}
