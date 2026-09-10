import { describe, it, expect } from 'vitest';
import { 
  createInitialGameState, 
  executePlayCard, 
  executeAttackMinion, 
  createCardInstance
} from '../engine/state-machine.js';
import { RoomManager } from '../engine/room-manager.js';
import { RedisService } from '../redis/redis-service.js';
import { CARD_DATABASE } from '@card-battler/shared';

describe('Multi-Stat Combat & State Machine Engine', () => {
  const p1 = { id: 'p1', name: 'Alice', avatar: 'cyber-runner', rating: 1200, deckId: 'marvel-avengers' };
  const p2 = { id: 'p2', name: 'Bob', avatar: 'arcane-mage', rating: 1200, deckId: 'dc-justice' };

  it('initializes game with correct hands, mana, and HP', () => {
    const { state } = createInitialGameState('test_room', p1, p2);

    expect(state.phase).toBe('active');
    expect(state.turn).toBe(1);
    expect(state.stateVersion).toBe(1);
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

    // Attacker: Levi (SPD 10, PWR 4, HP 4)
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
    expect(levi.currentHealth).toBe(4);
  });

  it('handles Divine Shield absorption', () => {
    const { state } = createInitialGameState('test_room', p1, p2);

    // Attacker with high health so it survives parry
    const attacker = createCardInstance(CARD_DATABASE.find(c => c.id === 'marvel-thor')!);
    attacker.currentHealth = 25;
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
    // Shield absorbed attack damage!
    expect(shieldMinion.hasShield).toBe(false);
    expect(shieldMinion.currentHealth).toBe(initialHealth);
  });
});

describe('Concurrency & Optimistic Concurrency Control (OCC)', () => {
  const p1 = { id: 'p1', name: 'Alice', avatar: 'cyber-runner', rating: 1200, deckId: 'marvel-avengers', socketId: 's1' };
  const p2 = { id: 'p2', name: 'Bob', avatar: 'arcane-mage', rating: 1200, deckId: 'dc-justice', socketId: 's2' };

  it('increments stateVersion on valid actions and rejects stale expectedVersion', async () => {
    const rm = new RoomManager();
    const room = rm.createRoom('occ_room', p1, p2, () => {}, () => {});

    expect(room.state.stateVersion).toBe(1);

    // End turn with matching version 1
    const res1 = await rm.dispatchAction('occ_room', 'p1', {
      type: 'END_TURN',
      expectedVersion: 1,
    });
    expect(res1.success).toBe(true);
    expect(res1.stateVersion).toBe(2);
    expect(room.state.stateVersion).toBe(2);

    // Attempt action with outdated version 1 (simulating race condition / lagged packet)
    const res2 = await rm.dispatchAction('occ_room', 'p2', {
      type: 'END_TURN',
      expectedVersion: 1,
    });
    expect(res2.success).toBe(false);
    expect(res2.versionMismatch).toBe(true);
    expect(res2.error).toContain('State version mismatch');

    rm.removeRoom('occ_room');
  });

  it('RedisService supports distributed locks and action idempotency deduplication', async () => {
    const redis = new RedisService();

    // 1. Mutex Lock Test
    const lock1 = await redis.acquireLock('test_mutex', 2000);
    expect(lock1.acquired).toBe(true);

    // Second acquire on same key should fail while held
    const lock2 = await redis.acquireLock('test_mutex', 2000);
    expect(lock2.acquired).toBe(false);

    // Release with correct token
    const released = await redis.releaseLock('test_mutex', lock1.token);
    expect(released).toBe(true);

    // Re-acquire after release should now succeed
    const lock3 = await redis.acquireLock('test_mutex', 2000);
    expect(lock3.acquired).toBe(true);
    await redis.releaseLock('test_mutex', lock3.token);

    // 2. Action Idempotency Test
    const actionId = 'test_act_123';
    const isFirstTime = await redis.checkAndSetIdempotency(actionId, 5);
    expect(isFirstTime).toBe(true);

    // Immediate second attempt with identical actionId must be rejected
    const isDuplicate = await redis.checkAndSetIdempotency(actionId, 5);
    expect(isDuplicate).toBe(false);

    await redis.close();
  });
});
