import React from 'react';
import { soundFX } from '../utils/audio.js';
import { 
  X, 
  Sparkles, 
  Code2, 
  Gamepad2, 
  Mail, 
  Award, 
  Heart, 
  ExternalLink,
  Crown,
  ShieldCheck,
  Server,
  Layers,
  MapPin,
  Flame
} from 'lucide-react';

interface FounderModalProps {
  onClose: () => void;
}

export const FounderModal: React.FC<FounderModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl glass-panel-glow p-6 sm:p-8 rounded-3xl border border-amber-500/60 relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            soundFX.playCardHover();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-amber-500/20 filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-arena-cyan/20 filter blur-3xl pointer-events-none" />

        {/* Founder Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 relative z-10 text-center sm:text-left">
          {/* Avatar with Crown Badge */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 via-arena-gold to-orange-500 p-1 shadow-xl shadow-amber-500/30 transform group-hover:scale-105 transition">
              <div className="w-full h-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-4xl font-black text-white relative overflow-hidden">
                <span className="animate-bounce">👑</span>
                <span className="text-[10px] font-black tracking-widest text-amber-300 font-mono mt-0.5">DEV</span>
              </div>
            </div>
            <span className="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1">
              <Crown className="w-3 h-3" /> Founder
            </span>
          </div>

          {/* Founder Identity & Headline */}
          <div className="flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-white">
                Abhay Pandey
              </h2>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>

            <p className="text-xs font-black text-amber-400 uppercase tracking-widest mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <span>🚀</span> Founder & Lead Full-Stack Architect
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                <MapPin className="w-3 h-3 text-rose-400" /> India
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Creator
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                <Flame className="w-3 h-3 text-amber-400" /> CARD ARENA v1.4
              </span>
            </div>
          </div>
        </div>

        {/* Founder Story & Vision */}
        <div className="relative z-10 space-y-3.5 text-xs text-slate-300 font-medium leading-relaxed mb-6">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner">
            <p className="text-slate-200">
              <strong className="text-amber-400">CARD ARENA</strong> was conceived, designed, and engineered from scratch by <strong className="text-white">Abhay Pandey</strong>. Driven by a deep love for pop-culture multiverses, gaming mechanics, and real-time multiplayer systems, Abhay united <strong className="text-arena-cyan">Marvel</strong>, <strong className="text-arena-blue">DC</strong>, <strong className="text-amber-400">Pokemon</strong>, <strong className="text-rose-400">WWE</strong>, and <strong className="text-yellow-400">Anime</strong> into a deterministic, high-octane web card battler.
            </p>
          </div>

          {/* Key Engineering Pillars built by Abhay */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Code2 className="w-5 h-5 text-arena-cyan shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Frontend & Motion</span>
                <span className="font-bold text-xs text-slate-200">React 19, TypeScript & 3D Tilt</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Holographic foil cards with procedural Web Audio FX.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Server className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Realtime Network</span>
                <span className="font-bold text-xs text-slate-200">Node.js WebSockets & AI Bot</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Authoritative state machine with friend invite rooms.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Gamepad2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Combat Design</span>
                <span className="font-bold text-xs text-slate-200">5-Card Stat Showdown</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Attack, Speed & Agility clashes with Loser-Leads initiative.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Multiverse Roster</span>
                <span className="font-bold text-xs text-slate-200">60 Balanced Cards</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Exactly 12 balanced minions per universe with HD art.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Social Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
          <a
            href="https://github.com/abhaypandey0572005-max"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition group cursor-pointer"
          >
            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>GitHub Profile</span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition" />
          </a>

          <a
            href="https://github.com/abhaypandey0572005-max/Card-Arena"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-arena-cyan text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition group"
          >
            <Code2 className="w-4 h-4 text-arena-cyan" />
            <span>Card Arena Repo</span>
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-arena-cyan transition" />
          </a>

          <a
            href="mailto:abhaypandey0572005@gmail.com"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-white text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 border border-white transition transform hover:scale-102"
          >
            <Mail className="w-4 h-4 text-slate-950" />
            <span>Contact Abhay</span>
          </a>
        </div>
      </div>
    </div>
  );
};
