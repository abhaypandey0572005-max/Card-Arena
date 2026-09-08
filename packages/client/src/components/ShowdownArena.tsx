import React, { useState, useEffect } from 'react';
import { CardTemplate } from '@card-battler/shared';
import { Card3D } from './Card3D.js';
import { 
  ShowdownMatchState, 
  initShowdownMatch, 
  evaluateShowdownClash, 
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
  X, 
  RotateCcw, 
  Sparkles,
  Bot,
  User,
  ArrowRight
} from 'lucide-react';

interface ShowdownArenaProps {
  universeId: string;
  playerName: string;
  onExit: () => void;
  onChangeUniverse: () => void;
}

export const ShowdownArena: React.FC<ShowdownArenaProps> = ({
  universeId,
  playerName,
  onExit,
  onChangeUniverse,
}) => {
  const [match, setMatch] = useState<ShowdownMatchState>(() => initShowdownMatch(universeId));
  const [screenShake, setScreenShake] = useState(false);
  const [showStatBars, setShowStatBars] = useState(false);

  const universe = UNIVERSES.find((u) => u.id === universeId) || UNIVERSES[0];

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 450);
  };

  // When player plays a card from hand
  const handlePlayCard = (card: CardTemplate) => {
    if (match.phase !== 'player_turn') return;

    soundFX.playCardPlay();

    // 1. Set player's card into the clash stage
    const nextPlayerHand = match.playerHand.filter((c) => c.id !== card.id);
    
    setMatch((prev) => ({
      ...prev,
      playerHand: nextPlayerHand,
      playedPlayerCard: card,
      phase: 'opponent_thinking',
    }));

    // 2. Computer thinks for 1.2 seconds, then plays counter card
    setTimeout(() => {
      const aiCard = chooseAiCounterCard(match.opponentHand, card);
      const nextOpponentHand = match.opponentHand.filter((c) => c.id !== aiCard.id);

      soundFX.playCardHover();
      soundFX.playAttack();
      triggerShake();

      // 3. Evaluate Clash Result
      const result: RoundClashResult = evaluateShowdownClash(card, aiCard);

      if (result.winner === 'player') {
        soundFX.playVictory();
      } else if (result.winner === 'opponent') {
        soundFX.playDamage();
      }

      setShowStatBars(true);

      const nextPlayerScore = result.winner === 'player' ? match.playerScore + 1 : result.winner === 'tie' ? match.playerScore + 1 : match.playerScore;
      const nextOpponentScore = result.winner === 'opponent' ? match.opponentScore + 1 : result.winner === 'tie' ? match.opponentScore + 1 : match.opponentScore;

      setMatch((prev) => ({
        ...prev,
        opponentHand: nextOpponentHand,
        playedOpponentCard: aiCard,
        lastClashResult: result,
        playerScore: nextPlayerScore,
        opponentScore: nextOpponentScore,
        phase: 'clash_reveal',
      }));
    }, 1200);
  };

  // Next round transition
  const handleNextRound = () => {
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

      setMatch((prev) => ({
        ...prev,
        phase: 'match_ended',
        matchWinner,
      }));
    } else {
      // Start Next Round
      setMatch((prev) => ({
        ...prev,
        round: prev.round + 1,
        playedPlayerCard: null,
        playedOpponentCard: null,
        lastClashResult: null,
        phase: 'player_turn',
      }));
    }
  };

  // Restart match with fresh 5 cards
  const handleRematch = () => {
    soundFX.playCardPlay();
    setShowStatBars(false);
    setMatch(initShowdownMatch(universeId));
  };

  const result = match.lastClashResult;
  const isMatchOver = match.phase === 'match_ended';

  return (
    <div className={`relative min-h-[calc(100vh-70px)] flex flex-col justify-between p-3 sm:p-6 select-none overflow-hidden transition-transform duration-150 ${screenShake ? 'scale-[1.02] translate-y-1' : ''}`}>
      
      {/* ================= TOP SCOREBOARD ================= */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between p-3 rounded-2xl glass-panel border border-slate-700/80 shadow-xl z-20">
        {/* Opponent Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 font-black shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-red-400 block tracking-wider">
              Computer (AI)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black font-cinzel text-white">
                {match.opponentScore}
              </span>
              <span className="text-xs text-slate-400">Points</span>
            </div>
          </div>
        </div>

        {/* Round Counter & Realm Badge */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-widest text-arena-cyan flex items-center gap-1.5 font-cinzel">
            <Swords className="w-3.5 h-3.5" /> ROUND {match.round} / {match.maxRounds}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <span
                key={r}
                className={`w-3.5 h-2 rounded-full transition-all duration-300 ${
                  r < match.round
                    ? 'bg-arena-cyan shadow-sm shadow-arena-cyan'
                    : r === match.round
                    ? 'bg-white scale-125 animate-pulse'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
            {universe.name}
          </span>
        </div>

        {/* Player Info */}
        <div className="flex items-center gap-2.5 text-right">
          <div>
            <span className="text-[10px] font-black uppercase text-arena-cyan block tracking-wider">
              {playerName}
            </span>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xl sm:text-2xl font-black font-cinzel text-arena-cyan">
                {match.playerScore}
              </span>
              <span className="text-xs text-slate-400">Points</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-arena-blue/20 border border-arena-cyan flex items-center justify-center text-arena-cyan font-black shadow-md">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ================= OPPONENT HAND (TOP) ================= */}
      <div className="w-full flex items-center justify-center gap-2 py-2 z-10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-2">
          Computer Hand ({match.opponentHand.length}):
        </span>
        {match.opponentHand.map((_, i) => (
          <div
            key={i}
            className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 border border-slate-700 shadow-md flex items-center justify-center text-slate-600 text-xs font-black transition-transform hover:-translate-y-1"
          >
            🎴
          </div>
        ))}
      </div>

      {/* ================= CENTER CLASH ARENA ================= */}
      <div className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center my-auto py-4 z-20">
        
        {/* Waiting for player prompt */}
        {match.phase === 'player_turn' && !match.playedPlayerCard && (
          <div className="text-center animate-bounce mb-4">
            <span className="px-5 py-2 rounded-full bg-arena-cyan/20 border border-arena-cyan text-arena-cyan font-black text-sm uppercase tracking-wider shadow-lg shadow-arena-cyan/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              👉 Select 1 of your {match.playerHand.length} cards below to play!
            </span>
          </div>
        )}

        {/* Duel Showcase Pedestals */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-12">
          
          {/* Player Card Pedestal (Left) */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-wider text-arena-cyan mb-2">
              Your Hero
            </span>
            {match.playedPlayerCard ? (
              <div className="animate-fade-in transform scale-105 transition-all">
                <Card3D card={match.playedPlayerCard} />
              </div>
            ) : (
              <div className="w-44 h-64 sm:w-48 sm:h-72 rounded-2xl border-2 border-dashed border-arena-cyan/40 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 text-xs font-bold gap-2">
                <span className="text-3xl opacity-40">⚔️</span>
                <span>Your Card Goes Here</span>
              </div>
            )}
          </div>

          {/* Center VS & Stat Duel Box */}
          <div className="flex flex-col items-center justify-center max-w-xs w-full">
            {match.phase === 'opponent_thinking' && (
              <div className="flex flex-col items-center gap-2 text-center animate-pulse py-6">
                <div className="w-12 h-12 rounded-full border-4 border-t-red-500 border-slate-700 animate-spin" />
                <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                  Computer is countering...
                </span>
              </div>
            )}

            {match.phase === 'clash_reveal' && result && (
              <div className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-cinzel">
                  STAT SHOWDOWN
                </span>

                {/* Stat Duels: Attack, Speed, Agility */}
                <div className="w-full space-y-2 text-xs">
                  {/* Power / Attack */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border ${
                    result.powerDuel.winner === 'player'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : result.powerDuel.winner === 'opponent'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    <span className="font-black text-base">{result.powerDuel.playerValue}</span>
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[11px]">
                      💥 ATTACK
                    </span>
                    <span className="font-black text-base">{result.powerDuel.opponentValue}</span>
                  </div>

                  {/* Speed */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border ${
                    result.speedDuel.winner === 'player'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : result.speedDuel.winner === 'opponent'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    <span className="font-black text-base">{result.speedDuel.playerValue}</span>
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[11px]">
                      ⚡ SPEED
                    </span>
                    <span className="font-black text-base">{result.speedDuel.opponentValue}</span>
                  </div>

                  {/* Agility */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border ${
                    result.agilityDuel.winner === 'player'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : result.agilityDuel.winner === 'opponent'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    <span className="font-black text-base">{result.agilityDuel.playerValue}</span>
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[11px]">
                      🛡️ AGILITY
                    </span>
                    <span className="font-black text-base">{result.agilityDuel.opponentValue}</span>
                  </div>
                </div>

                {/* Winner Declaration Banner */}
                <div className={`w-full py-2 px-3 rounded-xl font-black text-xs uppercase text-center tracking-wider shadow ${
                  result.winner === 'player'
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 animate-pulse'
                    : result.winner === 'opponent'
                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'bg-amber-500 text-slate-950'
                }`}>
                  {result.winner === 'player'
                    ? `🏆 You Won Round ${match.round}! (+1 pt)`
                    : result.winner === 'opponent'
                    ? `💀 Computer Won Round ${match.round}! (+1 pt)`
                    : `🤝 Tied Round! (+1 pt each)`}
                </div>

                {/* Next Round Button */}
                <button
                  onClick={handleNextRound}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-cyan-400 hover:to-white text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition transform hover:scale-105 active:scale-95 border border-white"
                >
                  <span>{match.round >= match.maxRounds ? 'View Final Results ➔' : 'Next Round ➔'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {match.phase === 'player_turn' && (
              <div className="w-16 h-16 rounded-full bg-slate-900/80 border-2 border-slate-700 flex items-center justify-center text-xl font-black text-slate-400 font-cinzel shadow-inner">
                VS
              </div>
            )}
          </div>

          {/* Opponent Card Pedestal (Right) */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-wider text-red-400 mb-2">
              Computer Counter
            </span>
            {match.playedOpponentCard ? (
              <div className="animate-fade-in transform scale-105 transition-all">
                <Card3D card={match.playedOpponentCard} />
              </div>
            ) : (
              <div className="w-44 h-64 sm:w-48 sm:h-72 rounded-2xl border-2 border-dashed border-red-500/40 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 text-xs font-bold gap-2">
                <span className="text-3xl opacity-40">🤖</span>
                <span>Awaiting Counter</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= PLAYER HAND (BOTTOM) ================= */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center pt-3 border-t border-slate-800/80 z-20">
        <div className="flex items-center justify-between w-full mb-2 px-2">
          <span className="text-xs font-black uppercase tracking-wider text-arena-cyan">
            Your Hand ({match.playerHand.length} cards remaining):
          </span>
          <span className="text-[11px] text-slate-400 italic">
            Click any card to duel with it!
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-5 overflow-x-auto w-full py-2 px-2">
          {match.playerHand.map((card) => (
            <div
              key={card.id}
              onClick={() => handlePlayCard(card)}
              className={`transform transition-all duration-200 ${
                match.phase === 'player_turn'
                  ? 'cursor-pointer hover:scale-105 hover:-translate-y-2'
                  : 'opacity-50 pointer-events-none'
              }`}
            >
              <Card3D card={card} isPlayable={match.phase === 'player_turn'} />
            </div>
          ))}
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
                ? `Outstanding strategy! You triumphed over the Computer ${match.playerScore} to ${match.opponentScore}!`
                : match.matchWinner === 'opponent'
                ? `The Computer edged out the victory ${match.opponentScore} to ${match.playerScore}. Rematch for glory!`
                : `A rare warrior stalemate! Both champions finished ${match.playerScore} to ${match.opponentScore}!`}
            </p>

            {/* Scorecard */}
            <div className="flex items-center justify-center gap-8 my-6 py-3 px-6 rounded-2xl bg-slate-900 border border-slate-800 w-full">
              <div>
                <span className="text-[10px] font-black uppercase text-arena-cyan block">YOU</span>
                <span className="text-3xl font-black text-white font-cinzel">{match.playerScore}</span>
              </div>
              <span className="text-xl font-black text-slate-600 font-cinzel">-</span>
              <div>
                <span className="text-[10px] font-black uppercase text-red-400 block">COMPUTER</span>
                <span className="text-3xl font-black text-white font-cinzel">{match.opponentScore}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={handleRematch}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-cyan-400 hover:to-white text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-arena-cyan/30 transition transform hover:scale-105 active:scale-95 border border-white"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again (Same Realm)
              </button>

              <button
                onClick={() => {
                  onChangeUniverse();
                }}
                className="w-full py-3 px-6 rounded-xl glass-panel border border-slate-700 hover:border-arena-cyan text-slate-200 font-bold text-sm uppercase tracking-wider transition"
              >
                Change Battle Universe
              </button>

              <button
                onClick={onExit}
                className="w-full py-2.5 px-6 text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-wider transition"
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
