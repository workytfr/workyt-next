"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import StreakIndicator from "@/components/ui/StreakIndicator";
import MushroomIndicator from "@/components/ui/MushroomIndicator";
import ClanWarIndicator from "@/components/ui/ClanWarIndicator";
import ActiveEvalIndicator from "@/components/ActiveEvalIndicator";
import { ProgressionIcon } from "@/components/ui/WkIcons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Couche gamifiée de la navbar — tout reste dans la barre.
 *
 *   — à partir de `md`, les indicateurs sont alignés en clair ;
 *   — en dessous, un seul bouton ouvre un panneau qui les contient : une
 *     cible tactile au lieu de quatre. À 390px, la guerre des clans en
 *     clair poussait le bouton du menu hors de l'écran ; elle rejoint donc
 *     le panneau, et une pastille sur le bouton signale qu'elle est en cours.
 *
 * L'évaluation en cours échappe au repli : c'est un compte à rebours, il
 * doit rester visible sans interaction. Le composant ne rend rien hors
 * épreuve, il ne coûte donc aucune place le reste du temps.
 */
export default function StatusCluster({ userId }: { userId: string }) {
    const [open, setOpen] = useState(false);
    // Épreuve en cours : sous sm, le chrono prend la place du bouton
    const [evalOn, setEvalOn] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Même clé que ClanWarIndicator : SWR déduplique, aucune requête en plus.
    const { data: clan } = useSWR(userId ? "/api/clan/status" : null, fetcher, {
        refreshInterval: 300_000,
        revalidateOnFocus: false,
    });
    const warOn = !!clan?.data;

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
            <div className="hidden items-center gap-0.5 md:flex">
                <StreakIndicator userId={userId} />
                <MushroomIndicator userId={userId} />
                <ClanWarIndicator userId={userId} />
                <Link
                    href="/progression"
                    title="Ma progression"
                    aria-label="Ma progression"
                    className="wk-nav-btn lg:max-xl:!hidden"
                >
                    <ProgressionIcon className="h-5 w-5 text-emerald-600" />
                </Link>
            </div>

            {/* ---------- Toujours visible : l'épreuve en cours ---------- */}
            <ActiveEvalIndicator onVisibleChange={setEvalOn} />

            {/* ---------- Sous md : un bouton, un panneau ---------- */}
            <div ref={panelRef} className={`relative md:hidden ${evalOn ? "max-sm:hidden" : ""}`}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-haspopup="true"
                    aria-label={warOn ? "Ma progression — guerre des clans en cours" : "Ma progression"}
                    className="wk-nav-btn !h-11 !w-10 !min-w-0 !px-0 sm:!w-11"
                >
                    <ProgressionIcon className="h-5 w-5 text-emerald-600" />
                    {warOn && (
                        <span
                            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--wk-accent)] ring-2 ring-white"
                            aria-hidden="true"
                        />
                    )}
                </button>

                {open && (
                    <div
                        className="wk-pop fixed right-3 top-[calc(env(safe-area-inset-top,0px)+4.875rem)] sm:top-[calc(env(safe-area-inset-top,0px)+5.625rem)] z-[200] w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white p-2 shadow-[0_18px_48px_rgba(26,21,18,0.14)]"
                        role="menu"
                    >
                        <div className="font-mono-ui px-2 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.45)]">
                            Ma progression
                        </div>
                        <div className="flex flex-wrap items-center gap-0.5 rounded-xl bg-[var(--wk-paper)] p-1">
                            <StreakIndicator userId={userId} />
                            <MushroomIndicator userId={userId} />
                            <ClanWarIndicator userId={userId} />
                        </div>
                        <Link
                            href="/progression"
                            onClick={() => setOpen(false)}
                            className="mt-1 flex min-h-[44px] items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium text-[var(--wk-ink)] transition-colors active:bg-[var(--wk-paper-2)]"
                        >
                            <ProgressionIcon className="h-[18px] w-[18px] text-emerald-600" />
                            Voir ma progression
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
