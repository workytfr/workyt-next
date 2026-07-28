/**
 * Types partagés du Plateau de l'Aventure.
 */

export interface CalendarDay {
  date: string; // 'YYYY-MM-DD' (locale)
  reward: {
    type: 'points' | 'gems' | 'chest';
    amount?: number;
    chestType?: 'common' | 'rare';
  };
  theme: string;
  isSpecial: boolean;
  specialName?: string;
  description?: string;
  claimed: boolean;
}

export type CellState = 'claimed' | 'missed' | 'today' | 'future';

export interface CollectionCard {
  week: number;
  theme: string;
  earnedAt: string;
}

export interface CollectionInfo {
  cards: CollectionCard[];
  totalWeeks: number;
  setCompleted: boolean;
}

export interface ClaimResult {
  rewardType: 'points' | 'gems' | 'chest';
  amount?: number;
  chestType?: 'common' | 'rare';
  chestReward?: {
    rewardType: string;
    amount?: number;
    cosmeticType?: string;
  } | null;
  cardEarned?: { week: number; theme: string };
  setCompleted?: boolean;
  setChestReward?: {
    chestType: string;
    rewardType: string;
    amount?: number;
  } | null;
  currentStreak?: number;
}

export const themeEmojis: Record<string, string> = {
  christmas: '🎄',
  newyear: '🎆',
  chinese_newyear: '🐉',
  eastern: '🏜️',
  indian: '🪔',
  japanese: '🌸',
  canadian: '🍁',
  french_civil: '🇫🇷',
  french_cultural: '🎭',
  default: ''
};

export const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
