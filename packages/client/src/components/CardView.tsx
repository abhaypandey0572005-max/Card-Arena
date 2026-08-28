import React from 'react';
import { CardInstance, CardTemplate } from '@card-battler/shared';
import { CharacterArt } from './CharacterArt.js';
import { Shield } from 'lucide-react';

interface CardViewProps {
  card: CardInstance | CardTemplate;
  isPlayable?: boolean;
  isAttackerReady?: boolean;
  isSelected?: boolean;
  isTargetable?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isPlayable = false,
  isAttackerReady = false,
  isSelected = false,
  isTargetable = false,
  compact = false,
  onClick,
}) => {
  const isInstance = 'instanceId' in card;
  const instance = isInstance ? (card as CardInstance) : null;

  const currentAttack = instance ? instance.currentAttack : card.attack;
  const currentHealth = instance ? instance.currentHealth : card.health;
  const currentSpeed = instance ? instance.currentSpeed : (card.speed || 5);
  const currentAgility = instance ? instance.currentAgility : (card.agility || 5);
  const hasShield = instance ? instance.hasShield : card.isShielded;
  const isLegendary = card.rarity === 'legendary';

  const getRarityBorder = () => {
    if (isLegendary) {
      return 'border-arena-gold shadow-lg shadow-arena-gold/30 ring-1 ring-arena-gold/60';
    }
    switch (card.rarity) {
      case 'epic': return 'border-arena-cyan shadow-arena-cyan/30';
      case 'rare': return 'border-arena-blue shadow-arena-blue/30';
      default: return 'border-slate-700 shadow-black/40';
    }
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`relative flex items-center justify-between p-2 rounded-xl border glass-panel transition-all cursor-pointer ${
          isPlayable ? 'border-arena-cyan ring-2 ring-arena-cyan/50 hover:scale-105' : 'border-slate-800'
        } ${isSelected ? 'ring-2 ring-arena-gold scale-105' : ''}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md overflow-hidden">
            <CharacterArt artIcon={card.artIcon} name={card.name} faction={card.faction} imageUrl={card.imageUrl} />
          </div>
          <span className="text-xs font-semibold truncate max-w-[100px]">{card.name}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold font-mono">
          <span className="text-orange-400">{currentAttack}</span>
          <span className="text-slate-500">/</span>
          <span className="text-rose-400">{currentHealth}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative w-40 h-56 sm:w-44 sm:h-64 rounded-2xl border-2 p-2 flex flex-col justify-between select-none bg-slate-950/90 transition-all duration-200 cursor-pointer shadow-lg overflow-hidden ${getRarityBorder()} ${
        isPlayable ? 'card-playable-cyan scale-105 hover:scale-110 -translate-y-2' : ''
      } ${isAttackerReady ? 'card-attack-ready scale-105' : ''} ${
        isSelected ? 'ring-4 ring-arena-gold scale-110 -translate-y-3 z-30 shadow-arena-gold/50' : ''
      } ${isTargetable ? 'ring-4 ring-rose-500 animate-pulse' : ''} ${
        card.isTaunt ? 'border-amber-400' : ''
      }`}
    >
      {/* Top Header: Energy & Badges */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arena-blue to-arena-cyan border border-white flex items-center justify-center font-black text-white text-xs shadow-md">
          {card.manaCost}
        </div>

        <div className="flex gap-1">
          {card.isTaunt && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/30 border border-amber-400 text-[8px] font-bold text-amber-300 flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> Taunt
            </span>
          )}
          {hasShield && (
            <span className="px-1.5 py-0.5 rounded bg-sky-500/30 border border-sky-400 text-[8px] font-bold text-sky-300">
              Shield
            </span>
          )}
        </div>
      </div>

      {/* Character Image */}
      <div className="relative z-10 w-full h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 my-0.5">
        <CharacterArt artIcon={card.artIcon} name={card.name} faction={card.faction} imageUrl={card.imageUrl} />
      </div>

      {/* Name */}
      <div className="relative z-10 text-center px-1">
        <h4 className="text-[11px] font-black tracking-wide text-slate-100 truncate">
          {card.name}
        </h4>
      </div>

      {/* 4-Stat Reactor Matrix */}
      {card.type === 'minion' ? (
        <div className="relative z-10 grid grid-cols-4 gap-0.5 pt-1 border-t border-slate-800 text-center text-[10px]">
          <div className="bg-orange-950/40 rounded p-0.5 text-orange-400 font-mono font-black">
            P:{currentAttack}
          </div>
          <div className="bg-amber-950/40 rounded p-0.5 text-amber-300 font-mono font-black">
            S:{currentSpeed}
          </div>
          <div className="bg-cyan-950/40 rounded p-0.5 text-cyan-400 font-mono font-black">
            A:{currentAgility}
          </div>
          <div className="bg-rose-950/40 rounded p-0.5 text-rose-400 font-mono font-black">
            H:{currentHealth}
          </div>
        </div>
      ) : (
        <div className="w-full text-center py-0.5 bg-arena-blue/30 border border-arena-cyan/50 rounded text-[9px] font-bold uppercase tracking-widest text-arena-cyan">
          ⚡ Spell
        </div>
      )}
    </div>
  );
};
