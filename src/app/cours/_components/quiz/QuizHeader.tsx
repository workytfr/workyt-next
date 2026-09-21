"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Award, CheckCircle, ChevronDown, ChevronUp, Clock, Trophy } from "lucide-react";
import QuizCompetencies from "./QuizCompetencies";
import { formatTime, isAnswered } from "./utils";
import type { CompetencyInfo, QuizViewerQuiz } from "./types";

interface QuizHeaderProps {
    quiz: QuizViewerQuiz;
    answers: Record<number, any>;
    currentQuestion: number;
    timeSpent: number;
    answeredCount: number;
    isCompleted?: boolean;
    competencyDetails: CompetencyInfo[];
    loadingCompetencies: boolean;
    showCompetencies: boolean;
    onToggleCompetencies: () => void;
    onGoToQuestion: (index: number) => void;
}

/**
 * En-tête du lecteur : identité du quiz, chronomètre, compétences visées et
 * navigation entre les questions.
 */
export default function QuizHeader({
    quiz,
    answers,
    currentQuestion,
    timeSpent,
    answeredCount,
    isCompleted,
    competencyDetails,
    loadingCompetencies,
    showCompetencies,
    onToggleCompetencies,
    onGoToQuestion,
}: QuizHeaderProps) {
    const total = quiz.questions.length;
    const progress = ((currentQuestion + 1) / total) * 100;

    const inBonus = !!quiz.timeBonus?.enabled && timeSpent <= (quiz.timeBonus?.targetTime ?? 0);
    const inPenalty =
        !!quiz.timePenalty?.enabled &&
        (quiz.timePenalty?.maxTime ?? 0) > 0 &&
        timeSpent > (quiz.timePenalty?.maxTime ?? 0);

    return (
        <div className="bg-[#f5efe3] rounded-2xl p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-semibold text-[#1a1512] text-lg leading-tight line-clamp-1">
                            {quiz.title}
                        </h2>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[#8f857b]">
                            <span
                                className={`flex items-center gap-1 ${
                                    inBonus
                                        ? "text-emerald-600 font-medium"
                                        : inPenalty
                                          ? "text-red-500 font-medium"
                                          : ""
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(timeSpent)}
                            </span>
                            <span>
                                {answeredCount}/{total} répondues
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {isCompleted && (
                        <Badge variant="secondary" className="text-xs">
                            Déjà complété
                        </Badge>
                    )}
                    {quiz.timeBonus?.enabled && quiz.timeBonus.targetTime > 0 && (
                        <Badge
                            variant="outline"
                            className={`text-[10px] ${
                                inBonus
                                    ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                                    : "border-gray-200 text-gray-400"
                            }`}
                        >
                            Bonus si &lt; {formatTime(quiz.timeBonus.targetTime)}
                        </Badge>
                    )}
                    {quiz.timePenalty?.enabled && quiz.timePenalty.maxTime > 0 && (
                        <Badge
                            variant="outline"
                            className={`text-[10px] ${
                                inPenalty
                                    ? "border-red-300 text-red-600 bg-red-50"
                                    : "border-gray-200 text-gray-400"
                            }`}
                        >
                            Malus si &gt; {formatTime(quiz.timePenalty.maxTime)}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Compétences visées */}
            {quiz.competencies && quiz.competencies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#e8dfd0]">
                    <button
                        onClick={onToggleCompetencies}
                        aria-expanded={showCompetencies}
                        className="flex items-center gap-2 text-sm text-[#6b625a] hover:text-[#ff6a1a] transition-colors w-full"
                    >
                        <Award className="w-4 h-4 text-orange-500" />
                        <span className="flex-1 text-left">
                            Ce quiz valide {quiz.competencies.length} compétence
                            {quiz.competencies.length > 1 ? "s" : ""}
                        </span>
                        {showCompetencies ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    <AnimatePresence initial={false}>
                        {showCompetencies && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3">
                                    {loadingCompetencies ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
                                            Chargement des compétences...
                                        </div>
                                    ) : (
                                        <QuizCompetencies
                                            skillIds={quiz.competencies}
                                            details={competencyDetails}
                                            variant="status"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Progression */}
            <div className="h-1.5 bg-[#e8dfd0] rounded-full overflow-hidden mt-4 mb-3">
                <motion.div
                    className="h-full bg-[#ff6a1a] rounded-full"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            </div>

            {/* Pastilles de navigation */}
            <div className="flex flex-wrap gap-1.5">
                {quiz.questions.map((question, i) => {
                    const answered = isAnswered(question, answers[i]);
                    const isCurrent = i === currentQuestion;

                    return (
                        <button
                            key={i}
                            onClick={() => onGoToQuestion(i)}
                            aria-label={`Question ${i + 1}${answered ? " (répondue)" : ""}`}
                            aria-current={isCurrent}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                                isCurrent
                                    ? "bg-[#ff6a1a] text-white shadow-sm ring-2 ring-[#ff6a1a]/25"
                                    : answered
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                      : "bg-white text-[#6b625a] hover:bg-[#eae9e6] border border-[#e8dfd0]"
                            }`}
                        >
                            {answered && !isCurrent ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                                i + 1
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
