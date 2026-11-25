"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChronometreIcon } from "@/components/ui/WkIcons";

interface ActiveEval {
    drawId: string;
    remainingMs: number;
    title: string;
}

/**
 * Pastille « évaluation en cours » affichée dans la navbar.
 * Visible uniquement si l'élève a une éval chronométrée en cours → permet de la
 * reprendre depuis n'importe quelle page, sans repasser par le cours.
 */
export default function ActiveEvalIndicator({ onVisibleChange }: { onVisibleChange?: (visible: boolean) => void } = {}) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [active, setActive] = useState<ActiveEval | null>(null);
    const [remaining, setRemaining] = useState(0);

    const token = (session as any)?.accessToken as string | undefined;

    useEffect(() => {
        if (!token) {
            setActive(null);
            return;
        }
        let cancelled = false;
        fetch("/api/evaluations/active", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                if (d?.active?.drawId && d.active.remainingMs > 0) {
                    setActive(d.active);
                    setRemaining(d.active.remainingMs);
                } else {
                    setActive(null);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
        // Recharge au changement de page (ex: après soumission, la pastille disparaît).
    }, [token, pathname]);

    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => setRemaining((p) => Math.max(0, p - 1000)), 1000);
        return () => clearInterval(id);
    }, [active]);

    // Inutile sur la page de l'épreuve elle-même.
    const visible = !!active && remaining > 0 && !pathname?.startsWith(`/evaluation/${active.drawId}`);

    // La barre mobile fait de la place au chrono (cf. StatusCluster)
    useEffect(() => {
        onVisibleChange?.(visible);
    }, [visible, onVisibleChange]);

    if (!visible || !active) return null;

    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    const critical = remaining < 60_000;

    return (
        <Link
            href={`/evaluation/${active.drawId}`}
            title={`Évaluation en cours : ${active.title} — reprendre`}
            aria-label={`Reprendre l'évaluation ${active.title}`}
            className={`flex h-9 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-semibold sm:gap-1.5 sm:px-2.5 sm:text-sm transition-[background-color,transform] duration-150 active:scale-[0.96] ${
                critical
                    ? "bg-red-100 text-red-700 hover:bg-red-200 animate-pulse"
                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            }`}
        >
            <ChronometreIcon className="h-4 w-4 shrink-0" />
            <span className="font-mono tabular-nums">
                {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </span>
        </Link>
    );
}
