'use client';

import React, { useState, useEffect } from 'react';
import { Rank, getRankProgress } from '@/lib/rankSystem';
import { Progress } from '@/components/ui/Progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface UserRankProps {
  points: number;
  className?: string;
  showProgress?: boolean;
}

export default function UserRank({ points, className = '', showProgress = true }: UserRankProps) {
  const [rankInfo, setRankInfo] = useState(() => getRankProgress(points));
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const newRankInfo = getRankProgress(points);
    setRankInfo(newRankInfo);
    
    // Animation lors du changement de rank
    if (newRankInfo.currentRank.level !== rankInfo.currentRank.level) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [points]);

  const { currentRank, nextRank, progress, pointsNeeded } = rankInfo;

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Rank actuel avec animation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`
              relative group cursor-pointer p-4 rounded-xl border-2
              bg-gradient-to-r ${currentRank.gradient}
              ${isAnimating ? 'animate-pulse scale-105' : 'hover:scale-105'}
              transition-all duration-300 transform
              shadow-lg hover:shadow-xl overflow-hidden
            `}>
              <div className="flex items-center space-x-3">
                <div className="text-3xl animate-bounce">
                  {currentRank.badge}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">
                    {currentRank.name}
                  </div>
                  <div className="text-white/80 text-sm">
                    Niveau {currentRank.level} • Monde {Math.ceil(currentRank.level / 3)}
                  </div>
                  <div className="text-white/70 text-xs mt-1">
                    {currentRank.world}
                  </div>
                  <div className="text-white/60 text-xs">
                    Niveau {currentRank.worldLevel}/3 dans ce monde
                  </div>
                </div>
                <div className="text-white/60 text-xs text-right">
                  <div>{points} points</div>
                  <div>XP</div>
                </div>
              </div>
              
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full animate-shine" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <div className="font-semibold">{currentRank.name}</div>
              <div className="text-sm text-gray-600">{currentRank.description}</div>
              <div className="text-xs text-gray-500 mt-1">
                Monde {Math.ceil(currentRank.level / 3)} : {currentRank.world}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Niveau {currentRank.worldLevel}/3 dans ce monde
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {currentRank.worldDescription}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {points} points d&apos;expérience
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Progression vers le prochain rank */}
        {showProgress && nextRank && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Prochain: {nextRank.world}
              </span>
              <span className="text-xs text-gray-500">
                {pointsNeeded} points restants
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">
                {currentRank.name} → {nextRank.name}
              </span>
              <div className="flex-1" />
              <span className="text-xs font-medium text-gray-700">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Monde {Math.ceil(nextRank.level / 3)} • Niveau {nextRank.worldLevel}/3
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {nextRank.worldDescription}
            </div>
          </div>
        )}

        {/* Animation spéciale pour les ranks élevés */}
        {currentRank.level >= 4 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
              <span className="animate-spin">⭐</span>
              <span>Monde Premium</span>
            </div>
          </div>
        )}

        {/* Animation spéciale pour le niveau max */}
        {currentRank.level >= 7 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-xs font-medium">
              <span className="animate-pulse">🌟</span>
              <span>Immortel - Monde Ultime</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 