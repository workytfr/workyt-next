"use client";

import React from "react";
import { Bold, Italic, List, Sigma, SquareFunction, type LucideIcon } from "lucide-react";
import type { FormatKind, MarkdownField } from "./useMarkdownField";

const BUTTONS: { kind: FormatKind; icon: LucideIcon; label: string }[] = [
    { kind: "bold", icon: Bold, label: "Gras (**texte**)" },
    { kind: "italic", icon: Italic, label: "Italique (*texte*)" },
    { kind: "list", icon: List, label: "Liste (- élément)" },
    { kind: "math", icon: Sigma, label: "Formule LaTeX : $x^2$, $\\sqrt{2}$…" },
];

export const toolbarButton =
    "flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[rgba(26,21,18,0.55)] transition hover:bg-[var(--wk-paper-2)] hover:text-[var(--wk-ink)] aria-pressed:bg-[var(--wk-paper-2)] aria-pressed:text-[var(--wk-ink)]";

/**
 * Barre de mise en forme d'une zone de texte du suivi. Le clavier de formules
 * (MathPanel) est ouvert par le parent, qui choisit où l'afficher.
 */
export default function FormatToolbar({
    field,
    mathOpen,
    onToggleMath,
    children,
}: {
    field: MarkdownField;
    mathOpen: boolean;
    onToggleMath: () => void;
    /** Boutons supplémentaires (bloc, réponses types…) */
    children?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Mise en forme">
            {BUTTONS.map(({ kind, icon: Icon, label }) => (
                <button
                    key={kind}
                    type="button"
                    // Garder le focus (et la sélection) dans la zone de saisie
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => field.format(kind)}
                    className={`${toolbarButton} w-7`}
                    aria-label={label}
                    title={label}
                >
                    <Icon className="h-3.5 w-3.5" />
                </button>
            ))}
            <button
                type="button"
                onClick={onToggleMath}
                aria-pressed={mathOpen}
                className={toolbarButton}
                title="Clavier de formules : écrire une formule sans connaître le LaTeX"
            >
                <SquareFunction className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold">Formule</span>
            </button>
            {children}
        </div>
    );
}
