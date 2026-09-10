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
  myPlayerId?: string;
}

export interface ShowdownStartPayload {
  roomId: string;
  hostPlayerId: string;
  hostPlayerName: string;
  hostDeckId: string;
  guestPlayerId: string;
  guestPlayerName: string;
  guestDeckId: string;
  startingLeader: 'host' | 'guest';
}

export interface ShowdownActionPayload {
  roomId: string;
  action: 'PLAY_CARD' | 'NEXT_ROUND' | 'REMATCH' | 'SURRENDER';
  card?: any;
  round?: number;
  nextLeader?: 'player' | 'opponent';
  senderPlayerId?: string;
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
  | { type: 'SHOWDOWN_ACTION'; payload: ShowdownActionPayload }
  | { type: 'GAME_ACTION'; payload: PlayerActionPayload }
  | { type: 'SYNC_STATE'; payload: { roomId: string } }
  | { type: 'PING' };

// Server to Client Messages
export type ServerMessage =
  | { type: 'QUEUE_STATUS'; payload: { inQueue: boolean; queuePosition?: number; timeInQueue: number } }
  | { type: 'MATCH_FOUND'; payload: { roomId: string; opponentName: string; opponentAvatar: string; opponentRating: number; yourPlayerId?: string } }
  | { type: 'CUSTOM_ROOM_STATE'; payload: CustomRoomLobbyState }
  | { type: 'SHOWDOWN_START'; payload: ShowdownStartPayload }
  | { type: 'SHOWDOWN_ACTION'; payload: ShowdownActionPayload }
  | { type: 'GAME_STATE'; payload: GameState }
  | { type: 'ACTION_REJECTED'; payload: { reason: string; actionType?: string; actionId?: string; currentState?: GameState } }
  | { type: 'ACTION_CONFIRMED'; payload: { actionType: string; timestamp: number; actionId?: string; stateVersion?: number } }
  | { type: 'PONG'; payload: { timestamp: number } }
  | { type: 'ERROR'; payload: { message: string; code?: string } };
