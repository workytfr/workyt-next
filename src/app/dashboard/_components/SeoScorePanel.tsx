"use client";

import { useMemo, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react";
import {
    auditCourseSeo,
    type SeoCheckInput,
    type SeoCheckStatus,
} from "@/lib/seoCourseChecks";

const STATUS_ICON: Record<SeoCheckStatus, ReactNode> = {
    ok: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
};

function scoreColor(score: number): string {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
}

function scoreBarColor(score: number): string {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
}

/**
 * Panneau d'aide SEO pour l'édition d'un cours.
 * Calcule le score en temps réel à partir des champs du cours.
 */
export default function SeoScorePanel({ input }: { input: SeoCheckInput }) {
    const { score, checks } = useMemo(() => auditCourseSeo(input), [input]);

    return (
        <div className="dash-card p-5 space-y-4">
            {/* En-tête avec score */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#ff6a1a]" />
                    <h3 className="font-semibold text-[#1a1512]">Score SEO</h3>
                </div>
                <span className={`text-2xl font-bold ${scoreColor(score)}`}>
                    {score}
                    <span className="text-sm font-medium text-[#97938e]">/100</span>
                </span>
            </div>

            {/* Barre de score */}
            <div className="h-2 bg-[#e6e0d6] rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
                    style={{ width: `${score}%` }}
                />
            </div>

            {/* Aperçu Google (titre composé automatiquement par Workyt) */}
            <div className="p-3 bg-[#f5efe3] rounded-lg border border-[#e6e0d6]">
                <p className="text-[10px] uppercase tracking-wide text-[#97938e] mb-1.5">
                    Aperçu dans Google
                </p>
                <p className="text-sm text-[#1a0dab] font-medium leading-snug line-clamp-1">
                    {input.title || "Titre du cours"} - Cours {input.matiere} {input.niveau} | Workyt
                </p>
                <p className="text-xs text-emerald-700 leading-snug line-clamp-1">
                    workyt.fr › cours › …
                </p>
                <p className="text-xs text-[#4d5156] leading-snug line-clamp-2 mt-0.5">
                    {input.description || "Ajoutez une description pour contrôler ce que Google affiche ici…"}
                </p>
            </div>

            {/* Checklist */}
            <ul className="space-y-3">
                {checks.map((check) => (
                    <li key={check.id} className="flex items-start gap-2.5">
                        {STATUS_ICON[check.status]}
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1a1512]">{check.label}</p>
                            <p className="text-xs text-[#6b625c] leading-relaxed">{check.advice}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
