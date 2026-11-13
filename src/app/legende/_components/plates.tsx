"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Amulet, Armor, Banner, Beast, Book, CrossedSwords, Lantern, Scroll, Sword } from "./art";
import { PIECES, PIERRE, type PlateKind } from "./story";

/*
 * Les planches : des illustrations à l'encre sur papier, comme dans un vieux livre.
 * Chacune résume en un coup d'œil la règle que le chapitre vient de raconter.
 * Elles restent dans la fiction : seuls les chiffres sont ceux du site.
 */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const MUTED = "text-[rgba(26,21,18,0.6)]";
const LABEL = "font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.5)]";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

function Plate({ n, title, children, note }: { n: number; title: string; children: ReactNode; note?: ReactNode }) {
    return (
        <figure className="legende-plate">
            <figcaption className="flex items-baseline justify-between gap-4 border-b border-dashed border-[rgba(26,21,18,0.2)] pb-3">
                <span className="font-serif-display text-xl leading-tight">{title}</span>
                <span className={`${LABEL} shrink-0`}>Planche {ROMAN[n - 1] ?? n}</span>
            </figcaption>
            <div className="mt-5">{children}</div>
            {note && <p className={`mt-5 border-t border-dashed border-[rgba(26,21,18,0.15)] pt-3 text-[13px] italic ${MUTED}`}>{note}</p>}
        </figure>
    );
}

const Coin = ({ size = 14 }: { size?: number }) => <Image src="/badge/coin.svg" alt="" width={size} height={size} className="inline-block align-[-2px]" />;
const Ember = ({ size = 14 }: { size?: number }) => <Image src="/badge/braise.svg" alt="" width={size} height={size} className="inline-block align-[-2px]" />;
const Shroom = ({ size = 16 }: { size?: number }) => (
    <Image src="/badge/champignon.svg" alt="" width={size} height={size} className="inline-block align-[-3px]" />
);

/** Une ligne « ce que ça coûte / ce que ça rapporte ». */
function Ledger({ rows }: { rows: { icon: ReactNode; label: string; value: ReactNode; minus?: boolean }[] }) {
    return (
        <ul className="divide-y divide-dashed divide-[rgba(26,21,18,0.15)]">
            {rows.map((r) => (
                <li key={r.label} className="flex items-center gap-3 py-2.5">
                    <span className="h-9 w-9 shrink-0">{r.icon}</span>
                    <span className="flex-1 text-[14px] leading-snug">{r.label}</span>
                    <span className={`font-mono-ui shrink-0 text-[13px] font-bold ${r.minus ? "text-[#a8410c]" : ""}`}>{r.value}</span>
                </li>
            ))}
        </ul>
    );
}

/* ------------------------------------------------------------------ */

function CheminPlate({ n }: { n: number }) {
    // Une semaine vue d'en haut : le 11 a été manqué, la bête du 14 attend, le Gardien garde le 15.
    const days: { d: number; state: "done" | "missed" | "today" | "future" | "boss" }[] = [
        { d: 9, state: "done" },
        { d: 10, state: "done" },
        { d: 11, state: "missed" },
        { d: 12, state: "done" },
        { d: 13, state: "done" },
        { d: 14, state: "today" },
        { d: 15, state: "boss" },
    ];
    const cards = [
        { label: "1 – 7", state: "won" },
        { label: "8 – 14", state: "lost" },
        { label: "15 – 21", state: "open" },
        { label: "22 – 28", state: "open" },
        { label: "29 – fin", state: "open" },
    ];
    return (
        <Plate n={n} title="Le chemin des jours" note="Une dalle par jour, seulement le jour même. Une dalle grise ne se rattrape pas, et elle coûte la carte de son tronçon.">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                {days.map((day, i) => (
                    <motion.div
                        key={day.d}
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.3, delay: i * 0.05, ease: EASE_OUT }}
                        className="flex flex-col items-center gap-1.5"
                    >
                        <div
                            className={`relative grid aspect-square w-full place-items-center rounded-lg border-2 ${
                                day.state === "done"
                                    ? "border-[#1a1512] bg-[#ff6a1a]"
                                    : day.state === "missed"
                                      ? "border-[rgba(26,21,18,0.25)] bg-[rgba(26,21,18,0.1)]"
                                      : day.state === "today" || day.state === "boss"
                                        ? "border-dashed border-[#1a1512] bg-[#fff4e0]"
                                        : "border-[rgba(26,21,18,0.2)]"
                            }`}
                        >
                            {day.state === "done" && <Coin size={18} />}
                            {day.state === "missed" && <span className="text-lg font-bold text-[rgba(26,21,18,0.35)]">×</span>}
                            {day.state === "today" && <Beast className="h-[80%] w-[80%]" />}
                            {day.state === "boss" && <Beast className="h-[86%] w-[86%]" crowned />}
                        </div>
                        <span className="font-mono-ui text-[10px] text-[rgba(26,21,18,0.55)]">{day.d}</span>
                    </motion.div>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[rgba(26,21,18,0.65)]">
                <span>
                    <b className="text-[#c24a0a]">■</b> conquise : 1 à 3 {PIECES}
                </span>
                <span>
                    <b className="text-[rgba(26,21,18,0.3)]">■</b> manquée
                </span>
                <span>la bête du jour pose son énigme</span>
                <span>le 15 : le Gardien, un équipement et un coffre</span>
            </div>

            <p className={`${LABEL} mt-6`}>Les cartes du mois</p>
            <div className="mt-3 flex items-end gap-2 sm:gap-3">
                {cards.map((c) => (
                    <div key={c.label} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                            className={`grid aspect-[3/4] w-full max-w-[56px] place-items-center rounded-md border-2 ${
                                c.state === "won"
                                    ? "border-[#1a1512] bg-[#ffb547]"
                                    : c.state === "lost"
                                      ? "border-[rgba(26,21,18,0.2)] bg-[rgba(26,21,18,0.08)]"
                                      : "border-dashed border-[rgba(26,21,18,0.25)]"
                            }`}
                        >
                            {c.state === "won" && <Beast className="h-7 w-7" />}
                            {c.state === "lost" && <span className="text-sm font-bold text-[rgba(26,21,18,0.3)]">×</span>}
                        </div>
                        <span className="font-mono-ui whitespace-nowrap text-[9px] text-[rgba(26,21,18,0.55)] sm:text-[10px]">{c.label}</span>
                    </div>
                ))}
                <span aria-hidden="true" className="pb-6 text-[rgba(26,21,18,0.4)]">
                    →
                </span>
                <div className="flex flex-col items-center gap-1">
                    <Image src="/coffre/epic_f.png" alt="" width={56} height={56} />
                    <span className="text-center text-[10px] font-semibold leading-tight">
                        coffre
                        <br />+ équipement
                    </span>
                </div>
            </div>
        </Plate>
    );
}

function StatBar({ label, formula, pct, color }: { label: string; formula: string; pct: number; color: string }) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="font-semibold">{label}</span>
                <span className="font-mono-ui text-[11px] text-[rgba(26,21,18,0.55)]">{formula}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-[rgba(26,21,18,0.25)] bg-white">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

const RARITIES = [
    { label: "Commun", color: "#9a948c" },
    { label: "Rare", color: "#2f6fb3" },
    { label: "Épique", color: "#7b4bc4" },
    { label: "Légendaire", color: "#e0a020" },
];

function VoyageurPlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="Fiche du voyageur" note="À zéro point de vie : évanoui, pas d'expérience, dalle fermée. Debout le lendemain, ou tout de suite avec un champignon.">
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                    <StatBar label="Points de vie" formula="20 + 4 × niveau" pct={72} color="#d9461b" />
                    <StatBar label="Attaque" formula="3 + niveau" pct={48} color="#ff6a1a" />
                    <StatBar label="Défense" formula="1 + niveau ÷ 2" pct={30} color="#2f6fb3" />
                </div>
                <div>
                    <p className={LABEL}>Équipement</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {[
                            { icon: <Sword className="h-full w-full" />, label: "Arme" },
                            { icon: <Armor className="h-full w-full" />, label: "Armure" },
                            { icon: <Amulet className="h-full w-full" />, label: "Amulette" },
                        ].map((slot) => (
                            <div key={slot.label} className="flex flex-col items-center gap-1 rounded-lg border-2 border-[rgba(26,21,18,0.2)] bg-white/60 p-2">
                                <span className="h-9 w-9">{slot.icon}</span>
                                <span className="text-[11px] font-semibold">{slot.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                        {RARITIES.map((r) => (
                            <span key={r.label} className="inline-flex items-center gap-1.5 text-[11px]">
                                <span className="h-2.5 w-2.5 rounded-full border border-[rgba(26,21,18,0.4)]" style={{ background: r.color }} />
                                {r.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <p className={`${LABEL} mt-6`}>À chaque niveau</p>
            <ul className="mt-2 grid gap-2 text-[13px] sm:grid-cols-2">
                <li>
                    <b>Chaque niveau</b> : +10 <Coin /> et points de vie pleins
                </li>
                <li>
                    <b>Tous les 3</b> : 1 <Shroom />
                </li>
                <li>
                    <b>Tous les 5</b> : 2 <Ember />
                </li>
                <li>
                    <b>Tous les 10</b> : une pièce d&apos;équipement
                </li>
            </ul>
        </Plate>
    );
}

const MILESTONES = [
    { days: 3, gift: <>5 <Coin /></> },
    { days: 7, gift: <>15 <Coin /> 1 <Shroom /></> },
    { days: 14, gift: <>30 <Coin /> 1 <Shroom /></> },
    { days: 30, gift: <>50 <Coin /> 1 <Ember /> 2 <Shroom /></> },
    { days: 60, gift: <>100 <Coin /> 2 <Ember /> 2 <Shroom /></> },
    { days: 100, gift: <>200 <Coin /> 5 <Ember /> 3 <Shroom /></> },
];

function LanternePlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="Les bornes de la lanterne" note="+2 % d'expérience par jour d'affilée, jusqu'à +60 %. Un jour sans rien, et la flamme retombe à une étincelle.">
            <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-6">
                {MILESTONES.map((m, i) => (
                    <div key={m.days} className="flex flex-col items-center text-center">
                        <div className="flex h-20 items-end">
                            <Lantern className="w-10" flame={(i + 1) / MILESTONES.length} />
                        </div>
                        <p className="font-serif-display mt-2 text-2xl leading-none">{m.days}</p>
                        <p className="font-mono-ui text-[9px] uppercase tracking-[0.14em] text-[rgba(26,21,18,0.5)]">jours</p>
                        <p className="mt-2 text-[12px] font-semibold leading-relaxed">{m.gift}</p>
                    </div>
                ))}
            </div>
        </Plate>
    );
}

function Note({ title, reward, tilt, tone = "#fff8ea" }: { title: string; reward: ReactNode; tilt: string; tone?: string }) {
    return (
        <div className={`relative rounded-sm p-3 pt-4 shadow-[0_6px_14px_rgba(26,21,18,0.25)] ${tilt}`} style={{ background: tone }}>
            <span aria-hidden="true" className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#ff6a1a] shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
            <p className="text-[13px] font-semibold leading-snug">{title}</p>
            <p className="mt-2 text-[12px] leading-relaxed">{reward}</p>
        </div>
    );
}

function QuetesPlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="Le tableau de l'auberge" note="Trois quêtes du jour tirées parmi neuf, quatre si tu as mangé deux champignons. Expérience : 15, 40 ou 80 selon la quête.">
            <div className="rounded-xl border-[6px] border-[#7a4a22] bg-[#c99a5e] p-3 sm:p-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.7)]">Du jour</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <Note title="Réponds à 3 appels" reward={<>5 <Coin /> + coffre commun</>} tilt="sm:-rotate-1" />
                    <Note title="Réussis 2 épreuves" reward={<>8 <Coin /></>} tilt="sm:rotate-1" />
                    <Note title="Copie 1 feuillet" reward={<>5 <Coin /></>} tilt="sm:-rotate-[0.5deg]" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                        <p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.7)]">De la semaine</p>
                        <div className="mt-2">
                            <Note title="5 réponses validées" reward={<>30 <Coin /> + coffre rare</>} tilt="sm:rotate-[0.6deg]" tone="#f3e6cc" />
                        </div>
                    </div>
                    <div>
                        <p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.7)]">Du mois</p>
                        <div className="mt-2">
                            <Note
                                title="Réponds à 30 appels"
                                reward={<>60 <Coin /> 1 <Ember /> + coffre épique</>}
                                tilt="sm:-rotate-[0.8deg]"
                                tone="#ffe2c2"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Plate>
    );
}

const CHESTS = [
    { src: "/coffre/common_f.png", name: "Commun", loot: <>30 à 100 <Coin />, parfois 1 <Ember /> ou 1 <Shroom /></> },
    { src: "/coffre/rare_f.png", name: "Rare", loot: <>75 à 200 <Coin />, 1 à 3 <Ember /></> },
    { src: "/coffre/epic_f.png", name: "Épique", loot: <>250 à 600 <Coin />, 2 à 12 <Ember />, 3 à 5 <Shroom /></> },
    { src: "/coffre/legendary_f.png", name: "Légendaire", loot: <>500 à 1000 <Coin />, 5 à 25 <Ember />, 5 à 10 <Shroom /></> },
];

const SHROOMS = [
    { count: 1, effect: "Tout ce que tu gagnes vaut 25 % de plus pendant 30 minutes" },
    { count: 2, effect: "Une quatrième quête du jour pendant 24 heures" },
    { count: 3, effect: "Le prochain coffre a plus de chances d'être généreux" },
];

function CoffresPlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="Coffres et champignons" note="Chaque champignon mangé remet aussi sur pied. Un même effet repris s'allonge, jusqu'à deux fois sa durée.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {CHESTS.map((c) => (
                    <div key={c.name} className="text-center">
                        <Image src={c.src} alt={`Coffre ${c.name.toLowerCase()}`} width={88} height={88} className="mx-auto" />
                        <p className="mt-1 text-sm font-bold">{c.name}</p>
                        <p className="mt-1 text-[12px] leading-relaxed">{c.loot}</p>
                    </div>
                ))}
            </div>
            <p className={`${LABEL} mt-7`}>Les champignons</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                {SHROOMS.map((s) => (
                    <li key={s.count} className="flex flex-col gap-2 rounded-lg border-2 border-[rgba(26,21,18,0.15)] bg-white/50 p-3">
                        <span className="flex shrink-0 -space-x-3">
                            {Array.from({ length: s.count }, (_, i) => (
                                <Image key={i} src="/badge/champignon.svg" alt="" width={30} height={30} />
                            ))}
                        </span>
                        <span className="text-[12px] leading-snug">{s.effect}</span>
                    </li>
                ))}
            </ul>
        </Plate>
    );
}

function GuildesPlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="Les comptes de la salle">
            <Ledger
                rows={[
                    { icon: <Scroll className="h-full w-full" />, label: "Clouer un appel à l'aide", value: <>− la mise</>, minus: true },
                    { icon: <Scroll className="h-full w-full" />, label: "Chaque dessin en plus sur l'appel", value: <>− 1</>, minus: true },
                    { icon: <Book className="h-full w-full" />, label: "Répondre à l'appel d'un autre", value: <>+ 2</> },
                    { icon: <Coin size={30} />, label: "Chaque voyageur qui te remercie", value: <>+ 1</> },
                    { icon: <Image src="/badge/Valider.svg" alt="" width={36} height={36} />, label: "Ta réponse est validée", value: <>+ toute la mise</> },
                ]}
            />
        </Plate>
    );
}

function BibliothequePlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="Les comptes de la bibliothèque">
            <Ledger
                rows={[
                    { icon: <Book className="h-full w-full" />, label: "Réussir l'épreuve d'une leçon, la première fois", value: <>+ ton score</> },
                    { icon: <Book className="h-full w-full" />, label: "Examen du maître (note sur 20)", value: <>jusqu&apos;à + 100</> },
                    { icon: <Scroll className="h-full w-full" />, label: "Copier un feuillet", value: <>+ 10</> },
                    { icon: <Scroll className="h-full w-full" />, label: "Chaque lecteur qui juge ton feuillet utile", value: <>+ 5</> },
                    { icon: <Book className="h-full w-full" />, label: "Écrire un grimoire entier, par auteur", value: <>+ 20</> },
                ]}
            />
        </Plate>
    );
}

const ROLES = [
    { label: "Attaquant", color: "#d9461b", line: "Frappe les portes adverses" },
    { label: "Défenseur", color: "#2f6fb3", line: "Tient les portes du camp" },
    { label: "Soigneur", color: "#2f8a52", line: "Relève ceux qui tombent" },
];
const RANKS = ["Hameau de Bronze", "Bourg d'Argent", "Cité d'Or", "Forteresse de Saphir", "Citadelle d'Émeraude", "Trône de Diamant"];

function ClansPlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="Rôles et rangs de clan" note="Le vainqueur de la semaine monte d'un rang, le vaincu descend, sauf son meilleur combattant.">
            <div className="grid grid-cols-3 gap-3">
                {ROLES.map((role) => (
                    <div key={role.label} className="flex flex-col items-center text-center">
                        <div className="h-20 w-11">
                            <Banner color={role.color} label={`Bannière ${role.label}`} />
                        </div>
                        <p className="mt-2 text-sm font-bold">{role.label}</p>
                        <p className={`mt-0.5 text-[11px] leading-snug ${MUTED}`}>{role.line}</p>
                    </div>
                ))}
            </div>
            <ol className="mt-6 flex flex-col-reverse gap-1.5" aria-label="Les six rangs, du plus bas au plus haut">
                {RANKS.map((rank, i) => {
                    const top = i === RANKS.length - 1;
                    return (
                        <li key={rank} className="flex items-center gap-3 text-[13px]">
                            <span className="font-mono-ui w-4 text-[11px] text-[rgba(26,21,18,0.45)]">{i + 1}</span>
                            <span className="relative flex-1">
                                <span
                                    aria-hidden="true"
                                    className={`absolute inset-y-0 left-0 rounded-md ${top ? "bg-[#ff6a1a]" : "bg-[rgba(26,21,18,0.09)]"}`}
                                    style={{ width: `${30 + i * 14}%` }}
                                />
                                <span className={`relative block px-2.5 py-1.5 ${top ? "font-bold text-white" : ""}`}>{rank}</span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </Plate>
    );
}

function ArenePlate({ n }: { n: number }) {
    const rules = [
        { k: "3 à 10", v: "énigmes par duel" },
        { k: "48 h", v: "pour répondre" },
        { k: "5", v: "duels à la fois" },
        { k: "0", v: "blessure, jamais" },
    ];
    return (
        <Plate n={n} title="Le règlement de l'arène">
            <div className="grid items-center gap-5 sm:grid-cols-[96px_1fr]">
                <CrossedSwords className="mx-auto h-20 w-20 sm:h-24 sm:w-24" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    {rules.map((r) => (
                        <div key={r.v}>
                            <p className="font-serif-display text-2xl leading-none">{r.k}</p>
                            <p className={`mt-1 text-[12px] leading-snug ${MUTED}`}>{r.v}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border-2 border-[rgba(26,21,18,0.2)] text-center text-[13px]">
                {[
                    ["Victoire", "5"],
                    ["Nul", "3"],
                    ["Défaite", "1"],
                ].map(([label, v]) => (
                    <div key={label} className="border-r-2 border-[rgba(26,21,18,0.12)] px-2 py-2.5 last:border-r-0">
                        <p className="font-semibold">{label}</p>
                        <p className="mt-0.5">
                            {v} <Coin />
                        </p>
                    </div>
                ))}
            </div>
            <p className={`mt-2 text-[12px] ${MUTED}`}>Au plus 5 {PIECES} par jour dans l&apos;arène, quel que soit le nombre de duels.</p>
        </Plate>
    );
}

function VeilleursPlate({ n }: { n: number }) {
    const weeks = [4, 8, 12, 20, 30];
    return (
        <Plate n={n} title="Le pacte du Veilleur" note="Un Veilleur, trois voyageurs, une réponse en moins de 48 heures.">
            <Ledger
                rows={[
                    { icon: <Scroll className="h-full w-full" />, label: "Une tâche confiée, accomplie (30 au plus par jour)", value: <>+ 5</> },
                    { icon: <Image src="/badge/Valider.svg" alt="" width={36} height={36} />, label: "Un objectif atteint", value: <>+ 10</> },
                    { icon: <Book className="h-full w-full" />, label: "Un point d'étape, tous les 14 jours", value: <>+ 3</> },
                ]}
            />
            <p className={`${LABEL} mt-6`}>La flamme du duo</p>
            <div className="mt-3 flex items-end justify-between gap-2">
                {weeks.map((w, i) => (
                    <div key={w} className="flex flex-1 flex-col items-center">
                        <div className="flex h-16 items-end gap-0.5">
                            <Lantern className="w-6" flame={(i + 1) / weeks.length} />
                            <Lantern className="w-6" flame={(i + 1) / weeks.length} />
                        </div>
                        <p className="font-serif-display mt-1.5 text-lg leading-none">{w}</p>
                        <p className="font-mono-ui text-[9px] uppercase tracking-[0.12em] text-[rgba(26,21,18,0.5)]">sem.</p>
                        <p className="mt-1 text-[11px] font-semibold">
                            +15 <Coin size={12} />
                        </p>
                    </div>
                ))}
            </div>
        </Plate>
    );
}

/** La forge : le compteur monte jusqu'à 100, puis la pierre prend sa couleur. Une fois, à l'entrée. */
function ForgePlate({ n }: { n: number }) {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "0px 0px -120px 0px" });
    const [progress, setProgress] = useState(0);
    const count = reduce ? 100 : progress;

    useEffect(() => {
        if (!inView || reduce) return;
        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / 1100);
            setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, reduce]);

    const done = count >= 100;
    return (
        <Plate n={n} title="Au creuset" note="Une pièce fondue ne revient jamais, et ton rang se lit dans ta bourse : ne fonds que le surplus.">
            <div ref={ref} className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                    <Image src="/badge/coin-stack.svg" alt="" width={56} height={56} />
                    <p className="font-serif-display text-4xl tabular-nums leading-none">
                        {count}
                        <span className="ml-1.5 align-middle font-sans text-sm font-semibold text-[rgba(26,21,18,0.5)]">{PIECES}</span>
                    </p>
                </div>
                <span aria-hidden="true" className="text-lg text-[rgba(26,21,18,0.4)]">
                    →
                </span>
                <motion.div
                    className="flex items-center gap-3"
                    initial={false}
                    animate={{ opacity: done ? 1 : 0.3, scale: done ? 1 : 0.96, filter: done ? "grayscale(0)" : "grayscale(1)" }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                    <Image src="/badge/braise.svg" alt={`Une ${PIERRE}`} width={56} height={56} />
                    <p className="font-serif-display text-4xl leading-none">
                        1<span className="ml-1.5 align-middle font-sans text-sm font-semibold text-[rgba(26,21,18,0.5)]">{PIERRE}</span>
                    </p>
                </motion.div>
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full border border-[rgba(26,21,18,0.25)] bg-white" aria-hidden="true">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ff6a1a] to-[#ffb547]" style={{ width: `${count}%` }} />
            </div>
        </Plate>
    );
}

const WARES = [
    { label: "Une teinture pour ton nom", price: "3 à 55" },
    { label: "Un cadre animé pour ton portrait", price: "5 à 50" },
    { label: "Des parures pour ton avatar", price: "3 à 40" },
    { label: "Un portrait de Foxy", price: "2 à 50" },
];

function EchoppePlate({ n }: { n: number }) {
    return (
        <Plate n={n} title="L'échoppe du tailleur" note="Tout ce qui s'achète ici est à toi pour toujours. Les marchands d'au-delà des murs, eux, vendent des choses du vrai monde.">
            <div className="flex justify-center gap-3 sm:justify-start">
                {["FoxyPink", "FoxySably", "FoxyStagey", "FoxyFrenchies"].map((p, i) => (
                    <Image
                        key={p}
                        src={`/profile/${p}.webp`}
                        alt=""
                        width={72}
                        height={72}
                        className={`rounded-xl border-2 border-[#1a1512] bg-white ${i % 2 ? "rotate-2" : "-rotate-2"}`}
                    />
                ))}
            </div>
            <ul className="mt-5 divide-y divide-dashed divide-[rgba(26,21,18,0.15)]">
                {WARES.map((w) => (
                    <li key={w.label} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                        <span>{w.label}</span>
                        <span className="font-mono-ui shrink-0 text-[13px] font-bold">
                            {w.price} <Ember />
                        </span>
                    </li>
                ))}
            </ul>
        </Plate>
    );
}

const PLATES: Record<PlateKind, (p: { n: number }) => ReactNode> = {
    chemin: CheminPlate,
    voyageur: VoyageurPlate,
    lanterne: LanternePlate,
    quetes: QuetesPlate,
    coffres: CoffresPlate,
    guildes: GuildesPlate,
    bibliotheque: BibliothequePlate,
    clans: ClansPlate,
    arene: ArenePlate,
    veilleurs: VeilleursPlate,
    forge: ForgePlate,
    echoppe: EchoppePlate,
};

export function PlateView({ kind, n }: { kind: PlateKind; n: number }) {
    const Component = PLATES[kind];
    return <Component n={n} />;
}

