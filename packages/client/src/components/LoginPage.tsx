import React, { useState } from 'react';
import { 
  loginUser, 
  registerUser, 
  UserAccount, 
  getCurrentUser 
} from '../utils/auth.js';
import { soundFX } from '../utils/audio.js';
import { 
  Swords, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Crown, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Zap,
  Bot
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  onPlayAsGuest: () => void;
  onOpenFounder: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'spiderman', name: 'Spider-Man', universe: 'Marvel' },
  { id: 'ironman', name: 'Iron Man', universe: 'Marvel' },
  { id: 'batman', name: 'Batman', universe: 'DC' },
  { id: 'flash', name: 'The Flash', universe: 'DC' },
  { id: 'pikachu', name: 'Pikachu', universe: 'Pokemon' },
  { id: 'charizard', name: 'Charizard', universe: 'Pokemon' },
  { id: 'cena', name: 'John Cena', universe: 'WWE' },
  { id: 'rock', name: 'The Rock', universe: 'WWE' },
  { id: 'goku', name: 'Goku', universe: 'Anime' },
  { id: 'luffy', name: 'Luffy', universe: 'Anime' },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onPlayAsGuest,
  onOpenFounder,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('spiderman');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = loginUser(username, password);
    if (result.success && result.user) {
      soundFX.playVictory();
      setSuccessMsg(`Welcome back, ${result.user.username}! Launching Arena...`);
      setTimeout(() => {
        onLoginSuccess(result.user!);
      }, 600);
    } else {
      soundFX.playDamage();
      setError(result.error || 'Login failed.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      soundFX.playDamage();
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    const result = registerUser(username, password, selectedAvatar);
    if (result.success && result.user) {
      soundFX.playVictory();
      setSuccessMsg(`Account created for ${result.user.username}! Entering Arena...`);
      setTimeout(() => {
        onLoginSuccess(result.user!);
      }, 600);
    } else {
      soundFX.playDamage();
      setError(result.error || 'Registration failed.');
    }
  };

  const handleQuickFounderLogin = () => {
    soundFX.playCardPlay();
    setUsername('Abhay');
    setPassword('password123');
    setError(null);
    setTab('login');
  };

  return (
    <div className="relative min-h-[calc(100vh-70px)] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden z-20">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-arena-blue/15 filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-arena-cyan/15 filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-6 my-auto">
        
        {/* ================= LEFT: AUTH FORM CARD ================= */}
        <div className="w-full lg:w-[480px] glass-panel-glow p-6 sm:p-8 rounded-3xl border border-arena-cyan/50 shadow-2xl relative flex flex-col justify-between">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arena-blue to-arena-cyan border border-white/60 flex items-center justify-center shadow-lg shadow-arena-cyan/20">
                  <Swords className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h1 className="text-xl font-black font-display tracking-widest text-white">
                    CARD<span className="text-arena-cyan">ARENA</span>
                  </h1>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Player Authorization
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-arena-cyan/20 border border-arena-cyan/50 text-arena-cyan font-black text-[10px] uppercase tracking-wider">
                v1.4 LIVE
              </span>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  soundFX.playCardHover();
                  setTab('login');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-arena-blue to-arena-cyan text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playCardHover();
                  setTab('register');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-arena-blue to-arena-cyan text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Feedback */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/80 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/80 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-arena-cyan" />
                  Player Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={tab === 'login' ? 'e.g. Abhay, ShadowStrike' : 'Choose your battle handle'}
                    className="w-full py-2.5 px-3.5 pl-10 rounded-xl bg-slate-950 border border-slate-700 focus:border-arena-cyan focus:ring-1 focus:ring-arena-cyan text-white text-sm outline-none transition placeholder:text-slate-600 font-semibold"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-arena-cyan" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full py-2.5 px-3.5 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-700 focus:border-arena-cyan focus:ring-1 focus:ring-arena-cyan text-white text-sm outline-none transition placeholder:text-slate-600 font-semibold"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register Only) */}
              {tab === 'register' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full py-2.5 px-3.5 pl-10 rounded-xl bg-slate-950 border border-slate-700 focus:border-arena-cyan focus:ring-1 focus:ring-arena-cyan text-white text-sm outline-none transition placeholder:text-slate-600 font-semibold"
                    />
                    <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Avatar Selector (Register Only) */}
              {tab === 'register' && (
                <div className="animate-fade-in pt-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Choose Champion Avatar:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setSelectedAvatar(av.id)}
                        className={`p-1 rounded-xl border transition flex flex-col items-center justify-center gap-1 ${
                          selectedAvatar === av.id
                            ? 'bg-arena-cyan/20 border-arena-cyan scale-105 shadow-md shadow-arena-cyan/30'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                        }`}
                        title={`${av.name} (${av.universe})`}
                      >
                        <span className="text-lg">
                          {av.universe === 'Marvel' ? '🦸' : av.universe === 'DC' ? '🦇' : av.universe === 'Pokemon' ? '⚡' : av.universe === 'WWE' ? '🤼' : '⚔️'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">
                          {av.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:from-arena-cyan hover:to-white text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-arena-cyan/25 transition transform hover:scale-[1.02] active:scale-98 border border-white cursor-pointer mt-2"
              >
                <span>{tab === 'login' ? 'Enter The Arena ➔' : 'Create Account & Play ➔'}</span>
              </button>
            </form>
          </div>

          {/* Bottom Actions: Quick Fill & Guest Play */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Test Account:</span>
              <button
                type="button"
                onClick={handleQuickFounderLogin}
                className="text-amber-400 hover:text-white transition font-bold flex items-center gap-1 text-[11px] underline underline-offset-2"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                Fill Abhay's Credentials
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playCardPlay();
                onPlayAsGuest();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <span>Continue as Guest (No Password Required)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* ================= RIGHT: FOUNDER & MULTIVERSE SPOTLIGHT ================= */}
        <div className="w-full lg:flex-1 flex flex-col justify-between gap-4">
          
          {/* Founder Feature Spotlight Card */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-amber-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/10 filter blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Founder Spotlight
                </span>
                <span className="text-[10px] font-mono text-slate-400">Card Arena Creator</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-3xl">
                    👑
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-wider flex items-center gap-1.5">
                    Abhay Pandey
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    Creator & Lead Full-Stack Architect
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    abhaypandey0572005@gmail.com
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed mb-4">
                CARD ARENA was founded and engineered by <strong>Abhay Pandey</strong> to unite the greatest multiverse franchises—<strong className="text-arena-cyan">Marvel</strong>, <strong className="text-arena-blue">DC</strong>, <strong className="text-amber-400">Pokemon</strong>, <strong className="text-rose-400">WWE</strong>, and <strong className="text-yellow-400">Anime</strong>—into a real-time web battle arena featuring 3D holographic cards, procedural Web Audio synthesizer, and the tactical 5-Card Stat Showdown engine.
              </p>

              {/* Founder Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-5">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-arena-cyan shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Engine</span>
                    <span className="font-bold text-[11px] text-slate-200">5-Card Showdown</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Roster</span>
                    <span className="font-bold text-[11px] text-slate-200">60 Equal Cards</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  soundFX.playCardHover();
                  onOpenFounder();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                View Full Founder Dossier
              </button>

              <a
                href="https://github.com/abhaypandey0572005-max"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Abhay Pandey on GitHub"
              >
                <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </a>

              <a
                href="mailto:abhaypandey0572005@gmail.com"
                className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                title="Send Email to Abhay"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
              </a>
            </div>
          </div>

          {/* Quick Multiverse Showcase Row */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎴</span>
              <div>
                <span className="font-black text-white uppercase block text-xs">
                  5 Universe Battle Arenas
                </span>
                <span className="text-[10px] text-slate-400">
                  Marvel • DC • Pokemon • WWE • Anime (12 Cards Each)
                </span>
              </div>
            </div>
            <span className="text-[11px] font-black text-arena-cyan uppercase tracking-wider">
              100% Free to Play
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
