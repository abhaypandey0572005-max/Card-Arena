import React, { useState, useEffect, useRef } from 'react';
import { 
  GameState, 
  PlayerState, 
  CardInstance 
} from '@card-battler/shared';
import { Card3D } from './Card3D.js';
import { CombatLog } from './CombatLog.js';
import { soundFX } from '../utils/audio.js';
import { 
  Shield, 
  Heart, 
  Zap, 
  ArrowRight, 
  Flag, 
  Swords, 
  AlertTriangle,
  Menu,
  X,
  Smile,
  Radio
} from 'lucide-react';

interface BattlefieldProps {
  gameState: GameState;
  myPlayerId: string;
  onPlayCard: (cardInstanceId: string, targetInstanceId?: string) => void;
  onAttackMinion: (attackerInstanceId: string, targetInstanceId: string) => void;
  onAttackHero: (attackerInstanceId: string, targetPlayerId: string) => void;
  onEndTurn: () => void;
  onSurrender: () => void;
}

interface FloatingDamage {
  id: string;
  value: number;
  x: number;
  y: number;
  color: string;
}

export const Battlefield: React.FC<BattlefieldProps> = ({
  gameState,
  myPlayerId,
  onPlayCard,
  onAttackMinion,
  onAttackHero,
  onEndTurn,
  onSurrender,
}) => {
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [showLogMobile, setShowLogMobile] = useState(false);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [floatingDamage, setFloatingDamage] = useState<FloatingDamage[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const opponentId = gameState.playerOrder.find((id) => id !== myPlayerId) || gameState.playerOrder[1];
  const me: PlayerState = gameState.players[myPlayerId] || gameState.players[gameState.playerOrder[0]];
  const opponent: PlayerState = gameState.players[opponentId] || gameState.players[gameState.playerOrder[1]];

  const isMyTurn = gameState.activePlayerId === myPlayerId;
  const opponentHasTaunt = opponent.board.some((m) => m.isTaunt);
  const prevTurnRef = useRef<number>(gameState.turn);

  // Trigger "YOUR TURN" banner & audio chime when turn switches to player
  useEffect(() => {
    if (gameState.turn !== prevTurnRef.current) {
      prevTurnRef.current = gameState.turn;
      if (isMyTurn) {
        soundFX.playTurnStart();
        setShowTurnBanner(true);
        const timer = setTimeout(() => setShowTurnBanner(false), 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.turn, isMyTurn]);

  // Track mouse cursor for targeting lines
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 400);
  };

  const spawnDamage = (value: number, x: number, y: number, isShield = false) => {
    const id = `dmg_${Date.now()}_${Math.random()}`;
    setFloatingDamage((prev) => [
      ...prev,
      { id, value, x, y, color: isShield ? '#38bdf8' : '#ef4444' },
    ]);
    setTimeout(() => {
      setFloatingDamage((prev) => prev.filter((d) => d.id !== id));
    }, 1200);
  };

  // Selected attacker and hand card
  const selectedAttacker = me.board.find((m) => m.instanceId === selectedAttackerId);
  const selectedHandCard = me.hand.find((c) => c.instanceId === selectedHandCardId);

  // Handle clicking a card in player's hand
  const handleHandCardClick = (card: CardInstance) => {
    if (!isMyTurn) return;
    if (me.mana < card.manaCost) return;

    setSelectedAttackerId(null);

    if (card.effect && (card.effect.type === 'direct_damage' || card.effect.type === 'buff_minion')) {
      if (selectedHandCardId === card.instanceId) {
        setSelectedHandCardId(null);
      } else {
        soundFX.playCardHover();
        setSelectedHandCardId(card.instanceId);
      }
      return;
    }

    soundFX.playCardPlay();
    onPlayCard(card.instanceId);
    setSelectedHandCardId(null);
  };

  // Handle clicking friendly minion
  const handleFriendlyMinionClick = (minion: CardInstance) => {
    if (!isMyTurn) return;

    if (selectedHandCard && selectedHandCard.effect?.type === 'buff_minion') {
      soundFX.playCardPlay();
      onPlayCard(selectedHandCard.instanceId, minion.instanceId);
      setSelectedHandCardId(null);
      return;
    }

    if (minion.canAttack && minion.attacksThisTurn === 0) {
      if (selectedAttackerId === minion.instanceId) {
        setSelectedAttackerId(null);
      } else {
        soundFX.playCardHover();
        setSelectedAttackerId(minion.instanceId);
        setSelectedHandCardId(null);
      }
    }
  };

  // Handle clicking enemy minion
  const handleEnemyMinionClick = (enemyMinion: CardInstance, e: React.MouseEvent) => {
    if (!isMyTurn) return;

    if (selectedHandCard && selectedHandCard.effect?.type === 'direct_damage') {
      soundFX.playCardPlay();
      soundFX.playDamage();
      triggerShake();
      spawnDamage(selectedHandCard.effect.value, e.clientX, e.clientY);
      onPlayCard(selectedHandCard.instanceId, enemyMinion.instanceId);
      setSelectedHandCardId(null);
      return;
    }

    if (selectedAttackerId && selectedAttacker) {
      if (opponentHasTaunt && !enemyMinion.isTaunt) return;

      soundFX.playAttack();
      if (enemyMinion.hasShield) {
        soundFX.playShieldHit();
        spawnDamage(0, e.clientX, e.clientY, true);
      } else {
        soundFX.playDamage();
        triggerShake();
        spawnDamage(selectedAttacker.currentAttack, e.clientX, e.clientY);
      }

      onAttackMinion(selectedAttackerId, enemyMinion.instanceId);
      setSelectedAttackerId(null);
    }
  };

  // Handle clicking enemy Hero
  const handleEnemyHeroClick = (e: React.MouseEvent) => {
    if (!isMyTurn) return;

    if (selectedHandCard && selectedHandCard.effect?.type === 'direct_damage') {
      soundFX.playCardPlay();
      soundFX.playDamage();
      triggerShake();
      spawnDamage(selectedHandCard.effect.value, e.clientX, e.clientY);
      onPlayCard(selectedHandCard.instanceId);
      setSelectedHandCardId(null);
      return;
    }

    if (selectedAttackerId && selectedAttacker) {
      if (opponentHasTaunt) return;

      soundFX.playAttack();
      soundFX.playDamage();
      triggerShake();
      spawnDamage(selectedAttacker.currentAttack, e.clientX, e.clientY);
      onAttackHero(selectedAttackerId, opponent.id);
      setSelectedAttackerId(null);
    }
  };

  // Render Mana Crystals
  const renderManaCrystals = (mana: number, maxMana: number) => {
    const crystals = [];
    for (let i = 0; i < 10; i++) {
      if (i < mana) {
        crystals.push(
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-arena-cyan border border-white shadow-sm shadow-arena-cyan"
          />
        );
      } else if (i < maxMana) {
        crystals.push(
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-slate-900 border border-arena-cyan/40"
          />
        );
      } else {
        crystals.push(
          <span key={i} className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800" />
        );
      }
    }
    return <div className="flex gap-1 items-center">{crystals}</div>;
  };

  const timerPct = (gameState.turnTimeRemaining / gameState.turnDurationSeconds) * 100;
  const isTimerCritical = gameState.turnTimeRemaining <= 8;

  return (
    <div
      className={`h-[calc(100vh-64px)] w-full flex flex-col justify-between p-2 sm:p-4 overflow-hidden select-none relative ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Floating Damage Indicators */}
      {floatingDamage.map((d) => (
        <div
          key={d.id}
          style={{ left: d.x, top: d.y }}
          className="fixed pointer-events-none z-50 font-black font-display text-3xl sm:text-4xl text-rose-500 drop-shadow-2xl animate-bounce -translate-x-1/2 -translate-y-1/2"
        >
          {d.value === 0 ? 'SHIELDED' : `-${d.value}`}
        </div>
      ))}

      {/* Cinematic "YOUR TURN" Banner Overlay */}
      {showTurnBanner && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-turn-reveal">
          <div className="relative px-12 py-6 rounded-3xl glass-panel-glow border-2 border-arena-cyan shadow-2xl shadow-arena-cyan/40 flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-widest text-arena-cyan mb-1">
              Tactical Initiative
            </span>
            <h2 className="text-4xl sm:text-6xl font-black font-display uppercase tracking-widest bg-gradient-to-r from-white via-arena-silver to-arena-cyan bg-clip-text text-transparent drop-shadow-2xl">
              YOUR TURN
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-arena-cyan to-transparent mt-2 shadow-lg shadow-arena-cyan" />
          </div>
        </div>
      )}

      {/* Opponent Disconnect Warning */}
      {!opponent.isConnected && (
        <div className="w-full bg-amber-500/20 border border-amber-400 text-amber-300 px-4 py-1.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold animate-pulse mb-1">
          <AlertTriangle className="w-4 h-4" />
          Opponent disconnected! 30s grace recovery window... ({opponent.disconnectGraceSeconds}s)
        </div>
      )}

      {/* Main Grid: Battlefield Arena + Combat Feed */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Arena Column */}
        <div className="flex-1 flex flex-col justify-between glass-panel rounded-3xl p-3 sm:p-5 relative overflow-hidden">
          {/* ================= OPPONENT ZONE (TOP) ================= */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            {/* Opponent Hero Card */}
            <div
              onClick={handleEnemyHeroClick}
              className={`flex items-center gap-3 p-2.5 rounded-2xl transition cursor-pointer ${
                (selectedAttackerId || (selectedHandCard && selectedHandCard.effect?.type === 'direct_damage')) &&
                !opponentHasTaunt
                  ? 'ring-2 ring-rose-500 bg-rose-950/40 hover:scale-105 shadow-lg shadow-rose-500/30'
                  : 'bg-slate-950/80 border border-slate-800'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arena-blue to-slate-950 border-2 border-arena-cyan flex items-center justify-center text-2xl shadow-md">
                {opponent.avatar === 'cyber-runner' ? '🤖' : opponent.avatar === 'inferno-knight' ? '🔥' : '🧙‍♂️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">{opponent.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-arena-cyan border border-arena-cyan/30">
                    {opponent.rating} MMR
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs font-black">
                  <span className="flex items-center gap-1 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    {opponent.hp} / {opponent.maxHp}
                  </span>
                  {opponent.shield > 0 && (
                    <span className="flex items-center gap-1 text-sky-400">
                      <Shield className="w-3.5 h-3.5 fill-sky-400" />
                      {opponent.shield}
                    </span>
                  )}
                  <span className="text-slate-400 text-[10px] font-semibold">
                    🎴 {opponent.hand.length} in hand
                  </span>
                </div>
              </div>
            </div>

            {/* Opponent Mana Gauge */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Opponent Reactor ({opponent.mana}/{opponent.maxMana})
              </span>
              {renderManaCrystals(opponent.mana, opponent.maxMana)}
            </div>
          </div>

          {/* Opponent Minions Board */}
          <div className="flex items-center justify-center gap-3 py-2 min-h-[140px] bg-slate-950/40 rounded-2xl border border-dashed border-slate-800/80 my-1">
            {opponent.board.length === 0 ? (
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Opponent Frontline Clear
              </span>
            ) : (
              opponent.board.map((minion) => {
                const isTargetable =
                  isMyTurn &&
                  ((selectedAttackerId && (!opponentHasTaunt || minion.isTaunt)) ||
                    (selectedHandCard && selectedHandCard.effect?.type === 'direct_damage'));

                return (
                  <div key={minion.instanceId} onClick={(e) => handleEnemyMinionClick(minion, e)}>
                    <Card3D card={minion} isTargetable={isTargetable} />
                  </div>
                );
              })
            )}
          </div>

          {/* ================= CENTER COMBAT LANE ================= */}
          <div className="relative py-2 flex items-center justify-between border-y border-slate-800/80 my-1 px-4 bg-slate-950/70 rounded-2xl">
            {/* Active Turn Badge */}
            <div className="flex items-center gap-3">
              <div
                className={`px-3.5 py-1.5 rounded-xl font-black font-display text-xs uppercase tracking-widest flex items-center gap-2 shadow ${
                  isMyTurn
                    ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan animate-pulse shadow-arena-cyan/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
              </div>

              {/* Turn Countdown Progress */}
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-44 h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isTimerCritical ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-arena-blue to-arena-cyan'
                    }`}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
                <span
                  className={`font-mono text-xs font-black ${
                    isTimerCritical ? 'text-rose-400 animate-ping' : 'text-slate-400'
                  }`}
                >
                  {gameState.turnTimeRemaining}s
                </span>
              </div>
            </div>

            {/* End Turn & Mobile Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogMobile(!showLogMobile)}
                className="md:hidden p-2 rounded-xl glass-panel text-slate-300"
              >
                <Menu className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  soundFX.playCardPlay();
                  onEndTurn();
                }}
                disabled={!isMyTurn}
                className={`py-2.5 px-6 rounded-xl font-black font-display text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition transform active:scale-95 ${
                  isMyTurn
                    ? 'bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-arena-cyan hover:to-white text-slate-950 shadow-arena-cyan/20 border-2 border-white'
                    : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                End Turn
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ================= PLAYER ZONE (BOTTOM) ================= */}
          {/* Player Minions Board */}
          <div className="flex items-center justify-center gap-3 py-2 min-h-[140px] bg-slate-950/40 rounded-2xl border border-dashed border-slate-800/80 my-1">
            {me.board.length === 0 ? (
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Deploy Units to Arena
              </span>
            ) : (
              me.board.map((minion) => {
                const isAttackerReady = isMyTurn && minion.canAttack && minion.attacksThisTurn === 0;
                const isSelected = selectedAttackerId === minion.instanceId;

                return (
                  <div key={minion.instanceId} onClick={() => handleFriendlyMinionClick(minion)}>
                    <Card3D
                      card={minion}
                      isAttackerReady={isAttackerReady}
                      isSelected={isSelected}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Player Hand & Hero Reactor */}
          <div className="flex items-end justify-between border-t border-slate-800/80 pt-2 gap-2">
            {/* Player Hero Card */}
            <div className="flex items-center gap-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arena-cyan to-slate-950 border-2 border-arena-cyan flex items-center justify-center text-2xl shadow-md">
                {me.avatar === 'cyber-runner' ? '🤖' : me.avatar === 'inferno-knight' ? '🔥' : '🧙‍♂️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-arena-cyan">{me.name}</span>
                  <button
                    onClick={() => {
                      soundFX.playCardHover();
                      onSurrender();
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 ml-1 font-bold uppercase"
                    title="Surrender Match"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs font-black">
                  <span className="flex items-center gap-1 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    {me.hp} / {me.maxHp}
                  </span>
                  {me.shield > 0 && (
                    <span className="flex items-center gap-1 text-sky-400">
                      <Shield className="w-3.5 h-3.5 fill-sky-400" />
                      {me.shield}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-arena-cyan">
                    <Zap className="w-3.5 h-3.5 fill-arena-cyan" />
                    {me.mana}/{me.maxMana}
                  </div>
                </div>
                <div className="mt-1">{renderManaCrystals(me.mana, me.maxMana)}</div>
              </div>
            </div>

            {/* Player Hand Cards */}
            <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto px-2 py-1">
              {me.hand.map((card) => {
                const isPlayable = isMyTurn && me.mana >= card.manaCost;
                const isSelected = selectedHandCardId === card.instanceId;

                return (
                  <div key={card.instanceId} onClick={() => handleHandCardClick(card)}>
                    <Card3D
                      card={card}
                      isPlayable={isPlayable}
                      isSelected={isSelected}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar: Combat Feed */}
        <div className="hidden md:block w-72 h-full">
          <CombatLog entries={gameState.actionLog} />
        </div>
      </div>

      {/* Mobile Drawer Combat Log */}
      {showLogMobile && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md p-4 flex flex-col justify-end md:hidden">
          <div className="h-3/4 w-full bg-slate-950 rounded-3xl p-4 flex flex-col border border-slate-800">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowLogMobile(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CombatLog entries={gameState.actionLog} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
