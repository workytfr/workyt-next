"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, ChevronLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";

import LatexText from "./quiz/LatexText";
import QuestionInput from "./quiz/inputs/QuestionInput";
import QuizHeader from "./quiz/QuizHeader";
import QuizResults from "./quiz/QuizResults";
import { defaultAnswerFor, isAnswered } from "./quiz/utils";
import type { CompetencyInfo, DetailedResults, QuizViewerQuiz } from "./quiz/types";
import type { QuizCompletionResult } from "./types";

interface QuizViewerProps {
    quiz: QuizViewerQuiz;
    onClose: () => void;
    onComplete: (result: QuizCompletionResult) => void;
    isCompleted?: boolean;
}

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/**
 * Lecteur de quiz.
 *
 * Ce composant orchestre : il tient l'état (réponses, question courante,
 * chronomètre), parle à l'API et délègue tout le rendu — l'en-tête à
 * `QuizHeader`, la saisie à `quiz/inputs/*`, les résultats à `QuizResults`.
 */
export default function QuizViewer({
    quiz,
    onClose,
    onComplete,
    isCompleted,
}: QuizViewerProps) {
    const { data: session } = useSession();
    const router = useRouter();

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [timeSpent, setTimeSpent] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<DetailedResults | null>(null);
    const [direction, setDirection] = useState(0);
    const [networkError, setNetworkError] = useState<string | null>(null);
    const [showCompetencies, setShowCompetencies] = useState(false);
    const [competencyDetails, setCompetencyDetails] = useState<CompetencyInfo[]>([]);
    const [loadingCompetencies, setLoadingCompetencies] = useState(false);

    // --- Chronomètre ---
    useEffect(() => {
        if (!session) {
            router.push("/api/auth/signin");
            return;
        }

        const timer = setInterval(() => setTimeSpent((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [session, router]);

    // --- Compétences visées ---
    useEffect(() => {
        const skills = quiz.competencies;
        if (!skills || skills.length === 0) return;

        let cancelled = false;
        setLoadingCompetencies(true);

        fetch(`/api/competencies/by-skills?skills=${skills.join(",")}`)
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (!cancelled && data) setCompetencyDetails(data.competencies || []);
            })
            .catch((error) => console.error("Error fetching competency details:", error))
            .finally(() => {
                if (!cancelled) setLoadingCompetencies(false);
            });

        return () => {
            cancelled = true;
        };
    }, [quiz.competencies]);

    const answeredCount = useMemo(
        () => quiz.questions.filter((q, i) => isAnswered(q, answers[i])).length,
        [answers, quiz.questions]
    );

    const allAnswered = answeredCount === quiz.questions.length;

    const handleAnswerChange = useCallback(
        (answer: any) => setAnswers((prev) => ({ ...prev, [currentQuestion]: answer })),
        [currentQuestion]
    );

    const goToQuestion = useCallback(
        (index: number) => {
            setDirection(index > currentQuestion ? 1 : -1);
            setCurrentQuestion(index);
        },
        [currentQuestion]
    );

    const handleNext = useCallback(() => {
        setDirection(1);
        setCurrentQuestion((prev) => Math.min(prev + 1, quiz.questions.length - 1));
    }, [quiz.questions.length]);

    const handlePrevious = useCallback(() => {
        setDirection(-1);
        setCurrentQuestion((prev) => Math.max(prev - 1, 0));
    }, []);

    /** Remet le lecteur à zéro pour une nouvelle tentative. */
    const handleRetry = useCallback(() => {
        setResults(null);
        setAnswers({});
        setCurrentQuestion(0);
        setDirection(0);
        setTimeSpent(0);
        setNetworkError(null);
    }, []);

    const recordCompetencyProgress = useCallback(
        async (percentage: number) => {
            const skills = quiz.competencies;
            if (!skills || skills.length === 0) return;

            try {
                await Promise.all(
                    skills.map((skillId) =>
                        fetch("/api/competencies/record", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                skillId,
                                score: percentage,
                                source: "quiz",
                                sourceId: quiz._id,
                            }),
                        })
                    )
                );
            } catch (error) {
                console.error("Error recording competency progress:", error);
            }
        },
        [quiz._id, quiz.competencies]
    );

    const handleSubmit = async () => {
        if (!session || isSubmitting) return;

        // Les retentatives sont autorisées : seule la première complétion
        // rapporte des points, et le meilleur score est conservé (côté API).
        const unanswered = quiz.questions.reduce<number[]>((acc, question, i) => {
            if (!isAnswered(question, answers[i])) acc.push(i + 1);
            return acc;
        }, []);

        if (unanswered.length > 0) {
            setNetworkError(`Il reste des questions sans réponse : ${unanswered.join(", ")}.`);
            goToQuestion(unanswered[0] - 1);
            return;
        }

        setIsSubmitting(true);
        setNetworkError(null);

        try {
            const orderedAnswers = quiz.questions.map((question, i) =>
                answers[i] !== undefined ? answers[i] : defaultAnswerFor(question)
            );

            const response = await fetch(`/api/quizzes/${quiz._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: orderedAnswers, timeSpent }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                setNetworkError(error.error || "Erreur lors de la soumission du quiz");
                return;
            }

            const result = await response.json();
            setResults(result);

            if (quiz.competencies && quiz.competencies.length > 0) {
                await recordCompetencyProgress(result.percentage);
            }

            onComplete(result);
        } catch {
            setNetworkError("Erreur réseau. Vérifiez votre connexion et réessayez.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Résultats ---
    if (results) {
        return (
            <QuizResults
                quiz={quiz}
                results={results}
                competencyDetails={competencyDetails}
                timeSpent={timeSpent}
                isCompleted={isCompleted}
                onClose={onClose}
                onRetry={handleRetry}
            />
        );
    }

    // --- Quiz en cours ---
    const currentQ = quiz.questions[currentQuestion];
    const isLastQuestion = currentQuestion === quiz.questions.length - 1;

    return (
        <div className="w-full">
            <button
                onClick={onClose}
                className="flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#37352f] transition-colors mb-6"
            >
                <ChevronLeft className="w-4 h-4" />
                Retour aux quiz
            </button>

            <QuizHeader
                quiz={quiz}
                answers={answers}
                currentQuestion={currentQuestion}
                timeSpent={timeSpent}
                answeredCount={answeredCount}
                isCompleted={isCompleted}
                competencyDetails={competencyDetails}
                loadingCompetencies={loadingCompetencies}
                showCompetencies={showCompetencies}
                onToggleCompetencies={() => setShowCompetencies((prev) => !prev)}
                onGoToQuestion={goToQuestion}
            />

            {networkError && (
                <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p>{networkError}</p>
                        <button
                            onClick={() => setNetworkError(null)}
                            className="text-red-500 underline text-xs mt-1"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            <div className="min-h-[300px] sm:min-h-[350px]">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentQuestion}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-[#37352f]">
                                Question {currentQuestion + 1}
                                <span className="text-[#9ca3af] font-normal">
                                    {" "}
                                    / {quiz.questions.length}
                                </span>
                            </h3>
                            <Badge variant="outline" className="text-xs">
                                {currentQ.point} pt{currentQ.point > 1 ? "s" : ""}
                            </Badge>
                        </div>

                        <div className="text-[#37352f] text-sm sm:text-base leading-relaxed mb-5">
                            <LatexText text={currentQ.question} />
                        </div>

                        {currentQ.questionPic && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={currentQ.questionPic}
                                alt="Illustration de la question"
                                className="max-w-full h-auto rounded-xl shadow-sm mb-5 border border-[#e3e2e0]"
                            />
                        )}

                        <div className="mb-6">
                            <QuestionInput
                                question={currentQ}
                                value={answers[currentQuestion]}
                                onChange={handleAnswerChange}
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#e3e2e0]">
                <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="order-2 sm:order-1"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Précédent
                </Button>

                <div className="flex gap-2 order-1 sm:order-2">
                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`flex-1 sm:flex-none ${
                                allAnswered ? "bg-emerald-600 hover:bg-emerald-700" : ""
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Soumission...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    {isCompleted ? "Refaire le quiz" : "Terminer le quiz"}
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="flex-1 sm:flex-none">
                            Suivant
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
