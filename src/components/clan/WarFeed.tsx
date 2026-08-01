"use client";

import React from 'react';
import {
  Hammer,
  DoorOpen,
  ShieldOff,
  HeartCrack,
  HeartPulse,
  Megaphone,
  Wrench,
  Trophy,
  Flag,
  type LucideIcon
} from 'lucide-react';

/**
 * Le fil de guerre.
 *
 * Aucun texte n'est écrit à la main : chaque étape de la résolution produit
 * sa ligne (voir clanResolution.persistSide). Même patron visuel que la
 * cloche de notifications — pastille ronde colorée + icône lucide, jamais
 * d'emoji.
 */

export interface WarEvent {
  type: string;
  message: string;
  gate?: string;
  amount?: number;
}

const STYLE: Record<string, { icon: LucideIcon; className: string }> = {
  gate_damage: { icon: Hammer, className: 'bg-orange-100 text-orange-600' },
  gate_fallen: { icon: DoorOpen, className: 'bg-red-100 text-red-600' },
  gate_repaired: { icon: Wrench, className: 'bg-sky-100 text-sky-600' },
  player_wounded: { icon: HeartCrack, className: 'bg-rose-100 text-rose-600' },
  player_healed: { icon: HeartPulse, className: 'bg-emerald-100 text-emerald-600' },
  soldier_lost: { icon: ShieldOff, className: 'bg-gray-100 text-gray-500' },
  rally: { icon: Megaphone, className: 'bg-indigo-100 text-indigo-600' },
  day_won: { icon: Trophy, className: 'bg-emerald-100 text-emerald-700' },
  day_lost: { icon: Flag, className: 'bg-gray-100 text-gray-500' },
  day_draw: { icon: Flag, className: 'bg-amber-100 text-amber-700' }
};

const FALLBACK = { icon: Flag, className: 'bg-gray-100 text-gray-500' };

export default function WarFeed({ events, day }: { events: WarEvent[]; day?: number }) {
  if (!events?.length) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 bg-white/50 p-4 text-center text-sm text-gray-400">
        Aucun affrontement pour l&apos;instant. La première bataille se résout cette nuit.
      </p>
    );
  }

  return (
    <ol className="space-y-1.5">
      {events.map((e, i) => {
        const s = STYLE[e.type] ?? FALLBACK;
        const Icon = s.icon;
        return (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.className}`}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <p className="pt-1 text-sm leading-snug text-gray-700">{e.message}</p>
          </li>
        );
      })}
      {day && (
        <li className="pt-2 text-center text-[11px] uppercase tracking-wider text-gray-400">
          Journée {day}
        </li>
      )}
    </ol>
  );
}
