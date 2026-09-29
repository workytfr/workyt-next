"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ensureMathlive, isMathliveLoaded } from "@/lib/ensureMathlive";
import { Spinner } from "../ui";

type MathfieldLike = HTMLElement & {
    value: string;
    insert?: (latex: string, options?: { focus?: boolean }) => boolean;
};

/**
 * Raccourcis du clavier de formules. `#@` reprend ce qui est sélectionné,
 * `#?` est une case à remplir (syntaxe MathLive).
 */
const TEMPLATES: { label: string; latex: string; title: string }[] = [
    { label: "a⁄b", latex: "\\frac{#@}{#?}", title: "Fraction" },
    { label: "√", latex: "\\sqrt{#@}", title: "Racine carrée" },
    { label: "xⁿ", latex: "#@^{#?}", title: "Puissance" },
    { label: "xₙ", latex: "#@_{#?}", title: "Indice" },
    { label: "×", latex: "\\times", title: "Multiplié par" },
    { label: "÷", latex: "\\div", title: "Divisé par" },
    { label: "±", latex: "\\pm", title: "Plus ou moins" },
    { label: "≤", latex: "\\leq", title: "Inférieur ou égal" },
    { label: "≥", latex: "\\geq", title: "Supérieur ou égal" },
    { label: "≠", latex: "\\neq", title: "Différent de" },
    { label: "≈", latex: "\\approx", title: "Environ égal" },
    { label: "π", latex: "\\pi", title: "Pi" },
    { label: "∞", latex: "\\infty", title: "Infini" },
    { label: "|x|", latex: "\\left|#@\\right|", title: "Valeur absolue" },
    { label: "( )", latex: "\\left(#@\\right)", title: "Parenthèses" },
    { label: "→", latex: "\\rightarrow", title: "Flèche" },
];

/**
 * Clavier de formules : on écrit la formule « comme sur papier » (MathLive),
 * sans connaître le LaTeX, puis on l'insère dans le texte entre `$…$`.
 * Panneau intégré (pas une fenêtre modale) pour que le clavier virtuel de
 * MathLive reste utilisable sur téléphone.
 */
export default function MathPanel({ onInsert, onClose }: { onInsert: (latex: string) => void; onClose: () => void }) {
    const [ready, setReady] = useState(isMathliveLoaded);
    const [empty, setEmpty] = useState(true);
    const fieldRef = useRef<MathfieldLike | null>(null);

    useEffect(() => {
        let cancelled = false;
        ensureMathlive().then(() => {
            if (!cancelled) setReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const el = fieldRef.current;
        if (!ready || !el) return;
        const onInput = () => setEmpty(!el.value.trim());
        el.addEventListener("input", onInput);
        el.focus();
        return () => el.removeEventListener("input", onInput);
    }, [ready]);

    const template = (latex: string) => {
        const el = fieldRef.current;
        if (!el?.insert) return;
        el.insert(latex, { focus: true });
        setEmpty(!el.value.trim());
    };

    const submit = () => {
        const latex = fieldRef.current?.value.trim();
        if (!latex) return;
        onInsert(latex);
    };

    return (
        <div className="mb-2 rounded-2xl border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] p-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Clavier de formules</span>
                <button type="button" onClick={onClose} className="rounded-full p-1 text-[rgba(26,21,18,0.5)] hover:bg-white" aria-label="Fermer le clavier de formules">
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            {ready ? (
                <math-field
                    ref={fieldRef as React.Ref<HTMLElement>}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submit();
                        }
                        if (e.key === "Escape") onClose();
                    }}
                    style={{
                        display: "block",
                        width: "100%",
                        fontSize: "1.25rem",
                        padding: "6px 10px",
                        borderRadius: 14,
                        border: "1px solid rgba(26,21,18,0.14)",
                        background: "#fff",
                    }}
                    aria-label="Formule"
                />
            ) : (
                <div className="flex h-11 items-center justify-center">
                    <Spinner className="h-4 w-4" />
                </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
                {TEMPLATES.map((t) => (
                    <button
                        key={t.title}
                        type="button"
                        // Garder le focus (et la sélection) dans la formule
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => template(t.latex)}
                        disabled={!ready}
                        title={t.title}
                        aria-label={t.title}
                        className="h-8 min-w-8 rounded-lg border border-[rgba(26,21,18,0.1)] bg-white px-2 text-sm transition hover:border-[var(--wk-accent)] disabled:opacity-40"
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[rgba(26,21,18,0.5)]">Écris au clavier : 1/2 devient une fraction, ^ une puissance.</span>
                <button type="button" onClick={submit} disabled={!ready || empty} className="wk-btn-ink shrink-0 !px-3.5 !py-1.5 text-xs disabled:opacity-40">
                    Insérer
                </button>
            </div>
        </div>
    );
}
