import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Eyebrow } from "@/components/wk/primitives";
import BacClient from "./BacClient";

export const metadata: Metadata = {
    title: "Calculateur de moyenne du bac 2027",
    description:
        "Calcule ta moyenne au bac 2027 (général ou technologique) avec les nouveaux coefficients : épreuve anticipée de maths, grand oral, contrôle continu, options et mentions.",
    alternates: { canonical: "https://workyt.fr/kits/moyenne-bac" },
};

export default function MoyenneBacPage() {
    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
                <div className="relative mx-auto max-w-[1200px] px-4 pb-10 pt-10 sm:px-6 md:pt-14">
                    <Link href="/kits" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-accent)]">
                        <ArrowLeft className="h-4 w-4" /> Kits de l&apos;élève
                    </Link>
                    <div className="mt-6">
                        <Eyebrow>Calculateur · session 2027</Eyebrow>
                    </div>
                    <h1 className="font-serif-display mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.95]">
                        Ma moyenne au bac<span className="text-[var(--wk-accent)]">.</span>
                    </h1>
                    <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                        Avec les coefficients du bac 2027 : nouvelle épreuve anticipée de mathématiques en fin de
                        première (coef 2) et grand oral à 8 en voie générale, 12 en voie technologique. Tes notes
                        restent sur ton appareil.
                    </p>
                </div>
            </header>
            <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 md:py-14">
                <BacClient />
                <p className="mt-10 max-w-3xl text-xs leading-relaxed text-[rgba(26,21,18,0.5)]">
                    Simulation indicative, sans valeur officielle. Les coefficients suivent la réforme du baccalauréat
                    applicable à la session 2027 : vérifie toujours auprès de ton lycée. Candidats individuels et voie
                    professionnelle non pris en charge.
                </p>
            </main>
        </div>
    );
}
