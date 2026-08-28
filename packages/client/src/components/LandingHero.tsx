import React, { useState, useEffect } from 'react';
import { CARD_DATABASE } from '@card-battler/shared';
import { Card3D } from './Card3D.js';
import { soundFX } from '../utils/audio.js';
import { 
  Play, 
  Layers, 
  Users, 
  Bot, 
  Radio, 
  Sparkles, 
  Flame, 
  ShieldCheck,
  Swords 
} from 'lucide-react';

interface LandingHeroProps {
  onQuickMatch: () => void;
  onPlayVsAi: () => void;
  onPlayWithFriends: () => void;
  onOpenDeckStudio: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onQuickMatch,
  onPlayVsAi,
  onPlayWithFriends,
  onOpenDeckStudio,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const heroCards = [
    CARD_DATABASE.find((c) => c.id === 'anime-goku') || CARD_DATABASE[0],
    CARD_DATABASE.find((c) => c.id === 'marvel-thanos') || CARD_DATABASE[1],
    CARD_DATABASE.find((c) => c.id === 'pkmn-charizard') || CARD_DATABASE[2],
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-between px-4 py-8 overflow-hidden z-10">
      {/* Top Ticker: Live Players Online */}
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-full glass-panel border border-arena-cyan/30 shadow-lg shadow-arena-cyan/10 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-arena-cyan animate-ping absolute" />
          <span className="w-2 h-2 rounded-full bg-arena-cyan" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-arena-cyan flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" /> 1,284 PLAYERS ONLINE
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-xs font-bold text-slate-400">MARVEL • DC • POKEMON • WWE • ANIME</span>
      </div>

      {/* Center Stage */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 my-auto py-6">
        {/* Left Column: Kinetic Typography & Action Matrix */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-arena-blue/15 border border-arena-blue/40 text-arena-cyan text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-arena-cyan" />
            Multiverse Motion-Design Card Battler
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black font-display tracking-tight uppercase leading-none bg-gradient-to-r from-white via-arena-silver to-arena-cyan bg-clip-text text-transparent drop-shadow-2xl">
            CARD<br />
            <span className="bg-gradient-to-r from-arena-cyan via-arena-blue to-arena-silver bg-clip-text text-transparent">
              ARENA
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 font-semibold tracking-wide mt-4 max-w-lg leading-relaxed">
            Battle with iconic characters across <strong className="text-arena-cyan">Marvel</strong>, <strong className="text-arena-blue">DC</strong>, <strong className="text-amber-400">Pokemon</strong>, <strong className="text-rose-400">WWE</strong>, and <strong className="text-yellow-300">Anime</strong>. Play online PvP, invite friends directly, or challenge the AI Bot!
          </p>

          {/* Action Matrix Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 w-full sm:w-auto">
            {/* Quick Match (PvP) */}
            <button
              onClick={() => {
                soundFX.playCardPlay();
                onQuickMatch();
              }}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:from-arena-cyan hover:to-white transition-all duration-300 text-slate-950 font-black font-display text-base uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-arena-cyan/30 transform hover:scale-105 active:scale-95 border-2 border-white group"
            >
              <Play className="w-5 h-5 fill-slate-950 transition-transform group-hover:scale-110" />
              Quick Match (PvP)
            </button>

            {/* Play vs Computer (AI) */}
            <button
              onClick={() => {
                soundFX.playCardPlay();
                onPlayVsAi();
              }}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 hover:from-cyan-500 hover:to-blue-600 transition-all text-white font-black font-display text-base uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/20 transform hover:scale-105 active:scale-95 border-2 border-arena-cyan"
            >
              <Bot className="w-5 h-5 text-arena-cyan" />
              Play vs Computer (AI)
            </button>

            {/* Play with Friends */}
            <button
              onClick={() => {
                soundFX.playCardHover();
                onPlayWithFriends();
              }}
              className="px-6 py-3.5 rounded-2xl glass-panel border border-arena-cyan/60 hover:border-arena-cyan text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-arena-cyan/15"
            >
              <Users className="w-4 h-4 text-arena-cyan" />
              Play with Friends (Room)
            </button>

            {/* Deck Studio */}
            <button
              onClick={() => {
                soundFX.playCardHover();
                onOpenDeckStudio();
              }}
              className="px-6 py-3.5 rounded-2xl glass-panel border border-slate-700 hover:border-arena-gold text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-arena-gold/20"
            >
              <Layers className="w-4 h-4 text-arena-gold" />
              Multiverse Deck Studio
            </button>
          </div>
        </div>

        {/* Right Column: Interactive 3D Floating Cards Showcase */}
        <div
          style={{
            transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
            transition: 'transform 300ms ease-out',
          }}
          className="flex-1 relative w-full max-w-md h-80 sm:h-96 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-arena-blue/20 via-arena-cyan/20 to-transparent rounded-full filter blur-3xl -z-10" />

          {/* Card 1 (Thanos - Left) */}
          <div className="absolute -left-4 sm:left-2 top-8 transform -rotate-12 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-300 animate-card-float">
            <Card3D card={heroCards[1]} />
          </div>

          {/* Card 2 (Goku - Center Hero) */}
          <div className="relative z-20 transform scale-105 hover:scale-115 transition-all duration-300 drop-shadow-2xl">
            <Card3D card={heroCards[0]} isPlayable />
          </div>

          {/* Card 3 (Charizard - Right) */}
          <div
            style={{ animationDelay: '1.5s' }}
            className="absolute -right-4 sm:right-2 top-12 transform rotate-12 hover:rotate-0 hover:scale-110 hover:z-30 transition-all duration-300 animate-card-float"
          >
            <Card3D card={heroCards[2]} />
          </div>
        </div>
      </div>

      {/* Bottom Features Banner */}
      <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/60 z-10 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-xl glass-panel">
          <ShieldCheck className="w-4 h-4 text-arena-cyan shrink-0" />
          <span className="font-bold text-slate-300">Play Solo vs AI or Real-Time PvP</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl glass-panel">
          <Users className="w-4 h-4 text-arena-blue shrink-0" />
          <span className="font-bold text-slate-300">1-Click Shareable Friend Invite Links</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl glass-panel">
          <Swords className="w-4 h-4 text-arena-gold shrink-0" />
          <span className="font-bold text-slate-300">Marvel • DC • Pokemon • WWE • Anime</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-xl glass-panel">
          <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="font-bold text-slate-300">Authoritative Full-Duplex WebSockets</span>
        </div>
      </div>
    </div>
  );
};
