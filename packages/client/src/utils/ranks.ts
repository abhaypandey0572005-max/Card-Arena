export interface MatchRecord {
  id: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  mmrChange: number;
  deckUsed: string;
}

export interface PlayerStats {
  playerName: string;
  mmr: number;
  wins: number;
  losses: number;
  draws: number;
  history: MatchRecord[];
}

export interface RankTier {
  id: string;
  name: string;
  badge: string;
  color: string;
  minMmr: number;
  maxMmr: number;
}

export const RANK_TIERS: RankTier[] = [
  { id: 'bronze', name: 'Bronze Pilot', badge: '🥉', color: 'text-amber-600 border-amber-600', minMmr: 0, maxMmr: 1199 },
  { id: 'silver', name: 'Silver Striker', badge: '🥈', color: 'text-slate-300 border-slate-300', minMmr: 1200, maxMmr: 1399 },
  { id: 'gold', name: 'Gold Champion', badge: '🥇', color: 'text-yellow-400 border-yellow-400', minMmr: 1400, maxMmr: 1599 },
  { id: 'platinum', name: 'Platinum Vanguard', badge: '💎', color: 'text-cyan-400 border-cyan-400', minMmr: 1600, maxMmr: 1799 },
  { id: 'diamond', name: 'Diamond Overlord', badge: '💠', color: 'text-blue-400 border-blue-400', minMmr: 1800, maxMmr: 1999 },
  { id: 'grandmaster', name: 'Grandmaster Titan', badge: '👑', color: 'text-amber-300 border-amber-300', minMmr: 2000, maxMmr: 9999 },
];

export function getRankTier(mmr: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (mmr >= RANK_TIERS[i].minMmr) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

const STATS_KEY = 'card_arena_player_stats';

export function loadPlayerStats(defaultName: string): PlayerStats {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load player stats', e);
  }

  const initial: PlayerStats = {
    playerName: defaultName,
    mmr: 1250,
    wins: 4,
    losses: 1,
    draws: 0,
    history: [
      { id: 'm1', date: 'Just now', opponent: 'Chrono AI (Bot)', result: 'win', mmrChange: +25, deckUsed: 'Marvel: Avengers Assemble' },
      { id: 'm2', date: 'Yesterday', opponent: 'ShadowPilot', result: 'win', mmrChange: +25, deckUsed: 'Anime: All-Stars' },
      { id: 'm3', date: '2 days ago', opponent: 'CyberViper', result: 'loss', mmrChange: -15, deckUsed: 'Pokemon: Champions' },
    ],
  };

  savePlayerStats(initial);
  return initial;
}

export function savePlayerStats(stats: PlayerStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save player stats', e);
  }
}

export function recordMatchResult(
  result: 'win' | 'loss' | 'draw',
  opponentName: string,
  deckUsed: string
): { newMmr: number; mmrChange: number } {
  const currentStats = loadPlayerStats('Player');
  const mmrChange = result === 'win' ? 25 : result === 'loss' ? -15 : 0;
  const newMmr = Math.max(100, currentStats.mmr + mmrChange);

  if (result === 'win') currentStats.wins += 1;
  else if (result === 'loss') currentStats.losses += 1;
  else currentStats.draws += 1;

  currentStats.mmr = newMmr;
  currentStats.history.unshift({
    id: `m_${Date.now()}`,
    date: 'Just now',
    opponent: opponentName,
    result,
    mmrChange,
    deckUsed,
  });

  if (currentStats.history.length > 20) {
    currentStats.history.pop();
  }

  savePlayerStats(currentStats);
  return { newMmr, mmrChange };
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  avatar: string;
  mmr: number;
  tier: RankTier;
  winRate: number;
  favoriteDeck: string;
  isCurrentUser?: boolean;
}

export function getGlobalLeaderboard(currentUserStats: PlayerStats): LeaderboardEntry[] {
  const mockChampions = [
    { playerName: 'KamehamehaKing', avatar: '⚡', mmr: 2480, wins: 98, losses: 12, favoriteDeck: 'Anime: All-Stars' },
    { playerName: 'ThanosSnap99', avatar: '👑', mmr: 2390, wins: 85, losses: 15, favoriteDeck: 'Marvel: Avengers' },
    { playerName: 'GodOfThunder', avatar: '🔨', mmr: 2280, wins: 78, losses: 18, favoriteDeck: 'Marvel: Avengers' },
    { playerName: 'DarkKnightArkham', avatar: '🦇', mmr: 2150, wins: 64, losses: 16, favoriteDeck: 'DC: Justice League' },
    { playerName: 'PikachuThunder', avatar: '⚡', mmr: 2040, wins: 59, losses: 21, favoriteDeck: 'Pokemon: Champions' },
    { playerName: 'TribalChiefRoman', avatar: '🩸', mmr: 1950, wins: 51, losses: 20, favoriteDeck: 'WWE: Legends' },
    { playerName: 'InfinityGojo', avatar: '✨', mmr: 1880, wins: 48, losses: 22, favoriteDeck: 'Anime: All-Stars' },
    { playerName: 'ManOfSteel99', avatar: '☀️', mmr: 1790, wins: 44, losses: 25, favoriteDeck: 'DC: Justice League' },
    { playerName: 'CharizardFlame', avatar: '🔥', mmr: 1680, wins: 39, losses: 26, favoriteDeck: 'Pokemon: Champions' },
    { playerName: 'ApexOverlord', avatar: '🤖', mmr: 1590, wins: 33, losses: 28, favoriteDeck: 'Apex: Cyber Syndicate' },
  ];

  const allEntries: LeaderboardEntry[] = mockChampions.map((c, idx) => ({
    rank: idx + 1,
    playerName: c.playerName,
    avatar: c.avatar,
    mmr: c.mmr,
    tier: getRankTier(c.mmr),
    winRate: Math.round((c.wins / (c.wins + c.losses)) * 100),
    favoriteDeck: c.favoriteDeck,
  }));

  const userWinRate =
    currentUserStats.wins + currentUserStats.losses > 0
      ? Math.round((currentUserStats.wins / (currentUserStats.wins + currentUserStats.losses)) * 100)
      : 50;

  const userEntry: LeaderboardEntry = {
    rank: 0,
    playerName: currentUserStats.playerName + ' (You)',
    avatar: '🤖',
    mmr: currentUserStats.mmr,
    tier: getRankTier(currentUserStats.mmr),
    winRate: userWinRate,
    favoriteDeck: currentUserStats.history[0]?.deckUsed || 'Marvel: Avengers',
    isCurrentUser: true,
  };

  // Insert user based on MMR and sort
  const combined = [...allEntries, userEntry].sort((a, b) => b.mmr - a.mmr);
  return combined.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
