"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

/**
 * Barre d'outils de la version imprimable (masquée à l'impression).
 * Avec `?pdf=1`, la boîte d'impression s'ouvre seule une fois polices et
 * images chargées : l'élève n'a plus qu'à choisir « Enregistrer en PDF ».
 */
export default function PrintToolbar({ backHref, withAnswersToggle = false }: { backHref: string; withAnswersToggle?: boolean }) {
    const [answers, setAnswers] = useState(true);

    useEffect(() => {
        document.querySelector(".wk-print")?.classList.toggle("no-answers", !answers);
    }, [answers]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("pdf") !== "1") return;
        const images = Array.from(document.images).filter((img) => !img.complete);
        Promise.all([
            document.fonts.ready,
            ...images.map(
                (img) =>
                    new Promise<void>((resolve) => {
                        img.addEventListener("load", () => resolve(), { once: true });
                        img.addEventListener("error", () => resolve(), { once: true });
                    })
            ),
        ]).then(() => setTimeout(() => window.print(), 300));
    }, []);

    return (
        <div className="wk-print-toolbar fixed inset-x-0 top-0 z-50 border-b border-[rgba(26,21,18,0.08)] bg-white/95 px-4 py-3">
            <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-3">
                <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(26,21,18,0.7)] hover:text-[var(--wk-ink)]">
                    <ArrowLeft className="h-4 w-4" /> Retour au cours
                </Link>
                <div className="ml-auto flex items-center gap-3">
                    {withAnswersToggle && (
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input type="checkbox" checked={answers} onChange={(e) => setAnswers(e.target.checked)} className="h-4 w-4 accent-[var(--wk-accent)]" />
                            Inclure les corrigés
                        </label>
                    )}
                    <button type="button" onClick={() => window.print()} className="wk-btn-orange !px-4 !py-2 text-sm">
                        <Download className="h-4 w-4" /> Enregistrer en PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
