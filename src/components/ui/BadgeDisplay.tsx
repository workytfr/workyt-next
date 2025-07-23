'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Progress } from '@/components/ui/Progress';

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
  badges?: string[]; // slugs des badges
  showAll?: boolean; // si true, affiche tous les badges disponibles
  maxDisplay?: number; // nombre max de badges à afficher
  className?: string;
  showProgress?: boolean; // afficher la progression
}

const rarityColors = {
  commun: 'bg-gray-100 text-gray-800 border-gray-300',
  rare: 'bg-blue-100 text-blue-800 border-blue-300',
  épique: 'bg-purple-100 text-purple-800 border-purple-300',
  légendaire: 'bg-yellow-100 text-yellow-800 border-yellow-300'
};

const rarityGradients = {
  commun: 'from-gray-100 to-gray-200',
  rare: 'from-blue-100 to-blue-200',
  épique: 'from-purple-100 to-purple-200',
  légendaire: 'from-yellow-100 to-yellow-200'
};

const categoryLabels = {
  progression: 'Progression',
  engagement: 'Engagement',
  performance: 'Performance',
  special: 'Spécial'
};

export default function BadgeDisplay({ 
  userId, 
  badges = [], 
  showAll = false, 
  maxDisplay = 5,
  className = '',
  showProgress = true
}: BadgeDisplayProps) {
  const [badgeData, setBadgeData] = useState<BadgeData[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        
        // Récupérer tous les badges disponibles
        const allBadgesResponse = await fetch('/api/badges');
        const allBadgesData = await allBadgesResponse.json();
        setAllBadges(allBadgesData.badges || []);

        if (showAll) {
          setBadgeData(allBadgesData.badges || []);
        } else if (userId) {
          // Récupérer les badges de l'utilisateur
          const userBadgesResponse = await fetch(`/api/badges?userId=${userId}`);
          const userBadgesData = await userBadgesResponse.json();
          setBadgeData(userBadgesData.userBadges || []);
        }
      } catch (err) {
        console.error('BadgeDisplay: Erreur lors du chargement:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId, showAll]);

  // Récupérer les stats utilisateur pour la progression
  useEffect(() => {
    if (userId && showProgress) {
      const fetchUserStats = async () => {
        try {
          const response = await fetch(`/api/user/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setUserStats({
              ...data.data.user,
              answerCount: data.data.pagination.totalAnswers,
              ficheCount: data.data.pagination.totalRevisions,
              questionCount: data.data.pagination.totalQuestions
            });
          }
        } catch (err) {
          console.error('Erreur lors du chargement des stats:', err);
        }
      };
      fetchUserStats();
    }
  }, [userId, showProgress]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex gap-6">
          {[...Array(maxDisplay)].map((_, i) => (
            <div key={i} className="w-24 h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Erreur: {error}
      </div>
    );
  }

  if (badgeData.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        {showAll ? 'Aucun badge disponible' : 'Aucun badge obtenu'}
      </div>
    );
  }

  const displayBadges = badgeData.slice(0, maxDisplay);
  const remainingCount = badgeData.length - maxDisplay;

  // Calculer la progression pour les prochains badges
  const getNextBadgeProgress = (badgeType: string) => {
    if (!userStats || !allBadges) return null;

    const nextBadge = allBadges.find(badge => 
      badge.condition.type === badgeType && 
      !badgeData.some(userBadge => userBadge.slug === badge.slug)
    );

    if (!nextBadge) return null;

    let currentValue = 0;
    switch (badgeType) {
      case 'forum_answer':
        currentValue = userStats.answerCount || 0;
        break;
      case 'fiche_created':
        currentValue = userStats.ficheCount || 0;
        break;
      case 'seniority':
        const now = new Date();
        const yearsDiff = (now.getTime() - new Date(userStats.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
        currentValue = yearsDiff;
        break;
      default:
        return null;
    }

    const progress = Math.min((currentValue / nextBadge.condition.value) * 100, 100);
    return {
      nextBadge,
      currentValue: Math.floor(currentValue),
      targetValue: nextBadge.condition.value,
      progress
    };
  };

  return (
    <div className={`space-y-4 overflow-hidden ${className}`}>
      {/* Badges obtenus */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-hidden">
        {displayBadges.map((badge) => (
          <Tooltip key={badge._id}>
            <TooltipTrigger asChild>
              <div className={`
                relative group cursor-pointer p-6 rounded-xl border-2
                bg-gradient-to-br ${rarityGradients[badge.rarity]}
                hover:scale-105 transition-transform duration-200
                ${rarityColors[badge.rarity]}
                min-h-[120px]
              `}>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-16 h-16 flex items-center justify-center">
                    {badge.icon ? (
                      <Image
                        src={badge.icon.replace('.svg', '_large.svg')}
                        alt={badge.name}
                        width={64}
                        height={64}
                        className="w-16 h-16"
                        onError={(e) => {
                          // Si l'icône large n'existe pas, essayer l'icône normale
                          const normalIcon = badge.icon;
                          if (e.currentTarget.src.includes('_large.svg')) {
                            e.currentTarget.src = normalIcon;
                          } else {
                            console.error('Erreur de chargement de l\'icône:', badge.icon);
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-bold">?</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold leading-tight">{badge.name}</div>
                </div>
                {badge.rarity !== 'commun' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs">★</span>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div>
                <div className="font-semibold text-sm">{badge.name}</div>
                <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${rarityColors[badge.rarity]}`}>
                    {badge.rarity}
                  </span>
                  <span className="text-xs text-gray-500">
                    {categoryLabels[badge.category]}
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-medium text-gray-600">
            +{remainingCount} autres
          </div>
        )}
      </div>

      {/* Progression vers les prochains badges */}
      {showProgress && userId && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Progression vers les prochains badges</h4>
          {['forum_answer', 'fiche_created', 'seniority'].map((badgeType) => {
            const progress = getNextBadgeProgress(badgeType);
            if (!progress) return null;

            return (
              <div key={badgeType} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{progress.nextBadge.name}</span>
                  <span className="text-xs text-gray-500">
                    {progress.currentValue}/{progress.targetValue}
                  </span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">{progress.nextBadge.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 