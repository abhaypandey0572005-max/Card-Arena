import { 
  GameState, 
  PlayerState, 
  CardInstance, 
  CardTemplate, 
  CombatLogEntry, 
  PlayCardPayload, 
  AttackMinionPayload, 
  AttackHeroPayload 
} from '@card-battler/shared';
import { CARD_DATABASE, PRESET_DECKS } from '@card-battler/shared';
import { nanoid } from 'nanoid';

const MAX_HAND_SIZE = 7;
const MAX_BOARD_SIZE = 6;
const MAX_MANA = 10;
const INITIAL_HP = 30;
const TURN_DURATION_SECONDS = 30;

export interface PlayerInitConfig {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  deckId: string;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createCardInstance(template: CardTemplate): CardInstance {
  return {
    ...template,
    instanceId: `card_${nanoid(8)}`,
    currentHealth: template.health,
    maxHealth: template.health,
    currentAttack: template.attack,
    currentSpeed: template.speed || 5,
    currentAgility: template.agility || 5,
    canAttack: false,
    attacksThisTurn: 0,
    hasShield: !!template.isShielded,
  };
}

function buildDeckInstances(deckId: string): CardInstance[] {
  const preset = PRESET_DECKS.find((d) => d.id === deckId) || PRESET_DECKS[0];
  const instances: CardInstance[] = [];

  for (const cardId of preset.cardIds) {
    const template = CARD_DATABASE.find((c) => c.id === cardId);
    if (template) {
      instances.push(createCardInstance(template));
    }
  }

  return shuffle(instances);
}

export function createInitialGameState(
  roomId: string,
  p1Config: PlayerInitConfig,
  p2Config: PlayerInitConfig
): { state: GameState; p1Deck: CardInstance[]; p2Deck: CardInstance[] } {
  const p1FullDeck = buildDeckInstances(p1Config.deckId);
  const p2FullDeck = buildDeckInstances(p2Config.deckId);

  const p1Hand = p1FullDeck.splice(0, 3);
  const p2Hand = p2FullDeck.splice(0, 4);

  const players: Record<string, PlayerState> = {
    [p1Config.id]: {
      id: p1Config.id,
      name: p1Config.name,
      avatar: p1Config.avatar,
      rating: p1Config.rating,
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      mana: 1,
      maxMana: 1,
      shield: 0,
      hand: p1Hand,
      board: [],
      deckCount: p1FullDeck.length,
      graveyardCount: 0,
      isConnected: true,
      disconnectGraceSeconds: 30,
    },
    [p2Config.id]: {
      id: p2Config.id,
      name: p2Config.name,
      avatar: p2Config.avatar,
      rating: p2Config.rating,
      hp: INITIAL_HP,
      maxHp: INITIAL_HP,
      mana: 0,
      maxMana: 0,
      shield: 0,
      hand: p2Hand,
      board: [],
      deckCount: p2FullDeck.length,
      graveyardCount: 0,
      isConnected: true,
      disconnectGraceSeconds: 30,
    },
  };

  const actionLog: CombatLogEntry[] = [
    {
      id: nanoid(6),
      timestamp: Date.now(),
      type: 'game_start',
      message: `Multiverse Match: ${p1Config.name} vs ${p2Config.name}!`,
    },
    {
      id: nanoid(6),
      timestamp: Date.now(),
      playerId: p1Config.id,
      playerName: p1Config.name,
      type: 'turn_start',
      message: `Turn 1: ${p1Config.name}'s turn (1 Energy).`,
    },
  ];

  const state: GameState = {
    roomId,
    turn: 1,
    turnStartTime: Date.now(),
    turnDurationSeconds: TURN_DURATION_SECONDS,
    turnTimeRemaining: TURN_DURATION_SECONDS,
    phase: 'active',
    activePlayerId: p1Config.id,
    playerOrder: [p1Config.id, p2Config.id],
    players,
    winnerId: null,
    winReason: null,
    actionLog,
  };

  return { state, p1Deck: p1FullDeck, p2Deck: p2FullDeck };
}

export function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

function appendLog(
  state: GameState,
  type: CombatLogEntry['type'],
  message: string,
  playerId?: string,
  playerName?: string
) {
  state.actionLog.push({
    id: nanoid(6),
    timestamp: Date.now(),
    type,
    message,
    playerId,
    playerName,
  });
}

export function checkGameOver(state: GameState): boolean {
  if (state.phase === 'ended') return true;

  const [p1Id, p2Id] = state.playerOrder;
  const p1 = state.players[p1Id];
  const p2 = state.players[p2Id];

  if (p1.hp <= 0 && p2.hp <= 0) {
    state.phase = 'ended';
    state.winnerId = null;
    state.winReason = 'Both heroes fell in battle. Draw match!';
    appendLog(state, 'game_over', state.winReason);
    return true;
  } else if (p1.hp <= 0) {
    state.phase = 'ended';
    state.winnerId = p2Id;
    state.winReason = `${p2.name} claimed Victory!`;
    appendLog(state, 'game_over', state.winReason, p2Id, p2.name);
    return true;
  } else if (p2.hp <= 0) {
    state.phase = 'ended';
    state.winnerId = p1Id;
    state.winReason = `${p1.name} claimed Victory!`;
    appendLog(state, 'game_over', state.winReason, p1Id, p1.name);
    return true;
  }

  return false;
}

export function executePlayCard(
  state: GameState,
  playerId: string,
  payload: PlayCardPayload,
  playerDeck: CardInstance[]
): { success: boolean; error?: string } {
  if (state.phase !== 'active') return { success: false, error: 'Game is not active' };
  if (state.activePlayerId !== playerId) return { success: false, error: 'Not your turn' };

  const player = state.players[playerId];
  const opponentId = state.playerOrder.find((id) => id !== playerId)!;
  const opponent = state.players[opponentId];

  const cardIndex = player.hand.findIndex((c) => c.instanceId === payload.cardInstanceId);
  if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

  const card = player.hand[cardIndex];

  if (player.mana < card.manaCost) {
    return { success: false, error: `Need ${card.manaCost} Energy (Have ${player.mana})` };
  }

  if (card.type === 'minion' && player.board.length >= MAX_BOARD_SIZE) {
    return { success: false, error: 'Battlefield is full (Max 6 units)' };
  }

  player.mana -= card.manaCost;
  player.hand.splice(cardIndex, 1);

  if (card.type === 'minion') {
    card.canAttack = !!card.isRush;
    card.attacksThisTurn = 0;
    player.board.push(card);

    appendLog(
      state,
      'play_card',
      `${player.name} deployed [${card.name}] (PWR:${card.currentAttack} SPD:${card.currentSpeed} AGI:${card.currentAgility} HP:${card.currentHealth}) for ${card.manaCost} Energy.`,
      playerId,
      player.name
    );

    if (card.effect) {
      triggerCardEffect(state, card.effect, player, opponent, playerDeck, payload);
    }
  } else if (card.type === 'spell') {
    player.graveyardCount += 1;
    appendLog(
      state,
      'spell_cast',
      `${player.name} cast [${card.name}] for ${card.manaCost} Energy!`,
      playerId,
      player.name
    );

    if (card.effect) {
      triggerCardEffect(state, card.effect, player, opponent, playerDeck, payload);
    }
  }

  resolveBoardDeaths(state);
  checkGameOver(state);

  return { success: true };
}

function triggerCardEffect(
  state: GameState,
  effect: NonNullable<CardTemplate['effect']>,
  player: PlayerState,
  opponent: PlayerState,
  playerDeck: CardInstance[],
  payload: PlayCardPayload
) {
  switch (effect.type) {
    case 'heal_hero':
      player.hp = Math.min(player.maxHp, player.hp + effect.value);
      appendLog(state, 'spell_cast', `${player.name}'s Hero healed for +${effect.value} HP!`);
      break;

    case 'shield_hero':
      player.shield += effect.value;
      appendLog(state, 'spell_cast', `${player.name}'s Hero gained +${effect.value} Armor Shield!`);
      break;

    case 'direct_damage': {
      if (payload.targetInstanceId) {
        const targetMinion =
          opponent.board.find((m) => m.instanceId === payload.targetInstanceId) ||
          player.board.find((m) => m.instanceId === payload.targetInstanceId);
        if (targetMinion) {
          applyDamageToMinion(targetMinion, effect.value);
          appendLog(state, 'spell_cast', `Target [${targetMinion.name}] took ${effect.value} damage!`);
        }
      } else {
        applyDamageToPlayer(opponent, effect.value);
        appendLog(state, 'spell_cast', `${opponent.name}'s Hero took ${effect.value} direct damage!`);
      }
      break;
    }

    case 'aoe_damage':
      for (const minion of opponent.board) {
        applyDamageToMinion(minion, effect.value);
      }
      applyDamageToPlayer(opponent, effect.value);
      appendLog(state, 'spell_cast', `Super Move dealt ${effect.value} AOE damage to all enemy units and hero!`);
      break;

    case 'draw_card':
      drawCard(player, playerDeck, state);
      break;
  }
}

export function applyDamageToPlayer(player: PlayerState, damage: number) {
  if (player.shield > 0) {
    if (player.shield >= damage) {
      player.shield -= damage;
      return;
    } else {
      const remainingDamage = damage - player.shield;
      player.shield = 0;
      player.hp -= remainingDamage;
      return;
    }
  }
  player.hp -= damage;
}

export function applyDamageToMinion(minion: CardInstance, rawDamage: number): number {
  if (minion.hasShield) {
    minion.hasShield = false;
    return 0;
  }
  // Agility mitigates up to floor(Agility / 3) damage (min 1 damage dealt)
  const mitigation = Math.min(Math.floor(minion.currentAgility / 3), rawDamage - 1);
  const finalDamage = Math.max(1, rawDamage - mitigation);
  minion.currentHealth -= finalDamage;
  return finalDamage;
}

export function resolveBoardDeaths(state: GameState) {
  for (const playerId of state.playerOrder) {
    const player = state.players[playerId];
    const deadMinions = player.board.filter((m) => m.currentHealth <= 0);
    if (deadMinions.length > 0) {
      player.graveyardCount += deadMinions.length;
      for (const dead of deadMinions) {
        appendLog(state, 'minion_death', `[${dead.name}] was defeated.`);
      }
      player.board = player.board.filter((m) => m.currentHealth > 0);
    }
  }
}

/**
 * Combat with Speed Initiative and Agility Mitigation
 */
export function executeAttackMinion(
  state: GameState,
  playerId: string,
  payload: AttackMinionPayload
): { success: boolean; error?: string } {
  if (state.phase !== 'active') return { success: false, error: 'Game is not active' };
  if (state.activePlayerId !== playerId) return { success: false, error: 'Not your turn' };

  const player = state.players[playerId];
  const opponentId = state.playerOrder.find((id) => id !== playerId)!;
  const opponent = state.players[opponentId];

  const attacker = player.board.find((m) => m.instanceId === payload.attackerInstanceId);
  if (!attacker) return { success: false, error: 'Attacker not on your board' };
  if (!attacker.canAttack || attacker.attacksThisTurn >= 1) {
    return { success: false, error: 'This unit cannot attack this turn' };
  }

  const target = opponent.board.find((m) => m.instanceId === payload.targetInstanceId);
  if (!target) return { success: false, error: 'Target unit not found' };

  const enemyHasTaunt = opponent.board.some((m) => m.isTaunt);
  if (enemyHasTaunt && !target.isTaunt) {
    return { success: false, error: 'You must attack a unit with Taunt first!' };
  }

  attacker.canAttack = false;
  attacker.attacksThisTurn += 1;

  // SPEED INITIATIVE CHECK
  if (attacker.currentSpeed >= target.currentSpeed) {
    // Attacker strikes first!
    const dmgToTarget = applyDamageToMinion(target, attacker.currentAttack);
    
    if (target.currentHealth <= 0) {
      appendLog(
        state,
        'attack_minion',
        `⚡ SPEED STRIKE: [${attacker.name}] (SPD ${attacker.currentSpeed}) struck first for ${dmgToTarget} damage and eliminated [${target.name}] before retaliation!`,
        playerId,
        player.name
      );
    } else {
      // Defender survives and counter-attacks
      const dmgToAttacker = applyDamageToMinion(attacker, target.currentAttack);
      appendLog(
        state,
        'attack_minion',
        `[${attacker.name}] struck [${target.name}] for ${dmgToTarget} damage (took ${dmgToAttacker} counter-strike).`,
        playerId,
        player.name
      );
    }
  } else {
    // Defender had superior speed and counter-parries!
    const dmgToAttacker = applyDamageToMinion(attacker, target.currentAttack);
    if (attacker.currentHealth <= 0) {
      appendLog(
        state,
        'attack_minion',
        `🛡️ SPEED PARRY: [${target.name}] (SPD ${target.currentSpeed}) counter-struck first for ${dmgToAttacker} damage, defeating [${attacker.name}]!`,
        playerId,
        player.name
      );
    } else {
      const dmgToTarget = applyDamageToMinion(target, attacker.currentAttack);
      appendLog(
        state,
        'attack_minion',
        `[${attacker.name}] attacked [${target.name}] for ${dmgToTarget} damage (took ${dmgToAttacker} counter-strike).`,
        playerId,
        player.name
      );
    }
  }

  resolveBoardDeaths(state);
  checkGameOver(state);

  return { success: true };
}

export function executeAttackHero(
  state: GameState,
  playerId: string,
  payload: AttackHeroPayload
): { success: boolean; error?: string } {
  if (state.phase !== 'active') return { success: false, error: 'Game is not active' };
  if (state.activePlayerId !== playerId) return { success: false, error: 'Not your turn' };

  const player = state.players[playerId];
  const opponentId = state.playerOrder.find((id) => id !== playerId)!;
  const opponent = state.players[opponentId];

  const attacker = player.board.find((m) => m.instanceId === payload.attackerInstanceId);
  if (!attacker) return { success: false, error: 'Attacker not on your board' };
  if (!attacker.canAttack || attacker.attacksThisTurn >= 1) {
    return { success: false, error: 'This unit cannot attack this turn' };
  }

  const enemyHasTaunt = opponent.board.some((m) => m.isTaunt);
  if (enemyHasTaunt) {
    return { success: false, error: 'Cannot attack Hero while Taunt units protect them!' };
  }

  applyDamageToPlayer(opponent, attacker.currentAttack);
  attacker.canAttack = false;
  attacker.attacksThisTurn += 1;

  appendLog(
    state,
    'attack_hero',
    `💥 [${attacker.name}] struck ${opponent.name}'s Hero directly for ${attacker.currentAttack} Power!`,
    playerId,
    player.name
  );

  checkGameOver(state);

  return { success: true };
}

export function drawCard(
  player: PlayerState,
  playerDeck: CardInstance[],
  state: GameState
): boolean {
  if (playerDeck.length === 0) {
    player.hp -= 2;
    appendLog(state, 'spell_cast', `${player.name} takes 2 Fatigue damage!`);
    return false;
  }

  const card = playerDeck.shift()!;
  player.deckCount = playerDeck.length;

  if (player.hand.length < MAX_HAND_SIZE) {
    player.hand.push(card);
    return true;
  } else {
    player.graveyardCount += 1;
    appendLog(state, 'spell_cast', `${player.name}'s hand was full! [${card.name}] was discarded.`);
    return false;
  }
}

export function executeEndTurn(
  state: GameState,
  playerId: string,
  p1Deck: CardInstance[],
  p2Deck: CardInstance[]
): { success: boolean; error?: string } {
  if (state.phase !== 'active') return { success: false, error: 'Game is not active' };
  if (state.activePlayerId !== playerId) return { success: false, error: 'Not your turn' };

  const nextPlayerId = state.playerOrder.find((id) => id !== playerId)!;
  const nextPlayer = state.players[nextPlayerId];
  const nextPlayerDeck = nextPlayerId === state.playerOrder[0] ? p1Deck : p2Deck;

  state.activePlayerId = nextPlayerId;
  state.turn += 1;
  state.turnStartTime = Date.now();
  state.turnTimeRemaining = TURN_DURATION_SECONDS;

  nextPlayer.maxMana = Math.min(MAX_MANA, nextPlayer.maxMana + 1);
  nextPlayer.mana = nextPlayer.maxMana;

  drawCard(nextPlayer, nextPlayerDeck, state);

  for (const minion of nextPlayer.board) {
    minion.canAttack = true;
    minion.attacksThisTurn = 0;
  }

  appendLog(
    state,
    'turn_start',
    `Turn ${state.turn}: ${nextPlayer.name}'s turn (${nextPlayer.mana} Energy).`,
    nextPlayerId,
    nextPlayer.name
  );

  checkGameOver(state);

  return { success: true };
}

export function executeSurrender(
  state: GameState,
  playerId: string
): { success: boolean } {
  if (state.phase === 'ended') return { success: true };

  const winnerId = state.playerOrder.find((id) => id !== playerId)!;
  const loser = state.players[playerId];
  const winner = state.players[winnerId];

  state.phase = 'ended';
  state.winnerId = winnerId;
  state.winReason = `${loser.name} surrendered. ${winner.name} is victorious!`;

  appendLog(state, 'game_over', state.winReason, winnerId, winner.name);

  return { success: true };
}
