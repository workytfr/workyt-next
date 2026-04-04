"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Target,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Clock,
    XCircle,
    Circle,
} from "lucide-react";
import { motion } from "framer-motion";

interface CompetencyInfo {
    skillId: string;
    description: string;
    difficulty: number;
    status: "not_started" | "in_progress" | "failed" | "mastered";
    bestScore: number;
    theme: string;
    chapter: string;
    nextReview?: string;
}

interface CourseCompetenciesProps {
    courseId: string;
}

const STATUS_CONFIG = {
    mastered: {
        label: "Maîtrisé",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: CheckCircle2,
    },
    in_progress: {
        label: "En cours",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Clock,
    },
    failed: {
        label: "À revoir",
        color: "text-red-500",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: XCircle,
    },
    not_started: {
        label: "Non commencé",
        color: "text-[#9ca3af]",
        bg: "bg-[#f7f6f3]",
        border: "border-[#e3e2e0]",
        icon: Circle,
    },
};

const DIFFICULTY_LABELS = ["", "Facile", "Moyen", "Intermédiaire", "Avancé", "Expert"];
const DIFFICULTY_COLORS = ["", "text-green-600 bg-green-50", "text-blue-600 bg-blue-50", "text-yellow-600 bg-yellow-50", "text-orange-600 bg-orange-50", "text-red-600 bg-red-50"];

export default function CourseCompetencies({ courseId }: CourseCompetenciesProps) {
    const { data: session } = useSession();
    const [competencies, setCompetencies] = useState<CompetencyInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchCompetencies() {
            try {
                const res = await fetch(`/api/competencies/by-course?courseId=${courseId}`, {
                    headers: session?.accessToken
                        ? { Authorization: `Bearer ${session.accessToken}` }
                        : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    setCompetencies(data.competencies || []);
                    const themes: string[] = [...new Set((data.competencies || []).map((c: CompetencyInfo) => c.theme))] as string[];
                    if (themes.length > 0) setExpandedThemes(new Set<string>(themes.slice(0, 2)));
                }
            } catch (err) {
                console.error("Erreur chargement compétences du cours:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCompetencies();
    }, [courseId, session?.accessToken]);

    if (loading) return null;
    if (competencies.length === 0) return null;

    const mastered = competencies.filter(c => c.status === "mastered").length;
    const inProgress = competencies.filter(c => c.status === "in_progress").length;
    const failed = competencies.filter(c => c.status === "failed").length;
    const notStarted = competencies.length - mastered - inProgress - failed;
    const total = competencies.length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    // Grouper par theme
    const grouped: Record<string, CompetencyInfo[]> = {};
    for (const c of competencies) {
        const key = c.theme || "Général";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
    }

    const toggleTheme = (theme: string) => {
        setExpandedThemes(prev => {
            const next = new Set(prev);
            if (next.has(theme)) next.delete(theme);
            else next.add(theme);
            return next;
        });
    };

    return (
        <div className="mt-12 pt-8 border-t border-[#e3e2e0]">
            {/* Header — même style que CourseFichesSection */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#37352f]">
                            Compétences du programme
                        </h3>
                        <p className="text-sm text-[#9ca3af]">
                            {mastered}/{total} compétence{total > 1 ? "s" : ""} maîtrisée{mastered > 1 ? "s" : ""} &middot; {percent}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Barre de progression */}
            <div className="w-full h-2.5 bg-[#f7f6f3] rounded-full overflow-hidden flex mb-4">
                {mastered > 0 && (
                    <div
                        className="h-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${(mastered / total) * 100}%` }}
                    />
                )}
                {inProgress > 0 && (
                    <div
                        className="h-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${(inProgress / total) * 100}%` }}
                    />
                )}
                {failed > 0 && (
                    <div
                        className="h-full bg-red-400 transition-all duration-500"
                        style={{ width: `${(failed / total) * 100}%` }}
                    />
                )}
            </div>

            {/* Mini stats — style badges */}
            <div className="flex flex-wrap gap-2 mb-5">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {mastered} maîtrisée{mastered > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                    <Clock className="w-3.5 h-3.5" /> {inProgress} en cours
                </span>
                {failed > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> {failed} à revoir
                    </span>
                )}
                {notStarted > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f6f3] text-[#9ca3af] text-xs font-medium rounded-full">
                        <Circle className="w-3.5 h-3.5" /> {notStarted} non commencée{notStarted > 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {/* Compétences groupées par thème */}
            <div className="space-y-3">
                {Object.entries(grouped).map(([theme, skills], themeIdx) => {
                    const themeMastered = skills.filter(s => s.status === "mastered").length;
                    const themePercent = skills.length > 0 ? Math.round((themeMastered / skills.length) * 100) : 0;
                    const isOpen = expandedThemes.has(theme);

                    return (
                        <motion.div
                            key={theme}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: themeIdx * 0.05 }}
                            className="bg-[#f7f6f3] rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => toggleTheme(theme)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#efeeeb] transition-colors text-left"
                            >
                                {isOpen ? (
                                    <ChevronDown className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                                )}
                                <span className="text-sm font-semibold text-[#37352f] flex-1">{theme}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/60 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                            style={{ width: `${themePercent}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-[#9ca3af] font-medium tabular-nums">
                                        {themeMastered}/{skills.length}
                                    </span>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="px-4 pb-4 space-y-2">
                                    {skills.map((skill, skillIdx) => {
                                        const config = STATUS_CONFIG[skill.status];
                                        const Icon = config.icon;
                                        const isRevisionDue =
                                            skill.nextReview &&
                                            new Date(skill.nextReview) <= new Date() &&
                                            skill.status !== "mastered";

                                        return (
                                            <motion.div
                                                key={skill.skillId}
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: skillIdx * 0.03 }}
                                                className={`flex items-start gap-3 px-4 py-3 rounded-xl border bg-white ${config.border} transition-colors`}
                                            >
                                                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.color}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-mono text-[11px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-medium">
                                                            {skill.skillId}
                                                        </span>
                                                        {skill.difficulty > 0 && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_COLORS[skill.difficulty] || ""}`}>
                                                                {DIFFICULTY_LABELS[skill.difficulty]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-[#37352f] leading-snug">
                                                        {skill.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isRevisionDue && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                                            Révision
                                                        </span>
                                                    )}
                                                    {skill.bestScore > 0 && (
                                                        <span className={`text-xs font-semibold ${
                                                            skill.bestScore >= 80 ? "text-emerald-600" :
                                                            skill.bestScore >= 60 ? "text-amber-600" : "text-red-500"
                                                        }`}>
                                                            {skill.bestScore}%
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
