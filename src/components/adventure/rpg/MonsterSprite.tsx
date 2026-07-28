"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MonsterSpriteProps {
  emoji: string;
  isBoss?: boolean;
  defeated?: boolean;
  sleeping?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Monstre affiché sur une case du plateau (ou dans l'arène de combat).
 * États : vivant (flottement), boss (aura rouge), vaincu (💀), endormi (💤).
 */
export default function MonsterSprite({ emoji, isBoss, defeated, sleeping, size = 'md' }: MonsterSpriteProps) {
  const sizeClass = size === 'lg' ? 'text-6xl sm:text-7xl' : size === 'md' ? 'text-2xl sm:text-3xl' : 'text-base';

  if (defeated) {
    return (
      <span className={cn(sizeClass, 'opacity-60 grayscale select-none leading-none')} title="Vaincu">
        💀
      </span>
    );
  }

  return (
    <span className={cn('relative inline-block select-none leading-none', size === 'lg' && 'adventure-monster-float')}>
      <span className={cn(sizeClass, isBoss && 'adventure-boss-aura inline-block')}>
        {emoji}
      </span>
      {sleeping && (
        <span className="absolute -top-2 -right-2 text-xs sm:text-sm">💤</span>
      )}
      {isBoss && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-red-600 tracking-widest whitespace-nowrap">
          BOSS
        </span>
      )}
    </span>
  );
}
