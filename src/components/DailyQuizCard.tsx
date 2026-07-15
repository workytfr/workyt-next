"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Brain, Check, X, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DailyQuizState {
    available: boolean;
    id?: string;
    question?: string;
    answers?: string[];
    solved?: boolean;
    attemptCount?: number;
    correctAnswer?: number;
    explanation?: string | null;
}

/**
 * Quiz du jour jouable sur le site. Une bonne réponse débloque la réclamation
 * de la récompense du calendrier — voir calendarService.claimDailyReward.
 *
 * `onSolved` permet au calendrier de se rafraîchir sans recharger la page.
 */
export default function DailyQuizCard({ onSolved }: { onSolved?: () => void }) {
    const { data: session } = useSession();
    const [state, setState] = useState<DailyQuizState | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);

    const fetchQuiz = useCallback(async () => {
        try {
            const res = await fetch("/api/daily-quiz/play");
            if (!res.ok) {
                setState({ available: false });
                return;
            }
            setState(await res.json());
        } catch {
            setState({ available: false });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session) fetchQuiz();
        else setLoading(false);
    }, [session, fetchQuiz]);

    const submit = async (index: number) => {
        setSubmitting(true);
        setSelected(index);
        try {
            const res = await fetch("/api/daily-quiz/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answerIndex: index }),
            });
            const data = await res.json();
            if (!res.ok) return;

            if (data.isCorrect) {
                setState((prev) =>
                    prev
                        ? {
                              ...prev,
                              solved: true,
                              correctAnswer: data.correctAnswer,
                              explanation: data.explanation,
                          }
                        : prev
                );
                onSolved?.();
            } else {
                setWrongAnswers((prev) => [...prev, index]);
                setSelected(null);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!session) {
        return (
            <div className="rounded-xl border border-white/20 bg-white/50 p-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-600">
                    Connectez-vous pour jouer au quiz du jour et débloquer votre récompense.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-white/20 bg-white/50 p-6 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
        );
    }

    // Pas de quiz déposé aujourd'hui : la récompense reste réclamable sans condition,
    // inutile d'afficher quoi que ce soit.
    if (!state?.available) return null;

    return (
        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Quiz du jour</h3>
                {state.solved && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        <Check className="h-3 w-3" />
                        Résolu
                    </span>
                )}
            </div>

            <p className="text-sm text-gray-800 font-medium">{state.question}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {state.answers?.map((answer, i) => {
                    const isCorrect = state.solved && state.correctAnswer === i;
                    const isWrong = wrongAnswers.includes(i);

                    return (
                        <Button
                            key={i}
                            variant="outline"
                            disabled={state.solved || submitting || isWrong}
                            onClick={() => submit(i)}
                            className={cn(
                                "justify-start h-auto py-2.5 text-left whitespace-normal",
                                isCorrect && "border-green-500 bg-green-50 text-green-800",
                                isWrong && "border-red-300 bg-red-50 text-red-700 opacity-70"
                            )}
                        >
                            {submitting && selected === i ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                            ) : isCorrect ? (
                                <Check className="h-4 w-4 mr-2 shrink-0" />
                            ) : isWrong ? (
                                <X className="h-4 w-4 mr-2 shrink-0" />
                            ) : null}
                            {answer}
                        </Button>
                    );
                })}
            </div>

            {state.solved ? (
                <div className="text-sm space-y-1">
                    <p className="text-green-700 font-medium">
                        Bonne réponse ! Votre récompense du jour est débloquée.
                    </p>
                    {state.explanation && (
                        <p className="text-gray-600 text-xs">{state.explanation}</p>
                    )}
                </div>
            ) : (
                <p className="text-xs text-gray-500">
                    {wrongAnswers.length > 0
                        ? "Ce n'est pas ça — réessayez avec une autre proposition."
                        : "Trouvez la bonne réponse pour débloquer la récompense du calendrier."}
                </p>
            )}
        </div>
    );
}
