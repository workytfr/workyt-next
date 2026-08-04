"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, Sparkles } from "lucide-react";
import StreakIndicator from "@/components/ui/StreakIndicator";
import MushroomIndicator from "@/components/ui/MushroomIndicator";
import ClanWarIndicator from "@/components/ui/ClanWarIndicator";
import ActiveEvalIndicator from "@/components/ActiveEvalIndicator";

/**
 * Couche gamifiée de la navbar — une seule barre.
 *
 * Elle vivait avant dans le conteneur `hidden lg:flex` : sous 1024px les
 * indicateurs n'étaient pas masqués, ils n'existaient pas dans le DOM, et le
 * drawer ne les reprenait pas. Le différenciateur du produit était donc
 * invisible pour la majeure partie du trafic.
 *
 * La corriger par une deuxième rangée sous la pilule se lisait comme deux
 * navbars superposées. Ici tout reste dans la pilule :
 *   — au-dessus de `md`, les indicateurs sont alignés en clair ;
 *   — en dessous, un seul bouton compact ouvre un panneau qui les contient,
 *     ce qui coûte une cible tactile au lieu de quatre.
 *
 * La guerre des clans échappe volontairement à ce repli : c'est une
 * information à durée limitée, elle reste visible sans interaction. Le
 * composant ne rend rien hors période, elle ne coûte donc aucune place le
 * reste du temps.
 */
export default function StatusCluster({ userId }: { userId: string }) {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <>
            {/* ---------- md et plus : tout en clair ---------- */}
            <div className="hidden items-center gap-1 rounded-full bg-[rgba(26,21,18,0.04)] px-2 py-1 md:flex">
                <StreakIndicator userId={userId} />
                <Separator />
                <MushroomIndicator userId={userId} />
                <Separator />
                <ProgressionLink />
            </div>

            {/* ---------- Toujours visible : la guerre en cours ---------- */}
            <ClanWarIndicator userId={userId} />
            <ActiveEvalIndicator />

            {/* ---------- Sous md : un bouton, un panneau ---------- */}
            <div ref={panelRef} className="relative md:hidden">
                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-haspopup="true"
                    aria-label="Ma progression"
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors touch-manipulation ${
                        open
                            ? "bg-[rgba(255,106,26,0.12)] text-[var(--wk-accent)]"
                            : "text-[rgba(26,21,18,0.6)] active:bg-[rgba(26,21,18,0.08)]"
                    }`}
                >
                    <Sparkles className="h-5 w-5" />
                </button>

                {open && (
                    <div
                        className="absolute right-0 top-full z-[200] mt-2 w-[248px] rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white p-3 shadow-xl"
                        role="menu"
                    >
                        <div className="font-mono-ui mb-2 px-1 text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.45)]">
                            Ma progression
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-[rgba(26,21,18,0.04)] px-2 py-1.5">
                            <StreakIndicator userId={userId} />
                            <Separator />
                            <MushroomIndicator userId={userId} />
                        </div>
                        <Link
                            href="/progression"
                            onClick={() => setOpen(false)}
                            className="mt-2 flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-medium text-[var(--wk-ink)] transition-colors active:bg-[rgba(26,21,18,0.05)]"
                        >
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Voir ma progression
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}

function Separator() {
    return (
        <span
            className="h-4 w-px shrink-0 bg-[rgba(26,21,18,0.15)]"
            aria-hidden="true"
        />
    );
}

function ProgressionLink() {
    return (
        <Link
            href="/progression"
            title="Ma progression"
            aria-label="Ma progression"
            className="flex items-center justify-center rounded-full p-1 text-emerald-600 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
            <TrendingUp className="h-4 w-4" />
        </Link>
    );
}
