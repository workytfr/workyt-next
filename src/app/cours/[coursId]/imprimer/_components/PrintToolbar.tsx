"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, X } from "lucide-react";

/**
 * Barre d'outils de la version imprimable (masquée à l'impression).
 *
 * Le PDF est produit par le navigateur (Imprimer → Enregistrer au format PDF).
 * On ne déclenche jamais l'impression tout seul : dans certains navigateurs
 * (intégrés, mobiles) l'appel automatique bloque la page. Avec `?pdf=1`
 * (bouton « Télécharger » du cours), une carte explique les deux clics à faire.
 */
export default function PrintToolbar({ backHref, withAnswersToggle = false }: { backHref: string; withAnswersToggle?: boolean }) {
    const [answers, setAnswers] = useState(true);
    const [help, setHelp] = useState(false);

    useEffect(() => {
        document.querySelector(".wk-print")?.classList.toggle("no-answers", !answers);
    }, [answers]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("pdf") !== "1") return;
        const t = setTimeout(() => setHelp(true), 0);
        return () => clearTimeout(t);
    }, []);

    const download = () => {
        setHelp(false);
        // Laisse la carte se fermer avant d'ouvrir la boîte d'impression
        setTimeout(() => window.print(), 50);
    };

    return (
        <>
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
                        <button type="button" onClick={download} className="wk-btn-orange !px-4 !py-2 text-sm">
                            <Download className="h-4 w-4" /> Télécharger le PDF
                        </button>
                    </div>
                </div>
            </div>

            {help && (
                <div className="wk-print-toolbar fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(26,21,18,0.45)] p-4" onClick={() => setHelp(false)}>
                    <div
                        role="dialog"
                        aria-labelledby="pdf-help-title"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] p-6 text-[var(--wk-ink)] shadow-[0_24px_60px_rgba(26,21,18,0.25)]"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--wk-accent)]">Ton PDF est prêt</p>
                                <h2 id="pdf-help-title" className="font-serif-display mt-1 text-3xl leading-tight">
                                    Enregistre-le en 2 clics
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHelp(false)}
                                aria-label="Fermer"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(26,21,18,0.1)] bg-white hover:bg-[var(--wk-paper-2)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <ol className="mt-5 space-y-3 text-sm">
                            <li className="flex gap-3">
                                <span className="font-serif-display text-2xl leading-none text-[var(--wk-accent)]">1</span>
                                <span>
                                    Clique sur <b>Télécharger le PDF</b>.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-serif-display text-2xl leading-none text-[var(--wk-accent)]">2</span>
                                <span>
                                    Dans la fenêtre qui s&apos;ouvre, choisis la destination <b>« Enregistrer au format PDF »</b> puis <b>Enregistrer</b>.
                                </span>
                            </li>
                        </ol>
                        <p className="mt-4 text-xs text-[rgba(26,21,18,0.55)]">
                            Sur téléphone : touche <b>Télécharger le PDF</b>, puis « Enregistrer en PDF » ou « Partager → Enregistrer dans Fichiers ».
                        </p>
                        <button type="button" onClick={download} className="wk-btn-orange mt-6 w-full !justify-center !py-3 text-sm">
                            <Download className="h-4 w-4" /> Télécharger le PDF
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
