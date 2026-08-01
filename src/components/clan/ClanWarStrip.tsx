"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Swords, X } from 'lucide-react';

/**
 * Bandeau permanent de la Guerre des Clans.
 *
 * Rappel discret en haut des pages de jeu. **Repliable et mémorisé** : un
 * bandeau qu'on ne peut pas fermer devient une nuisance.
 */

const HIDDEN_KEY = 'wk-clanstrip-hidden';

interface Strip {
  day: number;
  mine: number;
  theirs: number;
  weakest: { name: string; hp: number } | null;
}

export default function ClanWarStrip() {
  const [strip, setStrip] = useState<Strip | null>(null);
  const [hidden, setHidden] = useState(true); // masqué jusqu'à confirmation

  useEffect(() => {
    if (localStorage.getItem(HIDDEN_KEY) === '1') return;

    fetch('/api/clan')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data;
        if (!d?.clan || !d?.rival) return;

        const standing = (d.rival.gates ?? []).filter((g: any) => !g.fallen);
        const weakest = standing.length
          ? standing.reduce((a: any, b: any) => (a.hp <= b.hp ? a : b))
          : null;

        setStrip({
          day: d.day ?? 1,
          mine: d.clan.daysWon ?? 0,
          theirs: d.rival.daysWon ?? 0,
          weakest: weakest ? { name: weakest.name, hp: weakest.hp } : null
        });
        setHidden(false);
      })
      .catch(() => {});
  }, []);

  if (hidden || !strip) return null;

  const lead =
    strip.mine > strip.theirs ? 'mène' : strip.mine < strip.theirs ? 'est mené' : 'est à égalité';

  return (
    <div className="flex items-center gap-2 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-1.5 text-sm">
      <Link href="/clan" className="flex min-w-0 flex-1 items-center gap-2 hover:underline">
        <Swords className="h-4 w-4 shrink-0 text-orange-600" />
        <span className="truncate text-gray-700">
          <strong>Jour {strip.day}/7</strong> · ton clan {lead}{' '}
          <strong className="tabular-nums">
            {strip.mine}-{strip.theirs}
          </strong>
          {strip.weakest && (
            <span className="hidden sm:inline">
              {' · '}Porte {strip.weakest.name} adverse :{' '}
              <strong className="tabular-nums">{strip.weakest.hp} PV</strong>
            </span>
          )}
        </span>
      </Link>
      <button
        onClick={() => {
          localStorage.setItem(HIDDEN_KEY, '1');
          setHidden(true);
        }}
        aria-label="Masquer le bandeau de guerre"
        className="shrink-0 rounded p-1 text-orange-400 transition-colors hover:bg-orange-100 hover:text-orange-700"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
