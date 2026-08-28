import React, { useEffect, useRef } from 'react';
import { CombatLogEntry } from '@card-battler/shared';
import { Shield, Swords, Sparkles, Skull, ArrowRight, Zap, Trophy, History } from 'lucide-react';

interface CombatLogProps {
  entries: CombatLogEntry[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const getEntryIcon = (type: CombatLogEntry['type']) => {
    switch (type) {
      case 'game_start': return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'turn_start': return <ArrowRight className="w-4 h-4 text-cyan-400" />;
      case 'play_card': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'spell_cast': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'attack_minion':
      case 'attack_hero': return <Swords className="w-4 h-4 text-rose-400" />;
      case 'minion_death': return <Skull className="w-4 h-4 text-red-500" />;
      case 'game_over': return <Trophy className="w-4 h-4 text-yellow-300" />;
      default: return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
        <History className="w-4 h-4 text-cyan-400" />
        <span>Live Combat Log</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`p-2 rounded-lg flex items-start gap-2 border transition-all ${
              entry.type === 'game_over'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : entry.type === 'minion_death'
                ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                : entry.type === 'turn_start'
                ? 'bg-cyan-950/30 border-cyan-800/40 text-cyan-200 font-semibold'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="mt-0.5 shrink-0">{getEntryIcon(entry.type)}</div>
            <div className="flex-1 leading-snug">
              <span>{entry.message}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
