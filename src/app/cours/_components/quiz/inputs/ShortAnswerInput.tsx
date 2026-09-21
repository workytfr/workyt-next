"use client";

import React from "react";
import type { QuestionInputProps } from "../types";

/**
 * Réponse courte en texte libre.
 * La correction ignore la casse et les espaces de bord (voir la route POST),
 * d'où le rappel affiché sous le champ.
 */
export default function ShortAnswerInput({ value, onChange }: QuestionInputProps) {
    return (
        <div className="space-y-2">
            <input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Tapez votre réponse..."
                aria-label="Votre réponse"
                autoComplete="off"
                className="w-full p-4 border-2 border-[#e8dfd0] rounded-xl text-[#1a1512] placeholder-[#b4b4b0] focus:border-[#ff6a1a] focus:ring-0 focus:outline-none transition-colors bg-white text-sm sm:text-base"
            />
            <p className="text-xs text-[#8f857b]">
                La casse et les espaces en trop ne sont pas pris en compte.
            </p>
        </div>
    );
}
