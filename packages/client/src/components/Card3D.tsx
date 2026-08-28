import React, { useState, useRef } from 'react';
import { CardInstance, CardTemplate } from '@card-battler/shared';
import { CharacterArt } from './CharacterArt.js';
import { soundFX } from '../utils/audio.js';
import { 
  Shield, 
  Zap, 
  Wind 
} from 'lucide-react';

interface Card3DProps {
  card: CardInstance | CardTemplate;
  isPlayable?: boolean;
  isAttackerReady?: boolean;
  isSelected?: boolean;
  isTargetable?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  card,
  isPlayable = false,
  isAttackerReady = false,
  isSelected = false,
  isTargetable = false,
  compact = false,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const isInstance = 'instanceId' in card;
  const instance = isInstance ? (card as CardInstance) : null;

  const currentAttack = instance ? instance.currentAttack : card.attack;
  const currentHealth = instance ? instance.currentHealth : card.health;
  const currentSpeed = instance ? instance.currentSpeed : (card.speed || 5);
  const currentAgility = instance ? instance.currentAgility : (card.agility || 5);
  const hasShield = instance ? instance.hasShield : card.isShielded;
  const isLegendary = card.rarity === 'legendary';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || compact) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -14;
    const rotateY = ((x - centerX) / centerX) * 14;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.65,
    });
  };

  const handleMouseEnter = () => {
    soundFX.playCardHover();
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  const getRarityClasses = () => {
    if (isLegendary) {
      return 'border-arena-gold shadow-xl shadow-arena-gold/30 ring-1 ring-arena-gold/60';
    }
    switch (card.rarity) {
      case 'epic':
        return 'border-arena-cyan shadow-lg shadow-arena-cyan/30';
      case 'rare':
        return 'border-arena-blue shadow-md shadow-arena-blue/25';
      default:
        return 'border-slate-700 shadow-black/40';
    }
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer glass-panel ${
          isPlayable ? 'border-arena-cyan ring-2 ring-arena-cyan/50 hover:scale-102' : 'border-slate-800'
        } ${isSelected ? 'ring-2 ring-arena-gold scale-102' : ''}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700">
            <CharacterArt artIcon={card.artIcon} name={card.name} faction={card.faction} imageUrl={card.imageUrl} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold truncate max-w-[120px] text-slate-100">{card.name}</span>
            <span className="text-[9px] text-slate-400 font-mono">SPD:{currentSpeed} AGI:{currentAgility}</span>
          </div>
        </div>
        {card.type === 'minion' ? (
          <div className="flex items-center gap-1 text-xs font-black">
            <span className="text-orange-400">{currentAttack}</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400">{currentHealth}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-arena-cyan uppercase tracking-wider">Spell</span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ perspective: 1000 }}
      className="inline-block transition-transform duration-200"
    >
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isSelected ? 1.08 : 1})`,
          transition: 'transform 100ms ease-out',
        }}
        className={`relative w-44 h-64 sm:w-48 sm:h-72 rounded-2xl border-2 p-2.5 flex flex-col justify-between select-none cursor-pointer overflow-hidden backdrop-blur-md glass-panel ${getRarityClasses()} ${
          isPlayable ? 'card-playable-cyan -translate-y-2' : ''
        } ${isAttackerReady ? 'card-attack-ready -translate-y-1' : ''} ${
          isSelected ? 'ring-4 ring-arena-gold z-30 shadow-2xl -translate-y-4' : ''
        } ${isTargetable ? 'ring-4 ring-rose-500 animate-pulse' : ''} ${
          card.isTaunt ? 'border-amber-400' : ''
        }`}
      >
        {/* Holographic Sheen Layer */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-2xl holo-foil z-20"
          style={{
            opacity: glare.opacity,
            backgroundPosition: `${glare.x}% ${glare.y}%`,
          }}
        />

        {/* Top Header: Energy Crystal & Rarity/Traits */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-arena-blue to-arena-cyan border-2 border-white flex items-center justify-center font-black text-white text-sm shadow-md">
            {card.manaCost}
          </div>

          <div className="flex flex-col gap-1 items-end">
            {card.isTaunt && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/30 border border-amber-400 text-[9px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Shield className="w-2.5 h-2.5" /> Taunt
              </span>
            )}
            {hasShield && (
              <span className="px-1.5 py-0.5 rounded-md bg-sky-500/30 border border-sky-400 text-[9px] font-black text-sky-300 uppercase tracking-wider shadow-sm">
                Shield
              </span>
            )}
            {card.isRush && (
              <span className="px-1.5 py-0.5 rounded-md bg-orange-500/30 border border-orange-400 text-[9px] font-black text-orange-300 uppercase tracking-wider shadow-sm">
                Rush
              </span>
            )}
          </div>
        </div>

        {/* Center Character Artwork Frame (100% Accurate & Matched) */}
        <div className="relative z-10 w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner bg-slate-950 my-1 group">
          <CharacterArt
            artIcon={card.artIcon}
            name={card.name}
            faction={card.faction}
            imageUrl={card.imageUrl}
          />
          {/* Faction tag overlay */}
          <span className="absolute bottom-1 right-1.5 text-[8px] uppercase font-mono font-bold px-1 rounded bg-black/80 text-slate-300 border border-white/10 z-10">
            {card.faction}
          </span>
        </div>

        {/* Character Name & Brief Effect */}
        <div className="relative z-10 text-center px-1">
          <h4
            className={`text-xs sm:text-sm font-black tracking-wide leading-tight truncate ${
              isLegendary ? 'text-arena-gold font-display' : 'text-slate-100'
            }`}
          >
            {card.name}
          </h4>
          <p className="text-[9px] text-slate-300 font-semibold leading-tight line-clamp-1 mt-0.5">
            {card.description}
          </p>
        </div>

        {/* 4-Stat Reactor Matrix (Power, Speed, Agility, Health) */}
        {card.type === 'minion' ? (
          <div className="relative z-10 grid grid-cols-4 gap-1 pt-1.5 border-t border-slate-800/80 text-center">
            {/* Power (PWR) */}
            <div className="flex flex-col items-center bg-orange-950/40 rounded-lg p-0.5 border border-orange-500/40" title="Power (Attack Damage)">
              <span className="text-[8px] font-black text-orange-400 uppercase">PWR</span>
              <span className="text-xs font-black text-white">{currentAttack}</span>
            </div>

            {/* Speed (SPD) */}
            <div className="flex flex-col items-center bg-amber-950/40 rounded-lg p-0.5 border border-amber-400/40" title="Speed (Strike Initiative)">
              <span className="text-[8px] font-black text-amber-300 uppercase flex items-center gap-0.5">
                <Zap className="w-2 h-2" />SPD
              </span>
              <span className="text-xs font-black text-white">{currentSpeed}</span>
            </div>

            {/* Agility (AGI) */}
            <div className="flex flex-col items-center bg-cyan-950/40 rounded-lg p-0.5 border border-cyan-500/40" title="Agility (Evasion & Damage Mitigation)">
              <span className="text-[8px] font-black text-cyan-400 uppercase flex items-center gap-0.5">
                <Wind className="w-2 h-2" />AGI
              </span>
              <span className="text-xs font-black text-white">{currentAgility}</span>
            </div>

            {/* Health (HP) */}
            <div className="flex flex-col items-center bg-rose-950/40 rounded-lg p-0.5 border border-rose-500/40" title="Stamina (Health)">
              <span className="text-[8px] font-black text-rose-400 uppercase">HP</span>
              <span className="text-xs font-black text-white">{currentHealth}</span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 w-full text-center py-1 bg-gradient-to-r from-arena-blue/30 via-arena-cyan/30 to-arena-blue/30 border border-arena-cyan/50 rounded-lg text-[10px] font-black uppercase tracking-widest text-arena-cyan shadow-sm">
            ⚡ Tactical Spell
          </div>
        )}
      </div>
    </div>
  );
};
