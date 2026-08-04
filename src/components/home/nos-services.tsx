import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

/* Quatre services, pas six.
   — Blog : déplacé dans le footer (contenu périphérique, pas un produit).
   — Discord : déplacé dans la section gamification, là où on parle
     d'appartenance et de communauté. Il y gagne en pertinence. */
const services = [
    {
        title: "Cours en ligne",
        desc: "Théorie, exercices et quiz, chapitre par chapitre. Progresse à ton rythme.",
        img: "/workytcours.png",
        href: "/cours",
        tag: "Cours",
        accent: "#ff6a1a",
        cta: "Parcourir les cours",
    },
    {
        title: "Fiches de révision",
        desc: "Les synthèses de la communauté, relues et classées par matière et par niveau.",
        img: "/workytfiche.png",
        href: "/fiches",
        tag: "Fiches",
        accent: "#7ed957",
        cta: "Explorer les fiches",
    },
    {
        title: "Forum d'entraide",
        desc: "Bloqué sur un exercice ? Pose ta question, quelqu'un l'a déjà résolue.",
        img: "/workytforum.png",
        href: "/forum",
        tag: "Forum",
        accent: "#6ec1e4",
        cta: "Rejoindre le forum",
    },
    {
        title: "Orientation",
        desc: "Guides métiers, conseils et retours d'expérience pour choisir sereinement.",
        img: "/workytorientation.png",
        href: "https://blog.workyt.fr/category/orientation-scolaire/",
        tag: "Orientation",
        accent: "#ffb547",
        cta: "Découvrir",
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
                        <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                            Tout pour réussir,{" "}
                            <span className="italic">au même endroit.</span>
                        </h2>
                    </div>
                    <p className="max-w-sm leading-relaxed text-[rgba(26,21,18,0.7)]">
                        Quatre outils qui se répondent : tu apprends dans les cours,
                        tu révises avec les fiches, tu débloques sur le forum, tu te
                        projettes avec l&apos;orientation.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {services.map((s) => {
                        const external = s.href.startsWith("http");

                        const inner = (
                            <>
                                <div
                                    className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.1)]"
                                    style={{
                                        background: `linear-gradient(135deg, ${s.accent}1f, ${s.accent}08)`,
                                    }}
                                >
                                    <Image
                                        src={s.img}
                                        alt={`Aperçu de ${s.title} sur Workyt`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                    />
                                </div>

                                <div className="mt-5 flex flex-1 flex-col">
                                    <span
                                        className="font-mono-ui text-[11px] uppercase tracking-[0.16em]"
                                        style={{ color: s.accent }}
                                    >
                                        {s.tag}
                                    </span>
                                    <h3 className="font-serif-display mt-1.5 text-2xl leading-tight">
                                        {s.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-[rgba(26,21,18,0.65)]">
                                        {s.desc}
                                    </p>
                                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-[var(--wk-ink)]">
                                        {s.cta}
                                        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </>
                        );

                        const className =
                            "group flex flex-col rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wk-accent)]";

                        return external ? (
                            <a
                                key={s.title}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={className}
                            >
                                {inner}
                            </a>
                        ) : (
                            <Link key={s.title} href={s.href} className={className}>
                                {inner}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
