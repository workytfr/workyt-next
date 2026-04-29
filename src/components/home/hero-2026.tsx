import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    Play,
    Flame,
    Sparkles,
} from "lucide-react";
import HeroForumCards from "./hero-forum-cards";

const SUBJECTS = [
    "Maths",
    "SVT",
    "Français",
    "Anglais",
    "Physique-Chimie",
    "Histoire-Géo",
    "Philo",
    "NSI",
    "SES",
    "Espagnol",
    "Allemand",
    "Brevet",
    "Bac",
];

// Étoiles scintillantes positionnées aléatoirement sur le hero
const SPARKLES = [
    { top: "8%", left: "22%", size: 14, delay: "0s" },
    { top: "14%", left: "56%", size: 12, delay: "0.3s" },
    { top: "18%", left: "12%", size: 14, delay: "0.6s" },
    { top: "32%", left: "44%", size: 10, delay: "0.9s" },
    { top: "62%", left: "8%", size: 12, delay: "1.2s" },
    { top: "24%", left: "78%", size: 16, delay: "1.5s" },
    { top: "72%", left: "54%", size: 9, delay: "1.8s" },
    { top: "48%", left: "92%", size: 13, delay: "2.1s" },
    { top: "82%", left: "28%", size: 11, delay: "2.4s" },
    { top: "6%", left: "88%", size: 15, delay: "2.7s" },
];

// Emoji stickers décoratifs qui wobble — limités aux zones sans contenu
const EMOJI_STICKERS = [
    { top: "6%", left: "4%", emoji: "🎓", size: "text-3xl", rotate: "-16deg", delay: "1s" },
    { top: "52%", left: "2%", emoji: "💡", size: "text-2xl", rotate: "-6deg", delay: "2s" },
    { top: "82%", left: "38%", emoji: "📝", size: "text-2xl", rotate: "10deg", delay: "1.5s" },
];

export default function Hero2026() {
    return (
        <section
            id="top"
            className="wk-grain wk-gradient-peach relative overflow-hidden text-[var(--wk-ink)]"
        >
            {/* Notebook grid underneath the gradient */}
            <div
                className="wk-cahier pointer-events-none absolute inset-0 opacity-[0.55]"
                style={{ zIndex: 0 }}
            />

            {/* Sparkles flottantes */}
            {SPARKLES.map((s, i) => (
                <div
                    key={i}
                    className="wk-twinkle pointer-events-none absolute"
                    style={{
                        top: s.top,
                        left: s.left,
                        animationDelay: s.delay,
                        zIndex: 1,
                    }}
                    aria-hidden="true"
                >
                    <Sparkles
                        className="text-[var(--wk-accent)]"
                        style={{ width: s.size, height: s.size }}
                    />
                </div>
            ))}

            {/* Emoji stickers décoratifs (wobble subtil) */}
            {EMOJI_STICKERS.map((e, i) => (
                <div
                    key={`emoji-${i}`}
                    className={`wk-wobble pointer-events-none absolute hidden select-none md:block ${e.size}`}
                    style={{
                        top: e.top,
                        left: e.left,
                        ["--wobble-base" as string]: e.rotate,
                        animationDelay: e.delay,
                        zIndex: 1,
                    }}
                    aria-hidden="true"
                >
                    {e.emoji}
                </div>
            ))}

            {/* Confetti qui tombent en arrière-plan */}
            <div className="pointer-events-none absolute inset-x-0 top-0 hidden md:block" style={{ zIndex: 1 }}>
                {[
                    { left: "8%", color: "#ff6a1a", delay: "0s", duration: "5s" },
                    { left: "22%", color: "#ffb547", delay: "1.2s", duration: "6s" },
                    { left: "41%", color: "#7ed957", delay: "2.4s", duration: "4.5s" },
                    { left: "67%", color: "#6ec1e4", delay: "0.8s", duration: "5.5s" },
                    { left: "86%", color: "#c77dff", delay: "2s", duration: "6.5s" },
                    { left: "94%", color: "#ff6a1a", delay: "3.2s", duration: "5s" },
                ].map((c, i) => (
                    <span
                        key={i}
                        className="wk-confetti absolute block h-2 w-2 rounded-sm"
                        style={{
                            left: c.left,
                            background: c.color,
                            animationDelay: c.delay,
                            animationDuration: c.duration,
                        }}
                        aria-hidden="true"
                    />
                ))}
            </div>

            {/* A+ sticker — posé dans la marge gauche, sous la mi-hauteur du hero */}
            <div
                className="wk-wobble pointer-events-none absolute bottom-32 left-4 hidden md:block lg:left-8"
                style={{ ["--wobble-base" as string]: "-14deg", zIndex: 3 }}
            >
                <Image
                    src="/notation.png"
                    alt=""
                    width={96}
                    height={96}
                    className="w-[72px] lg:w-[96px]"
                />
            </div>

            <div className="relative mx-auto max-w-[1400px] px-4 pb-6 pt-6 lg:pb-10 lg:pt-6" style={{ zIndex: 2 }}>
                <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-8">
                    {/* LEFT — copy */}
                    <div className="relative flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
                        <span className="wk-chip wk-bounce-in mt-3 !border-[rgba(26,21,18,0.1)] !bg-white/90 !text-[var(--wk-ink)]">
                            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--wk-accent-4)]" />
                            <span>Asso loi 1901 · 100 % bénévole · zéro pub</span>
                        </span>

                        <h1 className="font-serif-display mt-3 tracking-tight leading-[0.95]">
                            <span className="wk-bounce-in block text-5xl sm:text-6xl md:text-7xl xl:text-[96px]" style={{ animationDelay: "0.1s" }}>
                                Apprendre,
                            </span>
                            <span className="wk-bounce-in block text-5xl italic sm:text-6xl md:text-7xl xl:text-[96px]" style={{ animationDelay: "0.25s" }}>
                                gratuitement,
                            </span>
                            <span className="wk-bounce-in mt-1 block text-5xl sm:text-6xl md:text-7xl xl:text-[96px]" style={{ animationDelay: "0.4s" }}>
                                <span className="relative inline-block">
                                    <span className="relative z-10">sans stress</span>
                                    <svg
                                        className="absolute -bottom-2 left-0 h-4 w-full"
                                        viewBox="0 0 400 14"
                                        preserveAspectRatio="none"
                                    >
                                        <path
                                            className="wk-draw"
                                            d="M2 10 C 80 2, 180 14, 398 6"
                                            stroke="var(--wk-accent)"
                                            strokeWidth="5"
                                            fill="none"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                                .
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-relaxed text-[rgba(26,21,18,0.72)] sm:text-lg">
                            La plate-forme d&apos;apprentissage gratuite portée par
                            une asso de 100+ bénévoles. Cours, fiches, forum d&apos;aide aux
                            devoirs, quiz et récompenses — pour le collège, le lycée, et
                            la vraie vie après.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                            <Link
                                href="/cours"
                                className="wk-btn-orange wk-animate-shine wk-pulse-glow"
                            >
                                Commencer gratuitement
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href="/cours" className="wk-btn-ghost">
                                <Play className="h-3.5 w-3.5 fill-current" />
                                Voir comment ça marche
                            </Link>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Image
                                        key={i}
                                        src={`/avatars/${i}.png`}
                                        alt=""
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded-full border-2 border-white bg-white object-cover ring-1 ring-[rgba(26,21,18,0.1)]"
                                    />
                                ))}
                                <div className="font-mono-ui flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[var(--wk-ink)] px-1 text-[10px] font-semibold text-[var(--wk-paper)]">
                                    Toi&nbsp;?
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[rgba(26,21,18,0.7)]">
                                <Sparkles className="h-4 w-4 text-[var(--wk-accent-2)]" />
                                <span className="text-sm">
                                    <b className="text-[var(--wk-ink)]">Communauté qui démarre</b> — viens construire avec nous.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — live forum feed */}
                    <div className="relative lg:col-span-5">
                        {/* Streak card flottante */}
                        <div
                            className="wk-float-y absolute -top-4 right-2 z-20 hidden rotate-[6deg] items-center gap-2 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white px-3 py-2 shadow-lg lg:flex"
                            style={{ animationDelay: "-2s" }}
                        >
                            <Flame className="h-[18px] w-[18px] text-[var(--wk-accent)]" />
                            <div>
                                <div className="font-mono-ui text-[10px] uppercase tracking-widest text-[rgba(26,21,18,0.6)]">
                                    streak
                                </div>
                                <div className="font-serif-display text-xl leading-none">
                                    7 jours 🔥
                                </div>
                            </div>
                        </div>

                        {/* Mascotte en petit, bas-gauche du panneau */}
                        <Image
                            src="/workytanim.gif"
                            alt="Mascotte Workyt — un personnage étudiant qui anime la plateforme d'entraide scolaire"
                            width={120}
                            height={120}
                            priority
                            unoptimized
                            className="wk-float-y pointer-events-none absolute -bottom-6 -left-10 z-20 hidden w-[110px] opacity-90 drop-shadow-[0_12px_40px_rgba(255,106,26,0.25)] lg:block"
                        />

                        {/* Pile de cartes forum */}
                        <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
                            <HeroForumCards />
                        </div>
                    </div>
                </div>

                {/* Promesses — pas de social proof inventée, on assume qu'on démarre */}
                <div className="mt-12 grid grid-cols-2 gap-6 rounded-3xl border border-[rgba(26,21,18,0.1)] bg-white/70 p-6 backdrop-blur md:grid-cols-4 md:p-8 lg:mt-16">
                    <Stat value="0 €" label="aucun abonnement" accent />
                    <Stat value="0" label="pub, jamais" />
                    <Stat value="100 %" label="bénévole, asso 1901" />
                    <Stat value="∞" label="entraide ouverte à tous" />
                </div>
            </div>

            {/* Subjects ticker */}
            <div className="relative overflow-hidden border-y border-[rgba(26,21,18,0.1)] bg-white/40 py-4 backdrop-blur">
                <div className="wk-marquee-track font-serif-display flex gap-10 whitespace-nowrap text-3xl md:text-4xl">
                    {[0, 1].map((row) => (
                        <div key={row} className="flex items-center gap-10 pr-10">
                            {SUBJECTS.map((w, i) => (
                                <span key={i} className="flex items-center gap-10">
                                    <span>{w}</span>
                                    <span className="text-[var(--wk-accent)]">✦</span>
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Stat({
    value,
    label,
    accent,
}: {
    value: string;
    label: string;
    accent?: boolean;
}) {
    return (
        <div>
            <div
                className={`font-serif-display text-4xl leading-none md:text-5xl ${
                    accent ? "text-[var(--wk-accent)]" : ""
                }`}
            >
                {value}
            </div>
            <div className="font-mono-ui mt-1 text-[11px] uppercase tracking-widest text-[rgba(26,21,18,0.6)]">
                {label}
            </div>
        </div>
    );
}
