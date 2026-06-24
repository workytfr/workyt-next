"use client";

/**
 * Anneau de progression (type camembert rempli sur le contour) pour la checklist.
 * Affiche la fraction terminée au centre (ex. 4/5).
 */
interface Props {
    done: number;
    total: number;
    size?: number;       // diamètre en px
    stroke?: number;     // épaisseur de l'anneau
    showLabel?: boolean; // afficher x/y au centre
}

export default function ChecklistRing({
    done, total, size = 22, stroke = 3, showLabel = true,
}: Props) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = total > 0 ? Math.min(1, done / total) : 0;
    const complete = total > 0 && done >= total;
    const color = complete ? "#10b981" : "#8b5cf6";

    return (
        <span
            className="inline-flex items-center justify-center relative flex-shrink-0"
            style={{ width: size, height: size }}
            title={`${done}/${total} sous-tâches`}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - ratio)}
                    style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.3s ease" }}
                />
            </svg>
            {showLabel && (
                <span
                    className="absolute font-semibold text-gray-600"
                    style={{ fontSize: Math.max(7, size * 0.3) }}
                >
                    {done}/{total}
                </span>
            )}
        </span>
    );
}
