"use client";

import React from 'react';
import { Swords, Flame, Crown, Layers, Heart, Scroll, Timer, Moon } from 'lucide-react';

/**
 * Règles du jeu « Workyt Quest » affichées sur la page /recompenses.
 * Résumé clair de la boucle de jeu et des systèmes.
 */
export default function GameRules() {
  return (
    <details className="group rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
      <summary className="cursor-pointer list-none flex items-center gap-2 px-4 py-3 font-extrabold text-indigo-900 hover:bg-indigo-100/50 transition-colors">
        <Scroll className="w-5 h-5 text-indigo-600" />
        Comment jouer ? Les règles du donjon
        <span className="ml-auto text-indigo-400 transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div className="px-4 pb-4 pt-1 grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
        <Rule
          icon={<Swords className="w-4 h-4 text-red-500" />}
          title="Quiz = Combat"
          text="Chaque jour, un monstre garde la case. SEULE une mauvaise réponse te fait perdre des PV : dégâts = ATK monstre − ta DEF. Bonne réponse = victoire (+10 XP, +50 boss), du 1er coup = CRITIQUE (×1.5). Certains monstres ont des pouvoirs : 🧪 poison (+2 dégâts), 🔥 brutal (critique 35%)."
        />
        <Rule
          icon={<Crown className="w-4 h-4 text-amber-500" />}
          title="Avance sur le chemin"
          text="Monstre vaincu → réclame ta case : 1-3 points, ~5% d'1 diamant. Le 15 = BOSS : coffre + équipement garanti (rare 45% / épique 35% / légendaire 20%). Les cases passées non réclamées sont perdues à jamais !"
        />
        <Rule
          icon={<Heart className="w-4 h-4 text-rose-500" />}
          title="PV : ils NE se rechargent PAS chaque jour"
          text="PV max = 20 + 4×niveau. Tes PV se gardent d'un jour à l'autre : ils mesurent tes erreurs accumulées. Plus tu montes en niveau, moins tu as droit à l'erreur (3 fautes au début, 1 seule à haut niveau) — l'armure est vitale ! À 0 PV → évanoui 💫 : plus d'XP ET plus de réclamation. Une potion 🍄 te remet à fond tout de suite ET active un boost (ça marche dans les deux sens : activer un boost depuis la navbar te soigne aussi). Sans champignon, ta case du jour est PERDUE et ton héros ne se réveille que le lendemain."
        />
        <Rule
          icon={<Timer className="w-4 h-4 text-cyan-600" />}
          title="Réponds vite = gagne plus"
          text="Le chrono ne te fait AUCUN dégât, mais il décide de ta récompense : très rapide = XP ×1.5, dans les temps = ×1, en cherchant = ×0.6, très long = ×0.3. Le délai se resserre en montant : 30s au début, 10s à partir du niveau 20. Prends le temps de réfléchir si tu veux — tu gagneras juste un peu moins."
        />
        <Rule
          icon={<Moon className="w-4 h-4 text-slate-500" />}
          title="Ne disparais pas trop longtemps"
          text="Chaque jour d'école manqué (au-delà du 1er), le monstre frappe ton héros pendant son sommeil : dégâts + −10% d'XP, et tu peux redescendre d'un niveau. Rassure-toi : les vacances scolaires ne comptent pas, tu peux souffler !"
        />
        <Rule
          icon={<Flame className="w-4 h-4 text-orange-500" />}
          title="Streak = combo"
          text="Chaque jour consécutif réclamé allume la traînée de flamme : +2% d'XP par jour de streak (max +60%). Paliers 3/7/14/30/60/100 jours : points, diamants, champignons, badges. Quêtes complétées : +15/40/80 XP."
        />
        <Rule
          icon={<Layers className="w-4 h-4 text-purple-500" />}
          title="Cartes & butin de niveau"
          text="Semaine complète → carte · set du mois complet → coffre épique + équipement épique. Chaque niveau : +10 pts · tous les 3 niv : 🍄 · tous les 5 niv : 💎 · tous les 10 niv : équipement bonus !"
        />
        <Rule
          icon={<Scroll className="w-4 h-4 text-indigo-500" />}
          title="Progression persistante"
          text="Ton héros garde niveau, XP et équipement d'un mois à l'autre (courbe : 50×niv^1.5 XP). Chaque mois = un nouveau donjon aléatoire avec un nouveau décor saisonnier !"
        />
      </div>
    </details>
  );
}

function Rule({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-white/70 border border-indigo-100 p-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="font-bold text-gray-900 text-[13px]">{title}</p>
        <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}
