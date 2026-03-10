'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Lock, Eye, EyeOff, Star } from 'lucide-react';

interface BadgeData {
  _id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'progression' | 'engagement' | 'performance' | 'special';
  rarity: 'commun' | 'rare' | 'épique' | 'légendaire';
  condition: {
    type: string;
    value: number;
  };
}

interface BadgeDisplayProps {
  userId?: string;
  badges?: string[];
  showAll?: boolean;
  maxDisplay?: number;
  className?: string;
  showProgress?: boolean;
}

const RARITY_CONFIG = {
  commun: {
    border: 'border-gray-200',
    bgEarned: 'bg-white',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    label: 'Commun',
  },
  rare: {
    border: 'border-blue-200',
    bgEarned: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    label: 'Rare',
  },
  'épique': {
    border: 'border-purple-200',
    bgEarned: 'bg-purple-50',
    text: 'text-purple-600',
    dot: 'bg-purple-500',
    label: 'Epique',
  },
  'légendaire': {
    border: 'border-yellow-300',
    bgEarned: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-500',
    label: 'Legendaire',
  },
} as const;

const CATEGORY_CONFIG = {
  progression: { label: 'Progression', emoji: '📈' },
  engagement: { label: 'Engagement', emoji: '💬' },
  performance: { label: 'Performance', emoji: '🏆' },
  special: { label: 'Special', emoji: '✨' },
} as const;

type CategoryFilter = 'all' | 'progression' | 'engagement' | 'performance' | 'special';

export default function BadgeDisplay({
  userId,
  className = '',
}: BadgeDisplayProps) {
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [earnedSlugs, setEarnedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showLocked, setShowLocked] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);

        const allRes = await fetch('/api/badges');
        const allData = await allRes.json();
        setAllBadges(allData.badges || []);

        if (userId) {
          const userRes = await fetch(`/api/badges?userId=${userId}`);
          const userData = await userRes.json();
          const slugs = (userData.userBadges || []).map((b: BadgeData) => b.slug);
          setEarnedSlugs(new Set(slugs));

          if (userData.selectedBadge) {
            setSelectedBadge(userData.selectedBadge);
          }
        }
      } catch (err) {
        console.error('BadgeDisplay: Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  const earnedBadges = useMemo(() => allBadges.filter(b => earnedSlugs.has(b.slug)), [allBadges, earnedSlugs]);
  const lockedBadges = useMemo(() => allBadges.filter(b => !earnedSlugs.has(b.slug)), [allBadges, earnedSlugs]);

  const displayedBadges = useMemo(() => {
    const source = showLocked ? allBadges : earnedBadges;
    if (categoryFilter === 'all') return source;
    return source.filter(b => b.category === categoryFilter);
  }, [showLocked, allBadges, earnedBadges, categoryFilter]);

  // Group by category
  const groupedBadges = useMemo(() => {
    const groups: Record<string, BadgeData[]> = {};
    for (const badge of displayedBadges) {
      if (!groups[badge.category]) groups[badge.category] = [];
      groups[badge.category].push(badge);
    }
    return groups;
  }, [displayedBadges]);

  const stats = useMemo(() => {
    const total = allBadges.length;
    const earned = earnedSlugs.size;
    const byRarity: Record<string, { total: number; earned: number }> = {
      commun: { total: 0, earned: 0 },
      rare: { total: 0, earned: 0 },
      'épique': { total: 0, earned: 0 },
      'légendaire': { total: 0, earned: 0 },
    };
    for (const b of allBadges) {
      byRarity[b.rarity].total++;
      if (earnedSlugs.has(b.slug)) byRarity[b.rarity].earned++;
    }
    return { total, earned, byRarity };
  }, [allBadges, earnedSlugs]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header: stats + toggles */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-gray-900">
            {stats.earned}<span className="text-base font-normal text-gray-400">/{stats.total}</span>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            {Object.entries(stats.byRarity).map(([rarity, s]) => (
              <div
                key={rarity}
                className="flex items-center gap-1"
                title={`${RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG].label}: ${s.earned}/${s.total}`}
              >
                <span className={`w-2 h-2 rounded-full ${RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG].dot}`} />
                <span className="text-xs text-gray-500">{s.earned}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle locked badges */}
          <button
            onClick={() => setShowLocked(!showLocked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showLocked
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            title={showLocked ? 'Masquer les badges verrouilles' : 'Voir les badges a recuperer'}
          >
            {showLocked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showLocked ? 'Masquer' : 'Tout voir'}</span>
          </button>
        </div>
      </div>

      {/* Category filter (visible when showing all) */}
      {showLocked && (
        <div className="flex flex-wrap gap-1">
          {(['all', 'progression', 'engagement', 'performance', 'special'] as CategoryFilter[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                categoryFilter === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? 'Tous' : CATEGORY_CONFIG[cat].emoji + ' ' + CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>
      )}

      {/* Earned badges (default view) or all badges */}
      {!showLocked && earnedBadges.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">Aucun badge obtenu pour le moment.</p>
          <button
            onClick={() => setShowLocked(true)}
            className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-medium"
          >
            Voir les badges a debloquer
          </button>
        </div>
      )}

      {categoryFilter === 'all' && Object.keys(groupedBadges).length > 0 ? (
        Object.entries(groupedBadges).map(([category, badges]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-sm">{CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.emoji}</span>
              <h4 className="text-sm font-semibold text-gray-700">
                {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label}
              </h4>
              {showLocked && (
                <span className="text-xs text-gray-400">
                  {badges.filter(b => earnedSlugs.has(b.slug)).length}/{badges.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {badges.map(badge => (
                <BadgeCard
                  key={badge.slug}
                  badge={badge}
                  earned={earnedSlugs.has(badge.slug)}
                  hovered={hoveredBadge === badge.slug}
                  onHover={setHoveredBadge}
                  isSelected={selectedBadge === badge.slug}
                />
              ))}
            </div>
          </div>
        ))
      ) : categoryFilter !== 'all' && displayedBadges.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {displayedBadges.map(badge => (
            <BadgeCard
              key={badge.slug}
              badge={badge}
              earned={earnedSlugs.has(badge.slug)}
              hovered={hoveredBadge === badge.slug}
              onHover={setHoveredBadge}
              isSelected={selectedBadge === badge.slug}
            />
          ))}
        </div>
      ) : showLocked && displayedBadges.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          Aucun badge dans cette categorie.
        </div>
      ) : null}
    </div>
  );
}

function BadgeCard({
  badge,
  earned,
  hovered,
  onHover,
  isSelected = false,
}: {
  badge: BadgeData;
  earned: boolean;
  hovered: boolean;
  onHover: (slug: string | null) => void;
  isSelected?: boolean;
}) {
  const rarity = RARITY_CONFIG[badge.rarity];

  return (
    <div
      className="relative group"
      onMouseEnter={() => onHover(badge.slug)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={`
          relative aspect-square rounded-xl border-2 p-2 sm:p-3 flex flex-col items-center justify-center gap-1.5
          transition-all duration-200 cursor-default
          ${earned
            ? `${isSelected ? 'border-orange-400 ring-2 ring-orange-200' : rarity.border} ${rarity.bgEarned} hover:shadow-md hover:scale-[1.03]`
            : 'border-gray-100 bg-gray-50 opacity-40 grayscale'
          }
          ${badge.rarity === 'légendaire' && earned && !isSelected ? 'shadow-sm shadow-yellow-200' : ''}
        `}
      >
        {/* Selected star indicator */}
        {isSelected && (
          <div className="absolute top-1 left-1 z-10">
            <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          </div>
        )}

        {/* Rarity dot */}
        <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${earned ? rarity.dot : 'bg-gray-300'}`} />

        {/* Icon */}
        <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${!earned ? 'relative' : ''}`}>
          {badge.icon ? (
            <Image
              src={badge.icon}
              alt={badge.name}
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-2xl">🏅</span>
          )}
          {!earned && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Name */}
        <p className={`text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-2 ${
          earned ? 'text-gray-800' : 'text-gray-400'
        }`}>
          {badge.name}
        </p>
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white rounded-xl shadow-xl border border-gray-100 pointer-events-none">
          <p className="text-sm font-semibold text-gray-900">{badge.name}</p>
          <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${rarity.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${rarity.dot}`} />
              {rarity.label}
            </span>
            <span className="text-[10px] text-gray-400">
              {CATEGORY_CONFIG[badge.category]?.label}
            </span>
          </div>
          {earned ? (
            isSelected ? (
              <p className="text-[10px] text-orange-500 font-medium mt-1.5">Affiche sur le profil</p>
            ) : (
              <p className="text-[10px] text-green-600 font-medium mt-1.5">Obtenu</p>
            )
          ) : (
            <p className="text-[10px] text-gray-400 mt-1.5">Non obtenu</p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
