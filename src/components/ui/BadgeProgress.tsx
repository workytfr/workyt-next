'use client';

import React from 'react';

interface BadgeProgressProps {
  badgesCount: number;
  totalBadges: number;
  className?: string;
}

export default function BadgeProgress({ badgesCount, totalBadges, className = '' }: BadgeProgressProps) {
  const progress = totalBadges > 0 ? Math.round((badgesCount / totalBadges) * 100) : 0;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-2xl font-bold text-gray-900">{badgesCount}</span>
        <span className="text-sm text-gray-400">/ {totalBadges}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-medium text-gray-500 shrink-0">{progress}%</span>
    </div>
  );
}
