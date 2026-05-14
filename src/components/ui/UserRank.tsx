'use client';

import React, { useState } from 'react';
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

export default function UserRank({ points, className = '', showProgress = true }: UserRankProps) {
  const { currentRank, nextRank, progress, pointsNeeded } = getRankProgress(points);
  const prestigeInfo = getPrestigeInfo(points);
  const [mapOpen, setMapOpen] = useState(false);

  const currentWorldIndex = WORLDS.indexOf(currentRank.world);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Identité du rang */}
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: `${currentRank.color}12`, borderColor: `${currentRank.color}30` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${currentRank.color}20` }}
          >
            {currentRank.badge}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-xl text-gray-900 leading-tight">{currentRank.name}</div>
            <div className="text-sm text-gray-500 mt-0.5 truncate">{currentRank.world}</div>
            <div className="text-xs text-gray-400 mt-1">
              {points.toLocaleString('fr-FR')} pts · Niveau {currentRank.level}
            </div>
          </div>

          {/* Dots position dans le monde */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-semibold text-gray-500">{currentRank.worldLevel}/3</span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: i <= currentRank.worldLevel ? currentRank.color : '#E5E7EB' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      {showProgress && (
        nextRank ? (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <span>Prochain :</span>
                <span>{nextRank.badge}</span>
                <span className="font-semibold" style={{ color: nextRank.color }}>{nextRank.name}</span>
              </div>
              <span className="text-xs text-gray-500 tabular-nums">
                {pointsNeeded.toLocaleString('fr-FR')} pts
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.max(progress, 2)}%`,
                  background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank.color})`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>{currentRank.name}</span>
              <span className="font-semibold text-gray-600">{Math.round(progress)}%</span>
              <span>{nextRank.name}</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
            <div className="text-sm font-semibold text-amber-800">✨ Rang maximum atteint</div>
            <div className="text-xs text-amber-600 mt-0.5">Tu as conquis tous les mondes</div>
          </div>
        )
      )}

      {/* Zone C : Prestige */}
      {prestigeInfo.level > 0 && prestigeInfo.tier && (
        <div
          className="rounded-2xl p-4 border"
          style={{ backgroundColor: `${prestigeInfo.color}10`, borderColor: `${prestigeInfo.color}35` }}
        >
          <div className="flex items-center gap-3">
            {/* Gemme animée */}
            <div className="flex-shrink-0">
              <PrestigeGem
                color={prestigeInfo.color}
                intensity={prestigeInfo.rankInTier}
                size={44}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: prestigeInfo.color }}>
                Prestige {prestigeInfo.level <= 100 ? prestigeInfo.level : '100+'}
              </div>
              <div className="font-bold text-base text-gray-900">{prestigeInfo.displayLevel}</div>
            </div>

            {prestigeInfo.level <= 100 && (
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500 tabular-nums">
                  {prestigeInfo.nextLevelPoints.toLocaleString('fr-FR')} pts
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-[width] duration-500"
                    style={{ width: `${prestigeInfo.progressInLevel}%`, backgroundColor: prestigeInfo.color }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Carte des mondes (dépliable) */}
      <div>
        <button
          onClick={() => setMapOpen(v => !v)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 px-1"
        >
          <span className="font-medium">
            Carte des mondes · Monde {currentWorldIndex + 1}/{WORLDS.length}
          </span>
          <span>{mapOpen ? '▲' : '▼'}</span>
        </button>

        {mapOpen && (
          <div className="mt-2 grid grid-cols-5 gap-2">
            {WORLDS.map((world, idx) => {
              const isDone = idx < currentWorldIndex;
              const isCurrent = idx === currentWorldIndex;
              return (
                <div
                  key={world}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center ${
                    isCurrent ? 'bg-white shadow-sm border-2' : isDone ? 'bg-gray-50' : 'opacity-40'
                  }`}
                  style={isCurrent ? { borderColor: currentRank.color } : {}}
                  title={world}
                >
                  <span className="text-xl">{WORLD_ICONS[world] ?? '🌍'}</span>
                  <span className="text-[9px] font-bold">
                    {isDone ? <span className="text-emerald-600">✓</span>
                      : isCurrent ? <span style={{ color: currentRank.color }}>●</span>
                      : <span className="text-gray-300">○</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
