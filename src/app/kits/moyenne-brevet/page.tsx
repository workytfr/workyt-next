import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Eyebrow } from "@/components/wk/primitives";
import BrevetClient from "./BrevetClient";

export const metadata: Metadata = {
    title: "Calculateur de moyenne du brevet",
    description:
        "Calcule ta moyenne au brevet (DNB) avec le nouveau calcul : 40 % de contrôle continu, 60 % d'épreuves finales, note sur 20, bonus des options et mentions.",
    alternates: { canonical: "https://workyt.fr/kits/moyenne-brevet" },
};

export default function MoyenneBrevetPage() {
    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
                <div className="relative mx-auto max-w-[1200px] px-4 pb-10 pt-10 sm:px-6 md:pt-14">
                    <Link href="/kits" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-accent)]">
                        <ArrowLeft className="h-4 w-4" /> Kits de l&apos;élève
                    </Link>
                    <div className="mt-6">
                        <Eyebrow>Calculateur · brevet</Eyebrow>
                    </div>
                    <h1 className="font-serif-display mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.95]">
                        Ma moyenne au brevet
                    </h1>
                    <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                        Depuis 2026, le brevet est noté sur 20 : 40 % pour tes moyennes de 3e, 60 % pour les épreuves
                        finales. Il faut 10/20 pour l&apos;obtenir. Tes notes restent sur ton appareil.
                    </p>
                </div>
            </header>
            <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 md:py-14">
                <BrevetClient />
                <p className="mt-10 max-w-3xl text-xs leading-relaxed text-[rgba(26,21,18,0.5)]">
                    Simulation indicative, sans valeur officielle, d&apos;après l&apos;arrêté du 10 avril 2025 et la
                    note de service du 11 septembre 2026 (sessions 2026 et suivantes). Candidats individuels non pris
                    en charge (pas de contrôle continu, épreuve de langue vivante en plus).
                </p>
            </main>
        </div>
    );
}
