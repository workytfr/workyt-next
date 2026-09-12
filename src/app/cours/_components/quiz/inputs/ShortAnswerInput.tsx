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
                className="w-full p-4 border-2 border-[#e3e2e0] rounded-xl text-[#37352f] placeholder-[#b4b4b0] focus:border-[#f97316] focus:ring-0 focus:outline-none transition-colors bg-white text-sm sm:text-base"
            />
            <p className="text-xs text-[#9ca3af]">
                La casse et les espaces en trop ne sont pas pris en compte.
            </p>
        </div>
    );
}
