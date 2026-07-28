"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBoardTheme, type BoardTheme } from './boardThemes';
import type { CollectionInfo } from './types';
import { themeEmojis } from './types';

interface CardCollectionProps {
  collection: CollectionInfo;
  theme: BoardTheme;
}

/**
 * Bandeau « Collection du mois » : une carte par semaine du mois.
 * Carte gagnée = face colorée du thème de la semaine (flip d'entrée).
 * Carte manquante = silhouette mystère.
 */
export default function CardCollection({ collection, theme }: CardCollectionProps) {
  const earnedWeeks = new Map(collection.cards.map(c => [c.week, c]));
  const total = collection.totalWeeks;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className={cn('w-4 h-4', theme.accent)} />
          <h3 className="text-sm font-bold text-gray-900">Collection du mois</h3>
        </div>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', theme.accentBg, theme.accent)}>
          {collection.cards.length}/{total}
        </span>
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
        {Array.from({ length: total }, (_, week) => {
          const card = earnedWeeks.get(week);
          const cardTheme = card ? getBoardTheme(card.theme) : null;
          return (
            <motion.div
              key={week}
              initial={card ? { rotateY: 90, opacity: 0 } : false}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn(
                'relative shrink-0 w-16 h-22 sm:w-20 sm:h-26 rounded-xl border-2 flex flex-col items-center justify-center gap-1 p-2',
                card
                  ? cn('bg-gradient-to-br border-yellow-300 shadow-md', cardTheme!.cardFace)
                  : 'bg-slate-800/80 border-slate-600 border-dashed'
              )}
              style={{ height: '5.5rem' }}
            >
              {card ? (
                <>
                  <span className="text-2xl leading-none">{themeEmojis[card.theme] || '🃏'}</span>
                  <span className="text-[9px] font-bold text-white drop-shadow text-center leading-tight">
                    Semaine {week + 1}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl leading-none text-slate-500">?</span>
                  <span className="text-[9px] font-semibold text-slate-400 text-center leading-tight">
                    Semaine {week + 1}
                  </span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {collection.setCompleted ? (
        <p className="mt-2 text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          🏆 Set complet — coffre épique remporté !
        </p>
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          Réclame toutes les cases d&apos;une semaine pour gagner sa carte. Set complet = coffre épique + équipement épique !
        </p>
      )}
    </div>
  );
}
