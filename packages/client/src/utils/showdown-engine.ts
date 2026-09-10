import { CardTemplate, CARD_DATABASE, PRESET_DECKS } from '@card-battler/shared';

export interface StatDuelResult {
  playerValue: number;
  opponentValue: number;
  winner: 'player' | 'opponent' | 'tie';
}

export interface RoundClashResult {
  winner: 'player' | 'opponent' | 'tie';
  playerCard: CardTemplate;
  opponentCard: CardTemplate;
  powerDuel: StatDuelResult;
  speedDuel: StatDuelResult;
  agilityDuel: StatDuelResult;
  playerWinsCount: number;
  opponentWinsCount: number;
  playerTotal: number;
  opponentTotal: number;
  reason: string;
}

export interface ShowdownMatchState {
  universeId: string;
  round: number; // 1 to 5
  maxRounds: number; // 5
  playerScore: number;
  opponentScore: number;
  playerHand: CardTemplate[];
  opponentHand: CardTemplate[];
  playedPlayerCard: CardTemplate | null;
  playedOpponentCard: CardTemplate | null;
  lastClashResult: RoundClashResult | null;
  currentLeader: 'player' | 'opponent'; // Who leads first in the current round
  phase: 'player_turn' | 'opponent_thinking' | 'clash_reveal' | 'match_ended';
  matchWinner: 'player' | 'opponent' | 'tie' | null;
}

/**
 * Shuffles array in-place
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles the universe deck and deals 5 cards each to player and opponent
 */
export function initShowdownMatch(
  universeId: string = 'marvel-avengers',
  opponentUniverseId?: string,
  startingLeader: 'player' | 'opponent' = 'player'
): ShowdownMatchState {
  const playerPreset = PRESET_DECKS.find((d) => d.id === universeId) || PRESET_DECKS[0];
  const oppPreset = opponentUniverseId
    ? PRESET_DECKS.find((d) => d.id === opponentUniverseId) || PRESET_DECKS[0]
    : playerPreset;
  
  // Collect all card templates in player's universe deck
  const playerFullDeck: CardTemplate[] = [];
  for (const cardId of playerPreset.cardIds) {
    const template = CARD_DATABASE.find((c) => c.id === cardId);
    if (template && template.type === 'minion') {
      playerFullDeck.push(template);
    }
  }

  // Collect all card templates in opponent's universe deck
  const oppFullDeck: CardTemplate[] = [];
  for (const cardId of oppPreset.cardIds) {
    const template = CARD_DATABASE.find((c) => c.id === cardId);
    if (template && template.type === 'minion') {
      oppFullDeck.push(template);
    }
  }

  // Shuffle the universe cards
  const playerHand = shuffle(playerFullDeck).slice(0, 5);
  const opponentHand = shuffle(oppFullDeck).slice(0, 5);

  return {
    universeId,
    round: 1,
    maxRounds: 5,
    playerScore: 0,
    opponentScore: 0,
    playerHand,
    opponentHand,
    playedPlayerCard: null,
    playedOpponentCard: null,
    lastClashResult: null,
    currentLeader: startingLeader,
    phase: 'player_turn',
    matchWinner: null,
  };
}

/**
 * Evaluates the 3-Stat Clash between Player card and Opponent card
 * (Power, Speed, Agility)
 */
export function evaluateShowdownClash(
  playerCard: CardTemplate,
  opponentCard: CardTemplate
): RoundClashResult {
  const pPWR = playerCard.attack;
  const oPWR = opponentCard.attack;

  const pSPD = playerCard.speed || 5;
  const oSPD = opponentCard.speed || 5;

  const pAGI = playerCard.agility || 5;
  const oAGI = opponentCard.agility || 5;

  const powerDuel: StatDuelResult = {
    playerValue: pPWR,
    opponentValue: oPWR,
    winner: pPWR > oPWR ? 'player' : pPWR < oPWR ? 'opponent' : 'tie',
  };

  const speedDuel: StatDuelResult = {
    playerValue: pSPD,
    opponentValue: oSPD,
    winner: pSPD > oSPD ? 'player' : pSPD < oSPD ? 'opponent' : 'tie',
  };

  const agilityDuel: StatDuelResult = {
    playerValue: pAGI,
    opponentValue: oAGI,
    winner: pAGI > oAGI ? 'player' : pAGI < oAGI ? 'opponent' : 'tie',
  };

  let playerWinsCount = 0;
  let opponentWinsCount = 0;

  if (powerDuel.winner === 'player') playerWinsCount++;
  else if (powerDuel.winner === 'opponent') opponentWinsCount++;

  if (speedDuel.winner === 'player') playerWinsCount++;
  else if (speedDuel.winner === 'opponent') opponentWinsCount++;

  if (agilityDuel.winner === 'player') playerWinsCount++;
  else if (agilityDuel.winner === 'opponent') opponentWinsCount++;

  const playerTotal = pPWR + pSPD + pAGI;
  const opponentTotal = oPWR + oSPD + oAGI;

  let winner: 'player' | 'opponent' | 'tie' = 'tie';
  let reason = '';

  if (playerWinsCount > opponentWinsCount) {
    winner = 'player';
    reason = `${playerCard.name} won ${playerWinsCount} of 3 stats!`;
  } else if (opponentWinsCount > playerWinsCount) {
    winner = 'opponent';
    reason = `${opponentCard.name} won ${opponentWinsCount} of 3 stats!`;
  } else {
    // Tie-breaker by Total Combat Power
    if (playerTotal > opponentTotal) {
      winner = 'player';
      reason = `${playerCard.name} won by Total Combat Score (${playerTotal} vs ${opponentTotal})!`;
    } else if (opponentTotal > playerTotal) {
      winner = 'opponent';
      reason = `${opponentCard.name} won by Total Combat Score (${opponentTotal} vs ${playerTotal})!`;
    } else {
      winner = 'tie';
      reason = `Evenly matched! Both cards tied with ${playerTotal} Total Power!`;
    }
  }

  return {
    winner,
    playerCard,
    opponentCard,
    powerDuel,
    speedDuel,
    agilityDuel,
    playerWinsCount,
    opponentWinsCount,
    playerTotal,
    opponentTotal,
    reason,
  };
}

/**
 * Computer AI chooses a strategic lead card when it loses a round and is forced to play first
 */
export function chooseAiLeadCard(aiHand: CardTemplate[]): CardTemplate {
  if (aiHand.length === 1) return aiHand[0];

  // Sort by total combat score
  const sorted = [...aiHand].sort((a, b) => {
    const totalA = (a.attack || 0) + (a.speed || 5) + (a.agility || 5);
    const totalB = (b.attack || 0) + (b.speed || 5) + (b.agility || 5);
    return totalA - totalB;
  });

  // Pick the median-power card to avoid immediately burning its strongest card
  const midIndex = Math.floor(sorted.length / 2);
  return sorted[midIndex];
}

/**
 * Computer AI chooses the best counter-card from its hand against the player's lead card
 */
export function chooseAiCounterCard(
  aiHand: CardTemplate[],
  playerCard: CardTemplate
): CardTemplate {
  if (aiHand.length === 1) return aiHand[0];

  // Evaluate each card against player's card
  const evaluated = aiHand.map((card) => {
    const clash = evaluateShowdownClash(playerCard, card);
    const aiWon = clash.winner === 'opponent';
    const totalPower = (card.attack || 0) + (card.speed || 5) + (card.agility || 5);
    return { card, aiWon, aiWinsCount: clash.opponentWinsCount, totalPower };
  });

  // Filter winning cards
  const winningCards = evaluated.filter((e) => e.aiWon);

  if (winningCards.length > 0) {
    // Pick the most efficient winning card (lowest total power among winners to save big guns)
    winningCards.sort((a, b) => a.totalPower - b.totalPower);
    return winningCards[0].card;
  }

  // If AI cannot win this round, sacrifice its lowest power card
  evaluated.sort((a, b) => a.totalPower - b.totalPower);
  return evaluated[0].card;
}
