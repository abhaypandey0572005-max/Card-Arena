import { CardInstance } from './card.js';

export type GamePhase = 'waiting' | 'active' | 'ended';

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  hand: CardInstance[];
  board: CardInstance[];
  deckCount: number;
  graveyardCount: number;
  isConnected: boolean;
  disconnectGraceSeconds: number;
}

export type CombatLogType =
  | 'game_start'
  | 'turn_start'
  | 'play_card'
  | 'attack_minion'
  | 'attack_hero'
  | 'spell_cast'
  | 'minion_death'
  | 'game_over'
  | 'disconnect'
  | 'reconnect';

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  playerId?: string;
  playerName?: string;
  type: CombatLogType;
  message: string;
  details?: Record<string, unknown>;
}

export interface GameState {
  roomId: string;
  turn: number;
  turnStartTime: number;
  turnDurationSeconds: number;
  turnTimeRemaining: number;
  phase: GamePhase;
  activePlayerId: string;
  playerOrder: [string, string];
  players: Record<string, PlayerState>;
  winnerId: string | null;
  winReason: string | null;
  actionLog: CombatLogEntry[];
}

export type PlayerActionType =
  | 'PLAY_CARD'
  | 'ATTACK_MINION'
  | 'ATTACK_HERO'
  | 'END_TURN'
  | 'SURRENDER'
  | 'EMOTE';

export interface PlayCardPayload {
  cardInstanceId: string;
  boardIndex?: number;
  targetInstanceId?: string;
  targetPlayerId?: string;
}

export interface AttackMinionPayload {
  attackerInstanceId: string;
  targetInstanceId: string;
}

export interface AttackHeroPayload {
  attackerInstanceId: string;
  targetPlayerId: string;
}

export interface EmotePayload {
  emote: 'taunt' | 'salute' | 'oops' | 'gg' | 'thinking';
}

export type PlayerActionPayload =
  | { type: 'PLAY_CARD'; payload: PlayCardPayload }
  | { type: 'ATTACK_MINION'; payload: AttackMinionPayload }
  | { type: 'ATTACK_HERO'; payload: AttackHeroPayload }
  | { type: 'END_TURN'; payload?: Record<string, never> }
  | { type: 'SURRENDER'; payload?: Record<string, never> }
  | { type: 'EMOTE'; payload: EmotePayload };
