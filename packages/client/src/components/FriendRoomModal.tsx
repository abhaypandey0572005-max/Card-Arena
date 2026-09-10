import React, { useState, useEffect } from 'react';
import { CustomRoomLobbyState } from '@card-battler/shared';
import { soundFX } from '../utils/audio.js';
import { UNIVERSES } from './UniverseSelector.js';
import { 
  Users, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  Loader2, 
  Link as LinkIcon,
  Swords,
  Share2,
  KeyRound,
  LogOut,
  ClipboardPaste,
  Layers
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
  isConnected?: boolean;
  errorMessage?: string | null;
  onSelectDeck?: (deckId: string) => void;
}

// Resilient clipboard helper with execCommand fallback for mobile browsers
async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API writeText failed, trying execCommand fallback', err);
    }
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (e) {
    console.error('All clipboard methods failed', e);
    return false;
  }
}

// Clean and normalize any input into ARENA-XXXX format
function normalizeRoomCode(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toUpperCase();
  if (cleaned.includes('ROOM=')) {
    const match = cleaned.match(/ROOM=([A-Z0-9_-]+)/i);
    if (match) cleaned = match[1];
  }
  cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
  if (cleaned.startsWith('ARENA')) {
    cleaned = cleaned.substring(5);
  }
  if (cleaned.length > 0) {
    return `ARENA-${cleaned}`;
  }
  return raw.trim().toUpperCase();
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
  isConnected = true,
  errorMessage = null,
  onSelectDeck,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [inputCode, setInputCode] = useState(normalizeRoomCode(initialRoomCode));
  const [selectedDeck, setSelectedDeck] = useState(defaultDeckId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  useEffect(() => {
    if (initialRoomCode) {
      setInputCode(normalizeRoomCode(initialRoomCode));
      setTab('join');
    }
  }, [initialRoomCode]);

  const handleSelectUniverse = (deckId: string) => {
    soundFX.playCardHover();
    setSelectedDeck(deckId);
    if (onSelectDeck) onSelectDeck(deckId);
  };

  const handleCopyLink = async () => {
    if (!customLobbyState) return;
    const inviteUrl = `${window.location.origin}/?room=${customLobbyState.roomCode}`;
    const success = await copyToClipboard(inviteUrl);
    if (success) {
      soundFX.playCardHover();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCodeOnly = async () => {
    if (!customLobbyState) return;
    const success = await copyToClipboard(customLobbyState.roomCode);
    if (success) {
      soundFX.playCardHover();
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (!customLobbyState) return;
    const inviteUrl = `${window.location.origin}/?room=${customLobbyState.roomCode}`;
    try {
      await navigator.share({
        title: 'Card Arena Private Duel Invite',
        text: `⚔️ I invite you to a private Card Arena match! Join room ${customLobbyState.roomCode}:`,
        url: inviteUrl,
      });
      soundFX.playCardHover();
    } catch (e) {
      handleCopyLink();
    }
  };

  const handlePasteCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          soundFX.playCardHover();
          setInputCode(normalizeRoomCode(text));
        }
      }
    } catch (err) {
      console.warn('Clipboard readText failed', err);
    }
  };

  const handleCreate = () => {
    soundFX.playCardPlay();
    onCreateRoom(defaultPlayerName, defaultAvatar, selectedDeck);
  };

  const handleJoin = () => {
    const cleanCode = normalizeRoomCode(inputCode);
    if (!cleanCode) return;
    soundFX.playCardPlay();
    onJoinRoom(cleanCode, defaultPlayerName, defaultAvatar, selectedDeck);
  };

  const handleLeave = () => {
    soundFX.playCardHover();
    if (customLobbyState) {
      onLeaveRoom(customLobbyState.roomCode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-panel-glow p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-arena-cyan/60 shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header with Title & Close Button */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-arena-blue to-arena-cyan border border-white flex items-center justify-center shadow-md shrink-0">
              <Users className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black font-display uppercase tracking-wider text-white truncate">
                Play with Friends
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">
                Private Duel • 1-Click Invite Link
              </p>
            </div>
          </div>

          <button
            onClick={handleLeave}
            className="w-9 h-9 rounded-xl glass-panel text-slate-400 hover:text-white flex items-center justify-center shrink-0 border border-slate-700/60 active:scale-95 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Offline / Connecting Notice */}
        {!isConnected && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-bold flex items-center gap-2 shrink-0">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>Connecting to Arena multiplayer network...</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] sm:text-xs font-bold flex items-center gap-2 animate-shake shrink-0">
            <span className="text-base shrink-0">⚠️</span>
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {!customLobbyState ? (
          /* Create vs Join Tabs */
          <div className="flex-1 flex flex-col">
            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 mb-4 shrink-0">
              <button
                onClick={() => {
                  soundFX.playCardHover();
                  setTab('create');
                }}
                className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                  tab === 'create'
                    ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Room</span>
              </button>
              <button
                onClick={() => {
                  soundFX.playCardHover();
                  setTab('join');
                }}
                className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                  tab === 'join'
                    ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Join with Code</span>
              </button>
            </div>

            {/* Quick Universe Deck Selector */}
            <div className="mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-arena-cyan" />
                  Your Battle Universe
                </span>
                <span className="text-[10px] font-bold text-arena-cyan uppercase">
                  {UNIVERSES.find((u) => u.id === selectedDeck)?.name || 'Default Deck'}
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {UNIVERSES.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUniverse(u.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      selectedDeck === u.id
                        ? 'bg-arena-cyan/20 border border-arena-cyan text-white shadow-sm'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{u.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {tab === 'create' ? (
              <div className="flex flex-col items-center text-center py-2 sm:py-4 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-arena-blue/20 border border-arena-cyan/40 flex items-center justify-center mb-3 shadow-lg">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-arena-cyan animate-pulse" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  Host a Private Duel
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-5 sm:mb-6 font-medium leading-relaxed">
                  Generates an instant 6-digit room code and share link. Send it to any friend to battle head-to-head!
                </p>

                <button
                  onClick={handleCreate}
                  disabled={!isConnected}
                  className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:brightness-110 text-slate-950 font-black font-display uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-arena-cyan/30 transition transform hover:scale-[1.01] active:scale-[0.99] border-2 border-white disabled:opacity-50 cursor-pointer"
                >
                  Generate Room Code & Link
                </button>
              </div>
            ) : (
              <div className="py-2 flex flex-col my-auto">
                {/* Invited banner if URL had room param */}
                {initialRoomCode && (
                  <div className="mb-4 p-3 rounded-2xl bg-arena-blue/20 border border-arena-cyan/60 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-arena-cyan block mb-0.5">
                      ⚔️ Friend Duel Invite
                    </span>
                    <span className="text-xs font-bold text-white">
                      You are invited to join room <span className="font-mono text-arena-cyan font-black">{initialRoomCode}</span>
                    </span>
                  </div>
                )}

                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Enter 6-Digit Code or Invite Link
                </label>

                {/* Input with embedded Paste Button */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="ARENA-XXXX"
                    value={inputCode}
                    onChange={(e) => setInputCode(normalizeRoomCode(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-4 pr-14 py-3.5 text-center text-lg sm:text-xl font-mono font-black text-arena-cyan placeholder:text-slate-600 focus:outline-none focus:border-arena-cyan tracking-widest uppercase shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handlePasteCode}
                    title="Paste from clipboard"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] uppercase flex items-center gap-1 transition cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-arena-cyan" />
                    <span>Paste</span>
                  </button>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={!inputCode.trim() || !isConnected}
                  className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:brightness-110 text-slate-950 font-black font-display uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-arena-cyan/30 transition transform hover:scale-[1.01] active:scale-[0.99] border-2 border-white disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  Join Friend's Room
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Active Staging Lobby */
          <div className="flex-1 flex flex-col py-1">
            
            {/* HERO ROOM CODE & SPACIOUS SHARING CARD (NO CONGESTION) */}
            <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-4 sm:p-5 rounded-2xl border border-arena-cyan/50 shadow-lg text-center mb-4 relative overflow-hidden">
              <span className="text-[10px] uppercase font-black tracking-widest text-arena-cyan/90 block mb-1">
                PRIVATE ROOM CODE
              </span>

              {/* Large, Glowing Room Code */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-2xl sm:text-4xl font-mono font-black text-white tracking-widest drop-shadow-[0_0_12px_rgba(6,182,212,0.5)] select-all">
                  {customLobbyState.roomCode}
                </h3>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mb-3">
                Send this code or share the invite link with your friend!
              </p>

              {/* ACTION BUTTONS: SPATIAL, TOUCH-FRIENDLY & UNCONGESTED */}
              <div className="space-y-2">
                {/* Native Mobile Share Button */}
                {canShare && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-slate-950" />
                    <span>Share Invite via WhatsApp / App</span>
                  </button>
                )}

                {/* 2 Equal Columns for Copy Code & Copy Link */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyCodeOnly}
                    className="py-2.5 sm:py-3 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-arena-cyan text-slate-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-arena-cyan" />}
                    <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="py-2.5 sm:py-3 px-3 rounded-xl bg-arena-blue/20 hover:bg-arena-blue/30 border border-arena-cyan/80 text-arena-cyan font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Players Staging Area */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4">
              {/* Host Player Card */}
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-arena-blue/60 flex flex-col items-center text-center">
                <span className="text-[9px] uppercase font-black tracking-widest text-arena-cyan mb-1">
                  👑 Host
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-arena-blue to-slate-950 border border-arena-cyan flex items-center justify-center text-xl sm:text-2xl mb-1.5 shadow-md">
                  🤖
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-full">
                  {customLobbyState.host.playerName}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                  🎴 {customLobbyState.host.deckId}
                </span>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready</span>
                </div>
              </div>

              {/* Guest Player Card */}
              {customLobbyState.guest ? (
                <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-arena-cyan flex flex-col items-center text-center">
                  <span className="text-[9px] uppercase font-black tracking-widest text-arena-cyan mb-1">
                    ⚔️ Challenger
                  </span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-arena-cyan to-slate-950 border border-arena-cyan flex items-center justify-center text-xl sm:text-2xl mb-1.5 shadow-md">
                    🔥
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-full">
                    {customLobbyState.guest.playerName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                    🎴 {customLobbyState.guest.deckId}
                  </span>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Connected</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-700/80 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-arena-cyan animate-spin mb-1.5" />
                  <span className="text-[11px] sm:text-xs font-bold text-slate-300">
                    Waiting for Friend...
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Share code or link above!
                  </span>
                </div>
              )}
            </div>

            {/* Launch & Exit Controls */}
            <div className="space-y-2 mt-auto">
              {customLobbyState.isHost ? (
                isLaunching ? (
                  <button
                    disabled
                    className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue text-slate-950 font-black font-display uppercase tracking-widest text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 opacity-80"
                  >
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 animate-spin" />
                    <span>Launching Arena Battle...</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      soundFX.playCardPlay();
                      setIsLaunching(true);
                      onStartMatch(customLobbyState.roomCode);
                    }}
                    disabled={!customLobbyState.guest}
                    className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:brightness-110 text-slate-950 font-black font-display uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-arena-cyan/30 transition transform hover:scale-[1.01] active:scale-[0.99] border-2 border-white disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>
                      {customLobbyState.guest ? 'Start Battle (2/2 Ready)' : 'Waiting for Friend (1/2)'}
                    </span>
                  </button>
                )
              ) : (
                <div className="w-full py-3 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-arena-cyan animate-spin" />
                  <span>Waiting for Host to Start Battle...</span>
                </div>
              )}

              {/* Explicit Leave Room Button */}
              <button
                onClick={handleLeave}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs uppercase tracking-wider transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Private Room</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
