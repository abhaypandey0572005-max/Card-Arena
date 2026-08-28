import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio.js';
import { recordMatchResult, getRankTier } from '../utils/ranks.js';
import { 
  Trophy, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  TrendingUp 
} from 'lucide-react';

interface GameOverModalProps {
  isWinner: boolean;
  isDraw?: boolean;
  winReason?: string | null;
  opponentName?: string;
  deckUsed?: string;
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isWinner,
  isDraw = false,
  winReason,
  opponentName = 'Opponent',
  deckUsed = 'Multiverse Deck',
  onPlayAgain,
}) => {
  const [mmrResult, setMmrResult] = useState<{ newMmr: number; mmrChange: number } | null>(null);

  useEffect(() => {
    if (isWinner) {
      soundFX.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#0066FF', '#FFD700', '#FFFFFF'],
      });
    } else {
      soundFX.playDefeat();
    }

    const outcome = isWinner ? 'win' : isDraw ? 'draw' : 'loss';
    const result = recordMatchResult(outcome, opponentName, deckUsed);
    setMmrResult(result);
  }, [isWinner, isDraw, opponentName, deckUsed]);

  const currentTier = mmrResult ? getRankTier(mmrResult.newMmr) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div
        className={`w-full max-w-md p-8 rounded-3xl border-2 relative overflow-hidden text-center shadow-2xl glass-panel-glow ${
          isWinner
            ? 'border-arena-gold shadow-arena-gold/30'
            : isDraw
            ? 'border-slate-500 shadow-slate-500/20'
            : 'border-rose-500 shadow-rose-500/30'
        }`}
      >
        {/* Dynamic Background Flare */}
        <div
          className={`absolute inset-0 filter blur-3xl opacity-20 pointer-events-none ${
            isWinner ? 'bg-amber-400' : isDraw ? 'bg-slate-400' : 'bg-rose-600'
          }`}
        />

        {/* Victory Icon */}
        <div className="relative z-10 flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-4xl shadow-xl ${
              isWinner
                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 border-yellow-200 shadow-amber-500/40 text-slate-950'
                : isDraw
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-rose-950/80 border-rose-500/80 text-rose-300'
            }`}
          >
            {isWinner ? <Trophy className="w-10 h-10 fill-slate-950 text-slate-950" /> : isDraw ? '⚔️' : <ShieldAlert className="w-10 h-10" />}
          </div>
        </div>

        {/* Title */}
        <h2
          className={`relative z-10 text-4xl font-black font-display uppercase tracking-widest leading-none ${
            isWinner
              ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent'
              : isDraw
              ? 'text-slate-300'
              : 'text-rose-400'
          }`}
        >
          {isWinner ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
        </h2>

        <p className="relative z-10 text-xs font-semibold text-slate-300 mt-2 mb-6">
          {winReason || (isWinner ? 'You dominated the Multiverse Arena!' : 'Your hero fell in combat.')}
        </p>

        {/* Rating & XP Reward Progression */}
        {mmrResult && currentTier && (
          <div className="relative z-10 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <span className="text-2xl">{currentTier.badge}</span>
              <div>
                <span className="text-xs font-bold text-slate-100 block">{currentTier.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{mmrResult.newMmr} MMR Rating</span>
              </div>
            </div>

            <div className="flex items-center gap-1 font-mono font-black text-sm">
              <TrendingUp className={`w-4 h-4 ${isWinner ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className={isWinner ? 'text-emerald-400' : 'text-rose-400'}>
                {isWinner ? '+25 MMR' : '-15 MMR'}
              </span>
            </div>
          </div>
        )}

        {/* Play Again Button */}
        <button
          onClick={() => {
            soundFX.playCardPlay();
            onPlayAgain();
          }}
          className="relative z-10 w-full py-4 rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:from-arena-cyan hover:to-white text-slate-950 font-black font-display uppercase tracking-widest text-sm shadow-xl shadow-arena-cyan/30 transition transform hover:scale-102 active:scale-98 border-2 border-white flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Return to Arena Lobby
        </button>
      </div>
    </div>
  );
};
