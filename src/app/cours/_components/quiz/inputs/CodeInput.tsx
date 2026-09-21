"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Code2 } from "lucide-react";
import { getLanguageLabel, normalizeLanguage } from "@/lib/codeHighlight";
import { blankWidth, parseTemplate, toBlankValues } from "./blanks";
import type { QuestionInputProps } from "../types";
import "@/components/ui/code-block.css";

/**
 * L'éditeur pèse ~150 Ko : il n'est chargé que si la question en a besoin,
 * c'est-à-dire uniquement en saisie libre.
 */
const CodeEditor = dynamic(() => import("@/components/ui/CodeEditor"), {
    ssr: false,
    loading: () => (
        <div className="p-4 text-xs text-[#8a8178]">Chargement de l&apos;éditeur...</div>
    ),
});

/**
 * Question de code. `answers[0]` porte le langage, `answers[1]` le gabarit —
 * avec `{{blank}}` pour compléter un extrait, ou vide pour une saisie libre.
 *
 * L'habillage est celui des blocs de code des leçons et des exercices
 * (`code-block.css`), pour que le code ait la même apparence partout.
 */
export default function CodeInput({ question, value, onChange }: QuestionInputProps) {
    const language = normalizeLanguage(question.answers[0]);
    const label = getLanguageLabel(language);
    const template = question.answers[1] || "";
    const { parts, blankCount } = parseTemplate(template);
    const values = toBlankValues(value, Math.max(blankCount, 1));

    const handleChange = (index: number, next: string) => {
        if (blankCount <= 1) {
            onChange(next);
            return;
        }
        const updated = [...values];
        updated[index] = next;
        onChange(updated);
    };

    const shell = (hint: string, children: React.ReactNode, padded: boolean) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#8f857b]" />
                <span className="text-xs text-[#8f857b]">{hint}</span>
            </div>

            <div className="wk-code" data-language={language ?? "plaintext"}>
                <div className="wk-code__bar">
                    <span className="wk-code__lang">{label}</span>
                </div>
                {padded ? (
                    <pre className="wk-code__pre" style={{ whiteSpace: "pre-wrap" }}>
                        {children}
                    </pre>
                ) : (
                    children
                )}
            </div>
        </div>
    );

    // --- Compléter un gabarit : champs en ligne dans le code ---
    if (blankCount > 0) {
        return shell(
            `Complétez le code (${label})`,
            parts.map((part, index) => (
                <span key={index}>
                    <span>{part}</span>
                    {index < blankCount && (
                        <input
                            type="text"
                            value={values[index] || ""}
                            onChange={(e) => handleChange(index, e.target.value)}
                            placeholder={blankCount > 1 ? `blanc ${index + 1}` : "votre réponse"}
                            aria-label={
                                blankCount > 1
                                    ? `Trou ${index + 1} sur ${blankCount}`
                                    : "Votre réponse"
                            }
                            autoComplete="off"
                            spellCheck={false}
                            className="inline-block bg-[#2d2a26] border border-[#ff6a1a] rounded px-2 py-0.5 text-[#ff6a1a] font-mono text-sm min-w-[80px] focus:outline-none focus:ring-1 focus:ring-[#ff6a1a] placeholder-[#6b6258]"
                            style={{ width: blankWidth(values[index] || "", blankCount > 1 ? 80 : 100) }}
                        />
                    )}
                </span>
            )),
            true
        );
    }

    // --- Saisie libre : véritable éditeur ---
    const freeValue = typeof value === "string" ? value : Array.isArray(value) ? value[0] || "" : "";

    return shell(
        `Écrivez votre code (${label})`,
        <CodeEditor
            value={freeValue}
            onChange={(next) => onChange(next)}
            language={language}
            placeholder={`Écrivez votre code ${label} ici...`}
            aria-label={`Votre code ${label}`}
        />,
        false
    );
}
