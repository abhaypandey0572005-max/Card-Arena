import { describe, it, expect } from 'vitest';
import { 
  createInitialGameState, 
  executePlayCard, 
  executeAttackMinion, 
  executeAttackHero, 
  executeEndTurn,
  createCardInstance
} from '../engine/state-machine.js';
import { CARD_DATABASE } from '@card-battler/shared';

describe('Multi-Stat Combat & State Machine Engine', () => {
  const p1 = { id: 'p1', name: 'Alice', avatar: 'cyber-runner', rating: 1200, deckId: 'marvel-avengers' };
  const p2 = { id: 'p2', name: 'Bob', avatar: 'arcane-mage', rating: 1200, deckId: 'dc-justice' };

  it('initializes game with correct hands, mana, and HP', () => {
    const { state } = createInitialGameState('test_room', p1, p2);

    expect(state.phase).toBe('active');
    expect(state.turn).toBe(1);
    expect(state.activePlayerId).toBe('p1');
    expect(state.players['p1'].hand.length).toBe(3);
    expect(state.players['p2'].hand.length).toBe(4);
    expect(state.players['p1'].hp).toBe(30);
  });

  it('summons a unit with full 5-stat profile and image', () => {
    const { state, p1Deck } = createInitialGameState('test_room', p1, p2);
    const spiderman = createCardInstance(CARD_DATABASE.find(c => c.id === 'marvel-spiderman')!);
    state.players['p1'].hand = [spiderman];
    state.players['p1'].mana = 2;

    const result = executePlayCard(state, 'p1', { cardInstanceId: spiderman.instanceId }, p1Deck);
    expect(result.success).toBe(true);
    expect(state.players['p1'].board[0].currentSpeed).toBe(9);
    expect(state.players['p1'].board[0].currentAgility).toBe(9);
    expect(state.players['p1'].board[0].imageUrl).toBeDefined();
  });

  it('resolves Speed Strike priority (high speed eliminates defender before counter)', () => {
    const { state } = createInitialGameState('test_room', p1, p2);

    // Attacker: Levi (SPD 10, PWR 4, HP 2)
    const levi = createCardInstance(CARD_DATABASE.find(c => c.id === 'anime-levi')!);
    levi.canAttack = true;
    state.players['p1'].board = [levi];

    // Defender: Low speed minion (SPD 4, HP 2, PWR 5)
    const blastoise = createCardInstance(CARD_DATABASE.find(c => c.id === 'pkmn-blastoise')!);
    blastoise.currentHealth = 2; // Low HP so 1 hit defeats it
    state.players['p2'].board = [blastoise];

    const result = executeAttackMinion(state, 'p1', {
      attackerInstanceId: levi.instanceId,
      targetInstanceId: blastoise.instanceId,
    });

    expect(result.success).toBe(true);
    // Blastoise should be eliminated
    expect(state.players['p2'].board.length).toBe(0);
    // Levi should NOT have taken counter damage because of Speed strike priority!
    expect(levi.currentHealth).toBe(2);
  });

  it('handles Divine Shield absorption', () => {
    const { state } = createInitialGameState('test_room', p1, p2);

    const attacker = createCardInstance(CARD_DATABASE.find(c => c.id === 'marvel-thor')!);
    attacker.canAttack = true;
    state.players['p1'].board = [attacker];

    const shieldMinion = createCardInstance(CARD_DATABASE.find(c => c.id === 'dc-superman')!);
    state.players['p2'].board = [shieldMinion];

    expect(shieldMinion.hasShield).toBe(true);
    const initialHealth = shieldMinion.currentHealth;

    const result = executeAttackMinion(state, 'p1', {
      attackerInstanceId: attacker.instanceId,
      targetInstanceId: shieldMinion.instanceId,
    });

    expect(result.success).toBe(true);
    expect(shieldMinion.hasShield).toBe(false);
    expect(shieldMinion.currentHealth).toBe(initialHealth);
  });
});
