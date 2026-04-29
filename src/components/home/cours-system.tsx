"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    BookOpen,
    FileText,
    Trophy,
    Users,
    Zap,
    Target,
    Brain,
    Share2,
    Clock,
    Star,
    Check,
    Sparkles,
    ArrowRight,
    ArrowUpRight,
} from "lucide-react";

export function CoursSystemSection() {
    const features = [
        {
            icon: <BookOpen className="h-5 w-5" />,
            title: "Cours Interactifs",
            description:
                "Des cours structurés avec théorie, exercices pratiques et quiz de validation pour un apprentissage progressif.",
            accent: "#ff6a1a",
        },
        {
            icon: <FileText className="h-5 w-5" />,
            title: "Fiches de Révision",
            description:
                "Partagez vos synthèses et accédez à celles de la communauté pour réviser efficacement.",
            accent: "#7ed957",
        },
        {
            icon: <Target className="h-5 w-5" />,
            title: "Quiz & Points",
            description:
                "Testez vos connaissances avec des quiz et gagnez des points pour chaque bonne réponse.",
            accent: "#6ec1e4",
        },
        {
            icon: <Share2 className="h-5 w-5" />,
            title: "Partage Collaboratif",
            description:
                "Une plateforme d'entraide où chaque ressource partagée enrichit l'apprentissage de tous.",
            accent: "#c77dff",
        },
    ];

    return (
        <section
            id="cours"
            className="relative overflow-hidden bg-[#fff8ee] px-4 py-20 md:py-28"
        >
            {/* Notebook pattern subtle */}
            <div
                className="wk-cahier pointer-events-none absolute inset-0 opacity-[0.35]"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-[1400px]">
                {/* Header */}
                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                        <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)]">
                            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                            <span>02</span>
                            <span>Système de cours</span>
                        </div>
                        <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl">
                            Des cours qui{" "}
                            <span className="italic text-[var(--wk-accent)]">
                                donnent envie
                            </span>{" "}
                            d&apos;ouvrir le cahier.
                        </h2>
                    </div>
                    <Link href="/cours" className="wk-btn-ink self-start md:self-end">
                        Explorer tous les cours
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Main two cards */}
                <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Cours Interactifs */}
                    <div className="wk-tilt group relative overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 md:p-8">
                        <div className="mb-5 flex items-center justify-between">
                            <span className="wk-chip !border-[#ffd8a8] !bg-[#fff3e0] !text-[#7a3a0a]">
                                <Sparkles className="h-3 w-3" />
                                COURS
                            </span>
                            <span className="font-mono-ui text-[11px] text-[rgba(26,21,18,0.4)]">
                                01
                            </span>
                        </div>
                        <h3 className="font-serif-display text-3xl leading-tight md:text-4xl">
                            Cours interactifs <span className="italic">📚</span>
                        </h3>
                        <p className="mt-3 text-[rgba(26,21,18,0.7)]">
                            Des cours complets structurés comme de véritables manuels numériques avec théorie, exercices pratiques et évaluations.
                        </p>
                        <div className="mt-6 space-y-3">
                            {[
                                { icon: Brain, t: "Théorie & Concepts", d: "Cours détaillés avec explications claires" },
                                { icon: Target, t: "Exercices Pratiques", d: "Manuel d'exercices intégré avec corrections" },
                                { icon: Trophy, t: "Quiz de Validation", d: "Gagnez des points pour chaque quiz réussi" },
                            ].map((row) => (
                                <div
                                    key={row.t}
                                    className="flex items-start gap-3 rounded-2xl border border-[rgba(26,21,18,0.06)] bg-[var(--wk-paper)] p-3"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,106,26,0.12)] text-[var(--wk-accent)]">
                                        <row.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{row.t}</div>
                                        <div className="text-xs text-[rgba(26,21,18,0.55)]">{row.d}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fiches Collaboratives */}
                    <div className="wk-tilt group relative overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 md:p-8">
                        <div className="mb-5 flex items-center justify-between">
                            <span className="wk-chip !border-[#bce8c2] !bg-[#edfbef] !text-[#1a5a1a]">
                                <Sparkles className="h-3 w-3" />
                                FICHES
                            </span>
                            <span className="font-mono-ui text-[11px] text-[rgba(26,21,18,0.4)]">
                                02
                            </span>
                        </div>
                        <h3 className="font-serif-display text-3xl leading-tight md:text-4xl">
                            Fiches collaboratives <span className="italic">📝</span>
                        </h3>
                        <p className="mt-3 text-[rgba(26,21,18,0.7)]">
                            Partagez vos synthèses et bénéficiez du travail de toute la communauté pour réviser plus efficacement.
                        </p>
                        <div className="mt-6 space-y-3">
                            {[
                                { icon: Share2, t: "Partage de Ressources", d: "Créez et partagez vos fiches de révision" },
                                { icon: Users, t: "Entraide Communautaire", d: "Accédez aux fiches de vos camarades" },
                                { icon: Star, t: "Système de Points", d: "Gagnez des points pour chaque fiche créée" },
                            ].map((row) => (
                                <div
                                    key={row.t}
                                    className="flex items-start gap-3 rounded-2xl border border-[rgba(26,21,18,0.06)] bg-[var(--wk-paper)] p-3"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(126,217,87,0.15)] text-[#1a5a1a]">
                                        <row.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">{row.t}</div>
                                        <div className="text-xs text-[rgba(26,21,18,0.55)]">{row.d}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Manuel d'exercices — dark ink featured */}
                <div className="relative mb-10 overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.1)] bg-[var(--wk-ink)] text-[var(--wk-paper)]">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.12]"
                        style={{
                            background:
                                "radial-gradient(ellipse at 70% 20%, #ff6a1a 0%, transparent 55%)",
                        }}
                    />
                    <div className="relative grid items-center gap-8 p-8 md:p-12 lg:grid-cols-[1.2fr_1fr]">
                        <div>
                            <div className="font-mono-ui inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(253,250,244,0.6)]">
                                <Target className="h-3 w-3" />
                                Manuel d&apos;exercices
                            </div>
                            <h3 className="font-serif-display mt-3 text-3xl leading-[1] md:text-5xl">
                                Un vrai manuel d&apos;exercices{" "}
                                <span className="italic text-[var(--wk-accent-2)]">
                                    interactif
                                </span>
                                .
                            </h3>
                            <p className="mt-4 max-w-xl text-[rgba(253,250,244,0.75)]">
                                Chaque cours intègre un manuel d&apos;exercices avec problèmes graduels, corrections détaillées et système de points pour motiver la progression.
                            </p>
                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {[
                                    { icon: Clock, t: "Exercices Progressifs", d: "Du débutant à l'avancé" },
                                    { icon: Brain, t: "Corrections Détaillées", d: "Explications pas à pas" },
                                    { icon: Zap, t: "Points & Progression", d: "Récompenses à chaque réussite" },
                                    { icon: Trophy, t: "Quiz de Validation", d: "Testez vos acquis régulièrement" },
                                ].map((row) => (
                                    <div
                                        key={row.t}
                                        className="flex items-start gap-3 rounded-2xl border border-[rgba(253,250,244,0.12)] bg-[rgba(253,250,244,0.04)] p-3"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,181,71,0.18)] text-[var(--wk-accent-2)]">
                                            <row.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--wk-paper)]">{row.t}</div>
                                            <div className="text-xs text-[rgba(253,250,244,0.6)]">{row.d}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mock quiz preview — notebook style */}
                        <div className="relative rounded-3xl border border-[rgba(253,250,244,0.12)] bg-[rgba(253,250,244,0.04)] p-5">
                            <Image
                                src="/AnimeCours.png"
                                alt="Aperçu du système de cours Workyt"
                                width={500}
                                height={360}
                                className="w-full rounded-2xl object-cover"
                            />
                            <div className="mt-4 rounded-2xl border border-[rgba(253,250,244,0.12)] bg-[rgba(253,250,244,0.04)] p-4">
                                <div className="font-mono-ui text-[10px] uppercase tracking-widest text-[rgba(253,250,244,0.6)]">
                                    Quiz éclair · Maths
                                </div>
                                <div className="mt-1 text-sm font-semibold">
                                    Développe (2x + 3)²
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <button className="rounded-xl border border-[rgba(253,250,244,0.12)] bg-[rgba(253,250,244,0.04)] px-3 py-2 text-left text-xs hover:bg-[rgba(253,250,244,0.08)]">
                                        4x² + 9
                                    </button>
                                    <button className="flex items-center gap-1 rounded-xl border border-[rgba(126,217,87,0.4)] bg-[rgba(126,217,87,0.2)] px-3 py-2 text-left text-xs font-semibold text-[#bdf5c4]">
                                        <Check className="h-3 w-3" /> 4x² + 12x + 9
                                    </button>
                                    <button className="rounded-xl border border-[rgba(253,250,244,0.12)] bg-[rgba(253,250,244,0.04)] px-3 py-2 text-left text-xs hover:bg-[rgba(253,250,244,0.08)]">
                                        2x² + 6x + 9
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features grid */}
                <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="wk-tilt group rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(26,21,18,0.08)]"
                        >
                            <div
                                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                                style={{ background: `linear-gradient(135deg, ${f.accent}, ${f.accent}cc)` }}
                            >
                                {f.icon}
                            </div>
                            <h4 className="font-serif-display text-xl">{f.title}</h4>
                            <p className="mt-2 text-sm leading-relaxed text-[rgba(26,21,18,0.65)]">
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="relative overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-8 md:p-12">
                    <div
                        className="wk-cahier pointer-events-none absolute inset-0 opacity-[0.3]"
                        aria-hidden="true"
                    />
                    <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
                        <div>
                            <h3 className="font-serif-display text-3xl leading-[0.95] md:text-5xl">
                                Commence ton{" "}
                                <span className="italic text-[var(--wk-accent)]">parcours</span>{" "}
                                d&apos;apprentissage.
                            </h3>
                            <p className="mt-3 max-w-2xl text-[rgba(26,21,18,0.7)]">
                                Explore les cours interactifs, crée des fiches de révision, réussis les quiz et gagne des points. L&apos;apprentissage collaboratif t&apos;attend.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                            <Link href="/cours" className="wk-btn-orange wk-animate-shine">
                                <BookOpen className="h-4 w-4" />
                                Explorer les cours
                            </Link>
                            <Link href="/fiches" className="wk-btn-ghost">
                                <FileText className="h-4 w-4" />
                                Voir les fiches
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
