"use client";

import React, { useState, useEffect } from "react";
import { Quiz } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Award, Clock, CheckCircle2, HelpCircle, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizCardProps {
    quiz: Quiz & { 
        completed?: boolean; 
        percentage?: number; 
        score?: number; 
        maxScore?: number;
        competencies?: string[];
    };
    onStartQuiz: (quizId: string) => void;
}

interface CompetencyInfo {
    skillId: string;
    description: string;
    status: "not_started" | "in_progress" | "failed" | "mastered";
    nextReview?: string;
}

export default function QuizCard({ quiz, onStartQuiz }: QuizCardProps) {
    const [showCompetencies, setShowCompetencies] = useState(false);
    const [competencyDetails, setCompetencyDetails] = useState<CompetencyInfo[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch competency details when expanded
    useEffect(() => {
        if (showCompetencies && quiz.competencies && quiz.competencies.length > 0 && competencyDetails.length === 0) {
            fetchCompetencyDetails();
        }
    }, [showCompetencies]);

    const fetchCompetencyDetails = async () => {
        if (!quiz.competencies || quiz.competencies.length === 0) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/competencies/by-skills?skills=${quiz.competencies.join(',')}`);
            if (response.ok) {
                const data = await response.json();
                setCompetencyDetails(data.competencies || []);
            }
        } catch (error) {
            console.error("Error fetching competency details:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total points
    const totalPoints = quiz.questions?.reduce((sum, q) => sum + (q.point || 0), 0) || 0;

    // Determine score color
    const getScoreColor = (percentage?: number) => {
        if (!percentage) return "text-gray-500";
        if (percentage >= 80) return "text-green-600";
        if (percentage >= 60) return "text-orange-600";
        return "text-red-600";
    };

    // Determine button text
    const getButtonText = () => {
        if (quiz.completed) return "Revoir le quiz";
        return "Commencer le quiz";
    };

    const statusColors: Record<string, string> = {
        not_started: "bg-gray-100 text-gray-600 border-gray-200",
        in_progress: "bg-amber-100 text-amber-700 border-amber-200",
        failed: "bg-red-100 text-red-700 border-red-200",
        mastered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    return (
        <Card className={cn(
            "group overflow-hidden transition-all duration-200",
            "hover:shadow-lg hover:border-orange-200",
            quiz.completed ? "border-green-200 bg-green-50/30" : "border-gray-200"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn(
                            "p-2.5 rounded-xl shrink-0 transition-colors",
                            quiz.completed ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                        )}>
                            {quiz.completed ? <Trophy className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-base font-semibold text-gray-900 truncate">
                                {quiz.title}
                            </CardTitle>
                            {quiz.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {quiz.description}
                                </p>
                            )}
                        </div>
                    </div>
                    {quiz.completed && (
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "shrink-0 font-semibold",
                                getScoreColor(quiz.percentage)
                            )}
                        >
                            {quiz.percentage?.toFixed(0)}%
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        <span>{quiz.questions?.length || 0} questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-gray-400" />
                        <span>{totalPoints} points</span>
                    </div>
                </div>

                {/* Competencies Toggle */}
                {quiz.competencies && quiz.competencies.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                        <button
                            onClick={() => setShowCompetencies(!showCompetencies)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors w-full"
                        >
                            <Award className="w-4 h-4 text-orange-500" />
                            <span className="flex-1 text-left">
                                {quiz.competencies.length} compétence{quiz.competencies.length > 1 ? 's' : ''} validée{quiz.competencies.length > 1 ? 's' : ''}
                            </span>
                            {showCompetencies ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>

                        {showCompetencies && (
                            <div className="mt-2 space-y-2">
                                {loading ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
                                        Chargement...
                                    </div>
                                ) : competencyDetails.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {competencyDetails.map((comp) => (
                                            <Badge
                                                key={comp.skillId}
                                                variant="outline"
                                                className={cn(
                                                    "text-xs font-medium cursor-help",
                                                    statusColors[comp.status] || statusColors.not_started
                                                )}
                                                title={comp.description}
                                            >
                                                {comp.skillId}
                                                {comp.status === "mastered" && <CheckCircle2 className="w-3 h-3 ml-1" />}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {quiz.competencies.map((skillId) => (
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
                )}

                {/* Score info if completed */}
                {quiz.completed && quiz.score !== undefined && quiz.maxScore !== undefined && (
                    <div className="flex items-center justify-between text-sm bg-white/50 rounded-lg p-2">
                        <span className="text-gray-600">Score</span>
                        <span className={cn("font-semibold", getScoreColor(quiz.percentage))}>
                            {quiz.score} / {quiz.maxScore} pts
                        </span>
                    </div>
                )}

                {/* Action Button */}
                <Button
                    onClick={() => onStartQuiz(quiz._id)}
                    className={cn(
                        "w-full transition-all",
                        quiz.completed
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                    )}
                    size="sm"
                >
                    {getButtonText()}
                </Button>
            </CardContent>
        </Card>
    );
}
