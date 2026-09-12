"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import LatexText from "../LatexText";
import type { QuestionInputProps } from "../types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * QCM à choix unique ou multiple.
 * Le mode est porté par `answerSelectionType` : en choix unique la sélection
 * remplace la précédente, en choix multiple elle s'ajoute ou se retire.
 */
export default function ChoiceInput({ question, value, onChange }: QuestionInputProps) {
    const isMultiple = question.answerSelectionType === "multiple";

    const isSelected = (index: number) =>
        isMultiple ? Array.isArray(value) && value.includes(index) : value === index;

    const toggle = (index: number) => {
        if (!isMultiple) {
            onChange(index);
            return;
        }

        const previous: number[] = Array.isArray(value) ? value : [];
        onChange(
            previous.includes(index)
                ? previous.filter((i) => i !== index)
                : [...previous, index]
        );
    };

    return (
        <div className="space-y-2.5">
            {isMultiple && (
                <p className="text-xs text-[#9ca3af] mb-3">
                    Plusieurs réponses sont attendues.
                </p>
            )}

            {question.answers.map((answer, index) => {
                const selected = isSelected(index);

                return (
                    <motion.button
                        key={index}
                        type="button"
                        onClick={() => toggle(index)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.2 }}
                        whileTap={{ scale: 0.99 }}
                        aria-pressed={selected}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-150 flex items-start gap-3 ${
                            selected
                                ? "border-[#f97316] bg-[#fff7ed] shadow-sm"
                                : "border-[#e3e2e0] bg-white hover:border-[#d1d0ce] hover:bg-[#fafaf9]"
                        }`}
                    >
                        <span
                            className={`w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold border-2 transition-colors ${
                                isMultiple ? "rounded-md" : "rounded-full"
                            } ${
                                selected
                                    ? "border-[#f97316] bg-[#f97316] text-white"
                                    : "border-[#d1d0ce] text-[#9ca3af]"
                            }`}
                        >
                            {selected ? (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </motion.span>
                            ) : (
                                LETTERS[index] ?? index + 1
                            )}
                        </span>

                        <span className="text-[#37352f] text-sm sm:text-base leading-relaxed">
                            <LatexText text={answer} />
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}
