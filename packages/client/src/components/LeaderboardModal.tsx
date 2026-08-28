import React, { useState } from 'react';
import { 
  PlayerStats, 
  getGlobalLeaderboard, 
  getRankTier, 
  RANK_TIERS 
} from '../utils/ranks.js';
import { soundFX } from '../utils/audio.js';
import { 
  Trophy, 
  X, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Award, 
  Crown 
} from 'lucide-react';

interface LeaderboardModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  stats,
  onClose,
}) => {
  const [tab, setTab] = useState<'leaderboard' | 'history' | 'tiers'>('leaderboard');
  const leaderboard = getGlobalLeaderboard(stats);
  const currentTier = getRankTier(stats.mmr);

  const totalMatches = stats.wins + stats.losses + stats.draws;
  const winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 100) : 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl glass-panel-glow p-6 rounded-3xl border border-arena-cyan relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            soundFX.playCardHover();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 border border-yellow-200 flex items-center justify-center shadow-lg shadow-amber-500/20 text-2xl">
            🏆
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider text-white flex items-center gap-2">
              Multiverse Leaderboard
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              Global MMR Rankings & Match History
            </p>
          </div>
        </div>

        {/* User Stats Card Banner */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800">
              {currentTier.badge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">{stats.playerName}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${currentTier.color} bg-slate-900`}>
                  {currentTier.name}
                </span>
              </div>
              <span className="text-xs font-mono font-black text-arena-cyan">
                {stats.mmr} MMR Rating
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Record</span>
              <span className="text-emerald-400 font-mono">{stats.wins}W</span>
              <span className="text-slate-500 mx-1">-</span>
              <span className="text-rose-400 font-mono">{stats.losses}L</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Win Rate</span>
              <span className="text-arena-gold font-mono">{winRate}%</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => {
              soundFX.playCardHover();
              setTab('leaderboard');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              tab === 'leaderboard'
                ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Top Champions
          </button>
          <button
            onClick={() => {
              soundFX.playCardHover();
              setTab('history');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              tab === 'history'
                ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Match History ({stats.history.length})
          </button>
          <button
            onClick={() => {
              soundFX.playCardHover();
              setTab('tiers');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              tab === 'tiers'
                ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rank Tiers
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1">
          {tab === 'leaderboard' ? (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank + entry.playerName}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    entry.isCurrentUser
                      ? 'bg-arena-cyan/15 border-arena-cyan shadow-md shadow-arena-cyan/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        entry.rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {entry.rank}
                    </span>

                    <span className="text-lg">{entry.avatar}</span>

                    <div>
                      <span
                        className={`font-bold text-xs ${
                          entry.isCurrentUser ? 'text-arena-cyan font-black' : 'text-slate-200'
                        }`}
                      >
                        {entry.playerName}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                        {entry.favoriteDeck}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${entry.tier.color} bg-slate-950`}>
                      {entry.tier.badge} {entry.tier.name.split(' ')[0]}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-100 w-16 text-right">
                      {entry.mmr} <span className="text-[10px] text-slate-500">MMR</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'history' ? (
            <div className="space-y-2">
              {stats.history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-bold">
                  No matches recorded yet. Play a match to start your log!
                </div>
              ) : (
                stats.history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          record.result === 'win'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : record.result === 'loss'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                        }`}
                      >
                        {record.result}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-slate-200">vs {record.opponent}</span>
                        <span className="text-[10px] text-slate-500 block">Deck: {record.deckUsed}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-black ${
                          record.mmrChange > 0
                            ? 'text-emerald-400'
                            : record.mmrChange < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {record.mmrChange > 0 ? `+${record.mmrChange}` : record.mmrChange} MMR
                      </span>
                      <span className="text-[10px] text-slate-500 block">{record.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Rank Tiers Explanations */
            <div className="space-y-2.5">
              {RANK_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`p-3 rounded-2xl bg-slate-950/60 border flex items-center justify-between ${tier.color}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tier.badge}</span>
                    <div>
                      <span className="font-bold text-xs text-slate-100 block">{tier.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tier.minMmr} - {tier.maxMmr === 9999 ? '∞' : tier.maxMmr} MMR Required
                      </span>
                    </div>
                  </div>
                  {stats.mmr >= tier.minMmr && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                      Unlocked
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
