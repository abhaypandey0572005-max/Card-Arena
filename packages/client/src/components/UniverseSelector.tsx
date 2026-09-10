import React from 'react';
import { 
  Shield, 
  Zap, 
  Sparkles, 
  Flame, 
  Trophy, 
  Check, 
  Swords, 
  X 
} from 'lucide-react';
import { soundFX } from '../utils/audio.js';

export interface UniverseOption {
  id: string; // matches preset deck id
  name: string;
  tagline: string;
  badge: string;
  universe: string;
  themeColor: string;
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  keyHeroes: string[];
  bannerArt: string;
  description: string;
}

export const UNIVERSES: UniverseOption[] = [
  {
    id: 'marvel-avengers',
    name: 'Marvel vs Marvel',
    tagline: 'Avengers & Mutants Civil War',
    badge: 'HEROES & TITANS',
    universe: 'MARVEL',
    themeColor: 'from-red-600 to-rose-700',
    borderColor: 'border-red-500/60 hover:border-red-400',
    glowColor: 'shadow-red-600/30',
    bgGradient: 'bg-gradient-to-br from-red-950/70 via-slate-900 to-slate-950',
    keyHeroes: ['Spider-Man', 'Wolverine', 'Iron Man', 'Cap', 'Deadpool', 'Thanos'],
    bannerArt: '/cards/ironman.jpg',
    description: 'Duel with pure Marvel cards: Berserker claws, vibranium shields, repulsor unibeams & Thanos snap!',
  },
  {
    id: 'dc-justice',
    name: 'DC vs DC',
    tagline: 'Justice League & Gotham Clash',
    badge: 'GODS & VILLAINS',
    universe: 'DC',
    themeColor: 'from-blue-600 to-indigo-700',
    borderColor: 'border-blue-500/60 hover:border-blue-400',
    glowColor: 'shadow-blue-600/30',
    bgGradient: 'bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950',
    keyHeroes: ['Batman', 'Superman', 'Flash', 'Joker', 'Harley Quinn', 'Darkseid'],
    bannerArt: '/cards/batman.jpg',
    description: 'Duel with pure DC cards: Maximum speed force, strategic intel, kryptonian heat vision & omega beams!',
  },
  {
    id: 'pokemon-champions',
    name: 'Pokemon vs Pokemon',
    tagline: 'Official Trainer Stadium',
    badge: 'ELEMENTAL MASTERS',
    universe: 'POKEMON',
    themeColor: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/60 hover:border-amber-400',
    glowColor: 'shadow-amber-500/30',
    bgGradient: 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950',
    keyHeroes: ['Charizard', 'Mewtwo', 'Pikachu', 'Blastoise', 'Gengar'],
    bannerArt: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    description: 'Duel with pure Pokemon: Hydro pumps, thunderbolts, psychic devastation & mega fire blasts!',
  },
  {
    id: 'anime-allstars',
    name: 'Anime vs Anime',
    tagline: 'Ultimate Shonen Battleground',
    badge: 'ULTRA INSTINCT',
    universe: 'ANIME',
    themeColor: 'from-orange-500 to-purple-600',
    borderColor: 'border-purple-500/60 hover:border-purple-400',
    glowColor: 'shadow-purple-500/30',
    bgGradient: 'bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950',
    keyHeroes: ['Goku UI', 'Naruto', 'Luffy Gear 5', 'Gojo', 'Levi'],
    bannerArt: '/cards/goku.jpg',
    description: 'Duel with pure Anime legends: Super Kamehamehas, Rasengans, Gear 5 gigantification & Infinite Void!',
  },
  {
    id: 'wwe-legends',
    name: 'WWE vs WWE',
    tagline: 'WrestleMania Heavyweight Ring',
    badge: 'SMACKDOWN ICONS',
    universe: 'WWE',
    themeColor: 'from-yellow-500 to-emerald-600',
    borderColor: 'border-yellow-500/60 hover:border-yellow-400',
    glowColor: 'shadow-yellow-500/30',
    bgGradient: 'bg-gradient-to-br from-yellow-950/70 via-slate-900 to-slate-950',
    keyHeroes: ['The Rock', 'John Cena', 'Roman Reigns', 'The Undertaker'],
    bannerArt: '/cards/rock.jpg',
    description: 'Duel with pure WWE champions: People\'s Elbows, AA slams, Tribal Chief spears & Tombstones!',
  },
  {
    id: 'fifa-legends',
    name: 'FIFA vs FIFA',
    tagline: 'World Cup Legends & Ballon d\'Or Kings',
    badge: 'FOOTBALL GOATS',
    universe: 'FIFA',
    themeColor: 'from-emerald-500 to-teal-700',
    borderColor: 'border-emerald-500/60 hover:border-emerald-400',
    glowColor: 'shadow-emerald-500/30',
    bgGradient: 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950',
    keyHeroes: ['Messi', 'Ronaldo', 'Mbappé', 'Haaland', 'Neymar Jr', 'Pelé', 'Maradona'],
    bannerArt: '/cards/fifa-messi.jpg',
    description: 'Duel with pure football icons: Ankara Messi dribbles, SIUU rocket strikes, lightning counter-attacks & samba magic!',
  },
  {
    id: 'cars-pixar',
    name: 'Cars vs Cars',
    tagline: 'Radiator Springs & Piston Cup Legends',
    badge: 'SPEED & HORSEPOWER',
    universe: 'CARS',
    themeColor: 'from-amber-500 to-red-600',
    borderColor: 'border-amber-500/60 hover:border-amber-400',
    glowColor: 'shadow-amber-500/30',
    bgGradient: 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950',
    keyHeroes: ['Lightning McQueen', 'Tow Mater', 'Doc Hudson', 'Jackson Storm', 'Cruz', 'Francesco'],
    bannerArt: '/cards/cars-mcqueen.jpg',
    description: 'Duel with pure Pixar Cars: Ka-chow speed bursts, dirt track drifting, reverse towing & next-gen simulators!',
  },
];

interface UniverseSelectorModalProps {
  isOpen: boolean;
  selectedUniverseId: string;
  onSelect: (universeId: string) => void;
  onClose: () => void;
  onStartAi?: (universeId: string) => void;
}

export const UniverseSelectorModal: React.FC<UniverseSelectorModalProps> = ({
  isOpen,
  selectedUniverseId,
  onSelect,
  onClose,
  onStartAi,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-7 flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-arena-cyan/20 border border-arena-cyan text-arena-cyan tracking-wider uppercase">
                Fair Universe Matchups
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black font-cinzel text-white mt-1">
              Select Your Battle Realm
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Pick which universe to play. Both you and your opponent will play pure, matched cards (Marvel vs Marvel, FIFA vs FIFA, Cars vs Cars, etc.)!
            </p>
          </div>
          <button
            onClick={() => {
              soundFX.playCardHover();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Universe Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-3 sm:my-5 overflow-y-auto overscroll-contain pr-1">
          {UNIVERSES.map((u) => {
            const isSelected = selectedUniverseId === u.id;
            return (
              <div
                key={u.id}
                onClick={() => {
                  soundFX.playCardPlay();
                  onSelect(u.id);
                }}
                className={`relative p-3.5 sm:p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden group ${
                  u.bgGradient
                } ${
                  isSelected
                    ? `border-2 border-arena-cyan shadow-xl ${u.glowColor} scale-[1.01]`
                    : `${u.borderColor} opacity-85 hover:opacity-100`
                }`}
              >
                {/* Selected Check Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-arena-cyan text-slate-950 flex items-center justify-center font-black shadow-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-white/20 bg-slate-900 shrink-0 shadow-md">
                    <img 
                      src={u.bannerArt} 
                      alt={u.name}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                      {u.badge}
                    </span>
                    <h3 className="text-lg font-black text-white font-cinzel leading-tight group-hover:text-arena-cyan transition">
                      {u.name}
                    </h3>
                    <p className="text-xs text-slate-300 italic mt-0.5">
                      {u.tagline}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {u.description}
                    </p>

                    {/* Heroes list pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {u.keyHeroes.map((hero, i) => (
                        <span 
                          key={i}
                          className="text-[9px] font-semibold bg-white/10 text-slate-200 px-1.5 py-0.5 rounded"
                        >
                          {hero}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Selected Realm:{' '}
            <strong className="text-arena-cyan">
              {UNIVERSES.find((u) => u.id === selectedUniverseId)?.name || 'Marvel vs Marvel'}
            </strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                soundFX.playCardHover();
                onClose();
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm transition"
            >
              Confirm Realm
            </button>

            {onStartAi && (
              <button
                onClick={() => {
                  soundFX.playCardPlay();
                  onStartAi(selectedUniverseId);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-arena-blue to-arena-cyan hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-arena-cyan/30 hover:scale-105 transition"
              >
                <Swords className="w-4 h-4" />
                <span>Instant Battle vs AI!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
