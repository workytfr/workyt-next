"use client";

import Image from "next/image";

const missionCards = [
    {
        span: "col-span-6 md:col-span-4",
        title: "🎓 Asso de 100+ bénévoles",
        body: "Des profs, des étudiants, des passionnés. Tous bénévoles, tous là pour les workeurs.",
    },
    {
        span: "col-span-6 md:col-span-2",
        title: "🚀 Apprendre en jouant",
        body: "Points, badges, streaks — la gamification qui motive, pas qui distrait.",
    },
    {
        span: "col-span-6 md:col-span-3",
        title: "🌱 Pédagogie douce",
        body: "Des contenus relus par des profs, testés par des élèves, et amusants à lire.",
    },
    {
        span: "col-span-6 md:col-span-3",
        title: "💡 Opportunités",
        body: "Ressources d'orientation, guides métiers et events pour ouvrir les portes.",
    },
];

export function WobbleCardDemo() {
    return (
        <section className="relative overflow-hidden bg-[var(--wk-ink)] px-4 py-20 text-[var(--wk-paper)] md:py-28">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 0%, #ff6a1a 0%, transparent 60%)",
                }}
            />

            <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(253,250,244,0.6)]">
                        <span className="inline-block w-8 border-t border-[rgba(253,250,244,0.3)]" />
                        <span>04</span>
                        <span>Notre mission</span>
                    </div>
                    <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                        Une éducation{" "}
                        <span className="italic text-[var(--wk-accent-2)]">
                            joyeuse
                        </span>
                        , accessible à tous.
                    </h2>
                    <p className="mt-6 max-w-md leading-relaxed text-[rgba(253,250,244,0.75)]">
                        Workyt est une asso portée par 100+ bénévoles qui
                        croient qu&apos;apprendre devrait être gratuit, simple
                        et un peu fun. Pas de paywall, pas de jargon — juste des
                        outils qui marchent, pour les 11-25 ans.
                    </p>

                    <div className="mt-8 grid max-w-md grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-[rgba(253,250,244,0.15)] p-4">
                            <div className="font-serif-display text-4xl text-[var(--wk-accent-2)]">
                                100%
                            </div>
                            <div className="mt-1 text-sm text-[rgba(253,250,244,0.7)]">
                                Gratuit, sans pub, sans collecte de données
                            </div>
                        </div>
                        <div className="rounded-2xl border border-[rgba(253,250,244,0.15)] p-4">
                            <div className="font-serif-display text-4xl text-[var(--wk-accent-2)]">
                                Depuis 2020
                            </div>
                            <div className="mt-1 text-sm text-[rgba(253,250,244,0.7)]">
                                Né en confinement, asso officielle depuis mars 2022
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 hidden lg:block">
                        <Image
                            src="/workytanim.gif"
                            width={220}
                            height={220}
                            alt="Workyt mascotte"
                            unoptimized
                            className="rounded-2xl"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-6 content-start gap-4 lg:col-span-7">
                    {missionCards.map((c) => (
                        <div
                            key={c.title}
                            className={`${c.span} rounded-3xl border border-[rgba(253,250,244,0.1)] bg-[rgba(253,250,244,0.04)] p-6 transition hover:bg-[rgba(253,250,244,0.07)]`}
                        >
                            <div className="font-serif-display text-xl md:text-2xl">
                                {c.title}
                            </div>
                            <div className="mt-2 text-sm leading-relaxed text-[rgba(253,250,244,0.7)]">
                                {c.body}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
