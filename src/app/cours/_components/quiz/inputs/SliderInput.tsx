"use client";

import React from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import type { QuestionInputProps } from "../types";

/**
 * Estimation au curseur.
 * Métadonnées portées par `answers` : [0] min, [1] max, [2] pas, [3] unité,
 * [4] tolérance acceptée à la correction.
 */
export default function SliderInput({ question, value, onChange }: QuestionInputProps) {
    const min = parseFloat(question.answers[0] || "0");
    const max = parseFloat(question.answers[1] || "100");
    const step = parseFloat(question.answers[2] || "1");
    const unit = question.answers[3] || "";
    const tolerance = question.answers[4] ? parseFloat(question.answers[4]) : 0;

    const currentValue = value !== undefined ? parseFloat(String(value)) : (min + max) / 2;
    const ratio = max > min ? (currentValue - min) / (max - min) : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#9ca3af]" />
                <span className="text-xs text-[#9ca3af]">
                    Ajustez le curseur pour donner votre estimation
                    {tolerance > 0 && ` (tolérance : ±${tolerance}${unit})`}
                </span>
            </div>

            <div className="bg-white border-2 border-[#e3e2e0] rounded-xl p-5">
                <div className="text-center mb-4">
                    <motion.span
                        key={currentValue}
                        initial={{ scale: 1.08 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.12 }}
                        className="inline-block text-3xl font-bold text-[#f97316]"
                    >
                        {currentValue}
                    </motion.span>
                    {unit && <span className="text-lg text-[#6b6b6b] ml-1">{unit}</span>}
                </div>

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    aria-label="Votre estimation"
                    aria-valuetext={`${currentValue}${unit}`}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#f97316]"
                    style={{
                        background: `linear-gradient(to right, #f97316 ${ratio * 100}%, #e3e2e0 ${ratio * 100}%)`,
                    }}
                />

                <div className="flex justify-between text-xs text-[#9ca3af] mt-2">
                    <span>
                        {min}
                        {unit}
                    </span>
                    <span>
                        {max}
                        {unit}
                    </span>
                </div>
            </div>
        </div>
    );
}
