"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import {
    Award,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    Clock,
    Lightbulb,
    Trophy,
    XCircle,
} from "lucide-react";
import CodeBlock from "@/components/ui/CodeBlock";
import LatexText from "./LatexText";
import QuizCompetencies from "./QuizCompetencies";
import { formatCorrectAnswer, formatTime, formatUserAnswer } from "./utils";
import type { CompetencyInfo, DetailedResults, QuizViewerQuiz } from "./types";

interface QuizResultsProps {
    quiz: QuizViewerQuiz;
    results: DetailedResults;
    competencyDetails: CompetencyInfo[];
    timeSpent: number;
    isCompleted?: boolean;
    onClose: () => void;
    onRetry: () => void;
}

/** Compteur animé : le score monte jusqu'à sa valeur au lieu d'apparaître sec. */
function AnimatedPercent({ value }: { value: number }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const unsubscribe = rounded.on("change", setDisplay);
        const controls = animate(count, value, { duration: 0.9, ease: "easeOut" });
        return () => {
            controls.stop();
            unsubscribe();
        };
    }, [count, rounded, value]);

    return <>{display}</>;
}

/** Message d'encouragement calé sur le résultat. */
function competencyMessage(percentage: number): string {
    if (percentage >= 80) return "🎉 Bravo ! Ces compétences sont maintenant maîtrisées.";
    if (percentage >= 60) return "👍 Bon travail ! Continuez à pratiquer pour les maîtriser.";
    if (percentage >= 40) return "💪 Encore un peu d'effort ! Revoyez les concepts et réessayez.";
    return "📚 Ces compétences nécessitent plus de travail. Consultez les cours associés.";
}

/**
 * Écran de résultats : score, compétences, puis le détail question par
 * question. Chaque carte est repliée sur l'essentiel et se déplie pour montrer
 * la réponse donnée, la bonne réponse et l'explication.
 */
export default function QuizResults({
    quiz,
    results,
    competencyDetails,
    timeSpent,
    isCompleted,
    onClose,
    onRetry,
}: QuizResultsProps) {
    const [expanded, setExpanded] = useState<Set<number>>(() => {
        // Les questions ratées sont dépliées d'office : c'est là que se trouve
        // ce que l'élève doit lire.
        const wrong = results.answers
            .map((answer, index) => (answer.isCorrect ? -1 : index))
            .filter((index) => index >= 0);
        return new Set(wrong);
    });

    const toggle = (index: number) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const percent = results.percentage;
    const correctCount = results.answers.filter((a) => a.isCorrect).length;
    const scoreColor =
        percent >= 80 ? "text-emerald-600" : percent >= 50 ? "text-amber-600" : "text-red-600";
    const scoreBg = percent >= 80 ? "bg-emerald-50" : percent >= 50 ? "bg-amber-50" : "bg-red-50";

    return (
        <div className="w-full">
            <button
                onClick={onClose}
                className="flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#37352f] transition-colors mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Retour aux quiz
            </button>

            {/* --- Score --- */}
            <div className={`${scoreBg} rounded-2xl p-6 sm:p-8 mb-8 text-center`}>
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 16 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center"
                >
                    <Trophy className={`w-8 h-8 ${scoreColor}`} />
                </motion.div>

                <div className={`text-4xl sm:text-5xl font-bold ${scoreColor} mb-2`}>
                    <AnimatedPercent value={percent} />%
                </div>

                <p className="text-[#6b6b6b] text-sm sm:text-base">
                    {results.score}/{results.maxScore} points — {correctCount}/
                    {results.answers.length} bonne{correctCount > 1 ? "s" : ""} réponse
                    {correctCount > 1 ? "s" : ""}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                    {(results.pointsAwarded || 0) > 0 && (
                        <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold"
                        >
                            <Trophy className="w-4 h-4" />+{results.pointsAwarded} points gagnés !
                        </motion.span>
                    )}

                    {isCompleted && results.isNewBest && (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                            <Trophy className="w-4 h-4" />
                            Nouveau record !
                        </span>
                    )}

                    {results.timeModifierLabel && (
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                (results.timeModifier || 0) > 0
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            {results.timeModifierLabel}
                        </span>
                    )}
                </div>

                {isCompleted && !results.isNewBest && results.bestScore !== undefined && (
                    <p className="text-xs text-[#9ca3af] mt-3">
                        Meilleur score conservé : {results.bestScore}/{results.maxScore} — les
                        points ne sont gagnés qu&apos;à la première complétion
                    </p>
                )}

                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-[#9ca3af]">
                    <Clock className="w-4 h-4" />
                    {formatTime(timeSpent)}
                </div>

                <Progress value={percent} className="h-2 mt-4 max-w-md mx-auto" />
            </div>

            {/* --- Compétences --- */}
            {quiz.competencies && quiz.competencies.length > 0 && (
                <div className="bg-white rounded-2xl p-5 sm:p-6 mb-6 border-2 border-orange-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-orange-500" />
                        <h3 className="font-semibold text-gray-900">Compétences validées</h3>
                    </div>
                    <QuizCompetencies
                        skillIds={quiz.competencies}
                        details={competencyDetails}
                        variant="score"
                        percentage={percent}
                    />
                    <p className="text-xs text-gray-500 mt-3">{competencyMessage(percent)}</p>
                </div>
            )}

            {/* --- Détail des réponses --- */}
            <h3 className="text-lg font-semibold text-[#37352f] mb-4">Détail des réponses</h3>

            <div className="space-y-3">
                {results.answers.map((answer, index) => {
                    const question = quiz.questions[index];
                    if (!question) return null;

                    const isOpen = expanded.has(index);
                    const isCode = question.questionType === "Code";

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.04, 0.4) }}
                            className={`rounded-xl border-2 overflow-hidden ${
                                answer.isCorrect
                                    ? "border-emerald-200 bg-emerald-50/50"
                                    : "border-red-200 bg-red-50/50"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => toggle(index)}
                                aria-expanded={isOpen}
                                className="w-full text-left p-4 sm:p-5 flex items-start gap-3"
                            >
                                {answer.isCorrect ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-medium text-[#37352f] text-sm sm:text-base">
                                            Question {index + 1}
                                        </span>
                                        <span className="flex items-center gap-2 flex-shrink-0">
                                            <Badge variant="outline" className="text-xs">
                                                {answer.pointsEarned}/{question.point || 0} pt
                                                {(question.point || 0) > 1 ? "s" : ""}
                                            </Badge>
                                            <ChevronDown
                                                className={`w-4 h-4 text-[#9ca3af] transition-transform ${
                                                    isOpen ? "rotate-180" : ""
                                                }`}
                                            />
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#6b6b6b]">
                                        <LatexText text={question.question} />
                                    </p>
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-12 sm:pl-13 space-y-3">
                                            <div className="text-sm p-2.5 bg-white/70 rounded-lg">
                                                <span className="text-[#9ca3af]">
                                                    Votre réponse :{" "}
                                                </span>
                                                <span
                                                    className={
                                                        answer.isCorrect
                                                            ? "text-emerald-700 font-medium"
                                                            : "text-red-700 font-medium"
                                                    }
                                                >
                                                    {formatUserAnswer(question, answer.userAnswer)}
                                                </span>
                                            </div>

                                            {!answer.isCorrect &&
                                                answer.correctAnswer !== undefined &&
                                                (isCode ? (
                                                    <div>
                                                        <p className="text-sm text-[#9ca3af] mb-1">
                                                            Bonne réponse :
                                                        </p>
                                                        <CodeBlock
                                                            code={formatCorrectAnswer(
                                                                question,
                                                                answer.correctAnswer
                                                            )}
                                                            language={question.answers[0]}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-sm p-2.5 bg-white/70 rounded-lg">
                                                        <span className="text-[#9ca3af]">
                                                            Bonne réponse :{" "}
                                                        </span>
                                                        <span className="text-emerald-700 font-medium">
                                                            {formatCorrectAnswer(
                                                                question,
                                                                answer.correctAnswer
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}

                                            {answer.explanation && (
                                                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                    <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-blue-800">
                                                        <LatexText text={answer.explanation} />
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* --- Actions --- */}
            <div className="mt-8 pb-4 flex flex-col sm:flex-row gap-3">
                <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Retour aux quiz
                </Button>
                <Button onClick={onRetry} className="w-full sm:w-auto">
                    Refaire le quiz
                </Button>
            </div>
        </div>
    );
}
