"use client";

import React from "react";
import { blankWidth, parseTemplate, toBlankValues } from "./blanks";
import type { QuestionInputProps } from "../types";

/**
 * Texte à trous. Le gabarit est dans `answers[0]`, chaque `{{blank}}` devenant
 * un champ. Avec un seul trou la réponse est transmise comme chaîne simple,
 * au-delà comme tableau — c'est ce qu'attend la correction côté serveur.
 */
export default function FillBlanksInput({ question, value, onChange }: QuestionInputProps) {
    const template = question.answers[0] || "";
    const { parts, blankCount } = parseTemplate(template);
    const values = toBlankValues(value, blankCount);

    const handleChange = (index: number, next: string) => {
        if (blankCount <= 1) {
            onChange(next);
            return;
        }
        const updated = [...values];
        updated[index] = next;
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#8f857b]">
                {blankCount > 1
                    ? "Complétez les trous dans le texte ci-dessous."
                    : "Complétez le trou dans le texte ci-dessous."}
            </p>

            <div className="bg-white border-2 border-[#e8dfd0] rounded-xl p-4">
                <p className="text-sm sm:text-base text-[#1a1512] leading-relaxed whitespace-pre-wrap">
                    {parts.map((part, index) => (
                        <span key={index}>
                            <span>{part}</span>
                            {index < blankCount && (
                                <input
                                    type="text"
                                    value={values[index] || ""}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    placeholder={blankCount > 1 ? `trou ${index + 1}` : "votre réponse"}
                                    aria-label={
                                        blankCount > 1
                                            ? `Trou ${index + 1} sur ${blankCount}`
                                            : "Votre réponse"
                                    }
                                    autoComplete="off"
                                    className="inline-block bg-[#fafaf9] border-2 border-[#ff6a1a] rounded-lg px-2 py-0.5 text-[#1a1512] text-sm min-w-[80px] focus:outline-none focus:ring-1 focus:ring-[#ff6a1a] placeholder-[#b4b4b0] mx-1"
                                    style={{ width: blankWidth(values[index] || "", blankCount > 1 ? 80 : 100) }}
                                />
                            )}
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}
