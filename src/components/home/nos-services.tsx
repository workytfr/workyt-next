"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";

const services = [
    {
        title: "Cours en ligne",
        desc: "Cours structurés avec théorie, exos et quiz. Progresse à ton rythme, gagne des points.",
        img: "/workytcours.png",
        href: "/cours",
        tag: "COURS",
        accent: "#ff6a1a",
    },
    {
        title: "Forum d'entraide",
        desc: "Bloqué sur un exo ? Poste ta question, la communauté répond en moyenne en 12 min.",
        img: "/workytforum.png",
        href: "/forum",
        tag: "FORUM",
        accent: "#6ec1e4",
    },
    {
        title: "Fiches de révision",
        desc: "Partage tes synthèses, accède à celles des autres. Révise plus vite, plus mieux.",
        img: "/workytfiche.png",
        href: "/fiches",
        tag: "FICHES",
        accent: "#7ed957",
    },
    {
        title: "Blog",
        desc: "Actus éducation, méthodes de travail, astuces pour le bac — tout ce qu'il faut savoir.",
        img: "/workytblog.png",
        href: "https://blog.workyt.fr/",
        tag: "BLOG",
        accent: "#c77dff",
    },
    {
        title: "Discord",
        desc: "Un serveur vivant pour battre la procrastination ensemble — salons d'étude, events.",
        img: "/workytdiscord.png",
        href: "https://dc.gg/workyt",
        tag: "COMMU",
        accent: "#5865f2",
    },
    {
        title: "Orientation",
        desc: "Conseils, guides métiers, retours d'expérience — trouve ta voie sereinement.",
        img: "/workytorientation.png",
        href: "https://blog.workyt.fr/category/orientation-scolaire/",
        tag: "ORIENTATION",
        accent: "#ffb547",
    },
];

export default function NosServices() {
    return (
        <section
            id="services"
            className="relative bg-[var(--wk-paper)] px-4 py-20 md:py-28"
        >
            <div className="mx-auto max-w-[1400px]">
                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                        <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)]">
                            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                            <span>01</span>
                            <span>Nos services</span>
                        </div>
                        <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl">
                            Tout pour réussir,{" "}
                            <span className="italic">au même endroit.</span>
                        </h2>
                    </div>
                    <p className="max-w-md leading-relaxed text-[rgba(26,21,18,0.7)]">
                        Workyt rassemble enseignants, élèves et parents dans un
                        seul écosystème — des cours aux communautés, du forum
                        aux fiches, chaque outil aide les workeurs à avancer.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((s, i) => {
                        const external = s.href.startsWith("http");
                        const CardInner = (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="wk-chip !border-[#ffd8a8] !bg-[#fff3e0] !text-[#7a3a0a]">
                                        <Sparkles className="h-3 w-3" />
                                        {s.tag}
                                    </span>
                                    <span className="font-mono-ui text-[11px] text-[rgba(26,21,18,0.4)]">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                </div>
                                <div
                                    className="relative mt-4 aspect-[16/10] overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.1)]"
                                    style={{
                                        background: `linear-gradient(135deg, ${s.accent}22, ${s.accent}08)`,
                                    }}
                                >
                                    <Image
                                        src={s.img}
                                        alt={`Aperçu du service ${s.title} de Workyt`}
                                        fill
                                        sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow transition group-hover:-translate-y-1 group-hover:translate-x-1">
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                                <h3 className="font-serif-display mt-4 text-2xl">
                                    {s.title}
                                </h3>
                                <p className="mt-1 text-sm leading-relaxed text-[rgba(26,21,18,0.65)]">
                                    {s.desc}
                                </p>
                            </>
                        );

                        const commonClasses =
                            "group relative flex min-h-[340px] flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(26,21,18,0.08)]";

                        return external ? (
                            <a
                                key={s.title}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={commonClasses}
                            >
                                {CardInner}
                            </a>
                        ) : (
                            <Link
                                key={s.title}
                                href={s.href}
                                className={commonClasses}
                            >
                                {CardInner}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
