'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { calculateUserRank, getPrestigeInfo, PRESTIGE_ROMAN, type Rank, type PrestigeInfo } from '@/lib/rankSystem';

const STORAGE_KEY = 'workyt_last_rank';

function showRankUpToast(rank: Rank, prestige: PrestigeInfo | null) {
  if (prestige !== null) {
    const romanLabel = PRESTIGE_ROMAN[(prestige.rankInTier - 1) as 0 | 1 | 2 | 3 | 4];
    toast.custom(() => (
      <div
        style={{
          background: `linear-gradient(135deg, ${prestige.color}15, ${prestige.color}30)`,
          border: `1px solid ${prestige.color}50`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          minWidth: 280,
          boxShadow: `0 8px 24px ${prestige.color}25`,
        }}
      >
        <div style={{
          fontSize: 36,
          background: `${prestige.color}20`,
          borderRadius: 12,
          width: 52,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {prestige.tier?.badge}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
            Nouveau prestige !
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#111827', lineHeight: 1.2 }}>
            {prestige.displayLevel}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>
            {prestige.tier?.name} · Prestige {prestige.level} {romanLabel}
          </div>
        </div>
      </div>
    ), { duration: 5000 });
  } else {
    toast.custom(() => (
      <div
        style={{
          background: `linear-gradient(135deg, ${rank.color}15, ${rank.color}30)`,
          border: `1px solid ${rank.color}50`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          minWidth: 280,
          boxShadow: `0 8px 24px ${rank.color}25`,
        }}
      >
        <div style={{
          fontSize: 36,
          background: `${rank.color}20`,
          borderRadius: 12,
          width: 52,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {rank.badge}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280', marginBottom: 2 }}>
            Nouveau rang débloqué !
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#111827', lineHeight: 1.2 }}>
            {rank.name}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>
            {rank.world} · Niveau {rank.level}
          </div>
        </div>
      </div>
    ), { duration: 5000 });
  }
}

export function useRankUp(points: number) {
  useEffect(() => {
    // Ignore l'état initial (points = 0 avant que les données utilisateur chargent)
    if (typeof window === 'undefined' || points <= 0) return;

    const currentRank = calculateUserRank(points);
    const currentPrestige = getPrestigeInfo(points);
    const current = { rankLevel: currentRank.level, prestigeLevel: currentPrestige.level };

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Première visite — on mémorise sans déclencher de toast
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      return;
    }

    // Toujours comparer contre localStorage (jamais contre un état intermédiaire en mémoire)
    const prev = JSON.parse(stored) as { rankLevel: number; prestigeLevel: number };

    if (current.rankLevel > prev.rankLevel) {
      showRankUpToast(currentRank, null);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } else if (current.prestigeLevel > prev.prestigeLevel && current.prestigeLevel > 0) {
      showRankUpToast(currentRank, currentPrestige);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } else if (current.rankLevel !== prev.rankLevel || current.prestigeLevel !== prev.prestigeLevel) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  }, [points]);
}
