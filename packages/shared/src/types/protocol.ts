import { GameState, PlayerActionPayload } from './game.js';

export interface CustomLobbyPlayer {
  socketId: string;
  playerId: string;
  playerName: string;
  avatar: string;
  deckId: string;
  isReady: boolean;
}

export interface CustomRoomLobbyState {
  roomCode: string;
  host: CustomLobbyPlayer;
  guest?: CustomLobbyPlayer;
  isHost: boolean;
}

// Client to Server Messages
export type ClientMessage =
  | { type: 'JOIN_QUEUE'; payload: { playerName: string; avatar: string; deckId: string } }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'CREATE_CUSTOM_ROOM'; payload: { playerName: string; avatar: string; deckId: string } }
  | { type: 'JOIN_CUSTOM_ROOM'; payload: { roomCode: string; playerName: string; avatar: string; deckId: string } }
  | { type: 'LEAVE_CUSTOM_ROOM'; payload: { roomCode: string } }
  | { type: 'START_CUSTOM_MATCH'; payload: { roomCode: string } }
  | { type: 'START_AI_MATCH'; payload: { playerName: string; avatar: string; deckId: string; aiDeckId?: string } }
  | { type: 'GAME_ACTION'; payload: PlayerActionPayload }
  | { type: 'PING' };

// Server to Client Messages
export type ServerMessage =
  | { type: 'QUEUE_STATUS'; payload: { inQueue: boolean; queuePosition?: number; timeInQueue: number } }
  | { type: 'MATCH_FOUND'; payload: { roomId: string; opponentName: string; opponentAvatar: string; opponentRating: number } }
  | { type: 'CUSTOM_ROOM_STATE'; payload: CustomRoomLobbyState }
  | { type: 'GAME_STATE'; payload: GameState }
  | { type: 'ACTION_REJECTED'; payload: { reason: string; actionType?: string } }
  | { type: 'ACTION_CONFIRMED'; payload: { actionType: string; timestamp: number } }
  | { type: 'PONG'; payload: { timestamp: number } }
  | { type: 'ERROR'; payload: { message: string; code?: string } };
