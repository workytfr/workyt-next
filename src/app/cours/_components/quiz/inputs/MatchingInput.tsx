"use client";

import React, { useMemo } from "react";
import { ArrowRight, Link2 } from "lucide-react";
import LatexText from "../LatexText";
import { seededShuffle } from "../utils";
import type { QuestionInputProps } from "../types";

/**
 * Glisser-déposer (association) : la première moitié de `answers` forme la
 * colonne de gauche, la seconde les propositions de droite.
 *
 * Les propositions de droite sont mélangées à l'affichage : saisies dans
 * l'ordre des paires par l'auteur, les laisser telles quelles revenait à
 * donner le corrigé dans l'ordre de la liste déroulante.
 */
export default function MatchingInput({ question, value, onChange }: QuestionInputProps) {
    const pivot = Math.ceil(question.answers.length / 2);
    const leftItems = question.answers.slice(0, pivot);
    const rightItems = question.answers.slice(pivot);

    const shuffledRight = useMemo(
        () => seededShuffle(rightItems, rightItems.length * 13 + 7),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [question.answers.join("|")]
    );

    const selections: string[] = Array.isArray(value)
        ? value
        : new Array(leftItems.length).fill("");

    const handleSelect = (leftIdx: number, rightValue: string) => {
        const next = [...selections];
        next[leftIdx] = rightValue;
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#8f857b] mb-3 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Associez chaque élément de gauche à son correspondant de droite.
            </p>

            {leftItems.map((leftItem, leftIdx) => (
                <div
                    key={leftIdx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl border-2 border-[#e8dfd0] bg-white"
                >
                    <div className="flex-1 text-sm sm:text-base text-[#1a1512] font-medium">
                        <LatexText text={leftItem} />
                    </div>

                    <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-[#b4b4b0] hidden sm:block flex-shrink-0" />
                        <select
                            value={selections[leftIdx] || ""}
                            onChange={(e) => handleSelect(leftIdx, e.target.value)}
                            aria-label={`Correspondance pour « ${leftItem} »`}
                            className={`w-full sm:w-48 p-2.5 rounded-lg border-2 text-sm transition-colors ${
                                selections[leftIdx]
                                    ? "border-[#ff6a1a] bg-[#fff1e6] text-[#1a1512]"
                                    : "border-[#e8dfd0] bg-[#fafaf9] text-[#6b625a]"
                            }`}
                        >
                            <option value="">Choisir...</option>
                            {shuffledRight.map((rightItem, rightIdx) => (
                                <option key={rightIdx} value={rightItem}>
                                    {rightItem}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
}
