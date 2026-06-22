"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";

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
export default function ActiveEvalIndicator() {
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
    if (!active || remaining <= 0 || pathname?.startsWith(`/evaluation/${active.drawId}`)) return null;

    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    const critical = remaining < 60_000;

    return (
        <Link
            href={`/evaluation/${active.drawId}`}
            title={`Évaluation en cours : ${active.title}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                critical
                    ? "bg-red-100 text-red-700 hover:bg-red-200 animate-pulse"
                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            }`}
        >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono tabular-nums">
                {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </span>
            <span className="hidden sm:inline">· Reprendre</span>
        </Link>
    );
}
