"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Swords, Shield, HeartPulse, Hammer, Play, Pause, RotateCcw,
  Warehouse, Trophy, Crosshair, Check, Undo2, Castle, Shuffle, Palette
} from 'lucide-react';
import { SOLDIER_CATALOG } from '@/lib/clanSoldierCatalog';
import ClanCastle from './ClanCastle';
import ClanBanner, { blasonDescription } from './ClanBanner';
import { TOUS_LES_NOMS } from '@/lib/clanNames';

/**
 * Tutoriel interactif de la Guerre des Clans.
 *
 * Principe : on n'explique pas, on fait ESSAYER. Chaque mécanique a son bac à
 * sable — choisir son rôle change toute la vue, recruter dépense un vrai
 * trésor, déployer déplace vraiment les unités, et le classement se recalcule.
 *
 * Tout est local : aucune requête, aucune écriture. C'est une maquette jouable.
 * `prefers-reduced-motion` est respecté partout.
 */

const GATES = ['nord', 'est', 'sud'] as const;
type Gate = (typeof GATES)[number];
type Role = 'attaquant' | 'defenseur' | 'soigneur';

const ROLE_META: Record<Role, {
  label: string; emoji: string; icon: typeof Swords;
  ring: string; chip: string; bar: string;
  pitch: string;
}> = {
  attaquant: {
    label: 'Attaquant', emoji: '⚔️', icon: Swords,
    ring: 'border-red-400 bg-red-50', chip: 'bg-red-100 text-red-700', bar: 'bg-red-500',
    pitch: 'Tes points démolissent les remparts adverses.'
  },
  defenseur: {
    label: 'Défenseur', emoji: '🛡️', icon: Shield,
    ring: 'border-sky-400 bg-sky-50', chip: 'bg-sky-100 text-sky-700', bar: 'bg-sky-500',
    pitch: 'Tes points protègent ta porte — mais tu peux être blessé.'
  },
  soigneur: {
    label: 'Soigneur', emoji: '💚', icon: HeartPulse,
    ring: 'border-emerald-400 bg-emerald-50', chip: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500',
    pitch: "Tes points remettent d'aplomb tes coéquipiers blessés."
  }
};

function useReducedMotion() {
  return useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );
}

const img = (key: string) => SOLDIER_CATALOG.find((u) => u.key === key)?.image ?? '';
const unitOf = (key: string) => SOLDIER_CATALOG.find((u) => u.key === key)!;

/* ══════════════════════════ 1 · le champ de bataille ══════════════════════ */

interface Frame {
  step: string; title: string; narration: string;
  gates: [number, number, number];
  march: string[]; advance: number;
  wounded: number; score: [number, number];
  focus: Role | 'breche' | 'donjon' | 'bilan';
  keep: number;
}

const FRAMES: Frame[] = [
  { step: 'Jour 1', title: 'Tes points marchent au combat',
    narration: "Tu réponds sur le forum, tu fais ton quiz. Chaque point gagné devient un assaut sur la porte visée. Rien de plus à faire.",
    gates: [100, 88, 100], march: ['milicien', 'archer'], advance: 0.3, wounded: 0, score: [1, 0], focus: 'attaquant', keep: 100 },
  { step: 'Jour 2', title: 'Être premier rend plus fort',
    narration: "Tu étais 1er attaquant hier : ta puissance passe à ×2. L'assiduité devient de la force de frappe.",
    gates: [100, 58, 96], march: ['milicien', 'archer', 'chevalier'], advance: 0.6, wounded: 0, score: [2, 0], focus: 'attaquant', keep: 100 },
  { step: 'Jour 3', title: 'Les défenseurs encaissent',
    narration: "L'adversaire déborde ta Porte Nord. Deux défenseurs sont blessés : ils contribueront à moitié. Jamais tous — il en reste toujours un debout.",
    gates: [96, 42, 92], march: ['piquier', 'piquier'], advance: 0.2, wounded: 2, score: [2, 1], focus: 'defenseur', keep: 100 },
  { step: 'Jour 4', title: 'Le soigneur les relève',
    narration: "Tes soigneurs remettent les blessés d'aplomb. Sans eux, ils auraient traîné à 50 % pendant 48 heures.",
    gates: [92, 24, 88], march: ['infirmier', 'medecin'], advance: 0.5, wounded: 0, score: [3, 1], focus: 'soigneur', keep: 100 },
  { step: 'Jour 5', title: 'La brèche !',
    narration: "Le Bélier enfonce la Porte Est. Elle ne se répare plus : tout ce qui passe par là frappe le donjon.",
    gates: [88, 0, 80], march: ['belier', 'sapeur'], advance: 0.95, wounded: 0, score: [4, 1], focus: 'breche', keep: 100 },
  { step: 'Jour 6', title: 'Le donjon tombe',
    narration: "Les assauts abattent le donjon : +3 journées d'un coup et 400 ⚒️. La guerre continue quand même jusqu'à dimanche.",
    gates: [84, 0, 46], march: ['chevalier', 'baliste', 'sapeur'], advance: 1, wounded: 0, score: [7, 1], focus: 'donjon', keep: 0 },
  { step: 'Dimanche', title: 'On compte les journées',
    narration: "7 journées à 1 : ton clan monte d'un rang et reçoit des coffres. En face tout le monde descend — sauf leur meilleur combattant.",
    gates: [80, 0, 38], march: [], advance: 0, wounded: 0, score: [7, 1], focus: 'bilan', keep: 0 }
];

const FOCUS_CHIP: Record<Frame['focus'], { label: string; className: string }> = {
  attaquant: { label: '⚔️ Assaut', className: 'bg-red-100 text-red-700' },
  defenseur: { label: '🛡️ Défense', className: 'bg-sky-100 text-sky-700' },
  soigneur: { label: '💚 Soins', className: 'bg-emerald-100 text-emerald-700' },
  breche: { label: '💥 Brèche', className: 'bg-orange-100 text-orange-700' },
  donjon: { label: '🏰 Donjon', className: 'bg-purple-100 text-purple-700' },
  bilan: { label: '🏆 Bilan', className: 'bg-amber-100 text-amber-800' }
};

const toGates = (pct: [number, number, number]) =>
  GATES.map((name, k) => ({ name, hp: Math.round(pct[k] * 3), hpMax: 300, fallen: pct[k] === 0 }));

function Battlefield() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setI((v) => (v + 1) % FRAMES.length), 4600);
    return () => clearTimeout(t);
  }, [i, playing]);

  const f = FRAMES[i];
  const chip = FOCUS_CHIP[f.focus];

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-orange-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-orange-100 bg-orange-50/70 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-orange-600">
          {f.step}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${chip.className}`}>
          {chip.label}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {FRAMES.map((_, k) => (
            <button key={k} onClick={() => { setI(k); setPlaying(false); }}
              aria-label={`Étape ${k + 1}`}
              className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-orange-500' : 'w-1.5 bg-orange-200 hover:bg-orange-300'}`} />
          ))}
          <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Lecture'}
            className="ml-1 rounded-full p-1 text-orange-500 hover:bg-orange-100">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </span>
      </div>

      <div className="relative bg-gradient-to-b from-sky-50 to-amber-50/60 px-3 pb-3 pt-4">
        <div className="grid grid-cols-[minmax(60px,0.45fr)_1fr_minmax(160px,1.5fr)] items-end gap-2 sm:gap-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-end justify-center rounded-t-xl border-2 border-b-0 border-[#3A2E2E] bg-[#E4D9C6] pb-1 text-2xl">🏳️</div>
            <p className="mt-1 text-[10px] font-bold text-gray-600">Ton camp</p>
            <p className="text-lg font-extrabold tabular-nums text-emerald-600">{f.score[0]}</p>
          </div>

          <div className="relative h-24">
            <div className="absolute inset-x-0 bottom-6 h-px bg-[#3A2E2E]/15" />
            <AnimatePresence mode="popLayout">
              {f.march.map((key, k) => (
                <motion.div key={`${i}-${key}-${k}`} className="absolute bottom-2"
                  initial={{ left: '0%', opacity: 0 }}
                  animate={{ left: `${f.advance * 64 + k * 9}%`, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 1.1, ease: 'easeOut', delay: k * 0.12 }}>
                  <Image src={img(key)} alt={unitOf(key).name} title={unitOf(key).name}
                    width={40} height={40} className="object-contain drop-shadow-sm" />
                </motion.div>
              ))}
            </AnimatePresence>
            {f.wounded > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute bottom-12 left-1/4 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 shadow-sm">
                🩸 {f.wounded} blessés
              </motion.span>
            )}
          </div>

          <div>
            <ClanCastle gates={toGates(f.gates)} keepHp={f.keep} keepHpMax={100} side="enemy" />
            <p className="mt-1 text-center text-[10px] font-bold text-gray-600">
              Forteresse adverse
              <span className="ml-2 text-lg font-extrabold tabular-nums text-gray-400">{f.score[1]}</span>
            </p>
          </div>
        </div>

        {f.keep === 0 && (
          <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-3 rounded-lg bg-purple-600 px-2 py-1 text-[10px] font-bold text-white shadow">
            🏰 Donjon abattu · +3 journées
          </motion.p>
        )}
      </div>

      <div className="border-t border-orange-100 bg-orange-50/40 px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div key={f.step}
            initial={{ opacity: 0, x: reduced ? 0 : 12 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : -12 }} transition={{ duration: 0.25 }}>
            <p className="text-sm font-bold text-gray-900">{f.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">{f.narration}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═════════════════════ 2 · l'identité du clan ════════════════════════════ */

/** Quelques noms au hasard, sans doublon — comme à la formation du lundi. */
function drawNames(n: number): string[] {
  const pool = [...TOUS_LES_NOMS];
  const out: string[] = [];
  while (out.length < n && pool.length) {
    out.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  }
  return out;
}

function IdentitySandbox() {
  const [names, setNames] = useState<string[]>(() => drawNames(6));
  const [sel, setSel] = useState(0);
  const season = '2026-W31';
  const seed = `${season}-${names[sel] ?? names[0]}`;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-violet-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-violet-100 bg-violet-50/70 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">
          <Palette className="h-3.5 w-3.5" /> Chaque clan a son nom et son blason
        </span>
        <button
          onClick={() => { setNames(drawNames(6)); setSel(0); }}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-violet-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-600"
        >
          <Shuffle className="h-3.5 w-3.5" /> Tirer d&apos;autres clans
        </button>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[1.3fr_1fr]">
        {/* La galerie */}
        <div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
            {names.map((name, i) => (
              <button
                key={name}
                onClick={() => setSel(i)}
                title={name}
                className={`rounded-xl border-2 p-1.5 transition-all ${
                  sel === i ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <ClanBanner seed={`${season}-${name}`} size={56} label={`Blason de ${name}`} />
                <span className="mt-1 block truncate text-[9px] font-semibold leading-tight text-gray-600">
                  {name}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
            <strong>160 noms</strong> — royaumes, duchés, comtés, marches, baronnies, principautés,
            guildes, ordres et compagnies. Tirés sans doublon parmi les clans de la semaine.
          </p>
        </div>

        {/* Le blason en grand + sa description héraldique */}
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="flex items-start gap-3">
            <ClanBanner seed={seed} size={84} label={`Blason de ${names[sel]}`} />
            <div className="min-w-0">
              <p className="truncate font-extrabold text-gray-900">{names[sel]}</p>
              <p className="mt-1 text-[12px] italic leading-relaxed text-gray-600">
                « {blasonDescription(seed)} »
              </p>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
            <li className="flex gap-1.5 text-[12px] leading-relaxed text-gray-600">
              <span className="text-violet-400">•</span>
              Le blason est <strong>calculé depuis le nom du clan</strong> : même clan, même blason,
              toujours. Rien n&apos;est stocké, aucune image n&apos;est hébergée.
            </li>
            <li className="flex gap-1.5 text-[12px] leading-relaxed text-gray-600">
              <span className="text-violet-400">•</span>
              La <strong>règle des émaux</strong> est respectée : jamais métal sur métal ni couleur
              sur couleur. C&apos;est elle qui distingue un vrai blason d&apos;un barbouillage.
            </li>
            <li className="flex gap-1.5 text-[12px] leading-relaxed text-gray-600">
              <span className="text-violet-400">•</span>
              6 formes d&apos;écu × 8 partitions × 7 pièces × 20 meubles :{' '}
              <strong>des dizaines de milliers</strong> de blasons distincts.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ 3 · la vue selon ton rôle ═══════════════════════ */

const MATES = [
  { name: 'Léa', pts: 62 }, { name: 'Yanis', pts: 48 },
  { name: 'Marc', pts: 31 }, { name: 'Sofia', pts: 20 }
];

function RoleSandbox() {
  const [role, setRole] = useState<Role>('attaquant');

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white">
      {/* Sélecteur */}
      <div className="grid gap-2 border-b border-gray-100 bg-gray-50/70 p-3 sm:grid-cols-3">
        {(Object.keys(ROLE_META) as Role[]).map((r) => {
          const m = ROLE_META[r];
          const Icon = m.icon;
          const active = role === r;
          return (
            <button key={r} onClick={() => setRole(r)}
              className={`rounded-xl border-2 p-2.5 text-left transition-all ${
                active ? `${m.ring} shadow-sm` : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
              <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Icon className="h-4 w-4" />
                {m.emoji} {m.label}
                {active && <Check className="ml-auto h-4 w-4" />}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{m.pitch}</span>
            </button>
          );
        })}
      </div>

      {/* La vue change complètement selon le rôle */}
      <AnimatePresence mode="wait">
        <motion.div key={role}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }} className="p-4">
          {role === 'attaquant' && <AttackView />}
          {role === 'defenseur' && <DefenseView />}
          {role === 'soigneur' && <HealView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* --- vue ATTAQUANT : choisir la porte à enfoncer --- */
function AttackView() {
  const [hp, setHp] = useState<Record<Gate, number>>({ nord: 280, est: 120, sud: 300 });
  const [target, setTarget] = useState<Gate>('est');
  const [log, setLog] = useState<string[]>([]);
  const [mult, setMult] = useState(1);

  const myPoints = 45;
  const damage = Math.round(myPoints * mult);

  const strike = () => {
    setHp((h) => {
      const next = Math.max(0, h[target] - damage);
      setLog((l) => [
        next === 0 && h[target] > 0
          ? `💥 La Porte ${target} tombe ! Brèche ouverte, +150 ⚒️`
          : `⚔️ ${damage} dégâts sur la Porte ${target}`,
        ...l
      ].slice(0, 4));
      return { ...h, [target]: next };
    });
  };

  const reset = () => { setHp({ nord: 280, est: 120, sud: 300 }); setLog([]); setMult(1); };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-600">
          <Crosshair className="h-3.5 w-3.5" /> Vue attaquant — choisis ta cible
        </p>
        <div className="grid grid-cols-3 gap-2">
          {GATES.map((g) => {
            const pct = (hp[g] / 300) * 100;
            const down = hp[g] === 0;
            const sel = target === g;
            return (
              <button key={g} onClick={() => !down && setTarget(g)} disabled={down}
                className={`rounded-xl border-2 p-2 transition-all ${
                  down ? 'border-red-200 bg-red-50/50 opacity-60'
                  : sel ? 'border-red-500 bg-red-50 shadow-sm'
                  : 'border-gray-200 hover:border-red-300'
                }`}>
                <p className="text-[11px] font-bold capitalize text-gray-700">
                  {down ? '💥' : sel ? '🎯' : ''} {g}
                </p>
                <div className="my-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${pct > 50 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                </div>
                <p className="text-[10px] tabular-nums text-gray-500">
                  {down ? 'tombée' : `${hp[g]}/300`}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={strike} disabled={hp[target] === 0}
            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-40">
            ⚔️ Frapper ({damage} dégâts)
          </button>
          <button onClick={() => setMult((m) => (m === 1 ? 2 : 1))}
            className={`rounded-lg border-2 px-3 py-2 text-xs font-bold transition-colors ${
              mult > 1 ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'
            }`}>
            {mult > 1 ? '×2 actif — 1er de mon rôle' : 'Simuler : être 1er hier (×2)'}
          </button>
          <button onClick={reset} title="Réinitialiser"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Notes
        title="Ce qu'il faut retenir"
        items={[
          'Tu choisis la porte : concentrer tout le clan la fait tomber vite — sauf si l\'ennemi y a mis ses défenseurs.',
          'Être 1er de ton rôle la veille double ta frappe. L\'assiduité, pas le talent.',
          'Une porte tombée ne se répare jamais : ensuite, tout passe au donjon.'
        ]}
        log={log}
      />
    </div>
  );
}

/* --- vue DÉFENSEUR : tenir une porte, risquer la blessure --- */
function DefenseView() {
  const [hold, setHold] = useState<Gate>('nord');
  const [assault] = useState<Record<Gate, number>>({ nord: 180, est: 60, sud: 20 });
  const [result, setResult] = useState<null | { overflow: number; wounded: number }>(null);

  const myDefense = 95;
  const resolve = () => {
    const overflow = Math.max(0, assault[hold] - myDefense);
    setResult({ overflow, wounded: overflow > 0 ? Math.ceil(overflow / 50) : 0 });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-600">
          <Shield className="h-3.5 w-3.5" /> Vue défenseur — quelle porte tiens-tu ?
        </p>
        <p className="mb-2 text-[11px] text-gray-500">
          Tu vois l&apos;assaut <strong>d&apos;hier</strong>. Celui d&apos;aujourd&apos;hui est
          inconnu — c&apos;est là qu&apos;est le pari.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {GATES.map((g) => {
            const sel = hold === g;
            return (
              <button key={g} onClick={() => { setHold(g); setResult(null); }}
                className={`rounded-xl border-2 p-2 text-left transition-all ${
                  sel ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-gray-200 hover:border-sky-300'
                }`}>
                <p className="text-[11px] font-bold capitalize text-gray-700">
                  {sel ? '🛡️' : ''} {g}
                </p>
                <p className="mt-1 text-[10px] text-gray-500">Assaut hier</p>
                <p className="text-sm font-extrabold tabular-nums text-gray-800">{assault[g]}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700">
            Ta défense : {myDefense}
          </span>
          <button onClick={resolve}
            className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-sky-600">
            Résoudre la nuit
          </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-3 rounded-xl border-2 p-3 text-sm ${
                result.overflow > 0 ? 'border-rose-300 bg-rose-50' : 'border-emerald-300 bg-emerald-50'
              }`}>
              {result.overflow > 0 ? (
                <>
                  <p className="font-bold text-rose-800">
                    🩸 Débordé de {result.overflow} — {result.wounded} défenseur(s) blessé(s)
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-rose-700">
                    Un blessé contribue à <strong>moitié</strong> jusqu&apos;à ce qu&apos;un soigneur
                    le relève, ou 48 h. Un par tranche de 50 de débordement, et jamais le dernier
                    debout.
                  </p>
                </>
              ) : (
                <p className="font-bold text-emerald-800">
                  ✅ Assaut absorbé — aucun blessé. Ta porte tient.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Notes
        title="Ce qu'il faut retenir"
        items={[
          'Défendre est un RISQUE, pas une position passive : un débordement blesse.',
          'Tu ne vois que l\'assaut d\'hier. Choisir à l\'aveugle, c\'est tout le jeu.',
          'Un clan sans soigneur voit ses défenseurs s\'affaiblir de jour en jour.'
        ]}
      />
    </div>
  );
}

/* --- vue SOIGNEUR : relever les coéquipiers --- */
function HealView() {
  const [pool, setPool] = useState(120);
  const [wounded, setWounded] = useState(['Léa', 'Yanis', 'Marc']);
  const [repaired, setRepaired] = useState(0);
  const HEAL = 40;

  const heal = (name: string) => {
    if (pool < HEAL) return;
    setPool((p) => p - HEAL);
    setWounded((w) => w.filter((x) => x !== name));
  };
  const reset = () => { setPool(120); setWounded(['Léa', 'Yanis', 'Marc']); setRepaired(0); };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600">
          <HeartPulse className="h-3.5 w-3.5" /> Vue soigneur — qui relèves-tu ?
        </p>

        <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5">
          <Image src={img('medecin')} alt="Médecin" width={40} height={40} className="object-contain" />
          <div className="flex-1">
            <p className="text-[11px] font-bold text-emerald-800">Réserve de soin</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
              <motion.div animate={{ width: `${(pool / 120) * 100}%` }}
                className="h-full rounded-full bg-emerald-500" />
            </div>
          </div>
          <span className="text-sm font-extrabold tabular-nums text-emerald-700">{pool} pts</span>
        </div>

        <div className="space-y-2">
          {wounded.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-emerald-200 p-4 text-center text-sm text-emerald-700">
              Tout le monde est debout ! Le surplus part en réparation de porte.
            </p>
          ) : wounded.map((name) => (
            <motion.div key={name} layout exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2">
              <span className="text-lg">🩸</span>
              <span className="flex-1 text-sm font-semibold text-gray-800">
                {name} <span className="text-[11px] font-normal text-rose-600">contribue à 50 %</span>
              </span>
              <button onClick={() => heal(name)} disabled={pool < HEAL}
                className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-40">
                Soigner ({HEAL})
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => { if (pool >= 40) { setPool((p) => p - 40); setRepaired((r) => r + 40); } }}
            disabled={pool < 40}
            className="rounded-lg border-2 border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-700 disabled:opacity-40">
            🔨 Convertir 40 en réparation de porte
          </button>
          {repaired > 0 && (
            <span className="text-xs font-bold text-emerald-700">+{repaired} PV réparés</span>
          )}
          <button onClick={reset} className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Notes
        title="Ce qu'il faut retenir"
        items={[
          '40 points = 1 coéquipier remis d\'aplomb. Les plus anciens blessés d\'abord.',
          'Le surplus part en réparation de porte : tu ne joues JAMAIS pour rien.',
          'Sans soigneur, un blessé guérit seul en 48 h — handicapé, jamais condamné.'
        ]}
      />
    </div>
  );
}

/* ═══════════════════════ 4 · recruter la garnison ════════════════════════ */

function RecruitSandbox() {
  const [treasure, setTreasure] = useState(800);
  const [owned, setOwned] = useState<string[]>([]);
  const MAX = 6;

  const buy = (key: string) => {
    const u = unitOf(key);
    if (treasure < u.cost || owned.length >= MAX) return;
    // Plafond par catégorie : pas plus de la moitié des achats sur un même type
    const spent = owned.reduce((s, k) => s + unitOf(k).cost, 0) + u.cost;
    const onType = owned.filter((k) => k === key).reduce((s, k) => s + unitOf(k).cost, 0) + u.cost;
    if (owned.length > 0 && onType / spent > 0.5) return;
    setTreasure((t) => t - u.cost);
    setOwned((o) => [...o, key]);
  };

  const undo = (idx: number) => {
    const u = unitOf(owned[idx]);
    setTreasure((t) => t + u.cost);
    setOwned((o) => o.filter((_, i) => i !== idx));
  };

  const atk = owned.reduce((s, k) => s + unitOf(k).atk, 0);
  const def = owned.reduce((s, k) => s + unitOf(k).def, 0);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-amber-100 bg-amber-50/70 px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm font-extrabold text-amber-800">
          <Hammer className="h-4 w-4" /> {treasure} ⚒️
        </span>
        <span className="text-xs font-semibold tabular-nums text-gray-500">
          {owned.length}/{MAX} unités
        </span>
        <span className="ml-auto flex gap-2 text-xs font-bold">
          <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">ATQ {atk}</span>
          <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-700">DEF {def}</span>
        </span>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Recrute — le catalogue réel du jeu
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {SOLDIER_CATALOG.map((u) => {
              const tooPoor = treasure < u.cost;
              const full = owned.length >= MAX;
              return (
                <button key={u.key} onClick={() => buy(u.key)} disabled={tooPoor || full}
                  title={u.description}
                  className="flex items-center gap-2 rounded-xl border-2 border-gray-200 p-2 text-left transition-colors enabled:hover:border-amber-400 enabled:hover:bg-amber-50/50 disabled:opacity-40">
                  <Image src={u.image} alt={u.name} width={34} height={34} className="shrink-0 object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-bold text-gray-800">{u.name}</span>
                    <span className="block text-[10px] tabular-nums text-gray-500">
                      {u.kind === 'combat' ? `ATQ ${u.atk} · DEF ${u.def}` : 'soutien'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-amber-700">{u.cost}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            Le plafond par catégorie est actif : impossible de mettre plus de la moitié de tes
            achats dans un même type. Essaie d&apos;enchaîner trois Béliers.
          </p>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Ta garnison
          </p>
          {owned.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
              Aucune unité. Clique dans le catalogue.
            </p>
          ) : (
            <div className="space-y-1.5">
              {owned.map((k, idx) => (
                <motion.div key={`${k}-${idx}`} layout initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
                  <Image src={img(k)} alt={unitOf(k).name} width={28} height={28} className="object-contain" />
                  <span className="flex-1 truncate text-[12px] font-semibold text-gray-700">
                    {unitOf(k).name}
                  </span>
                  <button onClick={() => undo(idx)} title="Annuler (12 h dans le vrai jeu)"
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            N&apos;importe quel membre peut <strong>annuler</strong> un achat de plus de 150 ⚒️
            pendant 12 h. Personne ne gaspille le trésor tout seul.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ 5 · déployer et viser le donjon ═════════════════ */

function DeploySandbox() {
  const ROSTER = ['piquier', 'archer', 'belier', 'medecin'];
  const [posted, setPosted] = useState<Record<string, { gate: Gate; stance: 'assaut' | 'garnison' } | null>>({
    piquier: null, archer: null, belier: null, medecin: null
  });
  const [gates] = useState<Record<Gate, { hp: number; fallen: boolean }>>({
    nord: { hp: 240, fallen: false }, est: { hp: 0, fallen: true }, sud: { hp: 300, fallen: false }
  });

  const place = (key: string, gate: Gate | null, stance: 'assaut' | 'garnison') => {
    setPosted((p) => ({ ...p, [key]: gate ? { gate, stance } : null }));
  };

  const engaged = ROSTER.filter((k) => posted[k]);
  const throughBreach = engaged.filter((k) => posted[k]!.stance === 'assaut' && gates[posted[k]!.gate].fallen);
  const keepDamage = throughBreach.reduce((s, k) => s + unitOf(k).atk, 0);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-purple-200 bg-white">
      <div className="border-b border-purple-100 bg-purple-50/70 px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-purple-700">
          Déploie ta garnison — la Porte Est est déjà tombée
        </p>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          {ROSTER.map((k) => {
            const u = unitOf(k);
            const cur = posted[k];
            return (
              <div key={k} className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-2">
                <Image src={u.image} alt={u.name} width={36} height={36} className="shrink-0 object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-bold text-gray-800">{u.name}</span>
                  <span className="block text-[10px] text-gray-500">
                    {u.gatesOnly ? 'portes uniquement' : `ATQ ${u.atk} · DEF ${u.def}`}
                  </span>
                </span>
                <select
                  value={cur ? `${cur.gate}:${cur.stance}` : ''}
                  onChange={(e) => {
                    const [g, st] = e.target.value.split(':');
                    place(k, (g || null) as Gate | null, (st as 'assaut' | 'garnison') || 'assaut');
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-1.5 py-1 text-[11px]">
                  <option value="">🏠 Caserne</option>
                  {GATES.map((g) => <option key={`a${g}`} value={`${g}:assaut`}>⚔️ Assaut · {g}</option>)}
                  {GATES.map((g) => <option key={`d${g}`} value={`${g}:garnison`}>🛡️ Défense · {g}</option>)}
                </select>
              </div>
            );
          })}
        </div>

        <div>
          <ClanCastle
            gates={GATES.map((n) => ({ name: n, hp: gates[n].hp, hpMax: 300, fallen: gates[n].fallen }))}
            keepHp={Math.max(0, 400 - keepDamage * 4)} keepHpMax={400} side="enemy"
            highlight={engaged.length ? posted[engaged[0]]!.gate : null}
          />

          <div className="mt-2 space-y-1.5 text-[12px]">
            <p className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-gray-600">
              🏠 <strong>{ROSTER.length - engaged.length}</strong> en réserve — elles ne s&apos;usent pas
            </p>
            {keepDamage > 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-lg bg-purple-50 px-2.5 py-1.5 font-semibold text-purple-800">
                🏰 <strong>{keepDamage}</strong> dégâts passent par la brèche et frappent le donjon
              </motion.p>
            ) : (
              <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-800">
                Place une unité en <strong>assaut sur la Porte Est</strong> : elle est tombée, les
                dégâts iront au donjon.
              </p>
            )}
            <p className="text-[11px] leading-relaxed text-gray-400">
              Abattre le donjon rapporte <strong>3 journées d&apos;un coup</strong> et 400 ⚒️ — mais
              la semaine va quand même jusqu&apos;à dimanche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════ 6 · le classement ════════════════════════════ */

function RankingSandbox() {
  const [pts, setPts] = useState(35);
  const rows = useMemo(() => {
    const all = [...MATES, { name: 'Toi', pts }].sort((a, b) => b.pts - a.pts);
    return all.map((r, i) => ({
      ...r, rank: i,
      mult: all.length <= 1 ? 1 : all.length === 2 ? (i === 0 ? 1.3 : 1) : ([2, 1.6, 1.3][i] ?? 1)
    }));
  }, [pts]);

  const mine = rows.find((r) => r.name === 'Toi')!;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-indigo-200 bg-white">
      <div className="border-b border-indigo-100 bg-indigo-50/70 px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-700">
          Classement des attaquants de ton clan — bouge ton curseur
        </p>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[1fr_1fr]">
        <div>
          <ol className="space-y-1.5">
            {rows.map((r) => {
              const me = r.name === 'Toi';
              return (
                <motion.li key={r.name} layout
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                    me ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-gray-50'
                  }`}>
                  <span className="w-6 text-center text-sm">
                    {['🥇', '🥈', '🥉'][r.rank] ?? `${r.rank + 1}.`}
                  </span>
                  <span className={`flex-1 text-sm ${me ? 'font-extrabold text-indigo-900' : 'font-medium text-gray-700'}`}>
                    {r.name}
                  </span>
                  <span className="text-sm tabular-nums text-gray-500">{r.pts} pts</span>
                  {r.mult > 1 && (
                    <span className="rounded bg-orange-100 px-1.5 text-[11px] font-bold text-orange-700">
                      ×{r.mult}
                    </span>
                  )}
                </motion.li>
              );
            })}
          </ol>

          <label className="mt-3 block">
            <span className="text-[11px] font-bold text-gray-500">Tes points aujourd&apos;hui : {pts}</span>
            <input type="range" min={0} max={90} value={pts}
              onChange={(e) => setPts(Number(e.target.value))}
              className="mt-1 w-full accent-indigo-600" />
          </label>
        </div>

        <Notes
          title={`Demain tu frapperas à ×${mine.mult}`}
          items={[
            'Tu n\'es classé QUE contre les joueurs de ton rôle — un soigneur régulier vaut un gros attaquant.',
            'Seul de ton rôle ? Multiplicateur ×1 : être premier ne vaut que s\'il y avait quelqu\'un à dépasser.',
            'Être blessé ne change PAS ton classement : il se calcule sur tes points bruts.'
          ]}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════ morceaux ═════════════════════════════════ */

function Notes({ title, items, log }: { title: string; items: string[]; log?: string[] }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="mb-2 text-[12px] font-extrabold text-gray-800">{title}</p>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-gray-600">
            <span className="text-orange-400">•</span>{t}
          </li>
        ))}
      </ul>
      {log && log.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-gray-200 pt-2">
          {log.map((l, i) => (
            <motion.p key={`${l}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              className="text-[11px] text-gray-500">{l}</motion.p>
          ))}
        </div>
      )}
    </div>
  );
}

function Step({ n, title, hint, children }: {
  n: number; title: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <section>
      <p className="mb-2 flex flex-wrap items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
          {n}
        </span>
        <span className="text-base font-extrabold text-orange-900">{title}</span>
        {hint && <span className="text-xs font-medium text-orange-500/70">— {hint}</span>}
      </p>
      {children}
    </section>
  );
}

/* ═══════════════════════════ le tutoriel ═════════════════════════════════ */

export default function ClanTutorial() {
  return (
    <details className="group overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-3 font-extrabold text-orange-900 transition-colors hover:bg-orange-100/50">
        <Castle className="h-5 w-5 text-orange-600" />
        Comment marche la Guerre des Clans ?
        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          tutoriel jouable
        </span>
        <span className="ml-auto text-orange-400 transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div className="space-y-6 px-4 pb-5 pt-2">
        {/* Sur très grand écran on passe en deux colonnes : sans ça, les lignes de
            texte font 1700 px de large et deviennent illisibles. */}
        <div className="grid gap-6 2xl:grid-cols-2 2xl:items-start">
          {/* La carte est panoramique : elle garde toute la largeur. */}
          <div className="2xl:col-span-2">
            <Step n={1} title="Le champ de bataille" hint="ça se joue tout seul">
              <Battlefield />
            </Step>
          </div>

          <Step n={2} title="Ton clan a son identité" hint="tire d'autres blasons">
            <IdentitySandbox />
          </Step>

          <Step n={3} title="Ton rôle change toute ta vue" hint="clique, la page s'adapte">
            <RoleSandbox />
          </Step>

          <Step n={4} title="Recruter la garnison" hint="dépense un vrai trésor">
            <RecruitSandbox />
          </Step>

          <Step n={5} title="Déployer et viser le donjon" hint="place tes unités">
            <DeploySandbox />
          </Step>

          <div className="2xl:col-span-2">
            <Step n={6} title="Le classement décide de ta puissance" hint="bouge le curseur">
              <RankingSandbox />
            </Step>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Warehouse, tone: 'text-slate-600', t: 'La réserve compte',
              d: 'Une unité engagée perd 25 % par assaut et meurt au 4e. À la caserne, elle ne s\'use pas.' },
            { icon: HeartPulse, tone: 'text-rose-500', t: 'Blessé ≠ évanoui',
              d: '🩸 Blessé = guerre, tu contribues à moitié. 💫 Évanoui = 0 PV sur le plateau, tu perds ta case.' },
            { icon: Hammer, tone: 'text-amber-600', t: 'Chaque point compte double',
              d: 'Une fois pour ton assaut, une fois pour le trésor ⚒️ du clan.' },
            { icon: Trophy, tone: 'text-emerald-600', t: 'Le meilleur ne descend jamais',
              d: 'Le clan perdant recule — sauf son meilleur contributeur, qui garde sa place.' }
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.t} className="rounded-xl bg-white/70 p-3">
                <p className="mb-1 flex items-center gap-2 text-[13px] font-bold text-gray-800">
                  <Icon className={`h-4 w-4 ${f.tone}`} />{f.t}
                </p>
                <p className="text-[11px] leading-relaxed text-gray-600">{f.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}
