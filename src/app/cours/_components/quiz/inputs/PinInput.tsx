"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import ImageCanvas, { type PercentPoint } from "./ImageCanvas";
import { parsePinAnswer } from "@/lib/imageQuestion";
import type { QuestionInputProps } from "../types";

/**
 * Point sur image : l'élève clique une fois pour poser un marqueur.
 * L'image est dans `answers[0]`, la cible et son rayon de tolérance dans
 * `correctAnswer` (jamais transmis à l'élève — voir la projection du GET).
 */
export default function PinInput({ question, value, onChange }: QuestionInputProps) {
    const imageUrl = question.answers[0];
    const answer = parsePinAnswer(value);

    if (!imageUrl) {
        return (
            <div className="p-4 rounded-xl border-2 border-dashed border-[#e8dfd0] text-sm text-[#6b625a]">
                Cette question n&apos;a pas d&apos;image associée.
            </div>
        );
    }

    const handlePoint = (point: PercentPoint) => onChange(point);

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#8f857b] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Cliquez sur l&apos;image à l&apos;endroit demandé.
            </p>

            <ImageCanvas src={imageUrl} alt="Image de la question" onPoint={handlePoint}>
                {answer && (
                    <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        style={{ left: `${answer.x}%`, top: `${answer.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
                    >
                        <MapPin
                            className="w-8 h-8 text-[#ff6a1a] drop-shadow"
                            fill="#ff6a1a"
                            strokeWidth={1.5}
                        />
                    </motion.span>
                )}
            </ImageCanvas>

            <p className="text-xs text-[#8f857b]">
                {answer
                    ? "Cliquez à nouveau pour déplacer le marqueur."
                    : "Aucun marqueur posé pour l'instant."}
            </p>
        </div>
    );
}
