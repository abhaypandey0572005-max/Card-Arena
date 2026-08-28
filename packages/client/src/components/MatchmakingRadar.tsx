import React from 'react';
import { QueueState } from '../hooks/useGameSocket.js';
import { soundFX } from '../utils/audio.js';
import { 
  Radio, 
  X, 
  ShieldCheck, 
  Crosshair, 
  Swords, 
  Cpu 
} from 'lucide-react';

interface MatchmakingRadarProps {
  queueState: QueueState;
  onCancelQueue: () => void;
}

export const MatchmakingRadar: React.FC<MatchmakingRadarProps> = ({
  queueState,
  onCancelQueue,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12 z-20 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-arena-cyan/15 rounded-full filter blur-[100px] pointer-events-none -z-10 animate-pulse" />

      {/* Main Radar Card */}
      <div className="w-full max-w-lg glass-panel-glow rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Top Status Header */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-arena-cyan/10 border border-arena-cyan/40 text-arena-cyan text-xs font-black uppercase tracking-widest mb-6">
          <Radio className="w-4 h-4 animate-ping" />
          <span>Searching for Opponent</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-display tracking-wider uppercase text-white mb-2">
          Finding Match
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-xs mb-8">
          Scanning global ladder nodes for an opponent with matching Elo MMR...
        </p>

        {/* Central Concentric Radar Graphic */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-2">
          {/* Outer Ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-arena-blue/30 animate-ping opacity-25" />

          {/* Outer Ring 2 */}
          <div className="absolute inset-2 rounded-full border border-arena-cyan/40" />

          {/* Middle Ring 3 (Dashed) */}
          <div className="absolute inset-8 rounded-full border border-dashed border-arena-cyan/60 animate-spin" style={{ animationDuration: '20s' }} />

          {/* Inner Ring 4 */}
          <div className="absolute inset-16 rounded-full border border-arena-blue/80" />

          {/* Rotating Radar Sweep Needle */}
          <div className="absolute inset-0 flex items-center justify-center animate-radar-sweep pointer-events-none">
            <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent via-arena-cyan to-white origin-right shadow-lg shadow-arena-cyan" />
          </div>

          {/* Center Target Core */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-blue to-arena-cyan border-2 border-white flex items-center justify-center shadow-lg shadow-arena-cyan/50 animate-pulse">
            <Swords className="w-8 h-8 text-slate-950" />
          </div>

          {/* Floating Target Blips */}
          <div className="absolute top-10 right-12 w-3 h-3 rounded-full bg-arena-cyan shadow-md shadow-arena-cyan animate-ping" />
          <div className="absolute bottom-12 left-10 w-2 h-2 rounded-full bg-arena-gold shadow-md shadow-arena-gold animate-pulse" />
        </div>

        {/* Elapsed Timer & Queue Info */}
        <div className="flex items-center gap-6 mt-8 mb-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Queue Time</span>
            <span className="font-mono text-2xl font-black text-arena-cyan">
              {formatTime(queueState.timeInQueue)}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Search Window</span>
            <span className="font-mono text-base font-bold text-slate-200">
              ±{100 + Math.floor(queueState.timeInQueue / 3) * 100} MMR
            </span>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Latency</span>
            <span className="font-mono text-sm font-bold text-emerald-400">
              &lt; 12ms
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => {
            soundFX.playCardHover();
            onCancelQueue();
          }}
          className="w-full py-3.5 px-6 rounded-2xl glass-panel border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-400 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition transform hover:scale-102 active:scale-98"
        >
          <X className="w-4 h-4" />
          Cancel Matchmaking
        </button>
      </div>
    </div>
  );
};
