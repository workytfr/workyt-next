"use client";

import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import LatexText from "../LatexText";
import { seededShuffle } from "../utils";
import type { QuestionInputProps } from "../types";

/**
 * Classement : l'élève remet les éléments dans le bon ordre.
 *
 * `answers` contient les éléments dans l'ordre correct — ils sont donc
 * mélangés à l'affichage, et la réponse transmise est la liste des index
 * d'origine dans l'ordre choisi.
 */
export default function OrderingInput({ question, value, onChange }: QuestionInputProps) {
    const items = question.answers;

    const initialOrder = useMemo(
        () => seededShuffle(items.map((_, i) => i), items.length * 7 + 31),
        // Ordre figé pour la durée de la question : il ne doit pas se remélanger
        // à chaque rendu.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const order: number[] = Array.isArray(value) ? value : initialOrder;

    // L'ordre mélangé devient la réponse par défaut : sans cela, une question
    // laissée telle quelle partirait sans valeur.
    useEffect(() => {
        if (!Array.isArray(value)) onChange(initialOrder);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const moveItem = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= order.length) return;
        const next = [...order];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <p className="text-xs text-[#8f857b] mb-3">
                Utilisez les flèches pour remettre les éléments dans le bon ordre.
            </p>

            <AnimatePresence initial={false}>
                {order.map((itemIndex, posIndex) => (
                    <motion.div
                        key={itemIndex}
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        className="flex items-center gap-2 p-3 rounded-xl border-2 border-[#e8dfd0] bg-white"
                    >
                        <GripVertical className="w-4 h-4 text-[#b4b4b0] flex-shrink-0" />

                        <span className="w-6 h-6 rounded-full bg-[#f5efe3] flex items-center justify-center text-xs font-medium text-[#6b625a] flex-shrink-0">
                            {posIndex + 1}
                        </span>

                        <span className="flex-1 text-sm sm:text-base text-[#1a1512]">
                            <LatexText text={items[itemIndex]} />
                        </span>

                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => moveItem(posIndex, posIndex - 1)}
                                disabled={posIndex === 0}
                                aria-label="Monter d'une place"
                                className="p-1 rounded hover:bg-[#f5efe3] disabled:opacity-30 transition-colors"
                            >
                                <ArrowUp className="w-3.5 h-3.5 text-[#6b625a]" />
                            </button>
                            <button
                                type="button"
                                onClick={() => moveItem(posIndex, posIndex + 1)}
                                disabled={posIndex === order.length - 1}
                                aria-label="Descendre d'une place"
                                className="p-1 rounded hover:bg-[#f5efe3] disabled:opacity-30 transition-colors"
                            >
                                <ArrowDown className="w-3.5 h-3.5 text-[#6b625a]" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
