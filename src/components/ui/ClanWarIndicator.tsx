"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Swords, Hammer, DoorOpen, HeartCrack, ArrowRight } from 'lucide-react';

/**
 * Indicateur de Guerre des Clans dans la navbar.
 *
 * Ne s'affiche QUE si une guerre est en cours pour le joueur : hors semaine
 * de guerre, trêve, ou joueur non enrôlé, le composant ne rend rien.
 *
 * Il tape /api/clan/status et non /api/clan : ce composant est monté sur
 * toutes les pages du site, il ne peut pas se permettre les agrégations de
 * classement et la liste des membres.
 */

interface Status {
  day: number;
  clanName: string;
  tierName: string;
  daysWon: number;
  resources: number;
  rivalName: string | null;
  rivalDaysWon: number;
  weakestGate: { name: string; hp: number; hpMax: number } | null;
  breached: boolean;
  me: { role: string; multiplier: number; dailyPoints: number; wounded: boolean };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_LABEL: Record<string, string> = {
  attaquant: '⚔️ Attaquant',
  defenseur: '🛡️ Défenseur',
  soigneur: '💚 Soigneur'
};

export default function ClanWarIndicator({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Rafraîchi toutes les 5 min : la guerre se résout une fois par nuit,
  // rien ne justifie d'interroger le serveur plus souvent.
  const { data } = useSWR(userId ? '/api/clan/status' : null, fetcher, {
    refreshInterval: 300_000,
    revalidateOnFocus: false
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const status: Status | null = data?.data ?? null;
  if (!status) return null; // pas de guerre : aucun encombrement de la navbar

  const winning = status.daysWon > status.rivalDaysWon;
  const losing = status.daysWon < status.rivalDaysWon;

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: Math.max(12, Math.min(window.innerWidth - r.right, window.innerWidth - 300)) });
    }
    setOpen(!open);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={toggle}
        title={`Guerre des Clans · Jour ${status.day}/7 · ${status.clanName} ${status.daysWon}-${status.rivalDaysWon} ${status.rivalName ?? ''}`}
        aria-label="Guerre des Clans"
        aria-expanded={open}
        className="wk-nav-btn !gap-1 !px-2"
      >
        <Swords
          className={`h-5 w-5 ${winning ? 'text-emerald-600' : losing ? 'text-red-500' : 'text-orange-500'}`}
        />
        <span className="text-sm font-bold tabular-nums text-[var(--wk-ink)]">
          {status.daysWon}-{status.rivalDaysWon}
        </span>
        {status.me.wounded && (
          <span
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"
            title="Tu es blessé"
          />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="wk-pop fixed z-[200] w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white p-4 shadow-[0_18px_48px_rgba(26,21,18,0.14)]"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-orange-500">
              Jour {status.day}/7 · {status.tierName}
            </p>
            <p className="mt-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-bold text-gray-900">{status.clanName}</span>
              <span className="shrink-0 text-lg font-extrabold tabular-nums">
                {status.daysWon}
                <span className="mx-1 text-gray-300">—</span>
                {status.rivalDaysWon}
              </span>
            </p>
            {status.rivalName && (
              <p className="truncate text-xs text-gray-400">contre {status.rivalName}</p>
            )}
          </div>

          <dl className="space-y-1.5 border-t border-gray-100 pt-3 text-xs">
            <Row label="Mon rôle" value={ROLE_LABEL[status.me.role] ?? status.me.role} />
            <Row label="Ma puissance" value={`×${status.me.multiplier}`} />
            <Row label="Mes points du jour" value={String(status.me.dailyPoints)} />
            <Row
              label={<span className="inline-flex items-center gap-1"><Hammer className="h-3 w-3" />Trésor</span>}
              value={`${status.resources} ⚒️`}
            />
          </dl>

          {status.weakestGate && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-orange-50 p-2 text-[11px] leading-snug text-orange-800">
              <DoorOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Porte <strong className="capitalize">{status.weakestGate.name}</strong> adverse la
                plus faible : <strong className="tabular-nums">{status.weakestGate.hp} PV</strong>
              </span>
            </p>
          )}

          {status.breached && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-[11px] font-semibold text-red-700">
              💥 Une porte adverse est tombée — la brèche est ouverte.
            </p>
          )}

          {status.me.wounded && (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-50 p-2 text-[11px] font-semibold text-rose-700">
              <HeartCrack className="h-3.5 w-3.5" />
              Tu es blessé : tu contribues à moitié jusqu&apos;à un soin.
            </p>
          )}

          <Link
            href="/clan"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            Au champ de bataille <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-bold text-gray-900">{value}</dd>
    </div>
  );
}
