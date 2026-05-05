"use client";

import React from "react";
import Image from "next/image";
import { Handshake, ArrowUpRight, Sparkles } from "lucide-react";

const partenairesList = [
    {
        name: "La Maison des étudiants",
        logo: "/mde.png",
        website:
            "https://www.lyoncampus.com/s-impliquer/la-maison-des-etudiants-de-la-metropole-de-lyon",
        description: "Accompagnement et vie étudiante à Lyon",
        darkBg: false,
    },
    {
        name: "Le Monde du PC",
        logo: "/lemondedupc.svg",
        website: "https://www.lemondedupc.fr",
        description: "Informatique et hardware",
        darkBg: true,
    },
    {
        name: "Shiftek Hosting",
        logo: "/ShiftekHosting.png",
        website: "https://shiftek.fr/hosting/",
        description: "Hébergement web performant",
        darkBg: true,
    },
    {
        name: "LearnHouse",
        logo: "/learnhouse_2.webp",
        website: "https://www.learnhouse.app",
        description: "Plateforme éducative open-source",
        darkBg: true,
    },
    {
        name: "YumeGo",
        logo: "/yumego.png",
        website: "https://yumego.ai/",
        description:
            "Extension Chrome pour apprendre le japonais avec Netflix — traduction des sous-titres, suivi JLPT et vocabulaire",
        darkBg: true,
    },
    {
        name: "Stagey",
        logo: "/Stagey.svg",
        website: "https://stagey.fr/",
        description: "Recherche de stage pour étudiants",
        darkBg: true,
    },
];

const PartenairesView = () => {
    return (
        <section
            id="partenaires"
            className="relative overflow-hidden bg-[var(--wk-paper)] px-4 py-20 md:py-28"
        >
            <div className="relative mx-auto max-w-[1400px]">
                {/* Header */}
                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                        <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)]">
                            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                            <span>05</span>
                            <span>Partenaires</span>
                        </div>
                        <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                            Ils nous font{" "}
                            <span className="italic text-[var(--wk-accent)]">
                                confiance
                            </span>
                            .
                        </h2>
                    </div>
                    <p className="max-w-md leading-relaxed text-[rgba(26,21,18,0.7)]">
                        Des organisations qui soutiennent notre mission éducative et contribuent à rendre l&apos;apprentissage accessible à tous.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {partenairesList.map((p, i) => (
                        <a
                            key={p.name}
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wk-tilt group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(26,21,18,0.08)]"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="wk-chip !border-[#ffd8a8] !bg-[#fff3e0] !text-[#7a3a0a]">
                                    <Sparkles className="h-3 w-3" />
                                    PARTENAIRE
                                </span>
                                <span className="font-mono-ui text-[11px] text-[rgba(26,21,18,0.4)]">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                            </div>

                            <div
                                className={`relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.1)] ${
                                    p.darkBg
                                        ? "bg-[var(--wk-ink)] p-3"
                                        : "bg-[var(--wk-paper-2)] p-3"
                                }`}
                            >
                                <Image
                                    src={p.logo}
                                    alt={`Logo ${p.name}`}
                                    width={140}
                                    height={64}
                                    className="max-h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                                    unoptimized
                                />
                            </div>

                            <h3 className="font-serif-display mt-4 text-lg leading-tight">
                                {p.name}
                            </h3>
                            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[rgba(26,21,18,0.55)]">
                                {p.description}
                            </p>

                            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[var(--wk-accent)] opacity-0 transition group-hover:opacity-100">
                                Visiter
                                <ArrowUpRight className="h-3 w-3" />
                            </div>
                        </a>
                    ))}
                </div>

                {/* Devenir partenaire strip */}
                <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-dashed border-[rgba(26,21,18,0.2)] bg-white/60 p-6 md:flex-row md:items-center md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(255,106,26,0.12)] text-[var(--wk-accent)]">
                            <Handshake className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-serif-display text-xl">
                                Vous voulez soutenir Workyt ?
                            </div>
                            <div className="text-sm text-[rgba(26,21,18,0.65)]">
                                Contactez-nous pour discuter d&apos;un partenariat éducatif.
                            </div>
                        </div>
                    </div>
                    <a
                        href="mailto:contact@workyt.fr"
                        className="wk-btn-ink !py-2.5 !px-5 text-sm"
                    >
                        Nous contacter
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </section>
    );
};

export default PartenairesView;
