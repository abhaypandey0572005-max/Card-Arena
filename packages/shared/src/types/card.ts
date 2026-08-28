export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardFaction = 
  | 'marvel' 
  | 'dc' 
  | 'pokemon' 
  | 'wwe' 
  | 'anime' 
  | 'apex' 
  | 'solaris' 
  | 'quantum' 
  | 'cyber';

export type CardType = 'minion' | 'spell';

export type CardEffectType = 
  | 'heal_hero'
  | 'direct_damage'
  | 'buff_minion'
  | 'draw_card'
  | 'aoe_damage'
  | 'shield_hero';

export interface CardEffect {
  type: CardEffectType;
  value: number;
  description: string;
}

export interface SuperMove {
  name: string;
  description: string;
  effectType: CardEffectType;
  value: number;
}

export interface CardTemplate {
  id: string;
  name: string;
  imageUrl: string;
  manaCost: number; // Energy Cost
  type: CardType;
  rarity: CardRarity;
  faction: CardFaction;
  attack: number;    // Power (PWR)
  speed: number;     // Speed (SPD) - 1 to 10 (determines strike initiative)
  agility: number;   // Agility (AGI) - 1 to 10 (evasion & damage mitigation)
  health: number;    // Stamina (HP)
  description: string;
  artIcon: string;
  flavorQuote?: string;
  isTaunt?: boolean;
  isShielded?: boolean;
  isRush?: boolean;
  effect?: CardEffect;
  superMove?: SuperMove;
}

export interface CardInstance extends CardTemplate {
  instanceId: string;
  currentHealth: number;
  maxHealth: number;
  currentAttack: number;
  currentSpeed: number;
  currentAgility: number;
  canAttack: boolean;
  attacksThisTurn: number;
  hasShield: boolean;
}
