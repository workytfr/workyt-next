"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { QuestionInputProps } from "../types";

const OPTIONS = [
    { value: "true", label: "Vrai", Icon: Check },
    { value: "false", label: "Faux", Icon: X },
] as const;

/** Vrai / Faux. La valeur transmise est la chaîne « true » ou « false ». */
export default function TrueFalseInput({ value, onChange }: QuestionInputProps) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {OPTIONS.map(({ value: optionValue, label, Icon }, index) => {
                const selected = value === optionValue;
                const isTrue = optionValue === "true";

                return (
                    <motion.button
                        key={optionValue}
                        type="button"
                        onClick={() => onChange(optionValue)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.2 }}
                        whileTap={{ scale: 0.98 }}
                        aria-pressed={selected}
                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 font-medium text-lg transition-colors duration-150 ${
                            selected
                                ? isTrue
                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                                    : "border-red-400 bg-red-50 text-red-700 shadow-sm"
                                : "border-[#e8dfd0] bg-white hover:border-[#d1d0ce] hover:bg-[#fafaf9] text-[#1a1512]"
                        }`}
                    >
                        <Icon
                            className={`w-6 h-6 ${
                                selected
                                    ? isTrue
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                    : "text-[#b4b4b0]"
                            }`}
                            strokeWidth={2.5}
                        />
                        {label}
                    </motion.button>
                );
            })}
        </div>
    );
}
