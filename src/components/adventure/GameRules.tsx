"use client";

import React, { useState } from 'react';
import {
  Scroll, Target, Play, Sword, Heart, Timer, Flame, Layers, Moon, Users, Crown
} from 'lucide-react';

/**
 * Règles complètes de « Workyt Quest ».
 *
 * Organisées en quatre onglets plutôt qu'une liste : un élève qui découvre le
 * jeu cherche « c'est quoi le but » et « comment je joue », pas les formules.
 * Les paramètres chiffrés existent quand même — ils sont dans leur onglet.
 */

type Tab = 'but' | 'jouer' | 'parametres' | 'clans';

const TABS: { id: Tab; label: string; icon: typeof Scroll }[] = [
  { id: 'but', label: 'Le but', icon: Target },
  { id: 'jouer', label: 'Comment jouer', icon: Play },
  { id: 'parametres', label: 'Les paramètres', icon: Sword },
  { id: 'clans', label: 'Amis & clans', icon: Users }
];

export default function GameRules() {
  const [tab, setTab] = useState<Tab>('but');

  return (
    <details className="group overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-extrabold text-indigo-900 transition-colors hover:bg-indigo-100/50">
        <Scroll className="h-5 w-5 text-indigo-600" />
        Comment jouer ? Le guide complet
        <span className="ml-auto text-indigo-400 transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div className="px-4 pb-4 pt-1">
        {/* Onglets */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={(e) => { e.preventDefault(); setTab(t.id); }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'bg-white/70 text-indigo-700 hover:bg-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="text-sm text-gray-700">
          {tab === 'but' && <ButPanel />}
          {tab === 'jouer' && <JouerPanel />}
          {tab === 'parametres' && <ParametresPanel />}
          {tab === 'clans' && <ClansPanel />}
        </div>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------- le but */

function ButPanel() {
  return (
    <div className="space-y-3">
      <Box tone="indigo">
        <p className="font-bold">Le but du jeu</p>
        <p className="mt-1 text-[13px] leading-relaxed">
          Faire progresser <strong>ton héros</strong> en travaillant sur Workyt. Chaque
          quiz résolu, chaque quête accomplie et chaque case réclamée lui donne de
          l&apos;XP. Il monte en niveau, gagne des PV, de l&apos;attaque, de la défense,
          et récupère de l&apos;équipement.
        </p>
      </Box>

      <p className="text-[13px] leading-relaxed">
        Il n&apos;y a <strong>pas de fin</strong> et personne ne « perd la partie ». Le jeu
        récompense la <strong>régularité</strong> : un élève moyen mais assidu dépasse
        toujours un élève brillant mais absent.
      </p>

      <Rule icon={<Layers className="h-4 w-4 text-purple-500" />} title="Ce que tu collectionnes">
        Des <strong>cartes hebdomadaires</strong> (une par semaine complète du mois),
        de l&apos;<strong>équipement</strong> (arme, armure, amulette), des <strong>badges</strong>,
        et des <strong>cosmétiques</strong> pour ton profil.
      </Rule>

      <Rule icon={<Crown className="h-4 w-4 text-amber-500" />} title="Les trois monnaies">
        <strong>Points</strong> — la monnaie principale, dépensable dans les concours.
        <br />
        <strong>💎 Diamants</strong> — rares, pour les cosmétiques.
        <br />
        <strong>🍄 Champignons</strong> — la ressource vitale : ils <em>réaniment</em>
        {' '}ton héros et activent un boost, en même temps.
      </Rule>

      <Box tone="amber">
        <p className="text-[13px] leading-relaxed">
          <strong>La règle la plus importante :</strong> tes points de vie{' '}
          <strong>ne se rechargent pas chaque jour</strong>. Ils mesurent tes erreurs
          accumulées. Un joueur qui répond juste du premier coup ne perd jamais un
          seul PV.
        </p>
      </Box>
    </div>
  );
}

/* --------------------------------------------------------- comment jouer */

function JouerPanel() {
  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        <Step n={1} title="Ouvre l'arène et clique « Commencer le combat »">
          Le chrono ne démarre <strong>qu&apos;à ce clic</strong>. Tu peux lire toute la
          page avant, ça ne te coûte rien.
        </Step>
        <Step n={2} title="Réponds à la question du jour">
          Bonne réponse = victoire, tu gagnes de l&apos;XP. Du premier coup, c&apos;est un{' '}
          <strong>coup critique</strong> (XP ×1,5). Mauvaise réponse = le monstre riposte
          et tu perds des PV.
        </Step>
        <Step n={3} title="Réclame ta case sur le plateau">
          Une fois le quiz résolu, la case du jour se débloque : points, diamants ou
          coffre. <strong>Uniquement le jour même</strong> — une case passée est perdue.
        </Step>
        <Step n={4} title="Fais tes quêtes de guilde">
          Quotidiennes, hebdomadaires et mensuelles. Elles rapportent de l&apos;XP et
          des récompenses en plus.
        </Step>
        <Step n={5} title="Défie tes amis, combats avec ton clan">
          Les duels rapportent de l&apos;XP sans jamais coûter de PV. La Guerre des
          Clans tourne toute seule à partir des points que tu gagnes normalement.
        </Step>
      </ol>

      <Box tone="rose">
        <p className="font-bold">💫 Si ton héros tombe à 0 PV : évanoui</p>
        <p className="mt-1 text-[13px] leading-relaxed">
          C&apos;est la sanction la plus lourde du jeu. Deux conséquences :
        </p>
        <ul className="mt-2 space-y-1 text-[13px] leading-relaxed">
          <li>• <strong>Aucune XP</strong> — même en trouvant la bonne réponse</li>
          <li>
            • <strong>Ta case du jour est bloquée</strong>, et une case passée est perdue
            définitivement — avec elle, peut-être ta carte de la semaine
          </li>
        </ul>
        <p className="mt-2 text-[13px] leading-relaxed">
          Bois une potion 🍄 pour repartir <strong>immédiatement</strong> (elle active en
          plus un boost). Sans champignon, ton héros se réveille le lendemain — mais la
          case d&apos;aujourd&apos;hui, elle, ne revient pas.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-rose-900/70">
          À ne pas confondre avec <strong>🩸 blessé</strong>, qui appartient à la Guerre
          des Clans : un blessé contribue à moitié à son camp, mais ses PV et sa case du
          jour ne sont pas touchés. Deux systèmes séparés.
        </p>
      </Box>

      <Rule icon={<Timer className="h-4 w-4 text-cyan-600" />} title="Le chrono ne fait AUCUN dégât">
        Il décide seulement de <strong>combien</strong> tu gagnes. Prendre le temps de
        relire ton cours te fera gagner un peu moins d&apos;XP — jamais un seul point de
        vie. Réfléchir n&apos;est pas puni.
      </Rule>
    </div>
  );
}

/* ------------------------------------------------------- les paramètres */

function ParametresPanel() {
  return (
    <div className="space-y-3">
      <Table
        title="Ton héros"
        icon={<Heart className="h-4 w-4 text-rose-500" />}
        rows={[
          ['PV max', '20 + 4 × niveau (+ amulette)'],
          ['Attaque', '3 + niveau (+ arme)'],
          ['Défense', '1 + niveau/2 (+ armure)'],
          ['XP pour monter', '50 × niveau^1,5']
        ]}
      />

      <Table
        title="Récompenses de niveau"
        icon={<Crown className="h-4 w-4 text-amber-500" />}
        rows={[
          ['Chaque niveau', '+10 points · PV restaurés'],
          ['Tous les 3 niveaux', '🍄 ×1'],
          ['Tous les 5 niveaux', '💎 ×2'],
          ['Tous les 10 niveaux', 'équipement']
        ]}
      />

      <Table
        title="Le chrono (anti-triche)"
        icon={<Timer className="h-4 w-4 text-cyan-600" />}
        rows={[
          ['Très rapide', 'XP ×1,5'],
          ['Dans les temps', 'XP ×1'],
          ['En cherchant', 'XP ×0,6'],
          ['Très long', 'XP ×0,3'],
          ['Temps de référence', '30 s au niveau 1 → 10 s au niveau 20+']
        ]}
      />

      <Table
        title="Combien d'erreurs avant de tomber"
        icon={<Sword className="h-4 w-4 text-red-500" />}
        rows={[
          ['Niveau 1-9', '3 erreurs (2 en fin de mois et au boss)'],
          ['Niveau 10-19', '2,5 erreurs (1,5 au boss)'],
          ['Niveau 20-29', '2 erreurs (1 au boss)'],
          ['Niveau 30+', '1,5 erreur (1 au boss)']
        ]}
      />
      <p className="text-[11px] leading-relaxed text-gray-500">
        Plus tu montes, moins tu as droit à l&apos;erreur — mais un joueur de haut
        niveau est par définition quelqu&apos;un qui se trompe rarement. Le <strong>15
        du mois</strong>, c&apos;est le boss : il frappe deux fois plus fort et lâche un
        équipement garanti.
      </p>

      <Table
        title="Bonus d'XP cumulables"
        icon={<Flame className="h-4 w-4 text-orange-500" />}
        rows={[
          ['Quiz du jour', '10 XP · 50 au boss'],
          ['Premier coup', '×1,5'],
          ['Ton attaque', '+2 % par point d\'ATK (max +100 %)'],
          ['Ta série (streak)', '+2 % par jour consécutif (max +60 %)'],
          ['Quêtes', '+15 / +40 / +80 XP']
        ]}
      />

      <Box tone="slate">
        <p className="flex items-center gap-1.5 font-bold">
          <Moon className="h-4 w-4" /> Absence prolongée
        </p>
        <p className="mt-1 text-[13px] leading-relaxed">
          Chaque <strong>jour d&apos;école</strong> manqué au-delà du premier : le monstre
          frappe ton héros pendant son sommeil et tu perds 10 % de l&apos;XP du niveau.
          Tu peux redescendre d&apos;un niveau. <strong>Les vacances scolaires ne
          comptent pas</strong> — souffle tranquille.
        </p>
      </Box>
    </div>
  );
}

/* ------------------------------------------------------- amis et clans */

function ClansPanel() {
  return (
    <div className="space-y-3">
      <Rule icon={<Users className="h-4 w-4 text-fuchsia-500" />} title="Les amis">
        Ajoute tes camarades depuis leur profil ou la page <strong>Mes amis</strong>.
        Tu vois leur niveau, s&apos;ils sont en ligne, et tu peux les <strong>défier au
        quiz</strong>.
      </Rule>

      <Rule icon={<Sword className="h-4 w-4 text-red-500" />} title="Les duels">
        Les questions sont tirées au hasard et calibrées sur vos deux niveaux. Le
        vainqueur gagne <strong>40 + 5 × niveau</strong> d&apos;XP, le perdant 15,
        l&apos;égalité 25 chacun. <strong>Aucun dégât</strong> : un ami ne peut jamais te
        faire perdre ta case du jour.
      </Rule>

      <Box tone="indigo">
        <p className="font-bold">La Guerre des Clans</p>
        <p className="mt-1 text-[13px] leading-relaxed">
          Chaque semaine <em>sans événement programmé</em>, tu es enrôlé dans un clan
          qui en affronte un autre. <strong>Ce sont les points que tu gagnes
          normalement</strong> (forum, fiches, quiz) qui alimentent le combat — rien de
          plus à faire.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed">
          Tu choisis un rôle : ⚔️ attaquant, 🛡️ défenseur ou 💚 soigneur. Sept
          batailles, une par jour. Le dimanche, le clan qui a gagné le plus de journées
          monte d&apos;un rang et reçoit des coffres.
        </p>
      </Box>

      <p className="text-[11px] leading-relaxed text-gray-500">
        Rien n&apos;est obligatoire : si tu ne choisis rien, tu suis automatiquement
        l&apos;ordre de ton capitaine, bonus compris. Et un élève inactif n&apos;est pas
        enrôlé du tout — il ne plombe personne et ne perd aucun rang.
      </p>
    </div>
  );
}

/* --------------------------------------------------------- morceaux */

const TONES: Record<string, string> = {
  indigo: 'border-indigo-300 bg-indigo-50/80',
  amber: 'border-amber-300 bg-amber-50/80',
  rose: 'border-rose-300 bg-rose-50/80',
  slate: 'border-slate-300 bg-slate-50/80'
};

function Box({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return <div className={`rounded-xl border-2 p-3 ${TONES[tone]}`}>{children}</div>;
}

function Rule({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/70 p-3">
      <p className="mb-1 flex items-center gap-2 font-bold text-gray-800">{icon}{title}</p>
      <p className="text-[13px] leading-relaxed text-gray-600">{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl bg-white/70 p-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {n}
      </span>
      <span>
        <span className="block font-bold text-gray-800">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-gray-600">{children}</span>
      </span>
    </li>
  );
}

function Table({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white/70">
      <p className="flex items-center gap-2 border-b border-gray-200/70 px-3 py-2 font-bold text-gray-800">
        {icon}{title}
      </p>
      <dl className="divide-y divide-gray-100">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
            <dt className="text-[13px] text-gray-600">{k}</dt>
            <dd className="text-right text-[13px] font-semibold tabular-nums text-gray-900">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
