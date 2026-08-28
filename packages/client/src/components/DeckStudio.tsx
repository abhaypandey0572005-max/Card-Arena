import React, { useState } from 'react';
import { CARD_DATABASE, PRESET_DECKS, CardTemplate } from '@card-battler/shared';
import { Card3D } from './Card3D.js';
import { soundFX } from '../utils/audio.js';
import { 
  Search, 
  Layers, 
  Check, 
  ArrowLeft, 
  Zap, 
  Sparkles, 
  Shield 
} from 'lucide-react';

interface DeckStudioProps {
  onBackToArena: () => void;
  onSelectDeck: (deckId: string) => void;
  currentSelectedDeckId: string;
}

export const DeckStudio: React.FC<DeckStudioProps> = ({
  onBackToArena,
  onSelectDeck,
  currentSelectedDeckId,
}) => {
  const [activeDeckId, setActiveDeckId] = useState<string>(currentSelectedDeckId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardTemplate>(CARD_DATABASE[0]);

  const activePreset = PRESET_DECKS.find((d) => d.id === activeDeckId) || PRESET_DECKS[0];

  // Filtered Cards
  const filteredCards = CARD_DATABASE.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFaction = selectedFaction === 'all' || card.faction === selectedFaction;
    const matchesCost = selectedCost === null || (selectedCost === 5 ? card.manaCost >= 5 : card.manaCost === selectedCost);
    return matchesSearch && matchesFaction && matchesCost;
  });

  const handleCardClick = (card: CardTemplate) => {
    soundFX.playCardHover();
    setSelectedCard(card);
  };

  const handleSelectPreset = (deckId: string) => {
    soundFX.playCardPlay();
    setActiveDeckId(deckId);
    onSelectDeck(deckId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              soundFX.playCardHover();
              onBackToArena();
            }}
            className="p-2.5 rounded-xl glass-panel border border-slate-700 hover:border-arena-cyan text-slate-300 hover:text-white transition transform active:scale-95 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Arena Lobby
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-7 h-7 text-arena-cyan" />
              Multiverse Deck Studio
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Browse Marvel, DC, Pokemon, WWE, and Anime character cards
            </p>
          </div>
        </div>

        {/* Universe Preset Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_DECKS.map((deck) => (
            <button
              key={deck.id}
              onClick={() => handleSelectPreset(deck.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                activeDeckId === deck.id
                  ? 'bg-gradient-to-r from-arena-blue to-arena-cyan text-slate-950 font-black shadow-lg shadow-arena-cyan/20 border-2 border-white'
                  : 'glass-panel border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeDeckId === deck.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              {deck.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Search, Filters & Cards */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Toolbar */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search heroes or moves..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-arena-cyan transition"
              />
            </div>

            {/* Universe Faction Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'marvel', label: '🦸 Marvel' },
                { id: 'dc', label: '🦇 DC' },
                { id: 'pokemon', label: '⚡ Pokemon' },
                { id: 'wwe', label: '🤼 WWE' },
                { id: 'anime', label: '⛩️ Anime' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFaction(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition shrink-0 ${
                    selectedFaction === f.id
                      ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Cost Filters */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((cost) => (
                <button
                  key={cost}
                  onClick={() => setSelectedCost(selectedCost === cost ? null : cost)}
                  className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition border ${
                    selectedCost === cost
                      ? 'bg-arena-blue text-white border-arena-cyan shadow-sm shadow-arena-cyan'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cost === 5 ? '5+' : cost}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="glass-panel p-4 rounded-2xl min-h-[460px] flex flex-wrap gap-4 items-center justify-center sm:justify-start overflow-y-auto max-h-[600px]">
            {filteredCards.map((card) => {
              const isSelected = selectedCard.id === card.id;
              return (
                <div key={card.id} onClick={() => handleCardClick(card)}>
                  <Card3D card={card} isSelected={isSelected} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: 3D Inspector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-panel-glow p-6 rounded-2xl flex flex-col items-center text-center shadow-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-arena-cyan mb-2">
              Character Card Inspector
            </span>

            <div className="my-2 transform hover:scale-105 transition-transform duration-300">
              <Card3D card={selectedCard} isPlayable />
            </div>

            <div className="mt-4 w-full text-left bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-100">{selectedCard.name}</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    selectedCard.rarity === 'legendary'
                      ? 'bg-amber-500/20 text-arena-gold border border-arena-gold/50'
                      : 'bg-arena-blue/20 text-arena-cyan border border-arena-blue/40'
                  }`}
                >
                  {selectedCard.rarity}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mb-2">{selectedCard.description}</p>
              {selectedCard.flavorQuote && (
                <p className="text-[10px] italic text-slate-400 border-l-2 border-arena-cyan pl-2 mt-2">
                  {selectedCard.flavorQuote}
                </p>
              )}
            </div>
          </div>

          {/* Active Deck Overview */}
          <div className="glass-panel p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                {activePreset.name}
              </span>
              <span className="text-xs font-mono font-bold text-arena-cyan px-2 py-0.5 rounded bg-arena-blue/20">
                {activePreset.cardIds.length} / 14 Cards
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              {activePreset.description}
            </p>

            <button
              onClick={() => {
                soundFX.playCardPlay();
                onSelectDeck(activeDeckId);
                onBackToArena();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-arena-cyan hover:to-white text-slate-950 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-arena-cyan/20 transition transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              Equip Deck & Enter Arena
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
