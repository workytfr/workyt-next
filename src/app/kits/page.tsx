import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Calculator, GraduationCap, PenTool, Timer } from "lucide-react";
import { Eyebrow } from "@/components/wk/primitives";

export const metadata: Metadata = {
    title: "Kits de l'élève : Pomodoro, tableau blanc et calculateurs de moyenne",
    description:
        "Outils gratuits pour réviser : minuteur Pomodoro, tableau blanc par matière, calculateur de moyenne du bac 2027 et du brevet avec les nouveaux coefficients.",
    alternates: { canonical: "https://workyt.fr/kits" },
};

const KITS = [
    {
        href: "/kits/pomodoro",
        icon: Timer,
        tag: "Concentration",
        title: "Pomodoro : Corvy et Foxy",
        text: "Des sessions de travail entrecoupées de pauses, avec sons d'ambiance et radio lofi. Foxy tente de te distraire : garde ton fromage !",
        emoji: "🧀",
    },
    {
        href: "/kits/tableau-blanc",
        icon: PenTool,
        tag: "Toutes matières",
        title: "Tableau blanc",
        text: "Repère et courbes, cercle trigo, circuits électriques, verrerie de chimie, formules, frise chronologique, cahier Seyès… Gardé sur ton appareil.",
        emoji: "✏️",
    },
    {
        href: "/kits/moyenne-bac",
        icon: GraduationCap,
        tag: "Lycée",
        title: "Calculateur de moyenne du bac 2027",
        text: "Général ou technologique, avec l'épreuve anticipée de maths, le grand oral, le contrôle continu et les options. Mention et rattrapage.",
        emoji: "🎓",
    },
    {
        href: "/kits/moyenne-brevet",
        icon: Calculator,
        tag: "Collège",
        title: "Calculateur de moyenne du brevet",
        text: "Le nouveau calcul sur 20 : 40 % de moyennes de 3e, 60 % d'épreuves finales. Découvre la note qu'il te faut le jour J.",
        emoji: "📝",
    },
];

export default function KitsPage() {
    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
                <div className="relative mx-auto max-w-[1200px] px-4 pb-14 pt-14 sm:px-6 md:pb-20 md:pt-20">
                    <Eyebrow>Kits de l&apos;élève</Eyebrow>
                    <h1 className="font-serif-display mt-5 text-[clamp(2.6rem,7vw,5rem)] leading-[0.92]">
                        Des outils pour réviser,{" "}
                        <span className="italic text-[rgba(26,21,18,0.45)]">sans prise de tête</span>
                        <span className="text-[var(--wk-accent)]">.</span>
                    </h1>
                    <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                        Gratuits, sans publicité, utilisables sans compte. Connecte-toi pour garder l&apos;historique
                        de tes sessions de travail.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {KITS.map((k) => (
                        <Link
                            key={k.href}
                            href={k.href}
                            className="group flex flex-col rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,21,18,0.08)]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e3]">
                                    <k.icon className="h-5 w-5 text-[var(--wk-accent)]" />
                                </span>
                                <ArrowUpRight className="h-5 w-5 text-[rgba(26,21,18,0.35)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--wk-accent)]" />
                            </div>
                            <span className="font-mono-ui mt-6 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">{k.tag}</span>
                            <h2 className="font-serif-display mt-2 text-2xl leading-tight">
                                {k.title} <span aria-hidden>{k.emoji}</span>
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-[rgba(26,21,18,0.65)]">{k.text}</p>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
