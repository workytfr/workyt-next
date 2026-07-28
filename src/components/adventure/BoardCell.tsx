"use client";

import React from 'react';
import Image from 'next/image';
import { Check, Lock, Loader2, Flame, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BoardTheme } from './boardThemes';
import type { CalendarDay, CellState } from './types';
import { themeEmojis } from './types';
import BoardMascot from './BoardMascot';
import MonsterSprite from './rpg/MonsterSprite';

interface BoardCellProps {
  day: CalendarDay;
  state: CellState;
  theme: BoardTheme;
  monster?: { emoji: string; isBoss: boolean; defeated: boolean };
  inFlameTrail: boolean;
  flameMilestone: boolean;
  hasMascot: boolean;
  mascotLayoutId: string;
  mascotImageUrl?: string | null;
  canClaim: boolean;
  claiming: boolean;
  quizLocked: boolean;
  onClaim: () => void;
}

export default function BoardCell({
  day, state, theme, monster, inFlameTrail, flameMilestone,
  hasMascot, mascotLayoutId, mascotImageUrl, canClaim, claiming, quizLocked, onClaim
}: BoardCellProps) {
  const dayNum = new Date(day.date + 'T00:00:00').getDate();
  const isChest = day.reward.type === 'chest';
  const specialEmoji = day.isSpecial ? themeEmojis[day.theme] : '';

  return (
    <div
      className={cn(
        'relative flex-1 aspect-square rounded-xl border-2 p-1 sm:p-1.5 flex flex-col transition-all duration-300',
        // État : réclamée
        state === 'claimed' && 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300',
        // État : ratée (jour passé non réclamé)
        state === 'missed' && 'bg-gray-100 border-gray-200 border-dashed opacity-40 grayscale',
        // État : aujourd'hui
        state === 'today' && 'bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.45)] adventure-glow',
        // État : futur (brouillard de guerre)
        state === 'future' && cn(theme.cellFuture, 'border'),
        // Case trésor (coffre du 15)
        isChest && state !== 'future' && !day.claimed && 'ring-2 ring-yellow-400 ring-offset-1',
        // Traînée de flamme
        inFlameTrail && 'shadow-[0_0_14px_rgba(249,115,22,0.55)] border-orange-400'
      )}
    >
      {hasMascot && <BoardMascot layoutId={mascotLayoutId} imageUrl={mascotImageUrl} />}

      {/* Ligne du haut : numéro + statut */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-xs sm:text-sm font-bold leading-none',
          state === 'future' ? 'text-slate-400' : state === 'today' ? 'text-amber-700' : state === 'claimed' ? 'text-emerald-700' : 'text-gray-700'
        )}>
          {dayNum}
        </span>
        {state === 'claimed' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />}
        {state === 'missed' && <Lock className="w-3 h-3 text-gray-300" />}
        {flameMilestone && <Flame className="w-3.5 h-3.5 text-orange-500 adventure-flame" />}
      </div>

      {/* Centre : monstre + récompense ou brouillard */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-0">
        {state === 'future' ? (
          day.isSpecial ? (
            <>
              <span className="text-sm sm:text-lg leading-none">{specialEmoji || '🎁'}</span>
              <HelpCircle className="w-3 h-3 text-slate-400" />
            </>
          ) : (
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          )
        ) : (
          <>
            {monster && (
              <MonsterSprite
                emoji={monster.emoji}
                isBoss={monster.isBoss}
                defeated={monster.defeated}
                size="sm"
              />
            )}
            {day.isSpecial && specialEmoji && !monster && (
              <span className="text-sm sm:text-base leading-none">{specialEmoji}</span>
            )}
            <RewardIcon day={day} />
          </>
        )}
      </div>

      {/* Bas : action ou label */}
      <div className="mt-auto">
        {state === 'today' && canClaim && (
          <button
            onClick={onClaim}
            disabled={claiming}
            className={cn(
              'w-full py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white rounded-md transition-all disabled:opacity-60',
              'bg-gradient-to-r hover:brightness-110 active:scale-95',
              theme.claimButton
            )}
          >
            {claiming ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Réclamer'}
          </button>
        )}
        {state === 'today' && quizLocked && !claiming && (
          <p className="text-[8px] sm:text-[9px] text-center font-semibold text-amber-700 leading-tight">
            🔒 Résous le quiz
          </p>
        )}
        {state !== 'today' && day.isSpecial && day.specialName && state !== 'future' && (
          <p className="text-[8px] sm:text-[9px] text-center font-medium text-gray-500 truncate">
            {day.specialName}
          </p>
        )}
      </div>
    </div>
  );
}

function RewardIcon({ day }: { day: CalendarDay }) {
  if (day.reward.type === 'chest') {
    return (
      <Image
        src={`/coffre/${day.reward.chestType || 'common'}_f.png`}
        alt="Coffre"
        width={22}
        height={22}
        className="object-contain drop-shadow"
      />
    );
  }
  if (day.reward.type === 'gems') {
    return (
      <div className="flex items-center gap-0.5">
        <Image src="/badge/diamond.png" alt="Diamants" width={14} height={14} className="object-contain" />
        <span className="text-[10px] font-bold text-blue-600">{day.reward.amount}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      <Image src="/badge/points.png" alt="Points" width={14} height={14} className="object-contain" />
      <span className="text-[10px] font-bold text-gray-600">{day.reward.amount}</span>
    </div>
  );
}
