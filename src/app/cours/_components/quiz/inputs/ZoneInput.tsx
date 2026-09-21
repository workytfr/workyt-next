"use client";

import React, { useRef, useState } from "react";
import { SquareDashedMousePointer } from "lucide-react";
import ImageCanvas, { type PercentPoint } from "./ImageCanvas";
import type { QuestionInputProps } from "../types";

/** Rectangle normalisé à partir de deux coins, quel que soit le sens du tracé. */
function rectFrom(a: PercentPoint, b: PercentPoint) {
    return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        w: Math.abs(b.x - a.x),
        h: Math.abs(b.y - a.y),
    };
}

/**
 * Zone sur image : l'élève trace un rectangle autour de la région demandée.
 * La note dépend du recouvrement avec la zone attendue (IoU, voir
 * `@/lib/imageQuestion`), pas d'un clic exact.
 */
export default function ZoneInput({ question, value, onChange }: QuestionInputProps) {
    const imageUrl = question.answers[0];
    const startRef = useRef<PercentPoint | null>(null);
    const [draft, setDraft] = useState<ReturnType<typeof rectFrom> | null>(null);

    if (!imageUrl) {
        return (
            <div className="p-4 rounded-xl border-2 border-dashed border-[#e8dfd0] text-sm text-[#6b625a]">
                Cette question n&apos;a pas d&apos;image associée.
            </div>
        );
    }

    const committed =
        value && Number.isFinite(Number(value.w)) && Number(value.w) > 0 ? value : null;
    const rect = draft ?? committed;

    const handleDragStart = (point: PercentPoint) => {
        startRef.current = point;
        setDraft(rectFrom(point, point));
    };

    const handleDragMove = (point: PercentPoint) => {
        if (!startRef.current) return;
        setDraft(rectFrom(startRef.current, point));
    };

    const handleDragEnd = () => {
        // Un simple clic (rectangle quasi nul) n'est pas une réponse : on
        // l'ignore plutôt que d'enregistrer une zone vide.
        if (draft && draft.w > 1 && draft.h > 1) {
            onChange(draft);
        }
        setDraft(null);
        startRef.current = null;
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#8f857b] flex items-center gap-1.5">
                <SquareDashedMousePointer className="w-3.5 h-3.5" />
                Tracez un rectangle autour de la zone demandée (cliquez-glissez).
            </p>

            <ImageCanvas
                src={imageUrl}
                alt="Image de la question"
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
            >
                {rect && rect.w > 0 && rect.h > 0 && (
                    <span
                        style={{
                            left: `${rect.x}%`,
                            top: `${rect.y}%`,
                            width: `${rect.w}%`,
                            height: `${rect.h}%`,
                        }}
                        className="absolute border-2 border-[#ff6a1a] bg-[#ff6a1a]/20 rounded pointer-events-none"
                    />
                )}
            </ImageCanvas>

            <p className="text-xs text-[#8f857b]">
                {committed
                    ? "Tracez à nouveau pour corriger votre zone."
                    : "Aucune zone tracée pour l'instant."}
            </p>
        </div>
    );
}
