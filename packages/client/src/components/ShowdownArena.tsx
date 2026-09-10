import React, { useState, useEffect } from 'react';
import { CardTemplate, ShowdownActionPayload } from '@card-battler/shared';
import { Card3D } from './Card3D.js';
import { 
  ShowdownMatchState, 
  initShowdownMatch, 
  evaluateShowdownClash, 
  chooseAiLeadCard,
  chooseAiCounterCard,
  RoundClashResult 
} from '../utils/showdown-engine.js';
import { UNIVERSES } from './UniverseSelector.js';
import { soundFX } from '../utils/audio.js';
import confetti from 'canvas-confetti';
import { 
  Swords, 
  Zap, 
  Wind, 
  Flame, 
  Trophy, 
  RotateCcw, 
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ShieldAlert,
  Target
} from 'lucide-react';

import { recordMatchResult } from '../utils/ranks.js';

interface ShowdownArenaProps {
  universeId: string;
  opponentUniverseId?: string;
  playerName: string;
  opponentName?: string;
  isQuickMatch?: boolean;
  isMultiplayer?: boolean;
  isHost?: boolean;
  roomId?: string;
  startingLeader?: 'player' | 'opponent';
  onSendShowdownAction?: (action: ShowdownActionPayload) => void;
  incomingShowdownAction?: ShowdownActionPayload | null;
  onExit: () => void;
  onChangeUniverse: () => void;
}

export const ShowdownArena: React.FC<ShowdownArenaProps> = ({
  universeId,
  opponentUniverseId,
  playerName,
  opponentName,
  isQuickMatch = false,
  isMultiplayer = false,
  isHost = false,
  roomId = '',
  startingLeader = 'player',
  onSendShowdownAction,
  incomingShowdownAction,
  onExit,
  onChangeUniverse,
}) => {
  const opponentDisplayName = opponentName || (isQuickMatch ? 'Rival Pilot' : isMultiplayer ? 'Friend Pilot' : 'Computer (AI)');
  const [match, setMatch] = useState<ShowdownMatchState>(() =>
    initShowdownMatch(universeId, opponentUniverseId, startingLeader)
  );
  const [screenShake, setScreenShake] = useState(false);
  const [showStatBars, setShowStatBars] = useState(false);
  const [mmrResult, setMmrResult] = useState<{ newMmr: number; mmrChange: number } | null>(null);
  const [rematchRequestedByPeer, setRematchRequestedByPeer] = useState(false);
  const [rematchSent, setRematchSent] = useState(false);

  const universe = UNIVERSES.find((u) => u.id === universeId) || UNIVERSES[0];

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 450);
  };

  // Re-sync match when roomId, universes, or startingLeader changes
  useEffect(() => {
    if (isMultiplayer) {
      setMatch(initShowdownMatch(universeId, opponentUniverseId, startingLeader));
      setRematchRequestedByPeer(false);
      setRematchSent(false);
    }
  }, [roomId, universeId, opponentUniverseId, startingLeader, isMultiplayer]);

  // Automated AI Lead: When Computer lost last round, Computer must play first (Solo / AI mode only)
  useEffect(() => {
    if (isMultiplayer) return;
    if (
      match.currentLeader === 'opponent' &&
      !match.playedOpponentCard &&
      match.phase !== 'match_ended' &&
      match.round <= match.maxRounds &&
      match.opponentHand.length > 0
    ) {
      const timer = setTimeout(() => {
        const aiLead = chooseAiLeadCard(match.opponentHand);
        const nextOpponentHand = match.opponentHand.filter((c) => c.id !== aiLead.id);

        soundFX.playCardPlay();
        setMatch((prev) => ({
          ...prev,
          opponentHand: nextOpponentHand,
          playedOpponentCard: aiLead,
          phase: 'player_turn',
        }));
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [match.round, match.currentLeader, match.playedOpponentCard, match.phase, isMultiplayer]);

  // Advance to next round locally with "Loser Leads" rule
  const advanceRoundLocally = () => {
    soundFX.playCardPlay();
    setShowStatBars(false);

    if (match.round >= match.maxRounds) {
      // Match Ended
      let matchWinner: 'player' | 'opponent' | 'tie' = 'tie';
      if (match.playerScore > match.opponentScore) {
        matchWinner = 'player';
        soundFX.playVictory();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else if (match.opponentScore > match.playerScore) {
        matchWinner = 'opponent';
      }

      if (isQuickMatch) {
        const resultOutcome =
          matchWinner === 'player' ? 'win' : matchWinner === 'opponent' ? 'loss' : 'draw';
        const res = recordMatchResult(resultOutcome, opponentDisplayName, universe.name);
        setMmrResult(res);
      }

      setMatch((prev) => ({
        ...prev,
        phase: 'match_ended',
        matchWinner,
      }));
    } else {
      // Determine initiative for next round: LOSER LEADS NEXT ROUND
      const lastWinner = match.lastClashResult?.winner;
      let nextLeader: 'player' | 'opponent';

      if (lastWinner === 'player') {
        // Player won -> Opponent lost -> Opponent MUST play first!
        nextLeader = 'opponent';
      } else if (lastWinner === 'opponent') {
        // Opponent won -> Player lost -> Player MUST play first!
        nextLeader = 'player';
      } else {
        // Tie -> Alternate
        nextLeader = match.currentLeader === 'player' ? 'opponent' : 'player';
      }

      setMatch((prev) => ({
        ...prev,
        round: prev.round + 1,
        playedPlayerCard: null,
        playedOpponentCard: null,
        lastClashResult: null,
        currentLeader: nextLeader,
        phase: 'player_turn',
      }));
    }
  };

  // Synchronize Multiplayer Peer Actions via WebSocket
  useEffect(() => {
    if (!isMultiplayer || !incomingShowdownAction) return;

    const { action, card } = incomingShowdownAction;

    if (action === 'PLAY_CARD' && card) {
      if (match.currentLeader === 'opponent') {
        // Case A: Peer was the leader and played their lead card
        soundFX.playCardPlay();
        const nextOpponentHand =
          match.opponentHand.length > 1
            ? match.opponentHand.slice(0, match.opponentHand.length - 1)
            : [];

        setMatch((prev) => ({
          ...prev,
          opponentHand: nextOpponentHand,
          playedOpponentCard: card,
          phase: 'player_turn', // Local player can now counter!
        }));
      } else {
        // Case B: Peer was countering our lead card!
        soundFX.playCardHover();
        soundFX.playAttack();
        triggerShake();

        const nextOpponentHand =
          match.opponentHand.length > 1
            ? match.opponentHand.slice(0, match.opponentHand.length - 1)
            : [];

        if (match.playedPlayerCard) {
          const result: RoundClashResult = evaluateShowdownClash(match.playedPlayerCard, card);

          if (result.winner === 'player') {
            soundFX.playVictory();
          } else if (result.winner === 'opponent') {
            soundFX.playDamage();
          }

          setShowStatBars(true);

          const nextPlayerScore =
            result.winner === 'player' || result.winner === 'tie'
              ? match.playerScore + 1
              : match.playerScore;
          const nextOpponentScore =
            result.winner === 'opponent' || result.winner === 'tie'
              ? match.opponentScore + 1
              : match.opponentScore;

          setMatch((prev) => ({
            ...prev,
            opponentHand: nextOpponentHand,
            playedOpponentCard: card,
            lastClashResult: result,
            playerScore: nextPlayerScore,
            opponentScore: nextOpponentScore,
            phase: 'clash_reveal',
          }));
        }
      }
    } else if (action === 'NEXT_ROUND') {
      if (match.phase === 'clash_reveal') {
        advanceRoundLocally();
      }
    } else if (action === 'REMATCH') {
      setRematchRequestedByPeer(true);
      soundFX.playVictory();
    } else if (action === 'SURRENDER') {
      soundFX.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setMatch((prev) => ({
        ...prev,
        phase: 'match_ended',
        matchWinner: 'player',
        playerScore: Math.max(prev.playerScore, 3),
      }));
    }
  }, [incomingShowdownAction, isMultiplayer, match.currentLeader, match.playedPlayerCard, match.phase]);

  // When player plays a card from hand
  const handlePlayCard = (card: CardTemplate) => {
    if (match.phase !== 'player_turn') return;

    const nextPlayerHand = match.playerHand.filter((c) => c.id !== card.id);

    if (match.currentLeader === 'opponent') {
      // ----------------------------------------------------
      // CASE 1: Opponent already led! Player is countering!
      // ----------------------------------------------------
      if (!match.playedOpponentCard) return; // Wait for opponent to place lead

      soundFX.playCardPlay();
      soundFX.playAttack();
      triggerShake();

      const opponentCard = match.playedOpponentCard;
      const result: RoundClashResult = evaluateShowdownClash(card, opponentCard);

      if (result.winner === 'player') {
        soundFX.playVictory();
      } else if (result.winner === 'opponent') {
        soundFX.playDamage();
      }

      setShowStatBars(true);

      const nextPlayerScore =
        result.winner === 'player' || result.winner === 'tie'
          ? match.playerScore + 1
          : match.playerScore;
      const nextOpponentScore =
        result.winner === 'opponent' || result.winner === 'tie'
          ? match.opponentScore + 1
          : match.opponentScore;

      setMatch((prev) => ({
        ...prev,
        playerHand: nextPlayerHand,
        playedPlayerCard: card,
        lastClashResult: result,
        playerScore: nextPlayerScore,
        opponentScore: nextOpponentScore,
        phase: 'clash_reveal',
      }));

      // Broadcast counter card in multiplayer
      if (isMultiplayer && onSendShowdownAction) {
        onSendShowdownAction({
          roomId,
          action: 'PLAY_CARD',
          card,
          round: match.round,
        });
      }

    } else {
      // ----------------------------------------------------
      // CASE 2: Player is leading! Opponent will counter!
      // ----------------------------------------------------
      soundFX.playCardPlay();

      setMatch((prev) => ({
        ...prev,
        playerHand: nextPlayerHand,
        playedPlayerCard: card,
        phase: 'opponent_thinking',
      }));

      if (isMultiplayer) {
        // Broadcast lead card to opponent
        onSendShowdownAction?.({
          roomId,
          action: 'PLAY_CARD',
          card,
          round: match.round,
        });
      } else {
        // Computer AI calculates counter after short thinking delay
        setTimeout(() => {
          const aiCard = chooseAiCounterCard(match.opponentHand, card);
          const nextOpponentHand = match.opponentHand.filter((c) => c.id !== aiCard.id);

          soundFX.playCardHover();
          soundFX.playAttack();
          triggerShake();

          const result: RoundClashResult = evaluateShowdownClash(card, aiCard);

          if (result.winner === 'player') {
            soundFX.playVictory();
          } else if (result.winner === 'opponent') {
            soundFX.playDamage();
          }

          setShowStatBars(true);

          const nextPlayerScore =
            result.winner === 'player' || result.winner === 'tie'
              ? match.playerScore + 1
              : match.playerScore;
          const nextOpponentScore =
            result.winner === 'opponent' || result.winner === 'tie'
              ? match.opponentScore + 1
              : match.opponentScore;

          setMatch((prev) => ({
            ...prev,
            opponentHand: nextOpponentHand,
            playedOpponentCard: aiCard,
            lastClashResult: result,
            playerScore: nextPlayerScore,
            opponentScore: nextOpponentScore,
            phase: 'clash_reveal',
          }));
        }, 1100);
      }
    }
  };

  // Next round transition with "Loser Plays First" logic
  const handleNextRound = () => {
    if (isMultiplayer) {
      onSendShowdownAction?.({
        roomId,
        action: 'NEXT_ROUND',
        round: match.round,
      });
    }
    advanceRoundLocally();
  };

  // Restart match with fresh 5 cards
  const handleRematch = () => {
    soundFX.playCardPlay();
    setShowStatBars(false);
    setRematchRequestedByPeer(false);
    setRematchSent(true);

    if (isMultiplayer) {
      onSendShowdownAction?.({
        roomId,
        action: 'REMATCH',
      });
    }
    setMatch(initShowdownMatch(universeId, opponentUniverseId, startingLeader));
  };

  // Exit match cleanly
  const handleExit = () => {
    if (isMultiplayer && match.phase !== 'match_ended') {
      onSendShowdownAction?.({
        roomId,
        action: 'SURRENDER',
      });
    }
    onExit();
  };

  const result = match.lastClashResult;
  const isMatchOver = match.phase === 'match_ended';

  return (
    <div className={`relative min-h-[calc(100dvh-64px)] flex flex-col justify-between p-2 sm:p-4 md:p-6 select-none overflow-x-hidden transition-transform duration-150 ${screenShake ? 'scale-[1.01] translate-y-0.5' : ''}`}>
      
      {/* ================= TOP SCOREBOARD ================= */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between p-2 sm:p-3 rounded-xl sm:rounded-2xl glass-panel border border-slate-700/80 shadow-xl z-20 gap-1 sm:gap-4">
        {/* Opponent Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${
            isQuickMatch || isMultiplayer
              ? 'bg-gradient-to-br from-indigo-950 to-purple-950 border border-purple-500/80 text-purple-300'
              : 'bg-red-950/80 border border-red-500/80 text-red-400'
          } flex items-center justify-center font-black shadow-md shrink-0`}>
            {isQuickMatch || isMultiplayer ? <Swords className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-[9px] sm:text-[10px] font-black uppercase ${isQuickMatch || isMultiplayer ? 'text-purple-300' : 'text-red-400'} block tracking-wider truncate`}>
                {opponentDisplayName}
              </span>
              {isMultiplayer ? (
                <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[7px] font-mono font-bold shrink-0">
                  ● ROOM
                </span>
              ) : isQuickMatch ? (
                <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[7px] font-mono font-bold shrink-0">
                  ● PvP
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-lg sm:text-2xl font-black font-cinzel text-white">
                {match.opponentScore}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400">pts</span>
            </div>
          </div>
        </div>

        {/* Round Counter & Realm Badge */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-arena-cyan flex items-center gap-1 font-cinzel whitespace-nowrap">
            <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> RND {match.round}/{match.maxRounds}
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <span
                key={r}
                className={`w-2.5 sm:w-3.5 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  r < match.round
                    ? 'bg-arena-cyan shadow-sm shadow-arena-cyan'
                    : r === match.round
                    ? 'bg-white scale-110 animate-pulse'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-0.5 uppercase truncate max-w-[100px] sm:max-w-none text-center">
            {universe.name}
          </span>
        </div>

        {/* Player Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-right min-w-0 justify-end">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-arena-cyan block tracking-wider truncate">
              {playerName}
            </span>
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <span className="text-lg sm:text-2xl font-black font-cinzel text-arena-cyan">
                {match.playerScore}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400">pts</span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-arena-blue/20 border border-arena-cyan flex items-center justify-center text-arena-cyan font-black shadow-md shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* ================= OPPONENT HAND (TOP) ================= */}
      <div className="w-full flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-2 z-10">
        <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 sm:mr-2 shrink-0">
          {opponentDisplayName} Hand ({match.opponentHand.length}):
        </span>
        <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
          {match.opponentHand.map((_, i) => (
            <div
              key={i}
              className="w-7 h-10 sm:w-11 sm:h-16 md:w-13 md:h-18 rounded-md sm:rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 border border-slate-700 shadow-sm flex items-center justify-center text-slate-600 text-[9px] sm:text-xs font-black transition-transform hover:-translate-y-0.5"
            >
              🎴
            </div>
          ))}
        </div>
      </div>

      {/* ================= CENTER CLASH ARENA ================= */}
      <div className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center my-auto py-1 sm:py-2 z-20">
        
        {/* Dynamic Turn Initiative Banners */}
        {match.phase === 'player_turn' && !match.playedPlayerCard && (
          <div className="text-center animate-bounce mb-2 sm:mb-3 px-2">
            {match.currentLeader === 'opponent' ? (
              match.playedOpponentCard ? (
                <span className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5 sm:gap-2">
                  <Target className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                  <span>{opponentDisplayName} played! Pick your counter card below!</span>
                </span>
              ) : (
                <span className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-red-500/20 border border-red-500 text-red-300 font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider shadow-lg inline-flex items-center gap-1.5 sm:gap-2">
                  <Swords className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>
                    {isMultiplayer 
                      ? `${opponentDisplayName} lost last round and is playing first...` 
                      : `${opponentDisplayName} lost last round and is picking lead...`}
                  </span>
                </span>
              )
            ) : (
              <span className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-arena-cyan/20 border border-arena-cyan text-arena-cyan font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-arena-cyan/20 inline-flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>⚔️ YOUR LEAD: Pick 1 card below to play!</span>
              </span>
            )}
          </div>
        )}

        {/* Dynamic Waiting for Opponent Counter Banner */}
        {match.phase === 'opponent_thinking' && (
          <div className="text-center mb-2 sm:mb-3 px-2">
            <span className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-amber-500/20 border border-amber-500 text-amber-300 font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider shadow-lg inline-flex items-center gap-1.5 sm:gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
              <span>You played! Waiting for {opponentDisplayName} to counter...</span>
            </span>
          </div>
        )}

        {/* Duel Showcase Pedestals */}
        <div className="w-full flex flex-row flex-wrap md:flex-nowrap items-center justify-center gap-2 sm:gap-4 md:gap-8">
          
          {/* Player Card Pedestal (Left / order-1) */}
          <div className="order-1 flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-arena-cyan mb-1 flex items-center gap-1">
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {match.currentLeader === 'player' ? 'Your Lead' : 'Your Counter'}
            </span>
            {match.playedPlayerCard ? (
              <div className="animate-fade-in transform scale-100 sm:scale-105 transition-all">
                <Card3D card={match.playedPlayerCard} size="responsive" />
              </div>
            ) : (
              <div className="w-28 h-44 sm:w-36 sm:h-56 md:w-44 md:h-68 lg:w-48 lg:h-72 rounded-2xl border-2 border-dashed border-arena-cyan/40 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 text-[10px] sm:text-xs font-bold gap-1.5 text-center p-2 sm:p-4">
                <span className="text-2xl sm:text-3xl opacity-40">⚔️</span>
                <span className="px-1">{match.currentLeader === 'opponent' ? 'Awaiting Your Counter' : 'Your Lead Card'}</span>
              </div>
            )}
          </div>

          {/* VS Divider when not clash reveal */}
          {match.phase !== 'clash_reveal' && (
            <div className="order-2 md:order-2 flex items-center justify-center px-1 sm:px-2">
              {match.phase === 'opponent_thinking' ? (
                <div className="flex flex-col items-center gap-1 text-center animate-pulse py-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 sm:border-4 border-t-amber-500 border-slate-700 animate-spin" />
                  <span className="text-[9px] sm:text-xs font-black text-amber-400 uppercase tracking-wider">
                    {isMultiplayer ? 'Countering...' : 'AI Thinking...'}
                  </span>
                </div>
              ) : (
                <div className="w-9 h-9 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-slate-900/80 border-2 border-slate-700 flex items-center justify-center text-xs sm:text-base md:text-xl font-black text-slate-400 font-cinzel shadow-inner">
                  VS
                </div>
              )}
            </div>
          )}

          {/* Opponent Card Pedestal (Right / order-2 or order-3) */}
          <div className={`${match.phase === 'clash_reveal' ? 'order-2 md:order-3' : 'order-3'} flex flex-col items-center`}>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${isQuickMatch || isMultiplayer ? 'text-purple-400' : 'text-red-400'} mb-1 flex items-center gap-1`}>
              {isQuickMatch || isMultiplayer ? <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              {match.currentLeader === 'opponent' ? `${opponentDisplayName} Lead` : `${opponentDisplayName} Counter`}
            </span>
            {match.playedOpponentCard ? (
              <div className="animate-fade-in transform scale-100 sm:scale-105 transition-all">
                <Card3D card={match.playedOpponentCard} size="responsive" />
              </div>
            ) : (
              <div className="w-28 h-44 sm:w-36 sm:h-56 md:w-44 md:h-68 lg:w-48 lg:h-72 rounded-2xl border-2 border-dashed border-red-500/40 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 text-[10px] sm:text-xs font-bold gap-1.5 text-center p-2 sm:p-4">
                <span className="text-2xl sm:text-3xl opacity-40">{isQuickMatch || isMultiplayer ? '⚔️' : '🤖'}</span>
                <span className="px-1">{match.currentLeader === 'opponent' ? `${opponentDisplayName} Choosing...` : `Awaiting ${opponentDisplayName} Counter`}</span>
              </div>
            )}
          </div>

          {/* Stat Showdown Box (Center on Desktop, wraps below both cards on Mobile) */}
          {match.phase === 'clash_reveal' && result && (
            <div className="order-3 md:order-2 w-full md:w-80 max-w-sm flex flex-col items-center justify-center mt-2 md:mt-0">
              <div className="w-full bg-slate-950/95 border border-slate-700 rounded-2xl p-2.5 sm:p-4 shadow-2xl flex flex-col items-center gap-2 sm:gap-3 animate-fade-in">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 font-cinzel">
                  STAT SHOWDOWN
                </span>

                {/* Stat Duels: Attack, Speed, Agility */}
                <div className="w-full space-y-1 sm:space-y-2 text-xs">
                  {/* Attack / Power */}
                  <div className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg border ${
                    result.powerDuel.winner === 'player'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : result.powerDuel.winner === 'opponent'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    <span className="font-black text-sm sm:text-base">{result.powerDuel.playerValue}</span>
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[10px] sm:text-[11px]">
                      💥 ATTACK
                    </span>
                    <span className="font-black text-sm sm:text-base">{result.powerDuel.opponentValue}</span>
                  </div>

                  {/* Speed */}
                  <div className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg border ${
                    result.speedDuel.winner === 'player'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : result.speedDuel.winner === 'opponent'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    <span className="font-black text-sm sm:text-base">{result.speedDuel.playerValue}</span>
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[10px] sm:text-[11px]">
                      ⚡ SPEED
                    </span>
                    <span className="font-black text-sm sm:text-base">{result.speedDuel.opponentValue}</span>
                  </div>

                  {/* Agility */}
                  <div className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg border ${
                    result.agilityDuel.winner === 'player'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : result.agilityDuel.winner === 'opponent'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    <span className="font-black text-sm sm:text-base">{result.agilityDuel.playerValue}</span>
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[10px] sm:text-[11px]">
                      🛡️ AGILITY
                    </span>
                    <span className="font-black text-sm sm:text-base">{result.agilityDuel.opponentValue}</span>
                  </div>
                </div>

                {/* Winner Declaration Banner */}
                <div className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs uppercase text-center tracking-wider shadow ${
                  result.winner === 'player'
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 animate-pulse'
                    : result.winner === 'opponent'
                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'bg-amber-500 text-slate-950'
                }`}>
                  {result.winner === 'player'
                    ? `🏆 You Won Round ${match.round}! (+1 pt)`
                    : result.winner === 'opponent'
                    ? `💀 ${opponentDisplayName} Won Round ${match.round}! (+1 pt)`
                    : `🤝 Tied Round! (+1 pt each)`}
                </div>

                {/* Next Turn Initiative Notice */}
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold tracking-wide uppercase text-center">
                  {match.round < match.maxRounds && (
                    result.winner === 'player'
                      ? `⚔️ Loser Leads: ${opponentDisplayName} must play first next round!`
                      : result.winner === 'opponent'
                      ? '⚔️ Loser Leads: You must play first next round!'
                      : '🤝 Tied: Turn initiative alternates!'
                  )}
                </div>

                {/* Next Round Button - Generous 46px+ Touch Target */}
                <button
                  onClick={handleNextRound}
                  className="w-full min-h-[46px] py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-cyan-400 hover:to-white text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition transform hover:scale-102 active:scale-95 border border-white cursor-pointer touch-manipulation"
                >
                  <span>{match.round >= match.maxRounds ? 'View Final Results ➔' : 'Next Round ➔'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= PLAYER HAND (BOTTOM) ================= */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center pt-2 sm:pt-3 border-t border-slate-800/80 z-20">
        <div className="flex items-center justify-between w-full mb-1 sm:mb-2 px-2">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-arena-cyan">
            Your Hand ({match.playerHand.length} cards):
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 italic truncate max-w-[200px] sm:max-w-none">
            {match.currentLeader === 'opponent' && match.playedOpponentCard
              ? `🎯 Pick the best counter card to defeat ${opponentDisplayName}!`
              : 'Click any card to play it!'}
          </span>
        </div>

        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar snap-x w-full py-1.5 sm:py-2 px-1">
          {match.playerHand.map((card) => {
            const isClickable = match.phase === 'player_turn' && (match.currentLeader === 'player' || Boolean(match.playedOpponentCard));
            return (
              <div
                key={card.id}
                onClick={() => isClickable && handlePlayCard(card)}
                className={`flex-shrink-0 snap-center transform transition-all duration-200 ${
                  isClickable
                    ? 'cursor-pointer hover:scale-105 hover:-translate-y-2'
                    : 'opacity-50 pointer-events-none'
                }`}
              >
                <Card3D card={card} isPlayable={isClickable} size="responsive" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MATCH OVER MODAL ================= */}
      {isMatchOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-950 border-2 border-arena-cyan rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-arena-blue to-arena-cyan flex items-center justify-center text-4xl shadow-xl shadow-arena-cyan/30 mb-4 border-2 border-white">
              {match.matchWinner === 'player' ? '🏆' : match.matchWinner === 'opponent' ? '💀' : '🤝'}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black font-cinzel text-white uppercase tracking-tight">
              {match.matchWinner === 'player'
                ? 'VICTORY!'
                : match.matchWinner === 'opponent'
                ? 'DEFEAT'
                : 'DRAW!'}
            </h2>

            <p className="text-sm text-slate-300 mt-2">
              {match.matchWinner === 'player'
                ? `Outstanding strategy! You triumphed over ${opponentDisplayName} ${match.playerScore} to ${match.opponentScore}!`
                : match.matchWinner === 'opponent'
                ? `${opponentDisplayName} edged out the victory ${match.opponentScore} to ${match.playerScore}. Rematch for glory!`
                : `A rare warrior stalemate! Both champions finished ${match.playerScore} to ${match.opponentScore}!`}
            </p>

            {/* Scorecard */}
            <div className="flex items-center justify-center gap-8 my-5 py-3 px-6 rounded-2xl bg-slate-900 border border-slate-800 w-full">
              <div>
                <span className="text-[10px] font-black uppercase text-arena-cyan block">YOU</span>
                <span className="text-3xl font-black text-white font-cinzel">{match.playerScore}</span>
              </div>
              <span className="text-xl font-black text-slate-600 font-cinzel">-</span>
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 block truncate max-w-[120px]">{opponentDisplayName.toUpperCase()}</span>
                <span className="text-3xl font-black text-white font-cinzel">{match.opponentScore}</span>
              </div>
            </div>

            {/* MMR Rating Change Pill for Quick Match */}
            {isQuickMatch && mmrResult && (
              <div className="mb-4 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-xs font-black text-amber-300 flex items-center gap-2 shadow-md">
                <Trophy className="w-4 h-4 text-arena-gold" />
                <span>Leaderboard MMR: {mmrResult.newMmr}</span>
                <span className={mmrResult.mmrChange >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  ({mmrResult.mmrChange >= 0 ? `+${mmrResult.mmrChange}` : mmrResult.mmrChange})
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={handleRematch}
                className={`w-full min-h-[48px] py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition transform hover:scale-102 active:scale-95 border border-white cursor-pointer touch-manipulation ${
                  rematchRequestedByPeer
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30 animate-pulse'
                    : rematchSent
                    ? 'bg-slate-800 text-slate-300 border-slate-600'
                    : 'bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-cyan-400 hover:to-white text-slate-950 shadow-arena-cyan/30'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                {rematchRequestedByPeer
                  ? `⚔️ ${opponentDisplayName} Requested Rematch! Accept Now`
                  : rematchSent
                  ? 'Rematch Request Sent... Play Again'
                  : 'Play Again (Same Realm)'}
              </button>

              {!isMultiplayer && (
                <button
                  onClick={() => {
                    onChangeUniverse();
                  }}
                  className="w-full min-h-[44px] py-3 px-6 rounded-xl glass-panel border border-slate-700 hover:border-arena-cyan text-slate-200 font-bold text-sm uppercase tracking-wider transition cursor-pointer touch-manipulation"
                >
                  Change Battle Universe
                </button>
              )}

              <button
                onClick={handleExit}
                className="w-full min-h-[44px] py-2.5 px-6 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer touch-manipulation"
              >
                Return to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

