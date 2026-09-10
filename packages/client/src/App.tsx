import React, { useState, useEffect, useRef } from 'react';
import { useGameSocket } from './hooks/useGameSocket.js';
import { ParticleBackground } from './components/ParticleBackground.js';
import { LandingHero } from './components/LandingHero.js';
import { DeckStudio } from './components/DeckStudio.js';
import { CustomDeckBuilder } from './components/CustomDeckBuilder.js';
import { LeaderboardModal } from './components/LeaderboardModal.js';
import { FounderModal } from './components/FounderModal.js';
import { LoginPage } from './components/LoginPage.js';
import { UniverseSelectorModal, UNIVERSES } from './components/UniverseSelector.js';
import { ShowdownArena } from './components/ShowdownArena.js';
import { Lobby } from './components/Lobby.js';
import { MatchmakingRadar } from './components/MatchmakingRadar.js';
import { FriendRoomModal } from './components/FriendRoomModal.js';
import { Battlefield } from './components/Battlefield.js';
import { GameOverModal } from './components/GameOverModal.js';
import { soundFX } from './utils/audio.js';
import { loadPlayerStats, PlayerStats } from './utils/ranks.js';
import { getCurrentUser, logoutUser, UserAccount } from './utils/auth.js';
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
  Crown,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { PRESET_DECKS } from '@card-battler/shared';

type ViewMode = 'landing' | 'login' | 'deck-studio' | 'custom-decks' | 'lobby' | 'showdown';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('arena_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [selectedDeckId, setSelectedDeckId] = useState<string>(PRESET_DECKS[0].id);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [currentPlayerName, setCurrentPlayerName] = useState<string>(() => {
    const user = getCurrentUser();
    if (user) return user.username;
    return `Pilot_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFounder, setShowFounder] = useState(false);
  const [showUniverseModal, setShowUniverseModal] = useState(false);
  const [initialUrlRoomCode, setInitialUrlRoomCode] = useState<string>('');
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats(currentPlayerName));
  const [quickMatchOpponent, setQuickMatchOpponent] = useState<string>('Rival Pilot');
  const [isQuickMatchMode, setIsQuickMatchMode] = useState<boolean>(false);
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState<boolean>(false);
  const [quickMatchSearchSeconds, setQuickMatchSearchSeconds] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (isSearchingQuickMatch) {
      timer = setInterval(() => {
        setQuickMatchSearchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setQuickMatchSearchSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isSearchingQuickMatch]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentPlayerName(user.username);
    setPlayerStats(loadPlayerStats(user.username));
    setViewMode('landing');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    const guestName = `Pilot_${Math.floor(1000 + Math.random() * 9000)}`;
    setCurrentPlayerName(guestName);
    setPlayerStats(loadPlayerStats(guestName));
    soundFX.playCardHover();
  };

  const currentUniverse = UNIVERSES.find((u) => u.id === selectedDeckId) || UNIVERSES[0];

  const {
    isConnected,
    queueState,
    customLobbyState,
    gameState,
    lastError,
    myPlayerId: serverPlayerId,
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

  // Close friend room modal immediately once match is established
  useEffect(() => {
    if (gameState) {
      setShowFriendModal(false);
    }
  }, [gameState]);

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

  const quickMatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (quickMatchTimeoutRef.current) {
        clearTimeout(quickMatchTimeoutRef.current);
      }
    };
  }, []);

  const handleQuickMatch = () => {
    soundFX.playCardPlay();
    setIsSearchingQuickMatch(true);
    setQuickMatchSearchSeconds(0);

    const RIVAL_PILOTS = [
      'ViperStrike_99',
      'ApexTitan_88',
      'ShadowDuelist_X',
      'QuantumGhost_23',
      'NovaChampion_77',
      'TitanSlayer_42',
      'PhantomBlade_07',
      'CyberViper_31',
    ];
    const pickedRival = RIVAL_PILOTS[Math.floor(Math.random() * RIVAL_PILOTS.length)];

    if (quickMatchTimeoutRef.current) {
      clearTimeout(quickMatchTimeoutRef.current);
    }

    // Authentic matchmaking radar search across the multiverse network
    quickMatchTimeoutRef.current = setTimeout(() => {
      soundFX.playMatchStart();
      setIsSearchingQuickMatch(false);
      setIsQuickMatchMode(true);
      setQuickMatchOpponent(pickedRival);
      setViewMode('showdown');
    }, 2200);
  };

  const handleCancelQuickMatch = () => {
    soundFX.playCardHover();
    if (quickMatchTimeoutRef.current) {
      clearTimeout(quickMatchTimeoutRef.current);
      quickMatchTimeoutRef.current = null;
    }
    setIsSearchingQuickMatch(false);
    leaveQueue();
  };

  // 5-CARD STAT SHOWDOWN (User's desired mode: 5 cards each, card-vs-card stat clash!)
  const handlePlayVsAi = (universeDeckId?: string) => {
    soundFX.playCardPlay();
    if (universeDeckId) setSelectedDeckId(universeDeckId);
    setShowUniverseModal(false);
    setIsQuickMatchMode(false);
    setQuickMatchOpponent('Chrono AI (Bot)');
    setViewMode('showdown');
  };

  const getMyPlayerId = (): string => {
    if (!gameState) return '';
    if (serverPlayerId && gameState.players[serverPlayerId]) {
      return serverPlayerId;
    }
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
            setIsQuickMatchMode(false);
            setIsSearchingQuickMatch(false);
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
        {!gameState && !queueState.inQueue && !isSearchingQuickMatch && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                soundFX.playCardHover();
                setIsQuickMatchMode(false);
                setIsSearchingQuickMatch(false);
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
            <button
              onClick={() => {
                soundFX.playCardHover();
                setViewMode('login');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                viewMode === 'login'
                  ? 'bg-arena-cyan/20 text-arena-cyan border border-arena-cyan/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              {currentUser ? 'Account' : 'Sign In'}
            </button>
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* User Account / Sign In Badge */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 p-1 pl-2 pr-1 rounded-xl bg-slate-900/90 border border-arena-cyan/50 shadow-md">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-arena-blue/30 border border-arena-cyan flex items-center justify-center text-xs">
                👤
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] sm:text-[11px] font-black text-arena-cyan leading-tight truncate max-w-[60px] sm:max-w-[120px]">
                  {currentUser.username}
                </span>
                <span className="text-[7px] sm:text-[8px] font-bold text-emerald-400 uppercase tracking-wider hidden sm:block">
                  Active
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                soundFX.playCardPlay();
                setViewMode('login');
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-cyan-400 hover:to-white text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md shadow-arena-cyan/20 border border-white transition transform hover:scale-105 cursor-pointer"
              title="Sign In / Register Account"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Founder Button */}
          <button
            onClick={() => {
              soundFX.playCardHover();
              setShowFounder(true);
            }}
            className="p-1.5 sm:p-2 px-2 sm:px-2.5 rounded-xl glass-panel text-amber-300 hover:text-white border border-amber-500/50 hover:border-amber-400 transition flex items-center gap-1.5 bg-amber-500/15 shadow-md shadow-amber-500/10 cursor-pointer"
            title="Founder Dossier — Abhay Pandey"
          >
            <Crown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider hidden lg:inline">
              Founder: Abhay
            </span>
          </button>

          {/* Realm Switcher in Nav */}
          <button
            onClick={() => {
              soundFX.playCardHover();
              setShowUniverseModal(true);
            }}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-arena-cyan border border-arena-cyan/40 hover:border-arena-cyan transition flex items-center gap-1 shadow-sm group"
            title="Switch Battle Universe"
          >
            <span className="text-[11px] sm:text-xs font-black uppercase font-cinzel tracking-wider group-hover:text-white hidden sm:inline">
              ⚔️ {currentUniverse.name}
            </span>
            <span className="text-[11px] font-black uppercase font-cinzel tracking-wider group-hover:text-white sm:hidden">
              ⚔️ {currentUniverse.universe}
            </span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              soundFX.playCardHover();
              setPlayerStats(loadPlayerStats(currentPlayerName));
              setShowLeaderboard(true);
            }}
            className="p-1.5 sm:p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-gold border border-slate-700 hover:border-arena-gold transition flex items-center gap-1.5"
            title="Global Leaderboard & Rankings"
          >
            <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-arena-gold" />
            <span className="text-xs font-mono font-black text-arena-gold hidden lg:inline">
              {playerStats.mmr} MMR
            </span>
          </button>

          <button
            onClick={() => {
              soundFX.playCardHover();
              setShowHowToPlay(true);
            }}
            className="hidden md:flex p-1.5 sm:p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-cyan border border-slate-700 hover:border-arena-cyan transition"
            title="Rules & How to Play"
          >
            <HelpCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 sm:p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-cyan border border-slate-700 hover:border-arena-cyan transition"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-arena-cyan" />}
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl glass-panel text-slate-300 hover:text-arena-gold border border-slate-700 hover:border-arena-gold transition flex items-center gap-1"
          >
            {theme === 'dark' ? <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-arena-gold" /> : <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-arena-blue" />}
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
        {gameState && viewMode !== 'showdown' ? (
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
        ) : isSearchingQuickMatch || queueState.inQueue ? (
          <MatchmakingRadar
            queueState={{
              inQueue: isSearchingQuickMatch || queueState.inQueue,
              timeInQueue: isSearchingQuickMatch ? quickMatchSearchSeconds : queueState.timeInQueue,
            }}
            onCancelQueue={handleCancelQuickMatch}
          />
        ) : viewMode === 'showdown' ? (
          <ShowdownArena
            universeId={selectedDeckId}
            playerName={currentPlayerName}
            isQuickMatch={isQuickMatchMode}
            opponentName={quickMatchOpponent}
            onExit={() => {
              setIsQuickMatchMode(false);
              setViewMode('landing');
            }}
            onChangeUniverse={() => {
              setIsQuickMatchMode(false);
              setViewMode('landing');
              setShowUniverseModal(true);
            }}
          />
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
        ) : viewMode === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onPlayAsGuest={() => setViewMode('landing')}
            onOpenFounder={() => setShowFounder(true)}
          />
        ) : (
          <LandingHero
            onQuickMatch={handleQuickMatch}
            onPlayVsAi={() => handlePlayVsAi(selectedDeckId)}
            onPlayWithFriends={() => setShowFriendModal(true)}
            onOpenDeckStudio={() => setViewMode('custom-decks')}
            onOpenFounder={() => setShowFounder(true)}
            onOpenLogin={() => setViewMode('login')}
            currentPlayerName={currentPlayerName}
            isLoggedIn={Boolean(currentUser)}
            selectedUniverseName={currentUniverse.name}
            onOpenUniverseSelector={() => setShowUniverseModal(true)}
          />
        )}
      </main>

      {/* Battle Universe Selector Modal */}
      <UniverseSelectorModal
        isOpen={showUniverseModal}
        selectedUniverseId={selectedDeckId}
        onSelect={(deckId) => setSelectedDeckId(deckId)}
        onClose={() => setShowUniverseModal(false)}
        onStartAi={handlePlayVsAi}
      />

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
          isConnected={isConnected}
          errorMessage={lastError}
          onSelectDeck={(deckId) => setSelectedDeckId(deckId)}
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
