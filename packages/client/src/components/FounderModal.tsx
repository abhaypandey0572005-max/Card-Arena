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
  ExternalLink 
} from 'lucide-react';

interface FounderModalProps {
  onClose: () => void;
}

export const FounderModal: React.FC<FounderModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-xl glass-panel-glow p-6 sm:p-8 rounded-3xl border border-arena-cyan relative shadow-2xl overflow-hidden">
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

        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-arena-cyan/20 filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-arena-blue/20 filter blur-3xl pointer-events-none" />

        {/* Founder Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 relative z-10 text-center sm:text-left">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-arena-blue via-arena-cyan to-arena-gold p-1 shadow-xl shadow-arena-cyan/30">
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-3xl font-black text-white overflow-hidden">
                👑
              </div>
            </div>
            <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md">
              Founder
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-white flex items-center justify-center sm:justify-start gap-2">
              Abhay Pandey
              <Sparkles className="w-5 h-5 text-arena-gold" />
            </h2>
            <p className="text-xs font-bold text-arena-cyan uppercase tracking-widest mt-0.5">
              Creator & Lead Full-Stack Architect
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1 font-semibold">
              <span>🚀</span> Architect of CARD ARENA Platform
            </p>
          </div>
        </div>

        {/* Founder Story & Vision */}
        <div className="relative z-10 space-y-3 text-xs text-slate-300 font-semibold leading-relaxed mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <p className="text-slate-200">
              <strong className="text-arena-cyan">CARD ARENA</strong> was conceived and engineered by <strong>Abhay Pandey</strong> to deliver a high-octane, motion-design esports card battle experience uniting the greatest multiverses into a deterministic, real-time multiplayer web arena.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
              <Code2 className="w-5 h-5 text-arena-cyan shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Engineering</span>
                <span className="font-bold text-xs text-slate-200">TypeScript & React 19</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
              <Gamepad2 className="w-5 h-5 text-arena-gold shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Game Engine</span>
                <span className="font-bold text-xs text-slate-200">WebSockets & Audio API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connect & Social Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-arena-cyan text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <svg className="w-4 h-4 text-arena-cyan fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub Profile
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <a
            href="mailto:abhaypandey0572005@gmail.com"
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:from-arena-cyan hover:to-white text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-arena-cyan/20 border border-white transition transform hover:scale-102"
          >
            <Mail className="w-4 h-4" />
            Contact Founder
          </a>
        </div>
      </div>
    </div>
  );
};
