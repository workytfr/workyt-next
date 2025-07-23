'use client';

import React from 'react';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

interface BadgeProgressProps {
  badgesCount: number;
  totalBadges: number;
  className?: string;
}

export default function BadgeProgress({ badgesCount, totalBadges, className = '' }: BadgeProgressProps) {
  const progress = (badgesCount / totalBadges) * 100;
  const remainingBadges = totalBadges - badgesCount;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getProgressMessage = (progress: number) => {
    if (progress >= 80) return 'Excellent !';
    if (progress >= 60) return 'Bien joué !';
    if (progress >= 40) return 'Continue comme ça !';
    if (progress >= 20) return 'Tu commences bien !';
    return 'Commence ta collection !';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Collection de Badges</h3>
        <Badge variant="secondary" className={getProgressColor(progress)}>
          {badgesCount}/{totalBadges}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progression</span>
            <span className={`font-medium ${getProgressColor(progress)}`}>
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Message de motivation */}
        <div className="text-center">
          <p className={`text-sm font-medium ${getProgressColor(progress)}`}>
            {getProgressMessage(progress)}
          </p>
          {remainingBadges > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {remainingBadges} badge{remainingBadges > 1 ? 's' : ''} restant{remainingBadges > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{badgesCount}</div>
            <div className="text-xs text-gray-500">Badges obtenus</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{remainingBadges}</div>
            <div className="text-xs text-gray-500">Badges restants</div>
          </div>
        </div>

        {/* Objectifs */}
        {remainingBadges > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Prochains objectifs</h4>
            <div className="space-y-1">
              {remainingBadges <= 3 && (
                <p className="text-xs text-blue-700">
                  🎯 Tu es proche de compléter ta collection !
                </p>
              )}
              {remainingBadges > 3 && remainingBadges <= 10 && (
                <p className="text-xs text-blue-700">
                  📈 Continue à participer pour débloquer plus de badges
                </p>
              )}
              {remainingBadges > 10 && (
                <p className="text-xs text-blue-700">
                  🌱 Commence par les badges les plus faciles à obtenir
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 