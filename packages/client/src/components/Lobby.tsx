import React, { useState } from 'react';
import { PRESET_DECKS } from '@card-battler/shared';
import { QueueState } from '../hooks/useGameSocket.js';
import { soundFX } from '../utils/audio.js';
import { Swords, Shield, Zap, Sparkles, User, Play, X, Loader2, CheckCircle2, Bot } from 'lucide-react';

interface LobbyProps {
  isConnected: boolean;
  queueState: QueueState;
  onJoinQueue: (playerName: string, avatar: string, deckId: string) => void;
  onLeaveQueue: () => void;
}

const AVATARS = [
  { id: 'cyber-runner', name: 'Chrono Vanguard', emoji: '🤖' },
  { id: 'arcane-mage', name: 'Nova Archon', emoji: '⚡' },
  { id: 'inferno-knight', name: 'Solaris Titan', emoji: '🔥' },
  { id: 'void-assassin', name: 'Quantum Phantom', emoji: '🥷' },
];

export const Lobby: React.FC<LobbyProps> = ({
  isConnected,
  queueState,
  onJoinQueue,
  onLeaveQueue,
}) => {
  const [playerName, setPlayerName] = useState(() => `Pilot_${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const [selectedDeckId, setSelectedDeckId] = useState(PRESET_DECKS[0].id);

  const selectedDeck = PRESET_DECKS.find((d) => d.id === selectedDeckId) || PRESET_DECKS[0];

  const handleStartQueue = () => {
    if (!playerName.trim()) return;
    soundFX.playCardPlay();
    onJoinQueue(playerName.trim(), selectedAvatar, selectedDeckId);
  };

  const formatQueueTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center z-10">
      {/* Header Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-blue/15 border border-arena-cyan/40 text-arena-cyan text-xs font-black uppercase tracking-widest mb-3">
          <span className="w-2 h-2 rounded-full bg-arena-cyan animate-ping"></span>
          Authoritative Real-Time Engine
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-display tracking-wider uppercase bg-gradient-to-r from-white via-arena-silver to-arena-cyan bg-clip-text text-transparent drop-shadow-sm">
          CARD ARENA LOBBY
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 font-semibold">
          Full-duplex WebSockets • Deterministic State Machine • Dynamic Elo MMR
        </p>
      </div>

      {/* Main Grid: Player Config & Deck Selection */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Player Identity */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-arena-cyan" />
              Pilot Identity
            </h3>

            {/* Name Input */}
            <div className="mb-5">
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                Player Call-sign
              </label>
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={queueState.inQueue}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 font-bold focus:outline-none focus:border-arena-cyan transition text-sm"
              />
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                Select Combat Avatar
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => {
                      soundFX.playCardHover();
                      setSelectedAvatar(av.id);
                    }}
                    disabled={queueState.inQueue}
                    className={`relative p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                      selectedAvatar === av.id
                        ? 'border-arena-cyan bg-arena-blue/20 ring-2 ring-arena-cyan/40 shadow-md shadow-arena-cyan/20'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{av.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-full">
                      {av.name.split(' ')[0]}
                    </span>
                    {selectedAvatar === av.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-arena-cyan absolute top-1.5 right-1.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connection status indicator */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>WebSocket Relay</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {isConnected ? 'Online (ws://)' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Deck Archetype Selector */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-4">
            <Swords className="w-4 h-4 text-arena-blue" />
            Equipped Faction Loadout
          </h3>

          <div className="space-y-3">
            {PRESET_DECKS.map((deck) => {
              const isSelected = selectedDeckId === deck.id;
              return (
                <div
                  key={deck.id}
                  onClick={() => {
                    if (!queueState.inQueue) {
                      soundFX.playCardHover();
                      setSelectedDeckId(deck.id);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-arena-cyan bg-arena-blue/15 ring-2 ring-arena-cyan/30 shadow-md shadow-arena-cyan/15'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {deck.faction === 'apex' && <Zap className="w-4 h-4 text-arena-cyan" />}
                      {deck.faction === 'quantum' && <Sparkles className="w-4 h-4 text-arena-blue" />}
                      {deck.faction === 'solaris' && <Shield className="w-4 h-4 text-amber-400" />}
                      <span className="font-bold text-sm text-slate-100">{deck.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {deck.cardIds.length} Cards
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{deck.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Queue / Play Action Bar */}
      <div className="w-full max-w-md">
        {!queueState.inQueue ? (
          <button
            onClick={handleStartQueue}
            disabled={!isConnected || !playerName.trim()}
            className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:from-arena-cyan hover:to-white text-slate-950 font-black font-display text-xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-arena-cyan/30 transition transform hover:scale-105 active:scale-95 border-2 border-white disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play className="w-6 h-6 fill-current" />
            Enter Matchmaking
          </button>
        ) : (
          <div className="w-full glass-panel-glow border border-arena-cyan rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Loader2 className="w-6 h-6 text-arena-cyan animate-spin" />
                <span className="absolute inset-0 rounded-full bg-arena-cyan/20 animate-ping" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Scanning Ladder...</h4>
                <p className="text-xs text-arena-cyan font-mono">
                  Elapsed: {formatQueueTime(queueState.timeInQueue)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFX.playCardHover();
                onLeaveQueue();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-300 transition"
              title="Cancel Matchmaking"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
