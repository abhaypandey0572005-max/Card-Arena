import { GameState, CardInstance } from '@card-battler/shared';
import { RoomManager } from './room-manager.js';

export const AI_PLAYER_ID = 'player_ai_bot';
export const AI_PLAYER_NAME = 'Chrono AI (Bot)';
export const AI_AVATAR = 'cyber-runner';

export class AiBotController {
  private activeTimers = new Map<string, NodeJS.Timeout>();

  constructor(private roomManager: RoomManager) {}

  /**
   * Evaluates if it's the AI's turn in a given room, and schedules actions
   */
  public checkAndExecuteAiTurn(roomId: string, state: GameState) {
    if (state.phase !== 'active') return;
    if (state.activePlayerId !== AI_PLAYER_ID) return;

    // Clear any existing timer for this room
    if (this.activeTimers.has(roomId)) {
      clearTimeout(this.activeTimers.get(roomId)!);
    }

    const timer = setTimeout(async () => {
      await this.runAiTurn(roomId);
    }, 1200);

    this.activeTimers.set(roomId, timer);
  }

  private async runAiTurn(roomId: string) {
    const room = this.roomManager.getRoom(roomId);
    if (!room || room.state.phase !== 'ended' && room.state.activePlayerId !== AI_PLAYER_ID) return;

    const state = room.state;
    const bot = state.players[AI_PLAYER_ID];
    const opponentId = state.playerOrder.find((id) => id !== AI_PLAYER_ID)!;
    const opponent = state.players[opponentId];

    try {
      // 1. Play Cards from Hand
      let playableCards = bot.hand.filter((c) => c.manaCost <= bot.mana);
      while (playableCards.length > 0 && bot.board.length < 6) {
        const cardToPlay = playableCards[0];

        let targetInstanceId: string | undefined = undefined;
        // If targeted direct damage, pick opponent minion or hero
        if (cardToPlay.effect?.type === 'direct_damage') {
          if (opponent.board.length > 0) {
            targetInstanceId = opponent.board[0].instanceId;
          }
        }

        await this.roomManager.dispatchAction(roomId, AI_PLAYER_ID, {
          type: 'PLAY_CARD',
          payload: {
            cardInstanceId: cardToPlay.instanceId,
            targetInstanceId,
          },
        });

        // Re-evaluate hand & mana
        playableCards = bot.hand.filter((c) => c.manaCost <= bot.mana);
      }

      // 2. Attack with Ready Minions
      const readyMinions = bot.board.filter((m) => m.canAttack && m.attacksThisTurn === 0);
      const enemyHasTaunt = opponent.board.some((m) => m.isTaunt);
      const enemyTauntMinion = opponent.board.find((m) => m.isTaunt);

      for (const attacker of readyMinions) {
        if (enemyHasTaunt && enemyTauntMinion) {
          await this.roomManager.dispatchAction(roomId, AI_PLAYER_ID, {
            type: 'ATTACK_MINION',
            payload: {
              attackerInstanceId: attacker.instanceId,
              targetInstanceId: enemyTauntMinion.instanceId,
            },
          });
        } else {
          // Attack opponent Hero directly!
          await this.roomManager.dispatchAction(roomId, AI_PLAYER_ID, {
            type: 'ATTACK_HERO',
            payload: {
              attackerInstanceId: attacker.instanceId,
              targetPlayerId: opponentId,
            },
          });
        }
      }

      // 3. End Turn
      await new Promise((res) => setTimeout(res, 600));
      await this.roomManager.dispatchAction(roomId, AI_PLAYER_ID, {
        type: 'END_TURN',
      });
    } catch (err) {
      console.error('Error during AI turn execution:', err);
    }
  }

  public cleanupRoom(roomId: string) {
    if (this.activeTimers.has(roomId)) {
      clearTimeout(this.activeTimers.get(roomId)!);
      this.activeTimers.delete(roomId);
    }
  }
}
