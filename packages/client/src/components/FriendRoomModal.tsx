import React, { useState, useEffect } from 'react';
import { CustomRoomLobbyState } from '@card-battler/shared';
import { soundFX } from '../utils/audio.js';
import { 
  Users, 
  Copy, 
  Check, 
  Play, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  Link as LinkIcon,
  Swords
} from 'lucide-react';

interface FriendRoomModalProps {
  customLobbyState: CustomRoomLobbyState | null;
  onCreateRoom: (name: string, avatar: string, deckId: string) => void;
  onJoinRoom: (roomCode: string, name: string, avatar: string, deckId: string) => void;
  onStartMatch: (roomCode: string) => void;
  onLeaveRoom: (roomCode: string) => void;
  onClose: () => void;
  defaultPlayerName: string;
  defaultAvatar: string;
  defaultDeckId: string;
  initialRoomCode?: string;
}

export const FriendRoomModal: React.FC<FriendRoomModalProps> = ({
  customLobbyState,
  onCreateRoom,
  onJoinRoom,
  onStartMatch,
  onLeaveRoom,
  onClose,
  defaultPlayerName,
  defaultAvatar,
  defaultDeckId,
  initialRoomCode = '',
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [inputCode, setInputCode] = useState(initialRoomCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setInputCode(initialRoomCode);
      setTab('join');
    }
  }, [initialRoomCode]);

  const handleCopyLink = () => {
    if (!customLobbyState) return;
    const inviteUrl = `${window.location.origin}/?room=${customLobbyState.roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    soundFX.playCardHover();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreate = () => {
    soundFX.playCardPlay();
    onCreateRoom(defaultPlayerName, defaultAvatar, defaultDeckId);
  };

  const handleJoin = () => {
    if (!inputCode.trim()) return;
    soundFX.playCardPlay();
    onJoinRoom(inputCode.trim().toUpperCase(), defaultPlayerName, defaultAvatar, defaultDeckId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-panel-glow p-6 sm:p-8 rounded-3xl border border-arena-cyan relative shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            soundFX.playCardHover();
            if (customLobbyState) {
              onLeaveRoom(customLobbyState.roomCode);
            }
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl glass-panel text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arena-blue to-arena-cyan border border-white flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider text-white">
              Play with Friends
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              Direct private staging room • 1-Click invite link
            </p>
          </div>
        </div>

        {!customLobbyState ? (
          /* Mode Selector (Create vs Join) */
          <div>
            <div className="flex gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
              <button
                onClick={() => {
                  soundFX.playCardHover();
                  setTab('create');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  tab === 'create'
                    ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  soundFX.playCardHover();
                  setTab('join');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  tab === 'join'
                    ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Join with Code
              </button>
            </div>

            {tab === 'create' ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-arena-blue/20 border border-arena-cyan/40 flex items-center justify-center mb-4 shadow-lg">
                  <Sparkles className="w-8 h-8 text-arena-cyan animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Host a Private Match</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  Generates an instant 6-digit room code you can send to any friend to play together.
                </p>

                <button
                  onClick={handleCreate}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-arena-cyan hover:to-white text-slate-950 font-black font-display uppercase tracking-widest text-sm shadow-xl shadow-arena-cyan/30 transition transform hover:scale-102 active:scale-98 border-2 border-white"
                >
                  Generate Room Code & Link
                </button>
              </div>
            ) : (
              <div className="py-2">
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  Enter 6-Digit Room Code (e.g. ARENA-4921)
                </label>
                <input
                  type="text"
                  placeholder="ARENA-XXXX"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-mono font-black text-arena-cyan placeholder:text-slate-600 focus:outline-none focus:border-arena-cyan mb-5 tracking-widest"
                />

                <button
                  onClick={handleJoin}
                  disabled={!inputCode.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-arena-cyan hover:to-white text-slate-950 font-black font-display uppercase tracking-widest text-sm shadow-xl shadow-arena-cyan/30 transition transform hover:scale-102 active:scale-98 border-2 border-white disabled:opacity-50 disabled:pointer-events-none"
                >
                  Join Friend's Room
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Active Staging Lobby */
          <div className="py-2">
            {/* Room Code & Copy Share Link Bar */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-arena-cyan/40 flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                  Private Room Code
                </span>
                <h3 className="text-2xl font-mono font-black text-arena-cyan tracking-wider">
                  {customLobbyState.roomCode}
                </h3>
              </div>

              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-arena-blue/20 hover:bg-arena-blue/40 border border-arena-cyan text-arena-cyan font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>

            {/* Players Staging Cards Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Host Player Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-arena-blue/60 flex flex-col items-center text-center">
                <span className="text-[9px] uppercase font-black tracking-widest text-arena-cyan mb-1">
                  Host
                </span>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arena-blue to-slate-950 border border-arena-cyan flex items-center justify-center text-2xl mb-2">
                  🤖
                </div>
                <span className="font-bold text-sm text-slate-100 truncate max-w-full">
                  {customLobbyState.host.playerName}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                  🎴 {customLobbyState.host.deckId}
                </span>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ready
                </div>
              </div>

              {/* Guest Player Card */}
              {customLobbyState.guest ? (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-arena-cyan flex flex-col items-center text-center">
                  <span className="text-[9px] uppercase font-black tracking-widest text-arena-cyan mb-1">
                    Challenger
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arena-cyan to-slate-950 border border-arena-cyan flex items-center justify-center text-2xl mb-2">
                    🔥
                  </div>
                  <span className="font-bold text-sm text-slate-100 truncate max-w-full">
                    {customLobbyState.guest.playerName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                    🎴 {customLobbyState.guest.deckId}
                  </span>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-6 h-6 text-slate-500 animate-spin mb-2" />
                  <span className="text-xs font-bold text-slate-400">Waiting for Friend...</span>
                  <span className="text-[10px] text-slate-500 mt-1">Send them the invite link!</span>
                </div>
              )}
            </div>

            {/* Launch Match Button (Host Only) */}
            {customLobbyState.isHost ? (
              <button
                onClick={() => {
                  soundFX.playCardPlay();
                  onStartMatch(customLobbyState.roomCode);
                }}
                disabled={!customLobbyState.guest}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:from-arena-cyan hover:to-white text-slate-950 font-black font-display uppercase tracking-widest text-sm shadow-xl shadow-arena-cyan/30 transition transform hover:scale-102 active:scale-98 border-2 border-white disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <Swords className="w-5 h-5" />
                Start Battle
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-arena-cyan animate-spin" />
                Waiting for Host to Start Battle...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
