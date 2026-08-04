import Link from "next/link";
import { ArrowRight, Flame, MessagesSquare } from "lucide-react";
import HeroForumCards from "./hero-forum-cards";
import CourseFinder from "./course-finder";

/* Promesses — nos engagements, pas des métriques d'usage. Elles tiennent
   debout le jour 1 comme le jour 1000. Posées en colophon typographique
   plutôt qu'en cartes : moins de matière, plus de tenue. */
const PROMESSES = [
    { value: "0 €", label: "aucun abonnement" },
    { value: "0", label: "publicité, jamais" },
    { value: "100 %", label: "bénévole · asso 1901" },
    { value: "∞", label: "entraide ouverte" },
];

export default function Hero2026() {
    return (
        /* Fond transparent : l'ambiance (halo, trame de cahier, grain) est
           portée par HeroBackdrop au niveau de la page, pour qu'elle passe
           aussi derrière la navbar au lieu de s'arrêter net sous elle. */
        <section
            id="top"
            className="relative overflow-hidden text-[var(--wk-ink)]"
        >
            <div className="relative mx-auto max-w-[1400px] px-4 pb-20 pt-12 md:pb-28 lg:pt-16">
                <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
                    {/* ---------------- Colonne éditoriale ---------------- */}
                    <div className="lg:col-span-7">
                        <div
                            className="wk-rise font-mono-ui flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[rgba(26,21,18,0.55)]"
                            style={{ animationDelay: "0.05s" }}
                        >
                            <span className="inline-block w-10 border-t border-[rgba(26,21,18,0.3)]" />
                            Association loi 1901 · depuis 2020
                        </div>

                        <h1 className="font-serif-display mt-6 tracking-[-0.025em]">
                            <span
                                className="wk-rise block text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.86]"
                                style={{ animationDelay: "0.12s" }}
                            >
                                Apprendre,
                            </span>
                            <span
                                className="wk-rise block text-[clamp(2.75rem,9vw,6.5rem)] italic leading-[0.86] text-[rgba(26,21,18,0.45)]"
                                style={{ animationDelay: "0.19s" }}
                            >
                                gratuitement,
                            </span>
                            <span
                                className="wk-rise mt-1 block text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.86]"
                                style={{ animationDelay: "0.26s" }}
                            >
                                <span className="relative inline-block">
                                    <span className="relative z-10">sans stress</span>
                                    <svg
                                        className="absolute -bottom-1 left-0 h-[0.16em] w-full"
                                        viewBox="0 0 400 14"
                                        preserveAspectRatio="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            className="wk-draw"
                                            d="M2 10 C 80 2, 180 14, 398 6"
                                            stroke="var(--wk-accent)"
                                            strokeWidth="6"
                                            fill="none"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                                <span className="text-[var(--wk-accent)]">.</span>
                            </span>
                        </h1>

                        <p
                            className="wk-rise mt-8 max-w-[46ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]"
                            style={{ animationDelay: "0.33s" }}
                        >
                            Cours, fiches de révision et forum d&apos;aide aux devoirs,
                            écrits par des bénévoles. Du collège au supérieur — et
                            aucun compte n&apos;est nécessaire pour commencer à lire.
                        </p>

                        <div
                            className="wk-rise mt-10 max-w-2xl"
                            style={{ animationDelay: "0.4s" }}
                        >
                            <CourseFinder />
                        </div>

                        <Link
                            href="/forum"
                            className="wk-rise group mt-6 inline-flex items-center gap-2.5 text-sm font-semibold text-[rgba(26,21,18,0.7)] transition-colors hover:text-[var(--wk-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--wk-accent)]"
                            style={{ animationDelay: "0.47s" }}
                        >
                            <MessagesSquare className="h-4 w-4" />
                            <span className="border-b border-[rgba(26,21,18,0.2)] pb-0.5 transition-colors group-hover:border-[var(--wk-accent)]">
                                Bloqué sur un exercice ? Pose ta question au forum
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {/* ---------------- Aperçu produit ----------------
                        Débordement volontaire hors de la colonne et légère
                        rotation : la composition respire au lieu d'être deux
                        blocs alignés au cordeau. */}
                    <div
                        className="wk-rise relative lg:col-span-5 lg:-mr-6 xl:-mr-14"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <div className="relative mx-auto max-w-[520px] lg:max-w-none lg:rotate-[1.2deg]">
                            {/* Micro-carte flottante — la profondeur vient de la
                                superposition, pas d'un effet décoratif. */}
                            <div className="absolute -left-3 -top-5 z-20 flex items-center gap-2.5 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white px-3.5 py-2.5 shadow-[0_12px_32px_rgba(26,21,18,0.12)] lg:-left-10">
                                <Flame className="h-5 w-5 text-[var(--wk-accent)]" />
                                <div>
                                    <div className="font-mono-ui text-[9px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.5)]">
                                        série
                                    </div>
                                    <div className="font-serif-display text-lg leading-none">
                                        7 jours
                                    </div>
                                </div>
                            </div>

                            <div className="wk-window">
                                <div className="wk-window-bar">
                                    <span className="wk-window-dot" aria-hidden="true" />
                                    <span className="wk-window-dot" aria-hidden="true" />
                                    <span className="wk-window-dot" aria-hidden="true" />
                                    <span className="font-mono-ui ml-2 truncate text-[11px] text-[rgba(26,21,18,0.4)]">
                                        workyt.fr/forum
                                    </span>
                                </div>
                                <div className="bg-[var(--wk-paper)] p-4 sm:p-5">
                                    <HeroForumCards />
                                </div>
                            </div>
                        </div>

                        <p className="font-mono-ui mt-5 text-center text-[10px] uppercase tracking-[0.2em] text-[rgba(26,21,18,0.4)] lg:pr-6 xl:pr-14">
                            Aperçu du forum d&apos;entraide
                        </p>
                    </div>
                </div>

                {/* ---------------- Colophon ---------------- */}
                <div
                    className="wk-rise mt-20 grid grid-cols-2 gap-y-8 border-t border-[rgba(26,21,18,0.14)] pt-8 md:grid-cols-4 md:gap-y-0"
                    style={{ animationDelay: "0.55s" }}
                >
                    {PROMESSES.map((p, i) => (
                        /* Le filet ne se pose qu'aux séparations réelles :
                           en 2 colonnes ce sont les items impairs, en 4 colonnes
                           tous sauf le premier. */
                        <div
                            key={p.label}
                            className={`border-[rgba(26,21,18,0.14)] ${
                                i % 2 === 1 ? "border-l pl-4" : "pr-4"
                            } ${
                                i === 0
                                    ? "md:border-l-0 md:pl-0"
                                    : "md:border-l md:pl-6"
                            }`}
                        >
                            <div className="font-serif-display text-4xl leading-none text-[var(--wk-ink)] md:text-5xl">
                                {p.value}
                            </div>
                            <div className="font-mono-ui mt-2 text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.5)]">
                                {p.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
