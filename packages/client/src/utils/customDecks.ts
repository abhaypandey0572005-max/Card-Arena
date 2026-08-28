import { DeckPreset, PRESET_DECKS, CARD_DATABASE, CardTemplate } from '@card-battler/shared';

const CUSTOM_DECKS_KEY = 'card_arena_custom_decks';

export function loadAllDecks(): DeckPreset[] {
  try {
    const saved = localStorage.getItem(CUSTOM_DECKS_KEY);
    if (saved) {
      const customDecks: DeckPreset[] = JSON.parse(saved);
      return [...PRESET_DECKS, ...customDecks];
    }
  } catch (e) {
    console.error('Failed to load custom decks', e);
  }
  return [...PRESET_DECKS];
}

export function saveCustomDeck(deck: DeckPreset): DeckPreset[] {
  try {
    const saved = localStorage.getItem(CUSTOM_DECKS_KEY);
    let customDecks: DeckPreset[] = saved ? JSON.parse(saved) : [];

    const existingIndex = customDecks.findIndex((d) => d.id === deck.id);
    if (existingIndex >= 0) {
      customDecks[existingIndex] = deck;
    } else {
      customDecks.push(deck);
    }

    localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(customDecks));
    return [...PRESET_DECKS, ...customDecks];
  } catch (e) {
    console.error('Failed to save custom deck', e);
    return [...PRESET_DECKS];
  }
}

export function deleteCustomDeck(deckId: string): DeckPreset[] {
  try {
    const saved = localStorage.getItem(CUSTOM_DECKS_KEY);
    if (saved) {
      let customDecks: DeckPreset[] = JSON.parse(saved);
      customDecks = customDecks.filter((d) => d.id !== deckId);
      localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(customDecks));
      return [...PRESET_DECKS, ...customDecks];
    }
  } catch (e) {
    console.error('Failed to delete custom deck', e);
  }
  return [...PRESET_DECKS];
}

export interface DeckAnalysis {
  avgCost: number;
  avgPower: number;
  avgSpeed: number;
  avgAgility: number;
  avgHealth: number;
  manaCurve: Record<number, number>;
  factionCount: Record<string, number>;
}

export function analyzeDeck(cardIds: string[]): DeckAnalysis {
  const cards: CardTemplate[] = cardIds
    .map((id) => CARD_DATABASE.find((c) => c.id === id))
    .filter((c): c is CardTemplate => !!c);

  if (cards.length === 0) {
    return {
      avgCost: 0,
      avgPower: 0,
      avgSpeed: 0,
      avgAgility: 0,
      avgHealth: 0,
      manaCurve: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      factionCount: {},
    };
  }

  let totalCost = 0;
  let totalPower = 0;
  let totalSpeed = 0;
  let totalAgility = 0;
  let totalHealth = 0;
  const manaCurve: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const factionCount: Record<string, number> = {};

  for (const card of cards) {
    totalCost += card.manaCost;
    totalPower += card.attack;
    totalSpeed += card.speed || 5;
    totalAgility += card.agility || 5;
    totalHealth += card.health;

    const costKey = Math.min(5, Math.max(1, card.manaCost));
    manaCurve[costKey] = (manaCurve[costKey] || 0) + 1;

    factionCount[card.faction] = (factionCount[card.faction] || 0) + 1;
  }

  return {
    avgCost: Math.round((totalCost / cards.length) * 10) / 10,
    avgPower: Math.round((totalPower / cards.length) * 10) / 10,
    avgSpeed: Math.round((totalSpeed / cards.length) * 10) / 10,
    avgAgility: Math.round((totalAgility / cards.length) * 10) / 10,
    avgHealth: Math.round((totalHealth / cards.length) * 10) / 10,
    manaCurve,
    factionCount,
  };
}
