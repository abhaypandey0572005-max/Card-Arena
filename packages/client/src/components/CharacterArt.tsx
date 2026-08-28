import React, { useState } from 'react';

interface CharacterArtProps {
  artIcon: string;
  name: string;
  faction: string;
  imageUrl?: string;
  className?: string;
}

export const CharacterArt: React.FC<CharacterArtProps> = ({
  artIcon,
  name,
  faction,
  imageUrl,
  className = 'w-full h-full',
}) => {
  const [hasError, setHasError] = useState(false);

  // If Pokemon, use official PokeAPI official artwork
  if (faction === 'pokemon' && imageUrl) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 ${className}`}>
        <div
          className={`absolute w-24 h-24 rounded-full filter blur-xl opacity-60 ${
            artIcon === 'charizard'
              ? 'bg-orange-500'
              : artIcon === 'pikachu'
              ? 'bg-yellow-400'
              : artIcon === 'mewtwo'
              ? 'bg-purple-500'
              : artIcon === 'blastoise'
              ? 'bg-blue-500'
              : 'bg-indigo-600'
          }`}
        />
        <img
          src={imageUrl}
          alt={name}
          className="relative z-10 w-4/5 h-4/5 object-contain filter drop-shadow-2xl transform hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
      </div>
    );
  }

  // Official high-definition character photo / artwork stored locally
  const imagePath = `/cards/${artIcon}.jpg`;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-slate-950 ${className}`}>
      {!hasError ? (
        <img
          src={imagePath}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-top filter contrast-110 drop-shadow-lg transform hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-2 text-center text-xs font-bold text-slate-300">
          <span className="text-2xl mb-1">👑</span>
          <span>{name}</span>
        </div>
      )}
      {/* Subtle bottom gradient to blend with card UI */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
