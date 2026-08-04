import Link from "next/link";
import {
    ArrowRight,
    CheckCircle,
    FileText,
    Flame,
    Gem,
    Heart,
    MessageCircle,
    Target,
} from "lucide-react";

/* Section volontairement resserrée.
   L'ancienne version empilait des WobbleCard en dégradés émeraude, teal et
   jaune — une palette qui n'est pas celle du site, sur une hauteur de trois
   écrans. Tout le contenu est conservé (sources de points, paliers de série,
   mondes, gemmes), mais présenté en trois blocs lisibles d'un coup d'œil. */

const POINT_SOURCES = [
    { action: "Créer une fiche de révision", points: "+10", icon: FileText },
    { action: "Compléter un quiz", points: "+score", icon: Target },
    { action: "Like reçu sur une fiche", points: "+5", icon: Heart },
    { action: "Répondre sur le forum", points: "+2", icon: MessageCircle },
    { action: "Réponse validée par l'auteur", points: "variable", icon: CheckCircle },
];

const STREAK_MILESTONES = [
    { days: 3, label: "Naissante", reward: "+5 pts" },
    { days: 7, label: "Stable", reward: "+15 pts · 1 champignon" },
    { days: 14, label: "Ardente", reward: "+30 pts · 1 champignon" },
    { days: 30, label: "Infernale", reward: "+50 pts · 1 gemme" },
    { days: 60, label: "Éternelle", reward: "+100 pts · 2 gemmes" },
    { days: 100, label: "Légendaire", reward: "+200 pts · 5 gemmes" },
];

const WORLDS = [
    { name: "Mangas", levels: "1-3", color: "#f43f5e" },
    { name: "Français", levels: "4-6", color: "#3b82f6" },
    { name: "Renards", levels: "7-9", color: "#ec4899" },
    { name: "Québec", levels: "10-12", color: "#dc2626" },
    { name: "Égypte", levels: "13-15", color: "#d97706" },
    { name: "Neiges", levels: "16-18", color: "#06b6d4" },
    { name: "Imaginaire", levels: "19-21", color: "#a855f7" },
];

export function GamificationSection() {
    return (
        <section
            id="gamification"
            className="relative bg-[var(--wk-paper-2)] px-4 py-20 md:py-28"
        >
            <div className="mx-auto max-w-[1400px]">
                {/* En-tête */}
                <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                        <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)]">
                            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                            <span>04</span>
                            <span>Progression</span>
                        </div>
                        <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                            Ce que tu donnes,{" "}
                            <span className="wk-underline italic text-[var(--wk-accent)]">
                                tu le récupères
                            </span>
                            .
                        </h2>
                    </div>
                    <p className="max-w-sm leading-relaxed text-[rgba(26,21,18,0.7)]">
                        Aider quelqu&apos;un rapporte autant que réviser. Les points
                        te font monter les niveaux, les niveaux ouvrent les mondes,
                        et les gemmes personnalisent ton profil.
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-12">
                    {/* ---- Gagner des points ---- */}
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 md:p-8 lg:col-span-5">
                        <div className="font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[var(--wk-accent)]">
                            01 · Gagner
                        </div>
                        <h3 className="font-serif-display mt-2 text-2xl">
                            Chaque action compte
                        </h3>

                        <ul className="mt-6 divide-y divide-[rgba(26,21,18,0.08)] border-y border-[rgba(26,21,18,0.08)]">
                            {POINT_SOURCES.map(({ action, points, icon: Icon }) => (
                                <li
                                    key={action}
                                    className="flex items-center justify-between gap-4 py-3"
                                >
                                    <span className="flex items-center gap-3 text-sm text-[rgba(26,21,18,0.75)]">
                                        <Icon className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.35)]" />
                                        {action}
                                    </span>
                                    <span className="font-serif-display shrink-0 text-lg text-[var(--wk-ink)]">
                                        {points}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <p className="font-mono-ui mt-5 text-[11px] uppercase tracking-[0.14em] text-[rgba(26,21,18,0.45)]">
                            20 points offerts à l&apos;inscription
                        </p>
                    </div>

                    {/* ---- La série ---- */}
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 md:p-8 lg:col-span-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[var(--wk-accent)]">
                                    02 · Tenir
                                </div>
                                <h3 className="font-serif-display mt-2 text-2xl">
                                    La série quotidienne
                                </h3>
                            </div>
                            <Flame className="h-7 w-7 shrink-0 text-[var(--wk-accent)]" />
                        </div>

                        {/* Ligne de paliers — une seule rangée, pas six cartes */}
                        <ol className="mt-7 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-6">
                            {STREAK_MILESTONES.map((m, i) => (
                                <li key={m.days} className="relative">
                                    <div
                                        className="mb-3 h-1 rounded-full"
                                        style={{
                                            background: `color-mix(in srgb, var(--wk-accent) ${20 + i * 16}%, rgba(26,21,18,0.08))`,
                                        }}
                                    />
                                    <div className="font-serif-display text-2xl leading-none">
                                        {m.days}
                                        <span className="font-mono-ui ml-0.5 text-[10px] uppercase text-[rgba(26,21,18,0.45)]">
                                            j
                                        </span>
                                    </div>
                                    <div className="mt-1.5 text-xs font-semibold text-[var(--wk-ink)]">
                                        {m.label}
                                    </div>
                                    <div className="mt-0.5 text-[11px] leading-snug text-[rgba(26,21,18,0.55)]">
                                        {m.reward}
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <p className="mt-7 border-t border-[rgba(26,21,18,0.08)] pt-5 text-sm text-[rgba(26,21,18,0.65)]">
                            Une quête quotidienne, une récompense mensuelle le 15, et un
                            coffre garanti les jours fériés. Rater un jour ne remet pas
                            tout à zéro — les champignons protègent la série.
                        </p>
                    </div>

                    {/* ---- Les mondes ---- */}
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 md:p-8 lg:col-span-7">
                        <div className="font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[var(--wk-accent)]">
                            03 · Traverser
                        </div>
                        <h3 className="font-serif-display mt-2 text-2xl">
                            Vingt-et-un niveaux, sept mondes
                        </h3>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {WORLDS.map((w) => (
                                <span
                                    key={w.name}
                                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] py-1.5 pl-2.5 pr-3 text-sm"
                                >
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{ background: w.color }}
                                        aria-hidden="true"
                                    />
                                    <span className="font-semibold">{w.name}</span>
                                    <span className="font-mono-ui text-[10px] text-[rgba(26,21,18,0.45)]">
                                        {w.levels}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ---- Les gemmes ---- */}
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-ink)] p-6 text-[var(--wk-paper)] md:p-8 lg:col-span-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[var(--wk-accent-2)]">
                                    04 · Dépenser
                                </div>
                                <h3 className="font-serif-display mt-2 text-2xl">
                                    Gemmes &amp; boutique
                                </h3>
                            </div>
                            <Gem className="h-7 w-7 shrink-0 text-[var(--wk-accent-2)]" />
                        </div>

                        <p className="mt-4 text-sm leading-relaxed text-[rgba(253,250,244,0.7)]">
                            Couleurs de pseudo, avatars Foxy, contours de profil et
                            badges. Purement cosmétique — aucune gemme n&apos;achète
                            un contenu ni un avantage.
                        </p>

                        <Link
                            href="/recompenses"
                            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--wk-accent-2)] transition hover:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--wk-accent-2)]"
                        >
                            Voir les récompenses
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* ---- Discord ----
                    Sa place est ici : on parle d'appartenance et de progression,
                    c'est exactement ce que le serveur apporte. Le CTA de
                    conversion, lui, est en fin de page. */}
                <div className="mt-5 flex flex-col items-start justify-between gap-6 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 md:flex-row md:items-center md:p-8">
                    <div className="max-w-xl">
                        <h3 className="font-serif-display text-2xl leading-tight md:text-3xl">
                            Réviser seul, c&apos;est dur.{" "}
                            <span className="italic text-[var(--wk-accent)]">
                                À plusieurs, moins.
                            </span>
                        </h3>
                        <p className="mt-2.5 text-sm leading-relaxed text-[rgba(26,21,18,0.65)]">
                            Salons d&apos;étude en vocal, entraide en direct, défis entre
                            clans et sessions de révision avant les épreuves.
                        </p>
                    </div>
                    <a
                        href="https://dc.gg/workyt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wk-btn-ink shrink-0 justify-center"
                    >
                        Rejoindre le Discord
                        <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </section>
    );
}
