"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Award, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Quiz {
    _id: string;
    title: string;
    competencies?: string[];
}

interface SectionCompetenciesProps {
    quizzes: Quiz[];
    className?: string;
}

interface CompetencyInfo {
    skillId: string;
    description: string;
    difficulty: number;
    status: "not_started" | "in_progress" | "failed" | "mastered";
    nextReview?: string;
    quizTitles: string[];
}

const statusConfig = {
    not_started: { color: "bg-gray-100 text-gray-600 border-gray-200", icon: null, label: "Non commencé" },
    in_progress: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "En cours" },
    failed: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "À revoir" },
    mastered: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Maîtrisé" },
};

export function SectionCompetencies({ quizzes, className }: SectionCompetenciesProps) {
    const [expanded, setExpanded] = useState(false);
    const [competencies, setCompetencies] = useState<CompetencyInfo[]>([]);
    const [loading, setLoading] = useState(false);

    // Aggregate all unique competencies from quizzes
    const allSkillIds = React.useMemo(() => {
        const skillSet = new Map<string, string[]>();
        
        quizzes.forEach(quiz => {
            if (quiz.competencies) {
                quiz.competencies.forEach(skillId => {
                    const existing = skillSet.get(skillId) || [];
                    existing.push(quiz.title);
                    skillSet.set(skillId, existing);
                });
            }
        });
        
        return skillSet;
    }, [quizzes]);

    const skillIds = Array.from(allSkillIds.keys());

    useEffect(() => {
        if (expanded && skillIds.length > 0 && competencies.length === 0) {
            fetchCompetencyDetails();
        }
    }, [expanded]);

    const fetchCompetencyDetails = async () => {
        if (skillIds.length === 0) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/competencies/by-skills?skills=${skillIds.join(',')}`);
            if (response.ok) {
                const data = await response.json();
                // Enrich with quiz titles
                const enriched = data.competencies.map((comp: CompetencyInfo) => ({
                    ...comp,
                    quizTitles: allSkillIds.get(comp.skillId) || [],
                }));
                setCompetencies(enriched);
            }
        } catch (error) {
            console.error("Error fetching competency details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (skillIds.length === 0) {
        return null;
    }

    const masteredCount = competencies.filter(c => c.status === "mastered").length;
    const inProgressCount = competencies.filter(c => c.status === "in_progress").length;
    const totalCount = skillIds.length;

    return (
        <div className={cn("mt-3", className)}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-600 transition-colors w-full group"
            >
                <Award className="w-3.5 h-3.5 text-orange-500" />
                <span className="flex-1 text-left">
                    {totalCount} compétence{totalCount > 1 ? 's' : ''} à valider via {quizzes.length} quiz{quizzes.length > 1 ? 'zes' : ''}
                    {masteredCount > 0 && (
                        <span className="ml-2 text-emerald-600 font-medium">
                            ({masteredCount} maîtrisée{masteredCount > 1 ? 's' : ''})
                        </span>
                    )}
                </span>
                {expanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                )}
            </button>

            {expanded && (
                <div className="mt-2 space-y-2 pl-5">
                    {loading ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-3.5 h-3.5 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
                            Chargement...
                        </div>
                    ) : competencies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {competencies.map((comp) => {
                                const config = statusConfig[comp.status];
                                const Icon = config.icon;
                                const isRevisionDue = comp.nextReview && new Date(comp.nextReview) <= new Date();
                                
                                return (
                                    <Badge
                                        key={comp.skillId}
                                        variant="outline"
                                        className={cn(
                                            "text-xs font-medium cursor-help",
                                            config.color,
                                            isRevisionDue && comp.status !== "mastered" && "ring-1 ring-amber-400"
                                        )}
                                        title={`${comp.description}\nQuiz: ${comp.quizTitles.join(', ')}`}
                                    >
                                        {comp.skillId}
                                        {Icon && <Icon className="w-3 h-3 ml-1" />}
                                        {isRevisionDue && comp.status !== "mastered" && (
                                            <span className="ml-1 text-[10px]">!</span>
                                        )}
                                    </Badge>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {skillIds.map((skillId) => (
                                <Badge
                                    key={skillId}
                                    variant="outline"
                                    className="text-xs font-medium bg-gray-50"
                                >
                                    {skillId}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SectionCompetencies;
