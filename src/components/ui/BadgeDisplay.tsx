'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Lock, Star, Check } from 'lucide-react';

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

/** Rareté : couleur du contour de la tuile et de la pastille du popover. */
const RARITY_CONFIG = {
  commun: { label: 'Commun', ring: 'rgba(26,21,18,0.12)', tint: '#ffffff', color: '#6b625c' },
  rare: { label: 'Rare', ring: '#9fd3ec', tint: '#f1f9fd', color: '#2f86b3' },
  'épique': { label: 'Épique', ring: '#c9b3f5', tint: '#f7f3ff', color: '#7b55d6' },
  'légendaire': { label: 'Légendaire', ring: '#ffc56b', tint: '#fff7e8', color: '#c27a00' },
} as const;

const CATEGORY_LABEL: Record<BadgeData['category'], string> = {
  progression: 'Progression',
  engagement: 'Engagement',
  performance: 'Performance',
  special: 'Spécial',
};

const CATEGORIES = ['progression', 'engagement', 'performance', 'special'] as const;
type CategoryFilter = 'all' | BadgeData['category'];

type OpenBadge = { slug: string; rect: DOMRect; pinned: boolean };

export default function BadgeDisplay({
  userId,
  className = '',
}: BadgeDisplayProps) {
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [earnedSlugs, setEarnedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showLocked, setShowLocked] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenBadge | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchBadges = async () => {
      try {
        const allRes = await fetch('/api/badges');
        const allData = await allRes.json();
        if (cancelled) return;
        setAllBadges(allData.badges || []);

        if (userId) {
          const userRes = await fetch(`/api/badges?userId=${userId}`);
          const userData = await userRes.json();
          if (cancelled) return;
          const slugs = (userData.userBadges || []).map((b: BadgeData) => b.slug);
          setEarnedSlugs(new Set(slugs));
          if (userData.selectedBadge) setSelectedBadge(userData.selectedBadge);
        }
      } catch (err) {
        console.error('BadgeDisplay: Erreur:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBadges();
    return () => { cancelled = true; };
  }, [userId]);

  // Le popover est positionné en `fixed` : on le ferme au défilement, et au
  // clic en dehors / Échap quand il a été ouvert par un clic (mobile).
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest('[data-badge-tile]')) close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const earnedBadges = useMemo(() => allBadges.filter(b => earnedSlugs.has(b.slug)), [allBadges, earnedSlugs]);

  const displayedBadges = useMemo(() => {
    const source = showLocked ? allBadges : earnedBadges;
    const filtered = categoryFilter === 'all' ? source : source.filter(b => b.category === categoryFilter);
    // Badges obtenus d'abord, le badge mis en avant en tête
    return [...filtered].sort((a, b) => {
      const score = (x: BadgeData) => (x.slug === selectedBadge ? 2 : earnedSlugs.has(x.slug) ? 1 : 0);
      return score(b) - score(a);
    });
  }, [showLocked, allBadges, earnedBadges, categoryFilter, selectedBadge, earnedSlugs]);

  const byRarity = useMemo(() => {
    const out: Record<string, { total: number; earned: number }> = {};
    for (const r of Object.keys(RARITY_CONFIG)) out[r] = { total: 0, earned: 0 };
    for (const b of allBadges) {
      if (!out[b.rarity]) continue;
      out[b.rarity].total++;
      if (earnedSlugs.has(b.slug)) out[b.rarity].earned++;
    }
    return out;
  }, [allBadges, earnedSlugs]);

  const openBadge = open ? allBadges.find(b => b.slug === open.slug) : undefined;
  const progress = allBadges.length ? Math.round((earnedSlugs.size / allBadges.length) * 100) : 0;

  if (loading) {
    return (
      <div className={`grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-2.5 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-[var(--wk-paper-2)]" />
        ))}
      </div>
    );
  }

  const tileProps = (badge: BadgeData) => ({
    badge,
    earned: earnedSlugs.has(badge.slug),
    isSelected: selectedBadge === badge.slug,
    isOpen: open?.slug === badge.slug,
    onPreview: (rect: DOMRect | null) =>
      // Survol / focus : aperçu, sauf si un badge a été épinglé par un clic
      setOpen(prev => (prev?.pinned ? prev : rect ? { slug: badge.slug, rect, pinned: false } : null)),
    onToggle: (rect: DOMRect) =>
      setOpen(prev => (prev?.slug === badge.slug && prev.pinned ? null : { slug: badge.slug, rect, pinned: true })),
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Résumé */}
      <div>
        <div className="flex items-end justify-between gap-3">
          <p className="font-serif-display text-3xl leading-none text-[var(--wk-ink)]">
            {earnedSlugs.size}
            <span className="text-lg text-[rgba(26,21,18,0.4)]"> / {allBadges.length}</span>
          </p>
          <div className="flex items-center gap-2.5">
            {Object.entries(byRarity).map(([rarity, s]) => {
              const cfg = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
              return (
                <span key={rarity} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[rgba(26,21,18,0.6)]" title={`${cfg.label} : ${s.earned}/${s.total}`}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {s.earned}
                </span>
              );
            })}
          </div>
        </div>
        <div className="wk-xp-bar mt-3 h-1.5">
          <div className="wk-xp-fill h-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Obtenus / Tous + catégories */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="inline-flex rounded-full bg-[var(--wk-paper-2)] p-0.5 text-xs font-semibold">
          {[
            { v: false, label: 'Obtenus' },
            { v: true, label: 'Tous' },
          ].map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => { setShowLocked(opt.v); setOpen(null); }}
              className={`rounded-full px-3 py-1 transition ${showLocked === opt.v ? 'bg-white text-[var(--wk-ink)] shadow-sm' : 'text-[rgba(26,21,18,0.55)] hover:text-[var(--wk-ink)]'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {showLocked && (
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value as CategoryFilter); setOpen(null); }}
            className="rounded-full border border-[rgba(26,21,18,0.12)] bg-white px-3 py-1 text-xs font-semibold text-[var(--wk-ink)] outline-none focus:border-[var(--wk-accent)]"
            aria-label="Catégorie"
          >
            <option value="all">Toutes les catégories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grille */}
      {displayedBadges.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-2.5">
          {displayedBadges.map(badge => (
            <BadgeTile key={badge.slug} {...tileProps(badge)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[rgba(26,21,18,0.18)] px-4 py-8 text-center">
          <p className="text-sm text-[rgba(26,21,18,0.55)]">
            {showLocked ? 'Aucun badge dans cette catégorie.' : 'Aucun badge obtenu pour le moment.'}
          </p>
          {!showLocked && (
            <button type="button" onClick={() => setShowLocked(true)} className="mt-2 text-xs font-semibold text-[var(--wk-accent)] hover:underline">
              Voir les badges à débloquer
            </button>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-[rgba(26,21,18,0.45)]">Survole ou touche un badge pour voir son détail.</p>

      {open && openBadge && typeof document !== 'undefined' &&
        createPortal(
          <BadgePopover
            badge={openBadge}
            rect={open.rect}
            earned={earnedSlugs.has(openBadge.slug)}
            isSelected={selectedBadge === openBadge.slug}
          />,
          document.body
        )}
    </div>
  );
}

function BadgeTile({
  badge,
  earned,
  isSelected,
  isOpen,
  onPreview,
  onToggle,
}: {
  badge: BadgeData;
  earned: boolean;
  isSelected: boolean;
  isOpen: boolean;
  onPreview: (rect: DOMRect | null) => void;
  onToggle: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const rarity = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.commun;
  const rect = () => ref.current!.getBoundingClientRect();

  return (
    <button
      ref={ref}
      type="button"
      data-badge-tile
      aria-label={`${badge.name}${earned ? '' : ' (non obtenu)'}`}
      aria-expanded={isOpen}
      onMouseEnter={() => onPreview(rect())}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(rect())}
      onBlur={() => onPreview(null)}
      onClick={() => onToggle(rect())}
      className={`group relative flex aspect-square items-center justify-center rounded-2xl border-2 p-2.5 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wk-accent)] focus-visible:ring-offset-2 ${
        earned ? 'hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(26,21,18,0.1)]' : 'border-dashed'
      } ${isOpen ? '-translate-y-0.5 shadow-[0_10px_24px_rgba(26,21,18,0.1)]' : ''}`}
      style={
        earned
          ? { borderColor: isSelected ? 'var(--wk-accent)' : rarity.ring, backgroundColor: rarity.tint }
          : { borderColor: 'rgba(26,21,18,0.12)', backgroundColor: 'var(--wk-paper)' }
      }
    >
      {badge.icon ? (
        <Image
          src={badge.icon}
          alt=""
          width={64}
          height={64}
          className={`h-full w-full object-contain transition ${earned ? 'group-hover:scale-105' : 'opacity-30 grayscale'}`}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <span className={`text-3xl ${earned ? '' : 'opacity-30 grayscale'}`}>🏅</span>
      )}

      {!earned && (
        <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
          <Lock className="h-3 w-3 text-[rgba(26,21,18,0.45)]" />
        </span>
      )}
      {isSelected && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--wk-accent)] shadow-sm" title="Mis en avant sur le profil">
          <Star className="h-3 w-3 fill-white text-white" />
        </span>
      )}
    </button>
  );
}

const POPOVER_WIDTH = 256;

function BadgePopover({ badge, rect, earned, isSelected }: { badge: BadgeData; rect: DOMRect; earned: boolean; isSelected: boolean }) {
  const rarity = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.commun;
  // Centré sur la tuile, gardé dans l'écran ; au-dessus s'il y a la place, sinon en dessous
  const margin = 12;
  const vw = window.innerWidth;
  const left = Math.min(Math.max(margin, rect.left + rect.width / 2 - POPOVER_WIDTH / 2), vw - POPOVER_WIDTH - margin);
  const above = rect.top > 200;
  const arrowLeft = Math.min(Math.max(16, rect.left + rect.width / 2 - left), POPOVER_WIDTH - 16);

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[400] rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white p-4 shadow-[0_18px_48px_rgba(26,21,18,0.16)]"
      style={{
        width: POPOVER_WIDTH,
        left,
        ...(above ? { bottom: window.innerHeight - rect.top + 10 } : { top: rect.bottom + 10 }),
      }}
    >
      <div className="flex items-start gap-3">
        {badge.icon && (
          <Image src={badge.icon} alt="" width={44} height={44} className={`h-11 w-11 shrink-0 object-contain ${earned ? '' : 'opacity-40 grayscale'}`} />
        )}
        <div className="min-w-0">
          <p className="font-serif-display text-lg leading-tight text-[var(--wk-ink)]">{badge.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1" style={{ color: rarity.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rarity.color }} />
              {rarity.label}
            </span>
            <span className="text-[rgba(26,21,18,0.35)]">·</span>
            <span className="text-[rgba(26,21,18,0.55)]">{CATEGORY_LABEL[badge.category] ?? badge.category}</span>
          </div>
        </div>
      </div>

      {badge.description && (
        <p className="mt-3 text-sm leading-relaxed text-[rgba(26,21,18,0.7)]">{badge.description}</p>
      )}

      <div className="mt-3 border-t border-[rgba(26,21,18,0.06)] pt-2.5 text-xs font-semibold">
        {earned ? (
          isSelected ? (
            <span className="inline-flex items-center gap-1 text-[var(--wk-accent)]"><Star className="h-3.5 w-3.5 fill-current" /> Mis en avant sur le profil</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="h-3.5 w-3.5" /> Obtenu</span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 text-[rgba(26,21,18,0.5)]"><Lock className="h-3.5 w-3.5" /> À débloquer</span>
        )}
      </div>

      <span
        className={`absolute h-3 w-3 rotate-45 border-[rgba(26,21,18,0.1)] bg-white ${above ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t'}`}
        style={{ left: arrowLeft - 6 }}
      />
    </div>
  );
}
