import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Eyebrow } from "@/components/wk/primitives";
import TimerPanel from "./_components/TimerPanel";
import FablePanel from "./_components/FablePanel";
import SoundPanel from "./_components/SoundPanel";
import SettingsPanel from "./_components/SettingsPanel";
import StatsPanel from "./_components/StatsPanel";

export const metadata: Metadata = {
    title: "Pomodoro : Corvy et Foxy",
    description:
        "Minuteur Pomodoro gratuit pour réviser : durées modulables, sons d'ambiance, radio lofi et Corvy et Foxy, notre fable d'après le Corbeau et le Renard. Statistiques de travail avec un compte Workyt.",
    alternates: { canonical: "https://workyt.fr/kits/pomodoro" },
};

export default function PomodoroPage() {
    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
                <div className="relative mx-auto max-w-[1200px] px-4 pb-10 pt-10 sm:px-6 md:pt-14">
                    <Link href="/kits" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-accent)]">
                        <ArrowLeft className="h-4 w-4" /> Kits de l&apos;élève
                    </Link>
                    <div className="mt-6">
                        <Eyebrow>Pomodoro</Eyebrow>
                    </div>
                    <h1 className="font-serif-display mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.95]">
                        Garde ton fromage<span className="text-[var(--wk-accent)]">.</span>
                    </h1>
                    <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                        « Tout flatteur vit aux dépens de celui qui l&apos;écoute. » Pendant chaque focus, Foxy essaie
                        de te distraire. Tiens bon jusqu&apos;à la sonnerie et Corvy garde son fromage. Le minuteur
                        continue de tourner pendant que tu navigues sur Workyt.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 md:py-14">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-7">
                        <TimerPanel />
                        <FablePanel />
                    </div>
                    <div className="space-y-6 lg:col-span-5">
                        <SoundPanel />
                        <SettingsPanel />
                    </div>
                </div>
                <div className="mt-6">
                    <StatsPanel />
                </div>
            </main>
        </div>
    );
}
