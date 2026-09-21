"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import { relativeTime } from "./forumUi";
import { ThumbsUp, CheckCircle2, Medal, MessageCircle, Quote } from "lucide-react";
import MentionMarkdown from "./MentionMarkdown";
import { useSession } from "next-auth/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import ReportButton from "@/components/ReportButton";
import "katex/dist/katex.min.css";

interface AnswerListProps {
    answers: any[];
    question: any;
    onQuote?: (text: string, userId: string, username: string) => void;
}

const AnswerList: React.FC<AnswerListProps> = ({ answers, question, onQuote }) => {
    const { data: session } = useSession();
    const [updatedAnswers, setUpdatedAnswers] = useState(answers);
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    // La page parente rafraîchit les réponses en arrière-plan (la page peut être en
    // cache statique). On resynchronise donc l'état local avec les props à jour pour
    // que les compteurs de likes reflètent la valeur réelle en base, en temps réel.
    useEffect(() => {
        setUpdatedAnswers(answers);
    }, [answers]);

    // Fonction pour afficher une notification
    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setTimeout(() => setSnackbarMessage(null), 3000);
    };

    // Fonction pour gérer les likes
    const handleLike = async (answerId: string) => {
        if (!session) {
            showSnackbar("Vous devez être connecté pour liker une réponse.");
            return;
        }

        try {
            const response = await fetch(`/api/forum/answers/like?id=${answerId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });

            const data = await response.json();

            if (data.success) {
                setUpdatedAnswers((prevAnswers) =>
                    prevAnswers.map((answer) =>
                        answer._id === answerId ? { ...answer, likes: data.data.likes, likedBy: data.data.likedBy } : answer
                    )
                );
                showSnackbar("Merci pour votre appréciation !");
            } else {
                showSnackbar("Erreur lors du like.");
                console.error("❌ Erreur lors du like :", data.message);
            }
        } catch (error) {
            showSnackbar("Erreur réseau.");
            console.error("❌ Erreur réseau :", error);
        }
    };

    // Fonction pour valider une réponse
    const handleValidate = async (answerId: string) => {
        if (!session) {
            showSnackbar("Vous devez être connecté pour valider une réponse.");
            return;
        }

        try {
            const response = await fetch(`/api/forum/answers/validate?id=${answerId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });

            const data = await response.json();

            if (data.success) {
                setUpdatedAnswers((prevAnswers) =>
                    prevAnswers.map((answer) =>
                        answer._id === answerId ? { ...answer, status: data.data.status } : answer
                    )
                );
                showSnackbar("Réponse validée avec succès !");
            } else {
                showSnackbar("Erreur lors de la validation.");
                console.error("❌ Erreur lors de la validation :", data.message);
            }
        } catch (error) {
            showSnackbar("Erreur réseau.");
            console.error("❌ Erreur réseau :", error);
        }
    };

    return (
        <section aria-label="Réponses">
            <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-serif-display text-3xl">
                    Réponses <span className="text-[var(--wk-accent)]">{updatedAnswers.length}</span>
                </h2>
                {updatedAnswers.length === 0 && (
                    <span className="text-sm text-[rgba(26,21,18,0.55)]">Sois le premier à répondre !</span>
                )}
            </div>

            {updatedAnswers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-12 text-center">
                    <MessageCircle className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                    <p className="mt-3 font-semibold">Aucune réponse pour l&apos;instant</p>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">Partage ce que tu sais : une piste suffit souvent à débloquer.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {updatedAnswers.map((answer) => {
                        const isQuestionOwner = question?.user && session?.user.id === question.user._id;
                        const isStaff = session?.user.role && ["Admin", "Helpeur"].includes(session.user.role);
                        const isValidated = answer.status === "Validée";
                        const isBestAnswer = answer.status === "Meilleure Réponse";
                        const hasLiked = answer.likedBy.includes(session?.user.username);

                        return (
                            <article
                                key={answer._id}
                                className={`overflow-hidden rounded-3xl border bg-white transition ${
                                    isBestAnswer
                                        ? "border-emerald-300 shadow-[0_12px_32px_rgba(16,185,129,0.12)]"
                                        : isValidated
                                          ? "border-[#bfe3f2] shadow-[0_12px_32px_rgba(110,193,228,0.14)]"
                                          : "border-[rgba(26,21,18,0.08)]"
                                }`}
                            >
                                {/* Bannière de statut */}
                                {(isBestAnswer || isValidated) && (
                                    <div
                                        className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold ${
                                            isBestAnswer ? "bg-emerald-50 text-emerald-800" : "bg-[#eaf6fb] text-[#2f86b3]"
                                        }`}
                                    >
                                        {isBestAnswer ? (
                                            <>
                                                <Medal className="h-3.5 w-3.5" /> Meilleure réponse choisie par l&apos;auteur
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Réponse validée par l&apos;équipe
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="p-5 sm:p-6">
                                    <div className="flex items-center gap-3">
                                        <ProfileAvatar username={answer.user.username} points={answer.user.points} size="small" userId={answer.user._id} />
                                        <div className="leading-tight">
                                            <Link href={`/compte/${answer.user._id}`} className="hover:underline">
                                                <UsernameDisplay username={answer.user.username} userId={answer.user._id} className="text-sm font-semibold" />
                                            </Link>
                                            <span className="block text-xs text-[rgba(26,21,18,0.5)]">{relativeTime(answer.createdAt)}</span>
                                        </div>
                                    </div>

                                    <MentionMarkdown
                                        content={answer.content}
                                        knownUsers={[question?.user, ...updatedAnswers.map((a: any) => a.user)].filter(Boolean)}
                                        className="prose prose-sm mt-4 max-w-none overflow-x-auto text-[rgba(26,21,18,0.88)]"
                                    />

                                    {/* Actions */}
                                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[rgba(26,21,18,0.06)] pt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleLike(answer._id)}
                                            aria-pressed={hasLiked}
                                            className={`wk-chip !py-1.5 transition ${
                                                hasLiked ? "!border-[var(--wk-accent)] !bg-[rgba(255,106,26,0.1)] text-[#c24a0a]" : "hover:border-[rgba(26,21,18,0.3)]"
                                            }`}
                                        >
                                            <ThumbsUp className="h-3.5 w-3.5" />
                                            {answer.likes}
                                            <span className="sr-only sm:not-sr-only">J&apos;aime</span>
                                        </button>

                                        {(isQuestionOwner || isStaff) && question.status !== "Résolue" && !isBestAnswer && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => !isValidated && handleValidate(answer._id)}
                                                            disabled={isValidated}
                                                            className={`wk-chip !py-1.5 transition ${
                                                                isValidated ? "cursor-not-allowed opacity-50" : "hover:!border-emerald-400 hover:text-emerald-700"
                                                            }`}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            <span className="sr-only sm:not-sr-only">{isValidated ? "Déjà validée" : "Valider cette réponse"}</span>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {isValidated ? "Cette réponse a déjà été validée" : "Marquer cette réponse comme validée"}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}

                                        {onQuote && (
                                            <button
                                                type="button"
                                                onClick={() => onQuote(answer.content || "", String(answer.user?._id ?? ""), answer.user?.username ?? "auteur")}
                                                className="wk-chip !py-1.5 transition hover:border-[rgba(26,21,18,0.3)]"
                                                title="Citer cette réponse"
                                            >
                                                <Quote className="h-3.5 w-3.5" />
                                                <span className="sr-only sm:not-sr-only">Citer</span>
                                            </button>
                                        )}

                                        <div className="ml-auto">
                                            <ReportButton contentId={answer._id} contentType="forum_answer" questionId={question?._id} variant="dropdown" />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Notification */}
            {snackbarMessage && (
                <div
                    role="status"
                    className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--wk-ink)] px-5 py-3 text-sm font-medium text-[var(--wk-paper)] shadow-xl"
                >
                    <CheckCircle2 className="h-4 w-4 text-[var(--wk-accent-2)]" />
                    {snackbarMessage}
                </div>
            )}
        </section>
    );
};

export default AnswerList;
