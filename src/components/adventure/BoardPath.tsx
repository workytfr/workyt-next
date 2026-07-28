"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { BoardTheme } from './boardThemes';

/**
 * Connecteur de chemin entre deux cases du plateau.
 * S'illumine en traînée de feu lorsque les deux cases adjacentes
 * font partie de la série de jours réclamés consécutifs.
 */
export function PathConnector({ lit, theme, vertical }: { lit: boolean; theme: BoardTheme; vertical?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-full transition-colors duration-500 shrink-0',
        vertical ? 'w-1.5 h-4 mx-auto' : 'h-1.5 w-2 sm:w-3 self-center',
        lit
          ? 'bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.7)]'
          : theme.path,
        !lit && 'opacity-50'
      )}
    />
  );
}

/**
 * Connecteur vertical en bout de ligne (serpentin) : relie la dernière
 * case d'une ligne à la première case de la ligne suivante.
 */
export function PathCorner({ lit, theme, side }: { lit: boolean; theme: BoardTheme; side: 'left' | 'right' }) {
  return (
    <div className={cn('flex', side === 'right' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'w-1.5 h-3 rounded-full transition-colors duration-500',
          side === 'right' ? 'mr-[8%]' : 'ml-[8%]',
          lit
            ? 'bg-gradient-to-b from-orange-400 to-red-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]'
            : theme.path,
          !lit && 'opacity-50'
        )}
      />
    </div>
  );
}
