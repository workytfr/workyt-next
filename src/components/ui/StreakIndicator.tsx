"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Trophy, Check } from 'lucide-react';
import useSWR from 'swr';

interface StreakIndicatorProps {
  userId: string;
  className?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Niveaux de flamme selon le streak
 * 0: eteinte (gris, pas d'animation)
 * 1: etincelle (jaune pale, leger tremblement)
 * 2: naissante (jaune, flicker doux)
 * 3: stable (orange, pulse)
 * 4: ardente (orange vif, flamme rapide + glow)
 * 5: infernale (rouge, flamme intense + particules)
 * 6: legendaire (violet, flamme legendaire + halo)
 */
export function getFlameLevel(streak: number) {
  if (streak >= 100) return 6;
  if (streak >= 60) return 5;
  if (streak >= 30) return 4;
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1;
  return 0;
}

export const FLAME_CONFIGS = {
  0: {
    color: '#9ca3af',
    glowColor: 'transparent',
    textClass: 'text-gray-400',
    animation: '',
    label: 'Eteinte',
  },
  1: {
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.3)',
    textClass: 'text-yellow-400',
    animation: 'flame-spark',
    label: 'Etincelle',
  },
  2: {
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.35)',
    textClass: 'text-yellow-500',
    animation: 'flame-flicker',
    label: 'Naissante',
  },
  3: {
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    textClass: 'text-orange-500',
    animation: 'flame-pulse',
    label: 'Stable',
  },
  4: {
    color: '#ea580c',
    glowColor: 'rgba(234, 88, 12, 0.5)',
    textClass: 'text-orange-600',
    animation: 'flame-burn',
    label: 'Ardente',
  },
  5: {
    color: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.5)',
    textClass: 'text-red-500',
    animation: 'flame-inferno',
    label: 'Infernale',
  },
  6: {
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    textClass: 'text-purple-500',
    animation: 'flame-legendary',
    label: 'Legendaire',
  },
} as const;

export function FlameIcon({ level, size = 20 }: { level: number; size?: number }) {
  const config = FLAME_CONFIGS[level as keyof typeof FLAME_CONFIGS];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow background for levels 3+ */}
      {level >= 3 && (
        <div
          className="absolute inset-0 rounded-full blur-sm"
          style={{
            background: config.glowColor,
            animation: level >= 5 ? 'flame-glow 1.5s ease-in-out infinite' : undefined,
          }}
        />
      )}

      {/* Secondary flame (behind, slightly offset) for levels 4+ */}
      {level >= 4 && (
        <svg
          className="absolute"
          width={size * 0.8}
          height={size * 0.8}
          viewBox="0 0 24 24"
          fill="none"
          style={{
            top: -1,
            left: size * 0.15,
            opacity: 0.4,
            animation: 'flame-secondary 0.8s ease-in-out infinite alternate',
          }}
        >
          <path
            d="M12 2C6.5 8.5 4 12 4 15.5C4 19.64 7.58 23 12 23C16.42 23 20 19.64 20 15.5C20 12 17.5 8.5 12 2Z"
            fill={config.color}
          />
        </svg>
      )}

      {/* Main flame SVG */}
      <svg
        className="relative z-10"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{
          animation: config.animation ? `${config.animation} ${level >= 5 ? '0.6s' : level >= 3 ? '1s' : '1.5s'} ease-in-out infinite` : undefined,
          filter: level >= 5 ? `drop-shadow(0 0 ${level >= 6 ? 4 : 2}px ${config.color})` : undefined,
        }}
      >
        {/* Flame body */}
        <path
          d="M12 2C6.5 8.5 4 12 4 15.5C4 19.64 7.58 23 12 23C16.42 23 20 19.64 20 15.5C20 12 17.5 8.5 12 2Z"
          fill={config.color}
          stroke={level >= 3 ? config.color : 'none'}
          strokeWidth={level >= 3 ? 0.5 : 0}
          strokeOpacity={0.5}
        />
        {/* Inner flame highlight */}
        {level >= 1 && (
          <path
            d="M12 9C9.5 13 8.5 15 8.5 16.5C8.5 18.43 10.07 20 12 20C13.93 20 15.5 18.43 15.5 16.5C15.5 15 14.5 13 12 9Z"
            fill={level >= 5 ? '#fbbf24' : level >= 3 ? '#fdba74' : '#fef3c7'}
            opacity={level >= 3 ? 0.9 : 0.7}
          />
        )}
        {/* Core glow for high levels */}
        {level >= 5 && (
          <ellipse
            cx="12"
            cy="17"
            rx="2"
            ry="2.5"
            fill="#fef3c7"
            opacity={0.8}
          />
        )}
      </svg>

      {/* Particle effects for level 5+ */}
      {level >= 5 && (
        <>
          <span
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: level >= 6 ? '#c084fc' : '#f87171',
              top: -2,
              left: '30%',
              animation: 'flame-particle-1 1.2s ease-out infinite',
            }}
          />
          <span
            className="absolute w-0.5 h-0.5 rounded-full"
            style={{
              background: level >= 6 ? '#e9d5ff' : '#fbbf24',
              top: 0,
              right: '25%',
              animation: 'flame-particle-2 1.5s ease-out infinite 0.3s',
            }}
          />
          <span
            className="absolute w-0.5 h-0.5 rounded-full"
            style={{
              background: level >= 6 ? '#a855f7' : '#fb923c',
              top: -1,
              left: '50%',
              animation: 'flame-particle-3 1s ease-out infinite 0.6s',
            }}
          />
        </>
      )}
    </div>
  );
}

function FlameIconLarge({ level }: { level: number }) {
  return <FlameIcon level={level} size={28} />;
}

const StreakIndicator: React.FC<StreakIndicatorProps> = ({ userId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [claimingMilestone, setClaimingMilestone] = useState<number | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

  const { data, error, isLoading, mutate } = useSWR(
    userId ? '/api/streak' : null,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (isLoading || !data?.success) return null;
  if (error) return null;

  const { currentStreak, longestStreak, milestones } = data.data;
  const level = getFlameLevel(currentStreak);
  const config = FLAME_CONFIGS[level as keyof typeof FLAME_CONFIGS];

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  const handleClaimMilestone = async (milestoneDays: number) => {
    setClaimingMilestone(milestoneDays);
    try {
      const res = await fetch('/api/streak/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneDays })
      });
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error('Erreur claim milestone:', err);
    } finally {
      setClaimingMilestone(null);
    }
  };

  // Milestone flame levels (matching STREAK_MILESTONES days)
  const getMilestoneFlameLvl = (days: number) => {
    if (days >= 100) return 6;
    if (days >= 60) return 5;
    if (days >= 30) return 4;
    if (days >= 14) return 3;
    if (days >= 7) return 2;
    return 1;
  };

  return (
    <div className={className}>
      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes flame-spark {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-0.5px) rotate(2deg); }
        }
        @keyframes flame-flicker {
          0%, 100% { transform: scaleY(1) rotate(0deg); opacity: 1; }
          25% { transform: scaleY(1.05) rotate(-2deg); opacity: 0.9; }
          50% { transform: scaleY(0.95) rotate(1deg); opacity: 1; }
          75% { transform: scaleY(1.03) rotate(-1deg); opacity: 0.95; }
        }
        @keyframes flame-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          30% { transform: scale(1.08) rotate(-2deg); }
          60% { transform: scale(0.97) rotate(2deg); }
        }
        @keyframes flame-burn {
          0%, 100% { transform: scale(1) rotate(0deg) translateY(0); }
          20% { transform: scale(1.1) rotate(-3deg) translateY(-1px); }
          40% { transform: scale(0.95) rotate(2deg) translateY(0); }
          60% { transform: scale(1.08) rotate(-1deg) translateY(-0.5px); }
          80% { transform: scale(0.98) rotate(1deg) translateY(0); }
        }
        @keyframes flame-inferno {
          0%, 100% { transform: scale(1) rotate(0deg) translateY(0); }
          15% { transform: scale(1.12) rotate(-4deg) translateY(-1.5px); }
          30% { transform: scale(0.93) rotate(3deg) translateY(0); }
          45% { transform: scale(1.1) rotate(-2deg) translateY(-1px); }
          60% { transform: scale(0.96) rotate(2deg) translateY(0.5px); }
          75% { transform: scale(1.08) rotate(-3deg) translateY(-1px); }
        }
        @keyframes flame-legendary {
          0%, 100% { transform: scale(1) rotate(0deg) translateY(0); filter: hue-rotate(0deg); }
          15% { transform: scale(1.15) rotate(-4deg) translateY(-2px); filter: hue-rotate(10deg); }
          30% { transform: scale(0.92) rotate(3deg) translateY(0); filter: hue-rotate(-5deg); }
          45% { transform: scale(1.12) rotate(-2deg) translateY(-1.5px); filter: hue-rotate(15deg); }
          60% { transform: scale(0.95) rotate(3deg) translateY(0); filter: hue-rotate(-10deg); }
          75% { transform: scale(1.1) rotate(-3deg) translateY(-1px); filter: hue-rotate(5deg); }
        }
        @keyframes flame-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes flame-secondary {
          0% { transform: scaleY(0.9) translateY(1px); opacity: 0.3; }
          100% { transform: scaleY(1.1) translateY(-1px); opacity: 0.5; }
        }
        @keyframes flame-particle-1 {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-8px) translateX(-3px) scale(0); opacity: 0; }
        }
        @keyframes flame-particle-2 {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-10px) translateX(4px) scale(0); opacity: 0; }
        }
        @keyframes flame-particle-3 {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-7px) translateX(-2px) scale(0); opacity: 0; }
        }
      `}</style>

      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50/50 transition-colors"
        title={`Streak: ${currentStreak} jour${currentStreak > 1 ? 's' : ''} | Record: ${longestStreak} | ${config.label}`}
      >
        <FlameIcon level={level} size={20} />
        <span className={`text-sm font-medium ${config.textClass}`}>{currentStreak}</span>
      </button>

      {/* Dropdown panel - fixed to viewport */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-[200] p-4 max-h-[70vh] overflow-y-auto"
          style={{ top: panelPos.top, right: panelPos.right }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FlameIconLarge level={level} />
              <div>
                <p className="text-lg font-bold text-gray-900">{currentStreak} jour{currentStreak > 1 ? 's' : ''}</p>
                <p className={`text-xs font-medium ${config.textClass}`}>{config.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{longestStreak}</span>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            {milestones.map((m: any) => (
              <div
                key={m.days}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  m.claimed
                    ? 'bg-green-50 border-green-200'
                    : m.reached
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <FlameIcon level={getMilestoneFlameLvl(m.days)} size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{m.name}</span>
                      <span className="text-xs text-gray-400">{m.days}j</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {m.rewards.points > 0 && (
                        <span className="text-xs text-blue-600">{m.rewards.points} pts</span>
                      )}
                      {m.rewards.gems > 0 && (
                        <span className="text-xs text-purple-600">{m.rewards.gems} gem{m.rewards.gems > 1 ? 's' : ''}</span>
                      )}
                      {m.rewards.mushrooms > 0 && (
                        <span className="text-xs text-orange-600">{m.rewards.mushrooms} champi{m.rewards.mushrooms > 1 ? 's' : ''}</span>
                      )}
                      {m.badge && (
                        <span className="text-xs text-yellow-600">+ badge</span>
                      )}
                    </div>
                  </div>
                </div>

                {m.claimed ? (
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                ) : m.reached ? (
                  <button
                    onClick={() => handleClaimMilestone(m.days)}
                    disabled={claimingMilestone === m.days}
                    className="px-3 py-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-full transition-colors disabled:opacity-50 shrink-0"
                  >
                    {claimingMilestone === m.days ? '...' : 'Claim'}
                  </button>
                ) : (
                  <div className="text-xs text-gray-400 shrink-0">
                    {m.days - currentStreak}j
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakIndicator;
