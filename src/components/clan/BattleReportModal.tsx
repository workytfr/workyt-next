"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { X, Swords, Trophy, ShieldAlert, Minus } from 'lucide-react';
import ClanBanner from './ClanBanner';

/**
 * Le Rapport de Bataille — la modale du matin.
 *
 * C'est le déclencheur d'animation du jeu : tu ouvres le site et il s'est
 * passé quelque chose pendant la nuit. Sans lui, la guerre tourne mais
 * personne ne la remarque.
 *
 * Charte Workyt : Funnel Display en titrage, dégradé pêche et grain de la
 * page d'accueil (voir globals.css), encre #1a1512, accent #ff6a1a.
 *
 * Contraintes assumées :
 *  - moins de 2 secondes d'animation totale
 *  - bouton de fermeture visible DÈS LA PREMIÈRE FRAME (une modale qu'on
 *    subit chaque matin devient une corvée)
 *  - vue une fois, elle ne revient pas (mémorisée en localStorage)
 */

interface Gate { name: string; hp: number; hpMax: number; fallen: boolean }
interface SideInfo { name: string; bannerSeed: string; daysWon: number; gates: Gate[] }

export interface BattleReport {
  day: number;
  outcome: 'win' | 'loss' | 'draw';
  damageDealt: number;
  damageTaken: number;
  rallyBonus: number;
  woundedCount: number;
  healedCount: number;
  events: { type: string; message: string }[];
  myMultiplier: number;
  iAmWounded: boolean;
  clan?: SideInfo | null;
  rival?: SideInfo | null;
}

const SEEN_KEY = 'wk-battle-report-seen';

/** Compteur animé — 800 ms, puis on s'arrête net sur la valeur exacte. */
function useCountUp(target: number, active: boolean, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target <= 0) { setValue(0); return; }

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setValue(target); return; }

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic : rapide puis freine, plus lisible qu'un linéaire
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}

export default function BattleReportModal() {
  const [report, setReport] = useState<BattleReport | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/clan/report')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const data: BattleReport | null = j?.data ?? null;
        if (cancelled || !data) return;

        // Une seule fois par journée de guerre
        const seen = localStorage.getItem(SEEN_KEY);
        if (seen === String(data.day)) return;

        setReport(data);
        setOpen(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Séquence : blason → scores → verdict → conséquences
  useEffect(() => {
    if (!open) return;
    const timers = [200, 1000, 1300, 1450].map((ms, i) =>
      setTimeout(() => setStep(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [open]);

  const dealt = useCountUp(report?.damageDealt ?? 0, step >= 2);
  const taken = useCountUp(report?.damageTaken ?? 0, step >= 2);

  const highlights = useMemo(
    () =>
      (report?.events ?? []).filter((e) =>
        ['gate_fallen', 'player_wounded', 'player_healed', 'gate_repaired', 'rally'].includes(e.type)
      ),
    [report]
  );

  if (!open || !report) return null;

  const close = () => {
    localStorage.setItem(SEEN_KEY, String(report.day));
    setOpen(false);
  };

  const won = report.outcome === 'win';
  const draw = report.outcome === 'draw';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1a1512]/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Rapport de bataille"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="wk-grain relative w-full max-w-lg overflow-hidden rounded-[28px] shadow-2xl"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 18%, #ffd4a8 0%, transparent 60%),' +
            'radial-gradient(ellipse 70% 50% at 82% 8%, #ffb7c5 0%, transparent 55%),' +
            'radial-gradient(ellipse 90% 70% at 50% 92%, #ffde7a 0%, transparent 60%),' +
            'linear-gradient(160deg,#fff3e0 0%,#ffe8d1 45%,#ffd8b8 100%)'
        }}
      >
        {/* Toujours visible, dès la première frame */}
        <button
          onClick={close}
          aria-label="Fermer le rapport"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1512]/10 text-[#1a1512] transition-colors hover:bg-[#1a1512]/20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative px-7 py-8 text-[#1a1512]">
          {/* Bandeau */}
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff6a1a]">
            <Swords className="h-3.5 w-3.5" />
            Rapport de bataille · Jour {report.day}/7
          </p>

          {/* Blasons */}
          <div
            className={`mt-5 flex items-center justify-center gap-5 transition-all duration-500 ${
              step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            {report.clan && (
              <div className="text-center">
                <ClanBanner seed={report.clan.bannerSeed} size={62} label={report.clan.name} />
                <p className="mt-1 max-w-[130px] truncate text-xs font-semibold">{report.clan.name}</p>
              </div>
            )}
            <span className="font-[family-name:var(--font-funnel-display)] text-2xl font-extrabold text-[#1a1512]/30">
              vs
            </span>
            {report.rival && (
              <div className="text-center">
                <ClanBanner seed={report.rival.bannerSeed} size={62} label={report.rival.name} />
                <p className="mt-1 max-w-[130px] truncate text-xs font-semibold">{report.rival.name}</p>
              </div>
            )}
          </div>

          {/* Scores */}
          <div className="mt-6 flex items-center justify-center gap-8">
            <Score label="Infligés" value={dealt} accent />
            <Score label="Subis" value={taken} />
          </div>

          {/* Verdict */}
          <div
            className={`mt-6 transition-all duration-300 ${
              step >= 3 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <div
              className={`mx-auto flex w-fit items-center gap-2.5 rounded-full px-5 py-2.5 font-[family-name:var(--font-funnel-display)] text-lg font-extrabold shadow-sm ${
                won
                  ? 'bg-[#1e7a46] text-white'
                  : draw
                    ? 'bg-[#ffb547] text-[#1a1512]'
                    : 'bg-[#1a1512] text-white'
              }`}
            >
              {won ? <Trophy className="h-5 w-5" /> : draw ? <Minus className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
              {won ? 'Journée remportée' : draw ? 'Journée nulle' : 'Journée perdue'}
            </div>
            {report.clan && report.rival && (
              <p className="mt-2 text-center text-sm font-semibold text-[#1a1512]/60">
                {report.clan.daysWon} — {report.rival.daysWon} sur la semaine
              </p>
            )}
          </div>

          {/* Conséquences */}
          <div
            className={`mt-6 space-y-1.5 transition-opacity duration-300 ${
              step >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Line show={report.myMultiplier > 1}>
              🎖️ Ta puissance passe à <strong>×{report.myMultiplier}</strong> aujourd&apos;hui
            </Line>
            <Line show={report.iAmWounded}>
              🩸 <strong>Tu es blessé</strong> — tu contribues à moitié jusqu&apos;à un soin
            </Line>
            {highlights.slice(0, 4).map((e, i) => (
              <Line key={i} show>{e.message}</Line>
            ))}
          </div>

          <button
            onClick={close}
            className="wk-btn-orange mt-7 w-full justify-center"
          >
            Au combat !
          </button>
        </div>
      </div>
    </div>
  );
}

function Score({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-center">
      <p
        className={`font-[family-name:var(--font-funnel-display)] text-4xl font-extrabold tabular-nums ${
          accent ? 'text-[#ff6a1a]' : 'text-[#1a1512]/45'
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a1512]/50">{label}</p>
    </div>
  );
}

function Line({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <p className="rounded-xl bg-white/55 px-3.5 py-2 text-[13px] leading-snug text-[#1a1512]/85">
      {children}
    </p>
  );
}
