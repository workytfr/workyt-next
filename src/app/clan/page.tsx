"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Loader2, Swords, Users, Hammer, ShieldQuestion, Check, Megaphone, Crosshair, Trophy,
  Telescope, Crown, ArrowUpRight, BookOpen, X, Shield, HeartPulse, Sword, History, ChevronDown
} from 'lucide-react';
import ClanBanner from '@/components/clan/ClanBanner';
import ClanCastle, { gateState, type GateState } from '@/components/clan/ClanCastle';
import BattleReportModal from '@/components/clan/BattleReportModal';
import ClanWarRewardModal from '@/components/clan/ClanWarRewardModal';
import GarrisonPanel from '@/components/clan/GarrisonPanel';
import WarFeed, { type WarEvent } from '@/components/clan/WarFeed';
import ClanChat from '@/components/clan/ClanChat';
import ClanTutorial from '@/components/clan/ClanTutorial';
import ChestCard from '@/components/chests/ChestCard';
import type { ChestWithOdds } from '@/lib/chestOdds';
import { Eyebrow } from '@/components/wk/primitives';
import ProfileAvatar from '@/components/ui/profile';

/**
 * Tableau de bord de la Guerre des Clans.
 *
 * Toute la stratégie se joue ici, de façon ASYNCHRONE : on voit où l'ennemi a
 * frappé hier, on choisit aujourd'hui à l'aveugle, tout se résout à minuit.
 * Personne n'a besoin d'être connecté à une heure précise.
 *
 * La page suit l'ordre dans lequel on joue : le champ de bataille (où en
 * est-on), mes décisions du jour, la garnison, l'enjeu, puis ce qui s'est dit.
 */

interface Gate { name: string; hp: number; hpMax: number; fallen: boolean }
interface ClanSide {
  id: string; name: string; bannerSeed: string;
  tier?: number; tierName?: string;
  gates: Gate[]; keepHp: number; keepHpMax: number;
  daysWon: number; memberCount: number;
  resources?: number; isCaptain?: boolean; dailyOrder?: string | null;
  /** Côté rival : true si un Éclaireur est en garnison (sinon dailyOrder = null) */
  scouted?: boolean;
  /** Côté rival, avec Éclaireur : où l'ennemi masse son assaut, et sa part */
  pressureGate?: string | null;
  pressureShare?: number | null;
}
interface RankEntry {
  userId: string; username: string; dailyPoints: number;
  totalPoints: number; rank: number; nextMultiplier: number; wounded: boolean;
}
interface ClanData {
  season: string;
  clan: ClanSide | null;
  rival?: ClanSide | null;
  reason?: string;
  me?: {
    userId: string;
    role: string; dailyPoints: number; totalPoints: number;
    multiplier: number; nextMultiplier: number;
    roleRank: number | null; roleSize: number; wounded: boolean;
    gate?: string | null;
  };
  rankings?: { role: string; entries: RankEntry[] }[];
  /** Butin de dimanche au rang actuel du clan (barème serveur, jamais recopié) */
  rewards?: {
    mvp: string[];
    winner: string[];
    loserPoints: number;
    /** Coffres réels indexés par type — absent si le coffre n'est pas seedé */
    chests: Record<string, ChestWithOdds>;
  };
  members?: { userId: string; username: string; role: string; totalPoints: number; wounded: boolean }[];
  feed?: WarEvent[];
  day?: number;
  /** Bilan de la dernière bataille résolue */
  yesterday?: {
    day: number;
    outcome: 'win' | 'loss' | 'draw';
    damageDealt: number; damageTaken: number;
    ratioDealt: number; ratioTaken: number;
    woundedCount: number; healedCount: number;
    gatesDealt: { gate: string; damage: number; fell: boolean }[];
    gatesTaken: { gate: string; damage: number; fell: boolean }[];
    keepDealt: number; keepTaken: number;
  } | null;
  /** Soldats actuellement à l'assaut / en garnison */
  garrison?: { assaut: number; garnison: number };
}

const ROLE_LABEL: Record<string, string> = {
  attaquant: 'Attaquant',
  defenseur: 'Défenseur',
  soigneur: 'Soigneur'
};
/** Une icône par rôle : plus lisible qu'un emoji, et fidèle à la charte. */
const ROLE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  attaquant: Sword,
  defenseur: Shield,
  soigneur: HeartPulse
};
const ROLE_TINT: Record<string, string> = {
  attaquant: 'bg-[#fdecec] text-[#c2272d]',
  defenseur: 'bg-[#eaf6fb] text-[#2f86b3]',
  soigneur: 'bg-[#ecfdf5] text-[#3f8a1f]'
};

/** Pastille « icône + nom du rôle », utilisée partout où le rôle s'affiche. */
function RoleTag({ role, compact }: { role: string; compact?: boolean }) {
  const Icon = ROLE_ICON[role];
  if (!Icon) return <span className="text-xs">{role}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_TINT[role]}`}>
      <Icon className="h-3.5 w-3.5" />
      {!compact && ROLE_LABEL[role]}
    </span>
  );
}
const ROLE_DESC: Record<string, string> = {
  attaquant: 'Tes points frappent les remparts adverses',
  defenseur: 'Tes points protègent ta porte — mais tu peux être blessé',
  soigneur: "Tes points remettent d'aplomb tes coéquipiers blessés"
};
/** Couleur du rôle sélectionné, dans la palette Workyt. */
const ROLE_STYLE: Record<string, string> = {
  attaquant: 'border-[#e5484d] bg-[#fdecec] text-[#c2272d]',
  defenseur: 'border-[#6ec1e4] bg-[#eaf6fb] text-[#2f86b3]',
  soigneur: 'border-[#7ed957] bg-[#ecfdf5] text-[#3f8a1f]'
};
const GATES = ['nord', 'est', 'sud'] as const;

/** Le tableau de bord occupe l'écran : on a deux châteaux, un tchat et des
 *  listes à montrer en même temps. Plus large que les pages catalogue. */
const WIDE = 'mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-10';
const CARD = 'rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white';
const SECTION_TITLE = 'font-serif-display flex items-center gap-2.5 text-2xl leading-none';

/** État d'une porte : libellé et couleurs, pour les jauges. */
const GATE_STATE_META: Record<GateState, { label: string; chip: string; bar: string }> = {
  intacte: { label: 'Intacte', chip: 'bg-emerald-50 text-emerald-800', bar: '#7ed957' },
  entamee: { label: 'Entamée', chip: 'bg-[#fff4e0] text-[#9a5d00]', bar: '#ffb547' },
  critique: { label: 'Critique', chip: 'bg-[#ffe8d1] text-[#c24a0a]', bar: '#ff6a1a' },
  tombee: { label: 'Tombée', chip: 'bg-[#fdecec] text-[#c2272d]', bar: '#e5484d' }
};

/**
 * Les coffres réellement remis pour un lot, avec leur table de butin.
 *
 * `types` peut contenir des doublons (['legendary','legendary'] au rang 6) :
 * on n'affiche qu'une carte par coffre, avec un « ×2 ».
 */
function ChestLoot({
  types, chests
}: {
  types: string[];
  chests: Record<string, ChestWithOdds>;
}) {
  const counts = types.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {Object.entries(counts).map(([type, n]) => {
        const chest = chests[type];
        // Coffre non seedé ou désactivé : on le dit, plutôt que d'inventer une
        // table de butin que la résolution du dimanche ne distribuera pas.
        if (!chest) {
          return (
            <p key={type} className="rounded-2xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white p-3 text-xs italic text-[rgba(26,21,18,0.55)]">
              Coffre « {type} » indisponible pour le moment.
            </p>
          );
        }
        return (
          <ChestCard
            key={type}
            chest={chest}
            badge={
              n > 1 ? (
                <span className="rounded-full bg-[rgba(255,106,26,0.12)] px-2 py-0.5 text-[10px] font-bold text-[#c24a0a]">
                  ×{n}
                </span>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}

export default function ClanPage() {
  const { status } = useSession();
  const [data, setData] = useState<ClanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const load = useCallback(
    () =>
      fetch('/api/clan')
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => setData(j?.data ?? null))
        .catch(() => {}),
    []
  );

  useEffect(() => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') setLoading(false);
      return;
    }
    load().finally(() => setLoading(false));
  }, [status, load]);

  const post = async (key: string, url: string, body: any, ok: string) => {
    setBusy(key);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d.error || 'Erreur'); return; }
      toast.success(ok);
      await load();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--wk-paper)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--wk-accent)]" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Empty
        title="La Guerre des Clans"
        text="Connecte-toi pour rejoindre ton clan."
        cta={
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('workyt:open-auth'))}
            className="wk-btn-orange !py-2.5 text-sm"
          >
            Se connecter
          </button>
        }
      />
    );
  }

  /* ── Pas encore enrôlé, ou semaine d'événement ── */
  if (!data?.clan) {
    return (
      <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
        <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
          <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
          <div className={`${WIDE} relative pb-10 pt-10 md:pb-14 md:pt-14`}>
            <Eyebrow>Guerre des Clans</Eyebrow>
            <h1 className="font-serif-display mt-3 max-w-[20ch] text-[clamp(2.2rem,5vw,3.75rem)] leading-[0.95]">
              {data?.reason === 'event_week' ? 'Guerre suspendue' : "Tu n'es pas encore enrôlé"}
              <span className="text-[var(--wk-accent)]">.</span>
            </h1>
            <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
              {data?.reason === 'event_week'
                ? 'Un événement est programmé cette semaine — la guerre reprendra lundi prochain.'
                : 'Gagne au moins 1 point cette semaine (forum, fiches, quiz) et tu rejoindras un clan lundi prochain. En attendant, découvre le jeu ci-dessous.'}
            </p>
            <Link href="/recompenses" className="wk-btn-orange mt-6 !py-2.5 text-sm">
              Gagner des points <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <ClanWarRewardModal />
        <main className={`${WIDE} py-8 md:py-10`}>
          <ClanTutorial />
        </main>
      </div>
    );
  }

  const { clan, rival, me, members = [], rankings, rewards, feed = [] } = data;
  const isAttacker = me?.role === 'attaquant';

  return (
    <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
      <BattleReportModal />
      <ClanWarRewardModal />

      {/* ─── En-tête ─── */}
      <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
        <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className={`${WIDE} relative grid grid-cols-1 gap-8 pb-10 pt-10 md:pb-12 md:pt-14 lg:grid-cols-12 lg:items-end`}>
          <div className="lg:col-span-7">
            <Eyebrow>Guerre des Clans · Jour {data.day ?? 1} sur 7</Eyebrow>
            <h1 className="font-serif-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] leading-[0.95]">
              {clan.tierName}<span className="text-[var(--wk-accent)]">.</span>
            </h1>
            <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
              <b className="text-[var(--wk-ink)]">{clan.name}</b> affronte{' '}
              <b className="text-[var(--wk-ink)]">{rival?.name ?? 'un adversaire'}</b>. Chaque point
              gagné sur le site alimente ton camp — sept batailles, une par jour.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {rival && (
                <span className="inline-flex items-center gap-3 rounded-full bg-[var(--wk-ink)] px-5 py-2.5 text-[var(--wk-paper)]">
                  <span className="font-serif-display text-2xl leading-none tabular-nums">{clan.daysWon}</span>
                  <span className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-white/60">journées</span>
                  <span className="font-serif-display text-2xl leading-none tabular-nums">{rival.daysWon}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="wk-chip !px-3.5 !py-2 text-sm transition hover:border-[var(--wk-accent)]"
                title="Comment jouer à la Guerre des Clans"
              >
                <BookOpen className="h-4 w-4 text-[var(--wk-accent)]" /> Comment jouer
              </button>
              {me && (
                <>
                  <span className="wk-chip !px-3.5 !py-2 text-sm" title="Points gagnés aujourd'hui">
                    <Image src="/badge/points.png" alt="" width={16} height={16} className="object-contain" />
                    {me.dailyPoints} aujourd&apos;hui
                  </span>
                  <span className="wk-chip !px-3.5 !py-2 text-sm" title="Multiplicateur de puissance">
                    ×{me.multiplier} puissance
                  </span>
                  {me.wounded && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdecec] px-3.5 py-2 text-sm font-semibold text-[#c2272d]">
                      🩸 Blessé
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={`${WIDE} space-y-6 py-8 md:py-10`}>
        {/* ─── 01 · Le champ de bataille ─── */}
        <section className={`${CARD} p-5 sm:p-6`} aria-label="Champ de bataille">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className={SECTION_TITLE}>
              <Swords className="h-5 w-5 text-[var(--wk-accent)]" /> Le champ de bataille
            </h2>
            <span className="ml-auto text-sm text-[rgba(26,21,18,0.55)]">
              Tout se résout à minuit, chaque jour.
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <CastleCard
              side={clan}
              mine
              highlight={isAttacker ? clan.dailyOrder : me?.gate ?? clan.dailyOrder}
              /* La pression réelle prime sur l'ordre affiché : c'est là que les
                 coups tombent vraiment. L'ordre ne sert que le matin, tant que
                 personne n'a encore marqué. */
              threat={rival?.pressureGate ?? rival?.dailyOrder}
              threatShare={rival?.pressureShare}
              scouted={rival?.scouted}
            />

            <div className="flex items-center justify-center lg:h-full lg:flex-col lg:justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--wk-ink)] text-[var(--wk-accent-2)]">
                <Swords className="h-7 w-7" />
              </span>
            </div>

            {rival ? (
              <CastleCard
                side={rival}
                enemy
                highlight={isAttacker ? me?.gate ?? clan.dailyOrder : null}
                onGateClick={
                  isAttacker
                    ? (g) => post('gate', '/api/clan/deploy', { action: 'gate', gate: g }, `Tu vises la Porte ${g}`)
                    : undefined
                }
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] p-8 text-center text-sm text-[rgba(26,21,18,0.5)]">
                Adversaire non assigné
              </div>
            )}
          </div>
        </section>

        {/* Tout ce qui suit vit à gauche ; le tchat tient la colonne de droite,
            visible pendant qu'on joue (il était en bas de page, donc jamais lu). */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
          <div className="order-2 min-w-0 space-y-6 xl:order-1">

        {/* ─── Rapport de la veille ─── */}
        {data.yesterday && (
          <YesterdayReport report={data.yesterday} garrison={data.garrison} rivalName={rival?.name} />
        )}

        {/* ─── 02 · Mes décisions du jour ─── */}
        {me && (
          <section className={`${CARD} p-5 sm:p-6`} aria-label="Mes décisions du jour">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className={SECTION_TITLE}>
                <Crosshair className="h-5 w-5 text-[var(--wk-accent)]" /> Mes décisions du jour
              </h2>
              <span className="ml-auto text-sm text-[rgba(26,21,18,0.55)]">
                Demain : ×{me.nextMultiplier}
                {me.roleRank ? ` · ${me.roleRank}e sur ${me.roleSize} dans ton rôle` : ''}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              {/* Rôle */}
              <div>
                <h3 className="font-semibold">Mon rôle</h3>
                <p className="mt-1 text-sm text-[rgba(26,21,18,0.62)]">
                  Les mêmes points produisent un effet différent selon ton rôle.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {Object.keys(ROLE_LABEL).map((r) => {
                    const active = me.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => post(r, '/api/clan/role', { role: r }, `Rôle : ${ROLE_LABEL[r]}`)}
                        disabled={busy !== null || active}
                        className={`rounded-2xl border-2 p-3.5 text-left transition disabled:cursor-default ${
                          active ? ROLE_STYLE[r] : 'border-[rgba(26,21,18,0.1)] hover:border-[rgba(26,21,18,0.25)]'
                        }`}
                      >
                        <span className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            {React.createElement(ROLE_ICON[r], { className: 'h-4 w-4' })}
                            {ROLE_LABEL[r]}
                          </span>
                          {busy === r && <Loader2 className="h-4 w-4 animate-spin" />}
                          {active && busy === null && <Check className="h-4 w-4" />}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-[rgba(26,21,18,0.6)]">{ROLE_DESC[r]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Porte */}
              <div className="rounded-2xl bg-[var(--wk-paper)] p-4">
                <h3 className="flex items-center gap-1.5 font-semibold">
                  <Crosshair className="h-4 w-4 text-[var(--wk-accent)]" />
                  {isAttacker ? 'Porte que je vise' : 'Porte que je tiens'}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <GateChip
                    label="Auto"
                    active={!me.gate}
                    onClick={() => post('g-none', '/api/clan/deploy', { action: 'gate', gate: null }, 'Choix automatique')}
                    busy={busy === 'g-none'}
                  />
                  {GATES.map((g) => (
                    <GateChip
                      key={g}
                      label={g}
                      active={me.gate === g}
                      onClick={() => post(`g-${g}`, '/api/clan/deploy', { action: 'gate', gate: g }, `Porte ${g}`)}
                      busy={busy === `g-${g}`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-[rgba(26,21,18,0.55)]">
                  Sans choix, tu suis l&apos;ordre du capitaine — et tu gardes son bonus de +20 %.
                </p>
              </div>
            </div>

            {/* Ordre du capitaine */}
            {clan.isCaptain && (
              <div className="mt-5 rounded-2xl bg-[rgba(255,106,26,0.07)] p-4 sm:p-5">
                <h3 className="flex items-center gap-2 font-semibold text-[#c24a0a]">
                  <Megaphone className="h-4 w-4" /> Ton ordre du jour <span className="wk-chip !py-0.5 text-[11px]"><Crown className="h-3 w-3" /> Capitaine</span>
                </h3>
                <p className="mt-1.5 text-sm text-[rgba(26,21,18,0.7)]">
                  Un seul ordre, lu différemment selon le rôle : les <strong>attaquants</strong> frappent cette porte{' '}
                  <em>chez l&apos;ennemi</em>, les <strong>défenseurs</strong> tiennent celle du même nom <em>chez toi</em>.
                  Les membres qui suivent gagnent <strong>+20 %</strong> ; ceux qui n&apos;ont rien choisi le suivent
                  automatiquement.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <GateChip
                    label="Aucun"
                    active={!clan.dailyOrder}
                    onClick={() => post('o-none', '/api/clan/deploy', { action: 'order', gate: null }, 'Ordre retiré')}
                    busy={busy === 'o-none'}
                  />
                  {GATES.map((g) => (
                    <GateChip
                      key={g}
                      label={`Tous sur ${g}`}
                      active={clan.dailyOrder === g}
                      onClick={() => post(`o-${g}`, '/api/clan/deploy', { action: 'order', gate: g }, `Ordre : porte ${g}`)}
                      busy={busy === `o-${g}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ─── 03 · La garnison ─── */}
        <GarrisonPanel onChange={load} />

        {/* ─── 04 · Classements et enjeu ─── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
          {rankings && rankings.some((r) => r.entries.length > 0) && (
            <section className={`${CARD} p-5 sm:p-6`}>
              <h2 className={SECTION_TITLE}>
                <Trophy className="h-5 w-5 text-[var(--wk-accent)]" /> Classements du jour
              </h2>
              <p className="mt-2 text-sm text-[rgba(26,21,18,0.62)]">
                Tu n&apos;es classé que contre les joueurs de <strong>ton rôle</strong>. Le classement fixe ta
                puissance de demain.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
                {rankings.map((r) => (
                  <div key={r.role}>
                    <p className="mb-2"><RoleTag role={r.role} /></p>
                    {r.entries.length === 0 ? (
                      <p className="text-xs italic text-[rgba(26,21,18,0.45)]">Personne</p>
                    ) : (
                      <ol className="space-y-1">
                        {r.entries.map((e) => (
                          <li key={e.userId} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--wk-paper)] px-2.5 py-1.5 text-xs">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="w-4 shrink-0 text-center">{['🥇', '🥈', '🥉'][e.rank] ?? `${e.rank + 1}`}</span>
                              <ProfileAvatar username={e.username} userId={e.userId} size="medium" showPoints={false} />
                              <span className="min-w-0 truncate font-semibold">
                                {e.username}
                                {e.wounded && <span className="ml-1 text-[#c2272d]">🩸</span>}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="tabular-nums text-[rgba(26,21,18,0.55)]">{e.dailyPoints}</span>
                              {e.nextMultiplier > 1 && (
                                <span className="rounded-full bg-[rgba(255,106,26,0.12)] px-1.5 font-bold text-[#c24a0a]">
                                  ×{e.nextMultiplier}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* L'enjeu de la semaine, replié par défaut : c'est une information
              de référence, pas une décision du jour. Le barème vient du serveur. */}
          {rewards && <RewardsPanel rewards={rewards} tierName={clan.tierName} tier={clan.tier} />}
        </div>

        {/* ─── 05 · Ce qui s'est passé ─── */}
        <section className={`${CARD} p-5 sm:p-6`}>
          <h2 className={SECTION_TITLE}>
            <Swords className="h-5 w-5 text-[var(--wk-accent)]" /> Fil de guerre
          </h2>
          <div className="mt-4">
            <WarFeed events={feed} day={data.day} />
          </div>
        </section>

        <section className={`${CARD} p-5 sm:p-6`}>
          <h2 className={SECTION_TITLE}>
            <Users className="h-5 w-5 text-[var(--wk-accent)]" /> Membres
            <span className="text-base text-[rgba(26,21,18,0.45)]">({members.length})</span>
          </h2>
          <ul className="mt-3 divide-y divide-[rgba(26,21,18,0.06)]">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2.5">
                  <ProfileAvatar username={m.username} userId={m.userId} size="medium" showPoints={false} />
                  <span className="min-w-0 truncate font-semibold">
                    {m.username}
                    {m.wounded && <span className="ml-2 text-xs text-[#c2272d]">🩸</span>}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-[rgba(26,21,18,0.55)]">
                  <RoleTag role={m.role} compact />
                  <span className="w-12 text-right font-semibold tabular-nums text-[var(--wk-ink)]">
                    {m.totalPoints}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

          </div>

          {/* Le tchat du clan : collant à droite sur grand écran, et placé haut
              sur mobile — on ne parle pas à ses coéquipiers si on doit scroller
              toute la page pour trouver le champ de saisie.
              Les membres viennent d'ici : le compositeur ne peut proposer que
              des joueurs du clan, jamais un compte quelconque du site. */}
          <div className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-4">
            <ClanChat
              members={members.map((m) => ({ userId: m.userId, username: m.username }))}
              myUserId={me?.userId}
            />
          </div>
        </div>
      </div>

      {/* Le tutoriel ne prend plus de place : il s'ouvre à la demande */}
      {showTutorial && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10">
          <div className="w-full max-w-5xl rounded-3xl bg-[var(--wk-paper)] p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <h2 className={SECTION_TITLE}>
                <BookOpen className="h-5 w-5 text-[var(--wk-accent)]" /> Comment jouer
              </h2>
              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ClanTutorial />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- morceaux */

/** Une porte : nom, état, jauge de points de structure. */
function GateBar({
  gate, onClick, targeted, threatened
}: {
  gate: Gate;
  onClick?: () => void;
  /** Porte visée par le joueur / tenue par lui */
  targeted?: boolean;
  /** Porte que l'ennemi vise */
  threatened?: boolean;
}) {
  const st = gateState(gate);
  const meta = GATE_STATE_META[st];
  const pct = gate.hpMax > 0 ? Math.max(0, Math.min(100, (gate.hp / gate.hpMax) * 100)) : 0;
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`w-full rounded-2xl border p-2.5 text-left transition ${
        targeted
          ? 'border-[var(--wk-accent)] bg-[rgba(255,106,26,0.06)]'
          : threatened
            ? 'border-[#e5484d] bg-[#fdecec]'
            : 'border-[rgba(26,21,18,0.08)] bg-white'
      } ${onClick ? 'hover:border-[var(--wk-accent)]' : ''}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold capitalize">
          {gate.name}
          {threatened && <span className="ml-1 text-[#c2272d]">•</span>}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>{meta.label}</span>
      </span>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)]">
        <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: meta.bar }} />
      </span>
      <span className="mt-1 block text-[10px] tabular-nums text-[rgba(26,21,18,0.5)]">
        {Math.max(0, gate.hp)} / {gate.hpMax}
      </span>
    </Tag>
  );
}

function CastleCard({
  side, mine, enemy, highlight, threat, threatShare, scouted, onGateClick
}: {
  side: ClanSide; mine?: boolean; enemy?: boolean;
  highlight?: string | null;
  /** Porte visée par l'ennemi — connue seulement avec un Éclaireur */
  threat?: string | null;
  /** Part de l'assaut adverse qui tombe sur `threat`, si elle est mesurée */
  threatShare?: number | null;
  scouted?: boolean;
  onGateClick?: (g: string) => void;
}) {
  const keepPct = side.keepHpMax > 0 ? Math.max(0, Math.min(100, (side.keepHp / side.keepHpMax) * 100)) : 0;
  const keepDown = side.keepHp <= 0;

  return (
    <div className={`overflow-hidden rounded-3xl border bg-white ${mine ? 'border-[var(--wk-accent)]' : 'border-[rgba(26,21,18,0.1)]'}`}>
      {/* Bandeau : qui c'est */}
      <div className={`flex items-center gap-3 px-4 py-3 ${mine ? 'bg-[rgba(255,106,26,0.07)]' : 'bg-[var(--wk-paper)]'}`}>
        <ClanBanner seed={side.bannerSeed} size={40} label={`Blason de ${side.name}`} />
        <div className="min-w-0 flex-1">
          <p className="font-serif-display truncate text-xl leading-tight">{side.name}</p>
          <p className="text-xs text-[rgba(26,21,18,0.55)]">
            {side.memberCount} membre{side.memberCount > 1 ? 's' : ''}
            {mine && typeof side.resources === 'number' && (
              <span className="ml-2 inline-flex items-center gap-1 font-semibold text-[#9a5d00]">
                <Hammer className="h-3 w-3" />{side.resources} ⚒️
              </span>
            )}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${mine ? 'bg-white text-[#c24a0a]' : 'bg-white text-[rgba(26,21,18,0.6)]'}`}>
          {mine ? 'Ton clan' : 'Adversaire'}
        </span>
      </div>

      {/* Le château */}
      <div className="px-3 pt-3">
        <ClanCastle
          gates={side.gates}
          keepHp={side.keepHp}
          keepHpMax={side.keepHpMax}
          side={enemy ? 'enemy' : 'ally'}
          bannerSeed={side.bannerSeed}
          highlight={highlight}
          threat={threat}
          onGateClick={onGateClick}
        />
      </div>

      <div className="space-y-3 p-4">
        {/* Donjon */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">Donjon</span>
            <span className="tabular-nums text-[rgba(26,21,18,0.55)]">
              {keepDown ? 'Tombé' : `${Math.max(0, side.keepHp)} / ${side.keepHpMax}`}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${keepPct}%`, backgroundColor: keepDown ? '#e5484d' : mine ? '#6ec1e4' : '#ffb547' }}
            />
          </div>
          <p className="mt-1 text-[11px] text-[rgba(26,21,18,0.5)]">
            Les coups ne l&apos;atteignent qu&apos;une fois la porte tombée.
          </p>
        </div>

        {/* Les trois portes */}
        <div className="grid grid-cols-3 gap-2">
          {side.gates.map((g) => (
            <GateBar
              key={g.name}
              gate={g}
              targeted={highlight === g.name}
              threatened={mine && threat === g.name}
              onClick={onGateClick ? () => onGateClick(g.name) : undefined}
            />
          ))}
        </div>

        {/* Légendes : à quoi correspond ce qu'on voit */}
        <div className="space-y-1.5 border-t border-[rgba(26,21,18,0.06)] pt-3">
          {highlight && (
            <p className="flex items-center gap-1.5 text-[11px] text-[rgba(26,21,18,0.6)]">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border-2 border-dashed border-[var(--wk-accent)]" />
              {mine ? 'Porte que ton clan tient' : 'Porte que tu vises'} :{' '}
              <strong className="font-semibold capitalize text-[var(--wk-ink)]">{highlight}</strong>
            </p>
          )}

          {/* L'Éclaireur : ce qu'on paie 90 ⚒️. On dit aussi quand il MANQUE —
              une information absente doit se distinguer d'une absence d'ordre. */}
          {mine && (
            threat ? (
              <p className="flex items-start gap-1.5 text-[11px] text-[#c2272d]">
                <Telescope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {typeof threatShare === 'number' ? (
                  <span>
                    L&apos;ennemi masse <strong className="font-bold">{threatShare} %</strong> de son assaut sur la
                    porte <strong className="font-bold capitalize">{threat}</strong>
                  </span>
                ) : (
                  <span>Ordre ennemi : porte <strong className="font-bold capitalize">{threat}</strong></span>
                )}
              </p>
            ) : scouted ? (
              <p className="flex items-start gap-1.5 text-[11px] text-[rgba(26,21,18,0.5)]">
                <Telescope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                L&apos;ennemi n&apos;a encore rien engagé aujourd&apos;hui
              </p>
            ) : (
              <p className="flex items-start gap-1.5 text-[11px] text-[rgba(26,21,18,0.5)]">
                <Telescope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Un Éclaireur révélerait la porte visée par l&apos;ennemi
              </p>
            )
          )}

          {onGateClick && (
            <p className="text-[11px] text-[rgba(26,21,18,0.5)]">
              Clique une porte pour la viser
              {side.gates?.some((g) => g.fallen) && (
                <> — viser une porte <strong className="font-semibold">tombée</strong> fait passer tes coups sur le donjon</>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** L'enjeu de la semaine : replié par défaut, on le déplie quand on s'y intéresse. */
function RewardsPanel({
  rewards, tierName, tier
}: {
  rewards: NonNullable<ClanData['rewards']>;
  tierName?: string;
  tier?: number;
}) {
  const [open, setOpen] = useState(false);
  const chestCount = rewards.winner.length;

  return (
    <section className={CARD}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-3 p-5 text-left sm:p-6"
      >
        <h2 className={SECTION_TITLE}>
          <Image src="/badge/diamond.png" alt="" width={20} height={20} className="object-contain" />
          L&apos;enjeu de cette guerre
        </h2>
        <span className="text-sm text-[rgba(26,21,18,0.55)]">
          {chestCount} coffre{chestCount > 1 ? 's' : ''} au rang {tierName ?? `n°${tier}`} · dimanche à minuit
        </span>
        <ChevronDown className={`ml-auto h-5 w-5 shrink-0 text-[rgba(26,21,18,0.45)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-[rgba(26,21,18,0.06)] p-5 sm:p-6">
          <p className="text-sm text-[rgba(26,21,18,0.62)]">
            Distribué <strong>dimanche à minuit</strong>, au rang <strong>{tierName ?? `n°${tier}`}</strong>.
            Monter de rang améliore le butin.
          </p>

          <div className="mt-4 space-y-5 text-sm">
            <div>
              <p className="mb-2 font-semibold">👑 MVP du clan vainqueur</p>
              <ChestLoot types={rewards.mvp} chests={rewards.chests} />
            </div>
            <div>
              <p className="mb-2 font-semibold">🏆 Clan vainqueur — chaque membre</p>
              <ChestLoot types={rewards.winner} chests={rewards.chests} />
            </div>
            <div className="border-t border-[rgba(26,21,18,0.06)] pt-4">
              <p className="mb-2 font-semibold">🤝 Clan perdant — chaque membre</p>
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--wk-paper)] p-3">
                <Image src="/badge/points.png" alt="" width={18} height={18} className="object-contain" />
                <span className="text-xs font-medium">{rewards.loserPoints} points de compensation</span>
              </div>
            </div>
          </div>

          <p className="mt-4 border-t border-[rgba(26,21,18,0.06)] pt-3 text-xs leading-relaxed text-[rgba(26,21,18,0.55)]">
            Chances indiquées <strong>hors boost</strong> — un « éclat de chance » actif améliore le tirage des
            récompenses rares. Les coffres sont réservés au clan vainqueur. Les points de compensation ne vont
            qu&apos;aux membres ayant gagné <strong>au moins 1 point</strong> dans la semaine. Le meilleur
            contributeur du clan perdant est le seul à <strong>conserver son rang</strong>.
          </p>
        </div>
      )}
    </section>
  );
}

/** Bilan de la dernière bataille : qui a frappé où, et avec quelle garnison. */
function YesterdayReport({
  report, garrison, rivalName
}: {
  report: NonNullable<ClanData['yesterday']>;
  garrison?: { assaut: number; garnison: number };
  rivalName?: string;
}) {
  const verdict = {
    win: { label: 'Journée gagnée', className: 'bg-emerald-50 text-emerald-800' },
    loss: { label: 'Journée perdue', className: 'bg-[#fdecec] text-[#c2272d]' },
    draw: { label: 'Journée nulle', className: 'bg-[var(--wk-paper-2)] text-[rgba(26,21,18,0.7)]' }
  }[report.outcome];

  const line = (hits: { gate: string; damage: number; fell: boolean }[]) =>
    hits.length === 0
      ? <span className="text-[rgba(26,21,18,0.5)]">Rien</span>
      : (
        <span className="flex flex-wrap gap-1.5">
          {hits.map((h) => (
            <span key={h.gate} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold">
              <span className="capitalize">{h.gate}</span>
              <span className="tabular-nums text-[rgba(26,21,18,0.55)]">{h.damage}</span>
              {h.fell && <span className="text-[#c2272d]">tombée</span>}
            </span>
          ))}
        </span>
      );

  return (
    <section className={`${CARD} p-5 sm:p-6`} aria-label="Rapport de la veille">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className={SECTION_TITLE}>
          <History className="h-5 w-5 text-[var(--wk-accent)]" /> Rapport de la veille
        </h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdict.className}`}>{verdict.label}</span>
        <span className="ml-auto text-sm text-[rgba(26,21,18,0.55)]">Bataille du jour {report.day}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ce qu'on a infligé */}
        <div className="rounded-2xl bg-[var(--wk-paper)] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sword className="h-4 w-4 text-[#c2272d]" /> Ce qu&apos;on a attaqué
            {rivalName && <span className="font-normal text-[rgba(26,21,18,0.55)]">chez {rivalName}</span>}
          </p>
          <p className="font-serif-display mt-2 text-2xl leading-none">
            {report.damageDealt} <span className="text-base text-[rgba(26,21,18,0.5)]">dégâts</span>
          </p>
          <div className="mt-2 text-sm">{line(report.gatesDealt)}</div>
          {report.keepDealt > 0 && (
            <p className="mt-2 text-xs text-[rgba(26,21,18,0.6)]">Donjon adverse : {report.keepDealt} dégâts par la brèche.</p>
          )}
        </div>

        {/* Ce qu'on a encaissé */}
        <div className="rounded-2xl bg-[var(--wk-paper)] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-[#2f86b3]" /> Ce qu&apos;on a encaissé
          </p>
          <p className="font-serif-display mt-2 text-2xl leading-none">
            {report.damageTaken} <span className="text-base text-[rgba(26,21,18,0.5)]">dégâts</span>
          </p>
          <div className="mt-2 text-sm">{line(report.gatesTaken)}</div>
          {report.keepTaken > 0 && (
            <p className="mt-2 text-xs text-[rgba(26,21,18,0.6)]">Ton donjon : {report.keepTaken} dégâts encaissés.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[rgba(26,21,18,0.06)] pt-4 text-xs">
        <span className="wk-chip">🩸 {report.woundedCount} blessé{report.woundedCount > 1 ? 's' : ''}</span>
        <span className="wk-chip">⛑️ {report.healedCount} soigné{report.healedCount > 1 ? 's' : ''}</span>
        {garrison && (
          <>
            <span className="wk-chip"><Sword className="h-3.5 w-3.5" /> {garrison.assaut} soldat{garrison.assaut > 1 ? 's' : ''} à l&apos;assaut</span>
            <span className="wk-chip"><Shield className="h-3.5 w-3.5" /> {garrison.garnison} en garnison</span>
          </>
        )}
        <span className="ml-auto text-[rgba(26,21,18,0.5)]">
          Mur adverse entamé : {Math.round(report.ratioDealt * 100)} % · le nôtre : {Math.round(report.ratioTaken * 100)} %
        </span>
      </div>
    </section>
  );
}

function GateChip({
  label, active, onClick, busy
}: { label: string; active: boolean; onClick: () => void; busy: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy || active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold capitalize transition disabled:cursor-default ${
        active
          ? 'border-transparent bg-[var(--wk-ink)] text-[var(--wk-paper)]'
          : 'border-[rgba(26,21,18,0.12)] bg-white text-[rgba(26,21,18,0.7)] hover:border-[var(--wk-accent)] hover:text-[var(--wk-ink)]'
      }`}
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </button>
  );
}

function Empty({ title, text, cta }: { title: string; text: string; cta?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--wk-paper)] p-4">
      <div className="mx-auto max-w-lg pt-24 text-center">
        <ShieldQuestion className="mx-auto h-12 w-12 text-[rgba(26,21,18,0.25)]" />
        <h1 className="font-serif-display mt-4 text-3xl">{title}<span className="text-[var(--wk-accent)]">.</span></h1>
        <p className="mt-2 text-[rgba(26,21,18,0.62)]">{text}</p>
        {cta && <div className="mt-6">{cta}</div>}
      </div>
    </div>
  );
}
