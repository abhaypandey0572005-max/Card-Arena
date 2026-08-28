import React, { useState } from 'react';
import { CARD_DATABASE, CardTemplate, DeckPreset } from '@card-battler/shared';
import { Card3D } from './Card3D.js';
import { CharacterArt } from './CharacterArt.js';
import { analyzeDeck, saveCustomDeck, deleteCustomDeck } from '../utils/customDecks.js';
import { soundFX } from '../utils/audio.js';
import { 
  Layers, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Zap, 
  Wind, 
  ShieldCheck, 
  Check, 
  Edit3 
} from 'lucide-react';

interface CustomDeckBuilderProps {
  onBackToArena: () => void;
  onSelectDeck: (deckId: string) => void;
  currentSelectedDeckId: string;
}

export const CustomDeckBuilder: React.FC<CustomDeckBuilderProps> = ({
  onBackToArena,
  onSelectDeck,
  currentSelectedDeckId,
}) => {
  const [deckName, setDeckName] = useState('Cosmic Hybrid Squad');
  const [selectedFaction, setSelectedFaction] = useState<string>('all');
  const [deckCards, setDeckCards] = useState<string[]>([
    'marvel-thanos', 'marvel-spiderman',
    'anime-goku', 'anime-gojo',
    'pkmn-charizard', 'pkmn-pikachu',
    'dc-superman', 'dc-flash',
    'wwe-undertaker', 'wwe-rock',
    'marvel-ironman', 'anime-naruto',
    'pkmn-blastoise', 'dc-batman'
  ]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const analysis = analyzeDeck(deckCards);

  const filteredCatalog = CARD_DATABASE.filter((c) => {
    if (selectedFaction === 'all') return true;
    return c.faction === selectedFaction;
  });

  const handleAddCard = (card: CardTemplate) => {
    if (deckCards.length >= 14) {
      soundFX.playCardHover();
      return;
    }
    const count = deckCards.filter((id) => id === card.id).length;
    if (count >= 2) {
      soundFX.playCardHover();
      return;
    }
    soundFX.playCardPlay();
    setDeckCards((prev) => [...prev, card.id]);
    setSavedSuccess(false);
  };

  const handleRemoveCard = (index: number) => {
    soundFX.playCardHover();
    setDeckCards((prev) => prev.filter((_, idx) => idx !== index));
    setSavedSuccess(false);
  };

  const handleSaveDeck = () => {
    if (deckCards.length !== 14) return;
    soundFX.playCardPlay();

    const newDeck: DeckPreset = {
      id: `custom_${Date.now()}`,
      name: deckName.trim() || 'Custom Multiverse Deck',
      universe: 'Anime',
      faction: 'anime',
      description: `Custom hybrid deck containing ${deckCards.length} cards.`,
      cardIds: deckCards,
    };

    saveCustomDeck(newDeck);
    onSelectDeck(newDeck.id);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 z-10 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              soundFX.playCardHover();
              onBackToArena();
            }}
            className="p-2.5 rounded-xl glass-panel border border-slate-700 hover:border-arena-cyan text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Arena Home
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-arena-cyan" />
              Hybrid Deck Studio
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Build a custom 14-card deck mixing Marvel, DC, Pokemon, WWE & Anime!
            </p>
          </div>
        </div>

        {/* Save Deck Button */}
        <button
          onClick={handleSaveDeck}
          disabled={deckCards.length !== 14}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-arena-blue via-arena-cyan to-arena-blue hover:from-arena-cyan hover:to-white text-slate-950 font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-arena-cyan/20 border-2 border-white transition transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-900" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Deck Saved & Equipped!' : 'Save & Equip Deck'}
        </button>
      </div>

      {/* Main Grid: Card Catalog (Left 7 cols) vs Active Deck (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Card Catalog */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Universe Tabs */}
          <div className="glass-panel p-3 rounded-2xl flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'All Cards' },
              { id: 'marvel', label: '🦸 Marvel' },
              { id: 'dc', label: '🦇 DC' },
              { id: 'pokemon', label: '⚡ Pokemon' },
              { id: 'wwe', label: '🤼 WWE' },
              { id: 'anime', label: '⛩️ Anime' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.playCardHover();
                  setSelectedFaction(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
                  selectedFaction === tab.id
                    ? 'bg-arena-cyan/20 border border-arena-cyan text-arena-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-center sm:justify-start overflow-y-auto max-h-[620px]">
            {filteredCatalog.map((card) => {
              const countInDeck = deckCards.filter((id) => id === card.id).length;
              return (
                <div key={card.id} className="relative group">
                  <Card3D card={card} />
                  {/* Quick Add Overlay */}
                  <button
                    onClick={() => handleAddCard(card)}
                    disabled={deckCards.length >= 14 || countInDeck >= 2}
                    className="absolute inset-x-2 bottom-2 py-2 rounded-xl bg-arena-blue/90 hover:bg-arena-cyan text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg backdrop-blur-sm transition border border-white disabled:opacity-30 disabled:pointer-events-none z-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {countInDeck === 1 ? 'Add 2nd Copy' : countInDeck >= 2 ? 'Max (2/2)' : 'Add to Deck'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Custom Deck */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Deck Header & Name Input */}
          <div className="glass-panel p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-arena-cyan">
                Deck Name
              </span>
              <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-slate-950 text-arena-gold border border-arena-gold/40">
                {deckCards.length} / 14 Cards
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Name your custom deck..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-arena-cyan"
              />
              <Edit3 className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Combat Stat Analysis Matrix */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
              <div className="p-1.5 rounded-xl bg-orange-950/40 border border-orange-500/40">
                <span className="text-[9px] font-black text-orange-400 uppercase block">Avg PWR</span>
                <span className="text-sm font-mono font-black text-white">{analysis.avgPower}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-950/40 border border-amber-400/40">
                <span className="text-[9px] font-black text-amber-300 uppercase block">Avg SPD</span>
                <span className="text-sm font-mono font-black text-white">{analysis.avgSpeed}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
                <span className="text-[9px] font-black text-cyan-400 uppercase block">Avg AGI</span>
                <span className="text-sm font-mono font-black text-white">{analysis.avgAgility}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                <span className="text-[9px] font-black text-rose-400 uppercase block">Avg HP</span>
                <span className="text-sm font-mono font-black text-white">{analysis.avgHealth}</span>
              </div>
            </div>
          </div>

          {/* Current 14 Cards List */}
          <div className="glass-panel p-4 rounded-2xl flex-1 flex flex-col min-h-[400px]">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3">
              Selected Deck Cards ({deckCards.length}/14)
            </span>

            <div className="space-y-1.5 overflow-y-auto max-h-[420px] pr-1 flex-1">
              {deckCards.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-bold">
                  Deck is empty. Click "+ Add to Deck" on any cards to assemble your team!
                </div>
              ) : (
                deckCards.map((cardId, index) => {
                  const card = CARD_DATABASE.find((c) => c.id === cardId);
                  if (!card) return null;
                  return (
                    <div
                      key={cardId + index}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700">
                          <CharacterArt artIcon={card.artIcon} name={card.name} faction={card.faction} imageUrl={card.imageUrl} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-100 block truncate max-w-[140px]">
                            {card.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold">
                            {card.manaCost} ENG • P:{card.attack} S:{card.speed} A:{card.agility} H:{card.health}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveCard(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Remove from deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
