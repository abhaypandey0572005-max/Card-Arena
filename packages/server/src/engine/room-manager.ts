import { 
  GameState, 
  PlayerActionPayload, 
  CardInstance 
} from '@card-battler/shared';
import { 
  createInitialGameState, 
  executePlayCard, 
  executeAttackMinion, 
  executeAttackHero, 
  executeEndTurn, 
  executeSurrender, 
  PlayerInitConfig,
  cloneGameState 
} from './state-machine.js';

export interface GameRoom {
  roomId: string;
  state: GameState;
  p1Deck: CardInstance[];
  p2Deck: CardInstance[];
  p1SocketId: string | null;
  p2SocketId: string | null;
  timerInterval: NodeJS.Timeout | null;
  actionQueue: Promise<void>;
  broadcast: (state: GameState) => void;
  onGameOver: (roomId: string, winnerId: string | null) => void;
}

export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private socketToRoom = new Map<string, string>(); // socketId -> roomId

  /**
   * Spawns a new active game room
   */
  public createRoom(
    roomId: string,
    p1Config: PlayerInitConfig & { socketId: string },
    p2Config: PlayerInitConfig & { socketId: string },
    broadcast: (state: GameState) => void,
    onGameOver: (roomId: string, winnerId: string | null) => void
  ): GameRoom {
    const { state, p1Deck, p2Deck } = createInitialGameState(roomId, p1Config, p2Config);

    const room: GameRoom = {
      roomId,
      state,
      p1Deck,
      p2Deck,
      p1SocketId: p1Config.socketId,
      p2SocketId: p2Config.socketId,
      timerInterval: null,
      actionQueue: Promise.resolve(),
      broadcast,
      onGameOver,
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(p1Config.socketId, roomId);
    this.socketToRoom.set(p2Config.socketId, roomId);

    this.startRoomTimer(room);
    return room;
  }

  /**
   * Starts the 1-second authoritative server tick for the room
   */
  private startRoomTimer(room: GameRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.timerInterval = setInterval(() => {
      if (room.state.phase === 'ended') {
        if (room.timerInterval) clearInterval(room.timerInterval);
        return;
      }

      // Decrement turn timer
      if (room.state.turnTimeRemaining > 0) {
        room.state.turnTimeRemaining -= 1;
      }

      // Check if turn expired
      if (room.state.turnTimeRemaining <= 0) {
        this.dispatchAction(room.roomId, room.state.activePlayerId, { type: 'END_TURN' });
      }

      // Check disconnect grace timer for disconnected players
      for (const playerId of room.state.playerOrder) {
        const player = room.state.players[playerId];
        if (!player.isConnected && player.disconnectGraceSeconds > 0) {
          player.disconnectGraceSeconds -= 1;
          if (player.disconnectGraceSeconds <= 0) {
            // Disconnect timeout -> auto surrender
            this.dispatchAction(room.roomId, playerId, { type: 'SURRENDER' });
          }
        }
      }

      room.broadcast(cloneGameState(room.state));
    }, 1000);
  }

  /**
   * Dispatches a player action into the room's serialized queue to prevent race conditions
   */
  public async dispatchAction(
    roomId: string,
    playerId: string,
    action: PlayerActionPayload
  ): Promise<{ success: boolean; error?: string }> {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    return new Promise((resolve) => {
      room.actionQueue = room.actionQueue.then(async () => {
        try {
          const result = this.applyAction(room, playerId, action);
          if (result.success) {
            room.broadcast(cloneGameState(room.state));
            if (room.state.phase === 'ended') {
              if (room.timerInterval) clearInterval(room.timerInterval);
              room.onGameOver(room.roomId, room.state.winnerId);
            }
          }
          resolve(result);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Action execution failed';
          resolve({ success: false, error: errorMsg });
        }
      });
    });
  }

  /**
   * Direct synchronous action application
   */
  private applyAction(
    room: GameRoom,
    playerId: string,
    action: PlayerActionPayload
  ): { success: boolean; error?: string } {
    const state = room.state;
    const isP1 = playerId === state.playerOrder[0];
    const playerDeck = isP1 ? room.p1Deck : room.p2Deck;

    switch (action.type) {
      case 'PLAY_CARD':
        return executePlayCard(state, playerId, action.payload, playerDeck);

      case 'ATTACK_MINION':
        return executeAttackMinion(state, playerId, action.payload);

      case 'ATTACK_HERO':
        return executeAttackHero(state, playerId, action.payload);

      case 'END_TURN':
        return executeEndTurn(state, playerId, room.p1Deck, room.p2Deck);

      case 'SURRENDER':
        return executeSurrender(state, playerId);

      default:
        return { success: false, error: 'Unknown action type' };
    }
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomBySocketId(socketId: string): GameRoom | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  /**
   * Handles player disconnection with 30s grace window
   */
  public handleSocketDisconnect(socketId: string) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    let disconnectedPlayerId: string | null = null;
    if (room.p1SocketId === socketId) {
      room.p1SocketId = null;
      disconnectedPlayerId = room.state.playerOrder[0];
    } else if (room.p2SocketId === socketId) {
      room.p2SocketId = null;
      disconnectedPlayerId = room.state.playerOrder[1];
    }

    if (disconnectedPlayerId && room.state.phase === 'active') {
      const player = room.state.players[disconnectedPlayerId];
      player.isConnected = false;
      player.disconnectGraceSeconds = 30;
      room.state.actionLog.push({
        id: `dc_${Date.now()}`,
        timestamp: Date.now(),
        type: 'disconnect',
        message: `${player.name} disconnected. 30s grace period to reconnect...`,
        playerId: disconnectedPlayerId,
        playerName: player.name,
      });
      room.broadcast(cloneGameState(room.state));
    }

    this.socketToRoom.delete(socketId);
  }

  /**
   * Handles player reconnecting back into active match
   */
  public handleReconnect(roomId: string, playerId: string, newSocketId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || room.state.phase === 'ended') return null;

    if (room.state.playerOrder[0] === playerId) {
      room.p1SocketId = newSocketId;
    } else if (room.state.playerOrder[1] === playerId) {
      room.p2SocketId = newSocketId;
    } else {
      return null;
    }

    const player = room.state.players[playerId];
    player.isConnected = true;
    player.disconnectGraceSeconds = 30;

    this.socketToRoom.set(newSocketId, roomId);

    room.state.actionLog.push({
      id: `rec_${Date.now()}`,
      timestamp: Date.now(),
      type: 'reconnect',
      message: `${player.name} reconnected to the match!`,
      playerId,
      playerName: player.name,
    });

    room.broadcast(cloneGameState(room.state));
    return room;
  }

  public removeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.p1SocketId) this.socketToRoom.delete(room.p1SocketId);
      if (room.p2SocketId) this.socketToRoom.delete(room.p2SocketId);
      this.rooms.delete(roomId);
    }
  }
}
