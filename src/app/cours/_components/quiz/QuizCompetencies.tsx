"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, Clock } from "lucide-react";
import type { CompetencyInfo } from "./types";

const STATUS_STYLES: Record<CompetencyInfo["status"], string> = {
    not_started: "bg-gray-100 text-gray-600 border-gray-200",
    in_progress: "bg-amber-100 text-amber-700 border-amber-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    mastered: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

/** Couleur déduite du score obtenu, pour l'écran de résultats. */
function scoreStyle(percentage: number): string {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-700";
    if (percentage < 40) return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
}

interface QuizCompetenciesProps {
    /** Identifiants bruts, utilisés tant que le détail n'est pas chargé. */
    skillIds: string[];
    /** Détail enrichi par l'API (statut de maîtrise de l'élève). */
    details: CompetencyInfo[];
    /**
     * « status » colore selon la maîtrise actuelle (avant le quiz),
     * « score » selon le résultat obtenu (après soumission).
     */
    variant: "status" | "score";
    /** Pourcentage obtenu — requis pour la variante « score ». */
    percentage?: number;
}

/**
 * Pastilles des compétences validées par un quiz.
 * Partagé par l'en-tête du lecteur et l'écran de résultats, qui n'en
 * diffèrent que par la règle de coloration.
 */
export default function QuizCompetencies({
    skillIds,
    details,
    variant,
    percentage = 0,
}: QuizCompetenciesProps) {
    if (details.length === 0) {
        return (
            <div className="flex flex-wrap gap-2">
                {skillIds.map((skillId) => (
                    <Badge
                        key={skillId}
                        variant="outline"
                        className={`text-xs font-medium ${
                            variant === "score" ? scoreStyle(percentage) : "bg-gray-50"
                        }`}
                    >
                        {skillId}
                    </Badge>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {details.map((comp) => {
                const needsReview =
                    comp.status === "in_progress" &&
                    comp.nextReview &&
                    new Date(comp.nextReview) <= new Date();

                return (
                    <Badge
                        key={comp.skillId}
                        variant="outline"
                        className={`text-xs font-medium ${
                            variant === "score" ? scoreStyle(percentage) : STATUS_STYLES[comp.status]
                        }`}
                        title={comp.description}
                    >
                        {comp.skillId}
                        {variant === "score" ? (
                            percentage >= 80 ? (
                                <CheckCircle className="w-3 h-3 ml-1 inline" />
                            ) : (
                                <Clock className="w-3 h-3 ml-1 inline" />
                            )
                        ) : (
                            <>
                                {comp.status === "mastered" && (
                                    <CheckCircle className="w-3 h-3 ml-1 inline" />
                                )}
                                {needsReview && <span className="ml-1 text-[10px]">À réviser</span>}
                            </>
                        )}
                    </Badge>
                );
            })}
        </div>
    );
}
