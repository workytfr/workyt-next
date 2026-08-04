import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

/* Traitement volontairement dépouillé.
   La version précédente donnait à chaque partenaire une carte complète —
   pastille « PARTENAIRE », numéro, description, effet tilt — soit autant de
   matière que pour un service Workyt. Ce sont des soutiens, pas des produits :
   un logo, un nom, un lien. Le reste était du bruit. */
const partenairesList = [
    {
        name: "La Maison des étudiants",
        logo: "/mde.png",
        website:
            "https://www.lyoncampus.com/s-impliquer/la-maison-des-etudiants-de-la-metropole-de-lyon",
        darkBg: false,
    },
    {
        name: "Le Monde du PC",
        logo: "/lemondedupc.svg",
        website: "https://www.lemondedupc.fr",
        darkBg: true,
    },
    {
        name: "LearnHouse",
        logo: "/learnhouse_2.webp",
        website: "https://www.learnhouse.app",
        darkBg: true,
    },
    {
        name: "YumeGo",
        logo: "/yumego.png",
        website: "https://yumego.ai/",
        darkBg: true,
    },
    {
        name: "Stagey",
        logo: "/Stagey.svg",
        website: "https://stagey.fr/",
        darkBg: true,
    },
];

const PartenairesView = () => {
    return (
        <section
            id="partenaires"
            className="bg-[var(--wk-paper)] px-4 py-20 md:py-24"
        >
            <div className="mx-auto max-w-[1200px]">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div className="font-mono-ui flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.55)]">
                        <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                        <span>06</span>
                        <span>Ils nous soutiennent</span>
                    </div>
                    <a
                        href="mailto:contact@workyt.fr"
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(26,21,18,0.6)] transition-colors hover:text-[var(--wk-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--wk-accent)]"
                    >
                        Devenir partenaire
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
                    {partenairesList.map((p) => (
                        <a
                            key={p.name}
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center gap-3 rounded-2xl p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wk-accent)]"
                        >
                            <div
                                className={`flex h-20 w-full items-center justify-center rounded-2xl border border-[rgba(26,21,18,0.08)] px-4 transition duration-300 group-hover:border-[rgba(26,21,18,0.18)] ${
                                    p.darkBg
                                        ? "bg-[var(--wk-ink)]"
                                        : "bg-[var(--wk-paper-2)]"
                                }`}
                            >
                                <Image
                                    src={p.logo}
                                    alt={p.name}
                                    width={140}
                                    height={56}
                                    className="max-h-11 w-auto object-contain opacity-75 transition duration-300 group-hover:opacity-100"
                                    unoptimized
                                />
                            </div>
                            <span className="text-center text-xs leading-snug text-[rgba(26,21,18,0.55)] transition-colors group-hover:text-[var(--wk-ink)]">
                                {p.name}
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PartenairesView;
