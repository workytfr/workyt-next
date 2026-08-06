"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Loader2, Swords, Users, Hammer, ShieldQuestion, Check, Megaphone, Crosshair, Trophy,
  Telescope
} from 'lucide-react';
import ClanBanner from '@/components/clan/ClanBanner';
import ClanCastle from '@/components/clan/ClanCastle';
import BattleReportModal from '@/components/clan/BattleReportModal';
import GarrisonPanel from '@/components/clan/GarrisonPanel';
import WarFeed, { type WarEvent } from '@/components/clan/WarFeed';
import ClanChat from '@/components/clan/ClanChat';
import ClanTutorial from '@/components/clan/ClanTutorial';
import ChestCard from '@/components/chests/ChestCard';
import type { ChestWithOdds } from '@/lib/chestOdds';

/**
 * Tableau de bord de la Guerre des Clans.
 *
 * Toute la stratégie se joue ici, de façon ASYNCHRONE : on voit où l'ennemi a
 * frappé hier, on choisit aujourd'hui à l'aveugle, tout se résout à minuit.
 * Personne n'a besoin d'être connecté à une heure précise.
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
}

const ROLE_LABEL: Record<string, string> = {
  attaquant: '⚔️ Attaquant',
  defenseur: '🛡️ Défenseur',
  soigneur: '💚 Soigneur'
};
const ROLE_DESC: Record<string, string> = {
  attaquant: 'Tes points frappent les remparts adverses',
  defenseur: 'Tes points protègent ta porte — mais tu peux être blessé',
  soigneur: "Tes points remettent d'aplomb tes coéquipiers blessés"
};
const ROLE_STYLE: Record<string, string> = {
  attaquant: 'border-red-400 bg-red-50 text-red-700',
  defenseur: 'border-sky-400 bg-sky-50 text-sky-700',
  soigneur: 'border-emerald-400 bg-emerald-50 text-emerald-700'
};
const GATES = ['nord', 'est', 'sud'] as const;

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
            <p key={type} className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-xs italic text-gray-500">
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
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Empty
        title="La Guerre des Clans"
        text="Connecte-toi pour rejoindre ton clan."
        cta={<Link href="/api/auth/signin" className="text-orange-600 hover:underline">Se connecter</Link>}
      />
    );
  }

  if (!data?.clan) {
    return (
      <div className="min-h-screen bg-white">
        {/* Même en-tête que la page enrôlée, au format /cours, /fiches et /forum */}
        <header className="border-b border-gray-100 bg-gradient-to-b from-orange-50/30 to-white">
          <div className="mx-auto max-w-[1800px] px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                <ShieldQuestion className="h-3.5 w-3.5" />
                Guerre des Clans
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {data?.reason === 'event_week' ? 'Guerre suspendue' : "Tu n'es pas encore enrôlé"}
              </h1>
              <p className="text-base leading-relaxed text-gray-500">
                {data?.reason === 'event_week'
                  ? 'Un événement est programmé cette semaine — la guerre reprendra lundi prochain.'
                  : 'Gagne au moins 1 point cette semaine (forum, fiches, quiz) et tu rejoindras un clan lundi prochain. En attendant, essaie le jeu ci-dessous.'}
              </p>
              <Link
                href="/recompenses"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                Gagner des points sur le plateau →
              </Link>
            </div>
          </div>
        </header>

        {/* Le tutoriel prend toute la largeur : c'est le contenu principal ici */}
        <main className="mx-auto max-w-[1800px] px-6 py-8">
          <ClanTutorial />
        </main>
      </div>
    );
  }

  const { clan, rival, me, members = [], rankings, rewards, feed = [] } = data;
  const isAttacker = me?.role === 'attaquant';

  return (
    <div className="min-h-screen bg-white">
      <BattleReportModal />

      {/* En-tête, au format des pages /cours, /fiches et /forum */}
      <header className="border-b border-gray-100 bg-gradient-to-b from-orange-50/30 to-white">
        <div className="mx-auto max-w-[1800px] px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                <Swords className="h-3.5 w-3.5" />
                Guerre des Clans · Jour {data.day ?? 1}/7
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {clan.tierName}
              </h1>
              <p className="text-base leading-relaxed text-gray-500">
                {clan.name} affronte {rival?.name ?? 'un adversaire'}. Chaque point que tu
                gagnes sur le site alimente ton camp — sept batailles, une par jour.
              </p>
            </div>
            {rival && (
              <div className="text-right">
                <p className="text-4xl font-bold tabular-nums text-gray-900">
                  {clan.daysWon} <span className="text-gray-300">—</span> {rival.daysWon}
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-400">journées</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1800px] space-y-6 px-6 py-8">
        <ClanTutorial />

        {/* Les deux châteaux */}
        <div className="grid gap-4 xl:gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          {/* Ma porte est surlignée du bon côté du champ de bataille : sur le
              château ADVERSE si je l'attaque, sur le MIEN si je la tiens.
              `gate` porte les deux sens selon le rôle (clanCombat.ts). */}
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
          <div className="flex items-center justify-center lg:pt-24">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg">
              <Swords className="h-6 w-6" />
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
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
              Adversaire non assigné
            </div>
          )}
        </div>

        {/* Deux colonnes : à gauche ce que je décide, à droite ce que je regarde */}
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3 lg:items-start">
        <div className="space-y-6">

        {/* Mon état */}
        {me && (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-orange-200 bg-white/80 p-4 shadow-sm">
            <Stat label="Aujourd'hui" value={`${me.dailyPoints} pts`} />
            <Stat label="Semaine" value={`${me.totalPoints} pts`} />
            <Stat label="Puissance" value={`×${me.multiplier}`} />
            <Stat
              label="Demain"
              value={`×${me.nextMultiplier}${me.roleRank ? ` (${me.roleRank}/${me.roleSize})` : ''}`}
            />
            {me.wounded && <Stat label="État" value="🩸 Blessé" />}
          </div>
        )}

        {/* Rôle + position */}
        {me && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-bold text-gray-800">Mon rôle</h2>
            <p className="mb-4 text-sm text-gray-500">
              Les mêmes points produisent un effet différent selon ton rôle.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.keys(ROLE_LABEL).map((r) => {
                const active = me.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => post(r, '/api/clan/role', { role: r }, `Rôle : ${ROLE_LABEL[r]}`)}
                    disabled={busy !== null || active}
                    className={`rounded-xl border-2 p-3 text-left transition-all disabled:cursor-default ${
                      active ? `${ROLE_STYLE[r]} shadow-sm` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-between font-bold">
                      {ROLE_LABEL[r]}
                      {busy === r && <Loader2 className="h-4 w-4 animate-spin" />}
                      {active && busy === null && <Check className="h-4 w-4" />}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-gray-500">{ROLE_DESC[r]}</span>
                  </button>
                );
              })}
            </div>

            {/* Ma porte */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Crosshair className="h-4 w-4 text-orange-500" />
                {isAttacker ? 'Porte que je vise' : 'Porte que je tiens'}
              </p>
              <div className="flex flex-wrap gap-2">
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
              <p className="mt-2 text-[11px] text-gray-400">
                Sans choix, tu suis l&apos;ordre du capitaine — et tu gardes son bonus de +20 %.
              </p>
            </div>
          </section>
        )}

        {/* Ordre du capitaine */}
        {clan.isCaptain && (
          <section className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-5">
            <h2 className="mb-1 flex items-center gap-2 font-bold text-indigo-900">
              <Megaphone className="h-5 w-5" /> Ordre du jour
            </h2>
            <p className="mb-3 text-sm text-indigo-700/80">
              Un seul ordre, lu différemment selon le rôle : les{' '}
              <strong>attaquants</strong> frappent cette porte <em>chez l&apos;ennemi</em>, les{' '}
              <strong>défenseurs</strong> tiennent celle du même nom <em>chez toi</em>. Les
              membres qui suivent gagnent <strong>+20 %</strong> ; ceux qui n&apos;ont rien
              choisi le suivent automatiquement.
            </p>
            <div className="flex flex-wrap gap-2">
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
          </section>
        )}

        </div>

        {/* Colonne 2 : la garnison, le bloc le plus dense */}
        <div className="space-y-6">

        <GarrisonPanel onChange={load} />

        {/* Classements par rôle */}
        {rankings && rankings.some((r) => r.entries.length > 0) && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-bold text-gray-800">Classements du jour</h2>
            <p className="mb-4 text-sm text-gray-500">
              Tu n&apos;es classé que contre les joueurs de <strong>ton rôle</strong>.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 2xl:grid-cols-1">
              {rankings.map((r) => (
                <div key={r.role}>
                  <p className="mb-2 text-sm font-bold">{ROLE_LABEL[r.role]}</p>
                  {r.entries.length === 0 ? (
                    <p className="text-xs italic text-gray-400">Personne</p>
                  ) : (
                    <ol className="space-y-1">
                      {r.entries.map((e) => (
                        <li key={e.userId} className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1 text-xs">
                          <span className="truncate">
                            {['🥇', '🥈', '🥉'][e.rank] ?? `${e.rank + 1}.`} {e.username}
                            {e.wounded && ' 🩸'}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="tabular-nums text-gray-500">{e.dailyPoints}</span>
                            {e.nextMultiplier > 1 && (
                              <span className="rounded bg-orange-100 px-1 font-bold text-orange-700">
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

        {/* L'enjeu de la semaine. Le barème vient du serveur : la page ne peut
            pas promettre autre chose que ce qui sera réellement distribué. */}
        {rewards && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 font-bold text-gray-800">
              <Trophy className="h-5 w-5 text-amber-500" />
              L&apos;enjeu de cette guerre
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Distribué <strong>dimanche à minuit</strong>, au rang{' '}
              <strong>{clan.tierName ?? `n°${clan.tier}`}</strong>. Monter de rang améliore le butin.
            </p>

            <div className="space-y-5 text-sm">
              <div>
                <p className="mb-2 font-semibold text-gray-800">👑 MVP du clan vainqueur</p>
                <ChestLoot types={rewards.mvp} chests={rewards.chests} />
              </div>
              <div>
                <p className="mb-2 font-semibold text-gray-800">🏆 Clan vainqueur — chaque membre</p>
                <ChestLoot types={rewards.winner} chests={rewards.chests} />
              </div>
              <div className="border-t border-amber-200 pt-4">
                <p className="mb-2 font-semibold text-gray-800">🤝 Clan perdant — chaque membre</p>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
                  <Image src="/badge/points.png" alt="" width={18} height={18} className="object-contain" />
                  <span className="text-xs font-medium text-gray-700">
                    {rewards.loserPoints} points de compensation
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 border-t border-amber-200 pt-3 text-xs text-gray-500">
              Chances indiquées <strong>hors boost</strong> — un « éclat de chance » actif
              améliore le tirage des récompenses rares.
              Les coffres sont réservés au clan vainqueur. Les points de compensation ne vont
              qu&apos;aux membres ayant gagné <strong>au moins 1 point</strong> dans la semaine.
              Le meilleur contributeur du clan perdant est le seul à <strong>conserver son rang</strong>.
            </p>
          </section>
        )}

        </div>

        {/* Colonne 3 : ce qu'on regarde — pleine largeur tant qu'on n'a que
            deux colonnes, sa propre colonne au-delà de 1536 px */}
        <div className="space-y-6 lg:col-span-2 2xl:col-span-1">

        {/* Fil de guerre */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-800">Fil de guerre</h2>
          <WarFeed events={feed} day={data.day} />
        </section>

        {/* Tchat — juste sous le fil : on lit ce qui s'est passé, on en parle.
            Les membres viennent d'ici : le compositeur ne peut proposer que
            des joueurs du clan, jamais un compte quelconque du site. */}
        <ClanChat
          members={members.map((m) => ({ userId: m.userId, username: m.username }))}
          myUserId={me?.userId}
        />

        {/* Membres */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-800">
            <Users className="h-5 w-5 text-orange-500" />
            Membres ({members.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-gray-800">
                  {m.username}
                  {m.wounded && <span className="ml-2 text-xs text-rose-600">🩸</span>}
                </span>
                <span className="flex items-center gap-4 text-gray-500">
                  <span>{ROLE_LABEL[m.role] ?? m.role}</span>
                  <span className="w-12 text-right font-semibold tabular-nums text-gray-800">
                    {m.totalPoints}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- morceaux */

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
  return (
    <div className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${mine ? 'border-orange-300' : 'border-gray-200'}`}>
      <div className="mb-2 flex items-center gap-3">
        <ClanBanner seed={side.bannerSeed} size={44} label={`Blason de ${side.name}`} />
        <div className="min-w-0">
          <p className="truncate font-extrabold text-gray-900">{side.name}</p>
          <p className="text-xs text-gray-500">
            {side.memberCount} membre{side.memberCount > 1 ? 's' : ''}
            {mine && typeof side.resources === 'number' && (
              <span className="ml-2 inline-flex items-center gap-1 font-bold text-amber-700">
                <Hammer className="h-3 w-3" />{side.resources} ⚒️
              </span>
            )}
          </p>
        </div>
      </div>

      <ClanCastle
        gates={side.gates}
        keepHp={side.keepHp}
        keepHpMax={side.keepHpMax}
        side={enemy ? 'enemy' : 'ally'}
        highlight={highlight}
        threat={threat}
        onGateClick={onGateClick}
      />

      {/* Légende du halo. Sans elle, le cerclage orange sur son PROPRE château
          se lit comme « on me vise » alors qu'il dit l'inverse. */}
      {highlight && (
        <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border-2 border-dashed border-orange-500" />
          {mine ? 'Porte que ton clan tient' : 'Porte que tu vises'} :{' '}
          <strong className="font-semibold capitalize text-gray-700">{highlight}</strong>
        </p>
      )}

      {/* L'Éclaireur : ce qu'on paie 90 ⚒️. On dit aussi quand il MANQUE —
          une information absente doit se distinguer d'une absence d'ordre. */}
      {mine && (
        threat ? (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[11px] text-red-600">
            <Telescope className="h-3.5 w-3.5 shrink-0" />
            {typeof threatShare === 'number' ? (
              <span>
                L&apos;ennemi masse <strong className="font-bold">{threatShare} %</strong> de son
                assaut sur la porte{' '}
                <strong className="font-bold capitalize">{threat}</strong>
              </span>
            ) : (
              <span>
                Ordre ennemi : porte <strong className="font-bold capitalize">{threat}</strong>
              </span>
            )}
          </p>
        ) : scouted ? (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Telescope className="h-3.5 w-3.5 shrink-0" />
            L&apos;ennemi n&apos;a encore rien engagé aujourd&apos;hui
          </p>
        ) : (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Telescope className="h-3.5 w-3.5 shrink-0" />
            Un Éclaireur révélerait la porte visée par l&apos;ennemi
          </p>
        )
      )}

      {onGateClick && (
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Clique une porte pour la viser
          {side.gates?.some((g) => g.fallen) && (
            <>
              {' '}— viser une porte <strong className="font-semibold text-gray-500">tombée</strong>{' '}
              fait passer tes coups sur le donjon
            </>
          )}
        </p>
      )}
    </div>
  );
}

function GateChip({
  label, active, onClick, busy
}: { label: string; active: boolean; onClick: () => void; busy: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy || active}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-semibold capitalize transition-colors disabled:cursor-default ${
        active
          ? 'border-orange-500 bg-orange-500 text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
      }`}
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-xl bg-gray-50 px-3 py-1.5 text-sm">
      <span className="text-gray-400">{label} </span>
      <span className="font-bold text-gray-900">{value}</span>
    </span>
  );
}

function Empty({ title, text, cta }: { title: string; text: string; cta?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="mx-auto max-w-lg pt-24 text-center">
        <ShieldQuestion className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-500">{text}</p>
        {cta && <div className="mt-6">{cta}</div>}
      </div>
    </div>
  );
}
