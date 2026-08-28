import React, { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket.js';
import { ParticleBackground } from './components/ParticleBackground.js';
import { LandingHero } from './components/LandingHero.js';
import { DeckStudio } from './components/DeckStudio.js';
import { CustomDeckBuilder } from './components/CustomDeckBuilder.js';
import { LeaderboardModal } from './components/LeaderboardModal.js';
import { FounderModal } from './components/FounderModal.js';
import { Lobby } from './components/Lobby.js';
import { MatchmakingRadar } from './components/MatchmakingRadar.js';
import { FriendRoomModal } from './components/FriendRoomModal.js';
import { Battlefield } from './components/Battlefield.js';
import { GameOverModal } from './components/GameOverModal.js';
import { soundFX } from './utils/audio.js';
import { loadPlayerStats, PlayerStats } from './utils/ranks.js';
import { 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Swords, 
  HelpCircle,
  X,
  Users,
  Trophy,
  Sparkles,
  Crown
} from 'lucide-react';
import { PRESET_DECKS } from '@card-battler/shared';

type ViewMode = 'landing' | 'deck-studio' | 'custom-decks' | 'lobby';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('arena_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [selectedDeckId, setSelectedDeckId] = useState<string>(PRESET_DECKS[0].id);
  const [currentPlayerName, setCurrentPlayerName] = useState<string>(
    () => `Pilot_${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFounder, setShowFounder] = useState(false);
  const [initialUrlRoomCode, setInitialUrlRoomCode] = useState<string>('');
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats(currentPlayerName));

  const {
    isConnected,
    queueState,
    customLobbyState,
    gameState,
    lastError,
    joinQueue,
    leaveQueue,
    startAiMatch,
    createCustomRoom,
    joinCustomRoom,
    leaveCustomRoom,
    startCustomMatch,
    playCard,
    attackMinion,
    attackHero,
    endTurn,
    surrender,
    resetMatchState,
  } = useGameSocket();

  // Read URL query param ?room=ARENA-XXXX for instant friend joins
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialUrlRoomCode(roomParam.toUpperCase());
      setShowFriendModal(true);
    }
  }, []);

  // Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('arena_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    soundFX.playCardHover();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleMute = () => {
    const nextMute = soundFX.toggleMute();
    setIsMuted(nextMute);
  };

  const handleQuickMatch = () => {
    soundFX.playCardPlay();
    joinQueue(currentPlayerName, 'cyber-runner', selectedDeckId);
  };

  const handlePlayVsAi = () => {
    soundFX.playCardPlay();
    const aiDeckOptions = ['marvel-avengers', 'anime-allstars', 'pokemon-champions', 'wwe-legends', 'dc-justice'];
    const randomAiDeck = aiDeckOptions[Math.floor(Math.random() * aiDeckOptions.length)];
    startAiMatch(currentPlayerName, 'cyber-runner', selectedDeckId, randomAiDeck);
  };

  const getMyPlayerId = (): string => {
    if (!gameState) return '';
    const matchingId = Object.keys(gameState.players).find(
      (id) => gameState.players[id].name === currentPlayerName
    );
    return matchingId || gameState.playerOrder[0];
  };

  const myPlayerId = getMyPlayerId();
  const isGameOver = gameState?.phase === 'ended';
  const isWinner = isGameOver && gameState.winnerId === myPlayerId;
  const isDraw = isGameOver && gameState.winnerId === null;

  const opponentPlayerId = gameState?.playerOrder.find((id) => id !== myPlayerId);
  const opponentName = opponentPlayerId ? gameState?.players[opponentPlayerId]?.name : 'Chrono AI (Bot)';

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col justify-between relative transition-colors duration-500">
      <ParticleBackground theme={theme} />

      {/* Header */}
      <header className="relative z-30 w-full border-b border-slate-800/80 glass-panel px-4 sm:px-8 py-3 flex items-center justify-between">
        <div
          onClick={() => {
            soundFX.playCardHover();
            setViewMode('landing');
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-arena-blue to-arena-cyan border border-white/60 flex items-center justify-center shadow-md shadow-arena-cyan/20 group-hover:scale-105 transition">
            <Swords className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-black font-display text-lg tracking-widest text-slate-100 flex items-center gap-1">
              CARD<span className="text-arena-cyan">ARENA</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        {!gameState && !queueState.inQueue && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                soundFX.playCardHover();
                setViewMode('landing');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                viewMode === 'landing'
                  ? 'bg-arena-cyan/20 text-arena-cyan border border-arena-cyan/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Arena Home
            </button>
            <button
              onClick={() => {
                soundFX.playCardHover();
                setShowFriendModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-arena-cyan hover:bg-arena-blue/20 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Play Friends
            </button>
            <button
              onClick={() => {
                soundFX.playCardHover();
                setViewMode('custom-decks');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                viewMode === 'custom-decks'
                  ? 'bg-arena-cyan/20 text-arena-cyan border border-arena-cyan/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-arena-gold" />
              Custom Deck Builder
            </button>
            <button
              onClick={() => {
                soundFX.playCardHover();
                setViewMode('deck-studio');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                viewMode === 'deck-studio'
                  ? 'bg-arena-cyan/20 text-arena-cyan border border-arena-cyan/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deck Studio
            </button>
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Founder Button */}
          <button
            onClick={() => {
              soundFX.playCardHover();
              setShowFounder(true);
            }}
            className="p-2 rounded-xl glass-panel text-arena-gold hover:text-white border border-amber-500/40 hover:border-arena-gold transition flex items-center gap-1.5 bg-amber-500/10"
            title="Founder Profile — Abhay Pandey"
          >
            <Crown className="w-4 h-4 text-arena-gold" />
            <span className="text-xs font-black uppercase tracking-wider hidden xl:inline">
              Founder
            </span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              soundFX.playCardHover();
              setPlayerStats(loadPlayerStats(currentPlayerName));
              setShowLeaderboard(true);
            }}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-gold border border-slate-700 hover:border-arena-gold transition flex items-center gap-1.5"
            title="Global Leaderboard & Rankings"
          >
            <Trophy className="w-4 h-4 text-arena-gold" />
            <span className="text-xs font-mono font-black text-arena-gold hidden lg:inline">
              {playerStats.mmr} MMR
            </span>
          </button>

          <button
            onClick={() => {
              soundFX.playCardHover();
              setShowHowToPlay(true);
            }}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-cyan border border-slate-700 hover:border-arena-cyan transition"
            title="Rules & How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-cyan border border-slate-700 hover:border-arena-cyan transition"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-arena-cyan" />}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-gold border border-slate-700 hover:border-arena-gold transition flex items-center gap-1.5"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-arena-gold" /> : <Moon className="w-4 h-4 text-arena-blue" />}
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
              {theme === 'dark' ? 'DARK' : 'LIGHT'}
            </span>
          </button>
        </div>
      </header>

      {/* Global Error Banner */}
      {lastError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-600/95 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-rose-400">
          <AlertCircle className="w-4 h-4" />
          {lastError}
        </div>
      )}

      {/* Screen Router */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        {gameState ? (
          <>
            <Battlefield
              gameState={gameState}
              myPlayerId={myPlayerId}
              onPlayCard={playCard}
              onAttackMinion={attackMinion}
              onAttackHero={attackHero}
              onEndTurn={endTurn}
              onSurrender={surrender}
            />
            {isGameOver && (
              <GameOverModal
                isWinner={isWinner}
                isDraw={isDraw}
                winReason={gameState.winReason}
                opponentName={opponentName}
                deckUsed={selectedDeckId}
                onPlayAgain={() => {
                  setPlayerStats(loadPlayerStats(currentPlayerName));
                  resetMatchState();
                }}
              />
            )}
          </>
        ) : queueState.inQueue ? (
          <MatchmakingRadar queueState={queueState} onCancelQueue={leaveQueue} />
        ) : viewMode === 'custom-decks' ? (
          <CustomDeckBuilder
            onBackToArena={() => setViewMode('landing')}
            onSelectDeck={(deckId) => setSelectedDeckId(deckId)}
            currentSelectedDeckId={selectedDeckId}
          />
        ) : viewMode === 'deck-studio' ? (
          <DeckStudio
            onBackToArena={() => setViewMode('landing')}
            onSelectDeck={(deckId) => setSelectedDeckId(deckId)}
            currentSelectedDeckId={selectedDeckId}
          />
        ) : viewMode === 'lobby' ? (
          <Lobby
            isConnected={isConnected}
            queueState={queueState}
            onJoinQueue={(name, avatar, deckId) => {
              setCurrentPlayerName(name);
              joinQueue(name, avatar, deckId);
            }}
            onLeaveQueue={leaveQueue}
          />
        ) : (
          <LandingHero
            onQuickMatch={handleQuickMatch}
            onPlayVsAi={handlePlayVsAi}
            onPlayWithFriends={() => setShowFriendModal(true)}
            onOpenDeckStudio={() => setViewMode('custom-decks')}
            onOpenFounder={() => setShowFounder(true)}
          />
        )}
      </main>

      {/* Founder Modal */}
      {showFounder && (
        <FounderModal onClose={() => setShowFounder(false)} />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          stats={playerStats}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Play with Friends Modal */}
      {showFriendModal && (
        <FriendRoomModal
          customLobbyState={customLobbyState}
          onCreateRoom={(name, avatar, deckId) => {
            setCurrentPlayerName(name);
            createCustomRoom(name, avatar, deckId);
          }}
          onJoinRoom={(code, name, avatar, deckId) => {
            setCurrentPlayerName(name);
            joinCustomRoom(code, name, avatar, deckId);
          }}
          onStartMatch={(code) => startCustomMatch(code)}
          onLeaveRoom={(code) => leaveCustomRoom(code)}
          onClose={() => setShowFriendModal(false)}
          defaultPlayerName={currentPlayerName}
          defaultAvatar="cyber-runner"
          defaultDeckId={selectedDeckId}
          initialRoomCode={initialUrlRoomCode}
        />
      )}

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg glass-panel-glow p-6 sm:p-8 rounded-3xl border border-arena-cyan relative">
            <button
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-4 right-4 p-2 rounded-xl glass-panel text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black font-display uppercase tracking-wider text-white mb-4">
              Card Arena Game Modes & Rules
            </h3>

            <div className="space-y-3 text-xs text-slate-300 font-semibold leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-arena-cyan font-black uppercase tracking-wider block mb-1">
                  1. Game Modes & Custom Decks
                </span>
                • <strong>Quick Match:</strong> Global PvP radar matchmaking.<br/>
                • <strong>Play vs Computer:</strong> Instant solo practice against the smart AI Bot.<br/>
                • <strong>Play with Friends:</strong> Create a 6-digit private room and send the 1-click link!<br/>
                • <strong>Custom Deck Builder:</strong> Mix Marvel, DC, Pokemon, WWE & Anime heroes into a 14-card hybrid deck!
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-arena-gold font-black uppercase tracking-wider block mb-1">
                  2. 5-Stat Battle System
                </span>
                • 💥 <strong>Power (PWR):</strong> Damage dealt in combat.<br/>
                • ⚡ <strong>Speed (SPD):</strong> High speed strikes first and eliminates defenders before retaliation!<br/>
                • 🛡️ <strong>Agility (AGI):</strong> Kinetic strike mitigation & evasion.<br/>
                • ❤️ <strong>Stamina (HP):</strong> Total endurance.
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-orange-400 font-black uppercase tracking-wider block mb-1">
                  3. Leaderboard & Ranks
                </span>
                Earn <strong>+25 MMR</strong> on victories and climb from <strong>Bronze $\rightarrow$ Grandmaster Titan</strong>!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
