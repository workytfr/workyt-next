'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getRankProgress, getPrestigeInfo, RANKS } from '@/lib/rankSystem';
import PrestigeGem from '@/components/ui/PrestigeGem';

interface UserRankProps {
  points: number;
  className?: string;
  showProgress?: boolean;
}

const WORLD_ICONS: Record<string, string> = {
  'Monde des Mangas':               '🗾',
  'Monde Français':                 '🇫🇷',
  'Monde des Renards et Fées':      '🦊',
  'Monde Québécois':                '🍁',
  'Monde Égyptien':                 '🏺',
  'Monde des Neiges et des Sables': '🏔️',
  'Monde de l\'Imaginaire':         '💭',
  'Monde Médiéval':                 '⚔️',
  'Monde des Sciences':             '🔬',
  'Monde des Anciens':              '✨',
};

const WORLDS = Array.from(
  new Map(RANKS.map(r => [r.world, r.level])).entries()
)
  .sort((a, b) => a[1] - b[1])
  .map(([world]) => world);

const muted = 'text-[rgba(26,21,18,0.55)]';

export default function UserRank({ points, className = '', showProgress = true }: UserRankProps) {
  const { currentRank, nextRank, progress, pointsNeeded } = getRankProgress(points);
  const prestigeInfo = getPrestigeInfo(points);
  const [mapOpen, setMapOpen] = useState(false);

  const currentWorldIndex = WORLDS.indexOf(currentRank.world);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Rang actuel */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl"
          style={{ backgroundColor: `${currentRank.color}1f`, boxShadow: `inset 0 0 0 1px ${currentRank.color}40` }}
        >
          {currentRank.badge}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif-display text-2xl leading-tight text-[var(--wk-ink)]">{currentRank.name}</p>
          <p className={`mt-0.5 truncate text-sm ${muted}`}>{currentRank.world}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-[rgba(26,21,18,0.5)]">Niv. {currentRank.level}</span>
            <span className="flex gap-1" title={`Étape ${currentRank.worldLevel} sur 3 dans ce monde`}>
              {[1, 2, 3].map(i => (
                <span
                  key={i}
                  className="h-1.5 w-4 rounded-full"
                  style={{ backgroundColor: i <= currentRank.worldLevel ? currentRank.color : 'rgba(26,21,18,0.1)' }}
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Vers le rang suivant */}
      {showProgress && (
        nextRank ? (
          <div className="rounded-2xl bg-[var(--wk-paper)] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-[rgba(26,21,18,0.7)]">
                Encore <strong className="text-[var(--wk-ink)]">{pointsNeeded.toLocaleString('fr-FR')} pts</strong>
              </p>
              <p className="flex min-w-0 items-center gap-1 text-sm font-semibold" style={{ color: nextRank.color }}>
                <span>{nextRank.badge}</span>
                <span className="truncate">{nextRank.name}</span>
              </p>
            </div>
            <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)]">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.max(progress, 3)}%`,
                  background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank.color})`,
                }}
              />
            </div>
            <p className={`mt-1.5 text-right text-xs font-semibold ${muted}`}>{Math.round(progress)} %</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#fff7e8] p-4 text-center">
            <p className="text-sm font-semibold text-[#9a5d00]">✨ Rang maximum atteint</p>
            <p className="mt-0.5 text-xs text-[#c27a00]">Tu as conquis tous les mondes</p>
          </div>
        )
      )}

      {/* Prestige */}
      {prestigeInfo.level > 0 && prestigeInfo.tier && (
        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ backgroundColor: `${prestigeInfo.color}12`, boxShadow: `inset 0 0 0 1px ${prestigeInfo.color}33` }}
        >
          <PrestigeGem color={prestigeInfo.color} intensity={prestigeInfo.rankInTier} size={40} />
          <div className="min-w-0 flex-1">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em]" style={{ color: prestigeInfo.color }}>
              Prestige {prestigeInfo.level <= 100 ? prestigeInfo.level : '100+'}
            </p>
            <p className="font-semibold text-[var(--wk-ink)]">{prestigeInfo.displayLevel}</p>
          </div>
          {prestigeInfo.level <= 100 && (
            <div className="shrink-0 text-right">
              <p className={`text-xs tabular-nums ${muted}`}>{prestigeInfo.nextLevelPoints.toLocaleString('fr-FR')} pts</p>
              <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)]">
                <div className="h-full rounded-full" style={{ width: `${prestigeInfo.progressInLevel}%`, backgroundColor: prestigeInfo.color }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Carte des mondes */}
      <div className="border-t border-[rgba(26,21,18,0.06)] pt-3">
        <button
          type="button"
          onClick={() => setMapOpen(v => !v)}
          aria-expanded={mapOpen}
          className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-sm font-semibold text-[var(--wk-ink)] transition hover:text-[var(--wk-accent)]"
        >
          <span>
            Carte des mondes <span className={`font-normal ${muted}`}>· {currentWorldIndex + 1}/{WORLDS.length}</span>
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${mapOpen ? 'rotate-180' : ''}`} />
        </button>

        {mapOpen && (
          <ol className="mt-3 space-y-1">
            {WORLDS.map((world, idx) => {
              const isDone = idx < currentWorldIndex;
              const isCurrent = idx === currentWorldIndex;
              return (
                <li
                  key={world}
                  className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm ${isCurrent ? 'bg-[var(--wk-paper)]' : ''} ${!isDone && !isCurrent ? 'opacity-45' : ''}`}
                  style={isCurrent ? { boxShadow: `inset 0 0 0 1.5px ${currentRank.color}` } : undefined}
                >
                  <span className="w-6 text-center text-lg">{WORLD_ICONS[world] ?? '🌍'}</span>
                  <span className={`min-w-0 flex-1 truncate ${isCurrent ? 'font-semibold text-[var(--wk-ink)]' : 'text-[rgba(26,21,18,0.7)]'}`}>{world}</span>
                  {isDone && <span className="text-xs font-semibold text-emerald-700">✓</span>}
                  {isCurrent && <span className="text-[11px] font-semibold" style={{ color: currentRank.color }}>Ici</span>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
