"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import { FlameLogo, FoxyMark } from "./art";
import { PlateView } from "./plates";
import { CHAPTERS, KEY, PIECES, PIERRE, PIERRES, type Chapter, type Journal } from "./story";

/*
 * Mise en page éditoriale, DA du site en version nuit : encre, papier, une seule couleur d'accent.
 * Le récit reste dans la fiction ; les planches (plates.tsx) résument chaque règle en image,
 * et la « Légende de la carte », à la fin, est le seul pont vers les vraies pages du site.
 * Le mouvement reste discret : une montée de 12 px à l'entrée, une seule fois,
 * jamais sur le texte qu'on lit.
 */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Numéro de la première planche de chaque chapitre (les planches sont numérotées sur tout le livre). */
const PLATE_START = CHAPTERS.reduce<number[]>((acc, _c, i) => {
    acc.push(i === 0 ? 1 : acc[i - 1] + (CHAPTERS[i - 1].plates?.length ?? 0));
    return acc;
}, []);

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -80px 0px" }}
            transition={{ duration: 0.5, delay, ease: EASE_OUT }}
        >
            {children}
        </motion.div>
    );
}

export default function LegendeStory() {
    return (
        <MotionConfig reducedMotion="user">
            <main className="legende relative overflow-x-clip bg-[#14100d] text-[#e9dccb]">
                <Hero />
                <div className="mx-auto max-w-6xl px-4 sm:px-8">
                    {CHAPTERS.map((chapter, i) => (
                        <ChapterSection key={chapter.id} chapter={chapter} index={i} plateStart={PLATE_START[i]} />
                    ))}
                </div>
                <MapKey />
                <Outro />
            </main>
        </MotionConfig>
    );
}

/* ------------------------------------------------------------------ */
/* Ouverture                                                           */
/* ------------------------------------------------------------------ */

function Hero() {
    return (
        <header className="relative overflow-hidden border-b border-[rgba(233,220,203,0.08)]">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(55%_60%_at_78%_45%,rgba(255,106,26,0.16),transparent_70%)]" />

            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-8 lg:grid-cols-12 lg:pb-28 lg:pt-24">
                <div className="lg:col-span-7">
                    <p
                        className="wk-rise font-mono-ui flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[rgba(233,220,203,0.55)]"
                        style={{ animationDelay: "0.05s" }}
                    >
                        <span className="inline-block w-10 border-t border-[rgba(233,220,203,0.3)]" />
                        Un conte du royaume · {CHAPTERS.length} chapitres
                    </p>

                    <h1 className="font-serif-display mt-6 tracking-[-0.025em] text-[#fff3e2]">
                        <span className="wk-rise block text-[clamp(2.75rem,8vw,5.75rem)] leading-[0.9]" style={{ animationDelay: "0.12s" }}>
                            La flamme
                        </span>
                        <span
                            className="wk-rise block text-[clamp(2.75rem,8vw,5.75rem)] italic leading-[0.9] text-[rgba(233,220,203,0.45)]"
                            style={{ animationDelay: "0.19s" }}
                        >
                            et le renard<span className="not-italic text-[var(--wk-accent)]">.</span>
                        </span>
                    </h1>

                    <p className="wk-rise mt-8 max-w-[48ch] text-lg leading-relaxed text-[rgba(233,220,203,0.72)]" style={{ animationDelay: "0.28s" }}>
                        Un royaume rongé par une brume qui éteint les gens un par un. Une tour au sommet de laquelle brûle une
                        flamme que rien n&apos;a jamais éteinte. Et toi, une lanterne presque vide à la main.
                    </p>
                    <p className="wk-rise mt-4 max-w-[52ch] leading-relaxed text-[rgba(233,220,203,0.6)]" style={{ animationDelay: "0.34s" }}>
                        Voici comment on gagne des {PIECES}, pourquoi on les fond en {PIERRES}, et ce qui attend en haut de la
                        tour. Les chiffres qu&apos;on y croise sont vrais, et au dos de la carte, à la fin, chaque lieu du royaume a son nom sur le site.
                    </p>

                    <a
                        href={`#${CHAPTERS[0].id}`}
                        className="wk-rise group mt-10 inline-flex items-center gap-2.5 text-sm font-semibold text-[rgba(233,220,203,0.7)] transition-colors hover:text-[var(--wk-accent)]"
                        style={{ animationDelay: "0.4s" }}
                    >
                        <span className="border-b border-[rgba(233,220,203,0.2)] pb-0.5 transition-colors group-hover:border-[var(--wk-accent)]">
                            Passer la porte
                        </span>
                        <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">↓</span>
                    </a>
                </div>

                {/* Les deux monnaies, posées comme des objets sur la table. */}
                <div className="wk-rise relative lg:col-span-5" style={{ animationDelay: "0.3s" }}>
                    <div className="relative mx-auto grid max-w-[440px] grid-cols-2 gap-4">
                        <CurrencyCard
                            src="/badge/coin-stack.svg"
                            name={PIECES}
                            line="La pièce que l'on gagne"
                            fact="20 offertes à l'arrivée"
                            className="lg:-rotate-[1.5deg]"
                        />
                        <CurrencyCard
                            src="/badge/braise.svg"
                            name={PIERRES}
                            line="La pierre que l'on forge"
                            fact={`100 ${PIECES} = 1 ${PIERRE}`}
                            className="mt-10 lg:rotate-[1.5deg]"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}

function CurrencyCard({ src, name, line, fact, className = "" }: { src: string; name: string; line: string; fact: string; className?: string }) {
    return (
        <div className={`rounded-2xl border border-[rgba(233,220,203,0.1)] bg-[#1f1915] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.35)] ${className}`}>
            <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24">
                <Image src={src} alt="" fill sizes="96px" />
            </div>
            <p className="font-serif-display mt-4 text-2xl leading-none">{name}</p>
            <p className="mt-1.5 text-sm text-[rgba(233,220,203,0.6)]">{line}</p>
            <p className="font-mono-ui mt-4 border-t border-dashed border-[rgba(233,220,203,0.15)] pt-3 text-[11px] uppercase tracking-[0.12em] text-[#ff9a4a]">
                {fact}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Chapitres                                                           */
/* ------------------------------------------------------------------ */

function ChapterSection({ chapter, index, plateStart }: { chapter: Chapter; index: number; plateStart: number }) {
    const side = index % 2 === 0 ? "left" : "right";
    return (
        <section
            id={chapter.id}
            aria-labelledby={`${chapter.id}-titre`}
            className="grid scroll-mt-24 gap-x-12 gap-y-8 border-b border-[rgba(233,220,203,0.08)] py-16 last:border-b-0 sm:py-24 lg:grid-cols-12"
        >
            {/* Colonne de repère : reste à l'écran pendant la lecture du chapitre. */}
            <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                    <Reveal>
                        <p className="font-mono-ui flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[rgba(233,220,203,0.5)]">
                            <span className="inline-block w-6 border-t border-[rgba(233,220,203,0.3)]" />
                            {chapter.kicker}
                        </p>
                        <h2 id={`${chapter.id}-titre`} className="font-serif-display mt-4 text-[#fff3e2] text-[2.5rem] leading-[1.02] tracking-[-0.02em] sm:text-5xl">
                            {chapter.title}
                        </h2>
                    </Reveal>
                    <Reveal delay={0.08} className="mt-6">
                        <Purse wallet={chapter.wallet} />
                    </Reveal>
                </div>
            </div>

            <div className="lg:col-span-8">
                <div className="legende-prose max-w-[62ch] space-y-5 text-[17px] leading-[1.8] text-[rgba(233,220,203,0.82)]">{chapter.body}</div>

                {chapter.plates?.map((kind, i) => (
                    <Reveal key={kind} className="mt-12 max-w-xl">
                        <PlateView kind={kind} n={plateStart + i} />
                    </Reveal>
                ))}

                {chapter.journal && <JournalCard journal={chapter.journal} side={side} />}
            </div>
        </section>
    );
}

/** L'état de la bourse à ce moment du récit. */
function Purse({ wallet }: { wallet: Chapter["wallet"] }) {
    return (
        <div
            className="inline-flex items-center gap-4 rounded-full border border-[rgba(233,220,203,0.1)] bg-[#1f1915] py-1.5 pl-2 pr-4 text-sm font-semibold tabular-nums"
            aria-label={`Ta bourse à ce moment : ${wallet.wyts} ${PIECES}, ${wallet.braises} ${PIERRES}`}
        >
            <span className="font-mono-ui rounded-full bg-[rgba(255,255,255,0.07)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[rgba(233,220,203,0.55)]">
                Bourse
            </span>
            <span className="flex items-center gap-1.5">
                <Image src="/badge/coin.svg" alt="" width={18} height={18} />
                {wallet.wyts}
            </span>
            <span className={`flex items-center gap-1.5 ${wallet.braises === 0 ? "text-[rgba(233,220,203,0.35)]" : ""}`}>
                <Image src="/badge/braise.svg" alt="" width={18} height={18} className={wallet.braises === 0 ? "opacity-40 grayscale" : ""} />
                {wallet.braises}
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* La légende de la carte                                               */
/* ------------------------------------------------------------------ */

/** Le seul endroit où le conte rejoint le site : chaque élément du royaume et son vrai nom. */
function MapKey() {
    return (
        <section aria-labelledby="carte-titre" className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
            <Reveal>
                <div className="legende-plate legende-map px-5 py-8 sm:px-10 sm:py-12">
                    <p className="font-mono-ui flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[rgba(26,21,18,0.5)]">
                        <span className="inline-block w-6 border-t border-[rgba(26,21,18,0.3)]" />
                        Au dos de la carte
                    </p>
                    <h2 id="carte-titre" className="font-serif-display mt-4 text-[2.5rem] leading-[1.02] tracking-[-0.02em] sm:text-5xl">
                        La légende de la carte
                    </h2>
                    <p className="mt-4 max-w-[54ch] leading-relaxed text-[rgba(26,21,18,0.68)]">
                        Tout ce que tu viens de lire existe vraiment. Voici, pour chaque lieu du royaume, son nom sur Workyt.
                    </p>
                    <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
                        {KEY.map((entry) => {
                            const inner = (
                                <>
                                    <span className="font-serif-display text-[17px] leading-snug">{entry.fiction}</span>
                                    <span className="flex items-center gap-2 text-[14px] text-[rgba(26,21,18,0.62)]">
                                        <span aria-hidden="true" className="text-[#c24a0a]">→</span>
                                        <span className={entry.href ? "font-semibold text-[var(--wk-ink)] group-hover:underline" : ""}>{entry.reel}</span>
                                    </span>
                                </>
                            );
                            const cls = "group flex flex-col gap-1 border-b border-dashed border-[rgba(26,21,18,0.15)] py-3";
                            return (
                                <li key={entry.fiction}>
                                    {entry.href && entry.external ? (
                                        <a href={entry.href} target="_blank" rel="noopener noreferrer" className={cls}>
                                            {inner}
                                        </a>
                                    ) : entry.href ? (
                                        <Link href={entry.href} className={cls}>
                                            {inner}
                                        </Link>
                                    ) : (
                                        <div className={cls}>{inner}</div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Reveal>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Journaux                                                            */
/* ------------------------------------------------------------------ */

const JOURNAL_STYLE: Record<Journal["kind"], string> = {
    carnet: "legende-carnet",
    ordre: "legende-ordre",
    parchemin: "legende-parchemin",
    registre: "legende-registre",
    gazette: "legende-gazette",
    forge: "legende-forgebook",
};

function JournalCard({ journal, side }: { journal: Journal; side: "left" | "right" }) {
    // Légère inclinaison fixe : un papier posé à la main, pas un effet d'entrée.
    const tilt = side === "left" ? "lg:-rotate-[0.8deg]" : "lg:translate-x-10 lg:rotate-[0.8deg]";
    return (
        <Reveal className="mt-12">
            <aside
                aria-label={`${journal.title}${journal.subtitle ? `, ${journal.subtitle}` : ""}`}
                className={`legende-journal ${JOURNAL_STYLE[journal.kind]} relative max-w-lg ${tilt}`}
            >
                {journal.kind === "parchemin" && <span aria-hidden="true" className="legende-pin" />}
                <JournalHeader journal={journal} />
                <div className="mt-4 space-y-3 text-[15px] leading-relaxed">{journal.content}</div>
                {journal.kind === "ordre" && (
                    <span aria-hidden="true" className="legende-seal">
                        <FlameLogo className="h-6 w-6" color="#fff4e0" />
                    </span>
                )}
            </aside>
        </Reveal>
    );
}

function JournalHeader({ journal }: { journal: Journal }) {
    if (journal.kind === "gazette") {
        return (
            <div className="border-b-2 border-double border-[rgba(26,21,18,0.55)] pb-2 text-center">
                <p className="font-serif-display text-2xl tracking-tight">{journal.title}</p>
                {journal.subtitle && <p className="font-mono-ui text-[10px] uppercase tracking-[0.2em] opacity-60">{journal.subtitle}</p>}
            </div>
        );
    }
    return (
        <div className="flex items-center gap-3">
            {journal.kind === "carnet" && <FoxyMark className="h-9 w-9 shrink-0" />}
            <div>
                <p className="font-serif-display text-xl leading-tight">{journal.title}</p>
                {journal.subtitle && <p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] opacity-60">{journal.subtitle}</p>}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Fin                                                                 */
/* ------------------------------------------------------------------ */

function Outro() {
    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <Reveal>
                <div className="relative overflow-hidden rounded-[28px] border border-[rgba(233,220,203,0.1)] bg-[radial-gradient(70%_90%_at_85%_0%,rgba(255,106,26,0.22),transparent_70%),#1f1915] px-6 py-12 text-[var(--wk-paper)] sm:px-12 sm:py-16">
                    <FlameLogo className="absolute -right-10 -top-6 h-64 w-64 opacity-[0.07] sm:h-80 sm:w-80" color="#fdfaf4" />
                    <FlameLogo className="h-12 w-12" color="var(--wk-accent)" />
                    <p className="font-serif-display mt-6 max-w-[18ch] text-4xl leading-[1.02] tracking-[-0.02em] sm:text-5xl">
                        La suite s&apos;écrit <span className="italic text-[var(--wk-accent-2)]">chez toi</span>.
                    </p>
                    <p className="mt-4 max-w-[46ch] leading-relaxed text-[rgba(253,250,244,0.7)]">
                        Tes vingt premiers {PIECES} t&apos;attendent déjà. Le reste se gagne une réponse, une leçon, une bataille à
                        la fois.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/cours" className="wk-btn-orange">
                            Faire mon premier quiz
                        </Link>
                        <Link
                            href="/forum"
                            className="inline-flex items-center rounded-full border border-[rgba(253,250,244,0.25)] px-6 py-3.5 font-semibold transition-colors hover:bg-[rgba(253,250,244,0.08)]"
                        >
                            Clouer une quête
                        </Link>
                    </div>
                </div>
            </Reveal>
            <div aria-hidden="true" className="relative left-1/2 mt-24 h-32 w-screen -translate-x-1/2 bg-gradient-to-b from-[#14100d] to-[var(--wk-paper)]" />
        </div>
    );
}
