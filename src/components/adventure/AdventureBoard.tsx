"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Flame, Map } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getBoardTheme } from './boardThemes';
import CardCollection from './CardCollection';
import RewardCeremony from './RewardCeremony';
import SeasonalScene from './SeasonalScene';
import RpgPath from './RpgPath';
import GameRules from './GameRules';
import HeroPanel, { type HeroState } from './rpg/HeroPanel';
import { fetchHero, invalidateHero } from '@/lib/heroClient';
import type { CalendarDay, ClaimResult, CollectionInfo } from './types';
import { formatDateLocal, monthNames } from './types';

/**
 * Plateau de l'Aventure : le calendrier mensuel transformé en jeu de plateau.
 * - Chemin serpentin (boustrophédon) de 28-31 cases
 * - Mascotte qui avance case par case
 * - Brouillard de guerre sur les jours futurs
 * - Traînée de flamme du streak sur les jours réclamés consécutifs
 * - Cartes hebdomadaires Ã  collectionner
 * - Reskin selon le thème saisonnier du mois
 */
export default function AdventureBoard() {
  const { data: session } = useSession();
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [collection, setCollection] = useState<CollectionInfo>({ cards: [], totalWeeks: 5, setCompleted: false });
  const [streak, setStreak] = useState<{ current: number; milestoneName: string | null }>({ current: 0, milestoneName: null });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [quizLocked, setQuizLocked] = useState(false);
  const [ceremony, setCeremony] = useState<ClaimResult | null>(null);
  const [hero, setHero] = useState<HeroState | null>(null);
  const [mushrooms, setMushrooms] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const currentMonth = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      firstDay: new Date(now.getFullYear(), now.getMonth(), 1),
      lastDay: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
  }, []);

  const todayStr = formatDateLocal(new Date());

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      const startStr = formatDateLocal(currentMonth.firstDay);
      const endStr = formatDateLocal(currentMonth.lastDay);
      const [calRes, streakRes] = await Promise.all([
        fetch(`/api/calendar/data?startDate=${startStr}&endDate=${endStr}`),
        fetch('/api/streak')
      ]);
      if (!calRes.ok) throw new Error('Erreur lors du chargement');
      const calData = await calRes.json();
      setDays(calData.days.map((day: any) => ({
        ...day,
        date: formatDateLocal(new Date(day.date))
      })));
      if (calData.collection) setCollection(calData.collection);

      // Héros RPG (Ã  part : ne doit pas bloquer le plateau)
      // fetchHero mutualise la requête avec BattleModal monté sur la même page
      fetchHero().then((heroData) => {
        if (!heroData) return;
        if (heroData.hero) setHero(heroData.hero);
        if (typeof heroData.mushrooms === 'number') setMushrooms(heroData.mushrooms);
      }).catch(() => {});

      if (streakRes.ok) {
        const streakData = await streakRes.json();
        const info = streakData?.data;
        const reached = info?.milestones?.filter((m: any) => m.reached) || [];
        setStreak({
          current: info?.currentStreak || 0,
          milestoneName: reached.length > 0 ? reached[reached.length - 1].name : null
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    if (session) loadBoard();
  }, [session, loadBoard]);

  // Photo de profil du joueur pour la mascotte (cosmétique actif)
  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;
    fetch(`/api/users/${userId}/customization`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const custom = data?.data?.customization;
        if (custom?.profileImage?.isActive && custom?.profileImage?.filename) {
          setAvatarUrl(`/profile/${custom.profileImage.filename}`);
        }
      })
      .catch(() => {});
  }, [session]);

  // Image de la mascotte : cosmétique actif → sinon avatar eigen du site (le même que partout ailleurs)
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  const mascotImage = avatarUrl || (sessionUserId ? `/api/avatar/${encodeURIComponent(sessionUserId)}?size=96` : null);

  // Thème dominant du mois (jours spéciaux), sinon default
  const theme = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of days) {
      if (d.isSpecial && d.theme && d.theme !== 'default') {
        counts[d.theme] = (counts[d.theme] || 0) + 1;
      }
    }
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'default';
    return getBoardTheme(dominant);
  }, [days]);

  // Traînée de flamme : jours réclamés consécutifs en remontant depuis
  // aujourd'hui (ou le dernier jour réclamé passé)
  const flameTrail = useMemo(() => {
    const claimed = new Set(days.filter(d => d.claimed).map(d => d.date));
    const trail: string[] = [];
    const cursor = new Date();
    // Si aujourd'hui n'est pas réclamé, on part d'hier
    if (!claimed.has(formatDateLocal(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (claimed.has(formatDateLocal(cursor))) {
      trail.unshift(formatDateLocal(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }
    return trail;
  }, [days]);

  const flameTrailSet = useMemo(() => new Set(flameTrail), [flameTrail]);
  const flameMilestones = useMemo(() => {
    const set = new Set<string>();
    flameTrail.forEach((date, i) => {
      if ((i + 1) % 7 === 0) set.add(date);
    });
    return set;
  }, [flameTrail]);

  const claimReward = async (date: string) => {
    if (!session || claiming) return;
    try {
      setClaiming(date);
      const response = await fetch('/api/calendar/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });

      if (!response.ok) {
        const error = await response.json();
        const msg: string = error.error || 'Erreur lors de la réclamation';
        if (msg.toLowerCase().includes('quiz')) {
          setQuizLocked(true);
          toast.error('ðŸ”’ Résous le quiz du jour pour débloquer cette case !');
        } else {
          toast.error(msg);
        }
        return;
      }

      const result: ClaimResult = await response.json();
      setQuizLocked(false);
      if (typeof result.currentStreak === 'number') {
        setStreak(s => ({ ...s, current: result.currentStreak! }));
      }
      // Cérémonie de récompense (remplace le simple toast)
      setCeremony(result);
      invalidateHero(); // le claim peut donner du loot de boss / des HP
      await loadBoard();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-white/40 p-3 sm:p-6 bg-gradient-to-br', theme.boardBg)}>
      {/* Décor vivant façon Pokémon : météo, végétation SVG, Foxy qui court */}
      <SeasonalScene theme={theme} />

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md', theme.claimButton)}>
            <Map className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
              Plateau de l&apos;Aventure
            </h2>
            <p className="text-xs text-gray-500">
              {monthNames[currentMonth.month]} {currentMonth.year} — {theme.emoji} {theme.name}
            </p>
          </div>
        </div>

        {/* Indicateur de streak */}
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm', streak.current > 0 ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-white/70 text-gray-500')}>
          <Flame className={cn('w-4 h-4', streak.current > 0 && 'adventure-flame')} />
          <span className="text-sm font-bold">{streak.current} jour{streak.current > 1 ? 's' : ''}</span>
          {streak.milestoneName && streak.current > 0 && (
            <span className="hidden sm:inline text-[10px] font-medium opacity-90">Â· {streak.milestoneName}</span>
          )}
        </div>
      </div>

      {/* Panneau du héros RPG */}
      {hero && (
        <div className="relative">
          <GameRules />
          <div className="mt-4">
            <HeroPanel
            hero={hero}
            mushrooms={mushrooms}
            onHealed={(hp, mushroomsLeft) => {
              setHero(h => h ? { ...h, hp, fainted: false } : h);
              setMushrooms(mushroomsLeft);
            }}
          />
          </div>
        </div>
      )}

      {/* Plateau desktop : chemin RPG horizontal */}
      <div className="relative hidden sm:block">
        <RpgPath
          days={days}
          todayStr={todayStr}
          theme={theme}
          heroLevel={hero?.level || 1}
          avatarUrl={mascotImage}
          flameTrailSet={flameTrailSet}
          flameMilestones={flameMilestones}
          claiming={claiming}
          quizLocked={quizLocked}
          canClaim={!!session}
          fainted={hero?.fainted || false}
          onClaim={claimReward}
        />
      </div>

      {/* Plateau mobile : chemin RPG vertical */}
      <div className="relative sm:hidden">
        <RpgPath
          days={days}
          todayStr={todayStr}
          theme={theme}
          heroLevel={hero?.level || 1}
          avatarUrl={mascotImage}
          flameTrailSet={flameTrailSet}
          flameMilestones={flameMilestones}
          claiming={claiming}
          quizLocked={quizLocked}
          canClaim={!!session}
          fainted={hero?.fainted || false}
          onClaim={claimReward}
          vertical
        />
      </div>

      {/* Légende */}
      <div className="relative mt-4 flex flex-wrap gap-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Aujourd&apos;hui</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Réclamé</span>
        <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> Traînée de flamme</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Brouillard</span>
      </div>

      {/* Collection du mois */}
      <div className="relative">
        <CardCollection collection={collection} theme={theme} />
      </div>

      {/* Cérémonie de récompense */}
      <RewardCeremony result={ceremony} theme={theme} onClose={() => setCeremony(null)} />
    </div>
  );
}
