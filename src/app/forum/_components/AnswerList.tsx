"use client";

import React, { useState } from "react";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { FaThumbsUp, FaCheckCircle, FaMedal, FaRegComment } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import "katex/dist/katex.min.css";

interface AnswerListProps {
    answers: any[];
    question: any;
}

const AnswerList: React.FC<AnswerListProps> = ({ answers, question }) => {
    const { data: session } = useSession();
    const [updatedAnswers, setUpdatedAnswers] = useState(answers);
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

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
        <div className="mt-8 w-full max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaRegComment className="text-indigo-600" />
                    Réponses <span className="ml-1.5 text-indigo-600">{updatedAnswers.length}</span>
                </h3>
                <div className="text-sm text-gray-500">
                    {updatedAnswers.length === 0 ? "Soyez le premier à répondre !" : ""}
                </div>
            </div>

            {updatedAnswers.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="text-gray-400 text-5xl mb-4">💬</div>
                    <p className="text-gray-600 mb-2">Aucune réponse pour l&apos;instant.</p>
                    <p className="text-gray-500 text-sm">Partagez votre expertise et aidez cette personne !</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {updatedAnswers.map((answer) => {
                        const isQuestionOwner = question?.user && session?.user.id === question.user._id;
                        const isStaff = session?.user.role && ["Admin", "Helpeur"].includes(session.user.role);
                        const isValidated = answer.status === "Validée";
                        const isBestAnswer = answer.status === "Meilleure Réponse";
                        const hasLiked = answer.likedBy.includes(session?.user.username);

                        return (
                            <div
                                key={answer._id}
                                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden
                                    ${isBestAnswer ? "border-green-500" : isValidated ? "border-orange-400" : "border-gray-200"}`}
                            >
                                {/* Bannière de statut en haut */}
                                {(isBestAnswer || isValidated) && (
                                    <div className={`py-1.5 px-4 text-white text-xs font-medium flex items-center gap-1.5
                                        ${isBestAnswer ? "bg-green-500" : "bg-orange-400"}`}>
                                        {isBestAnswer ? (
                                            <>
                                                <FaMedal /> Meilleure réponse choisie par l&apos;auteur
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle /> Réponse validée par l&apos;équipe
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Contenu de la réponse */}
                                <div className="p-6">
                                    {/* Utilisateur et métadonnées */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <ProfileAvatar username={answer.user.username} points={answer.user.points} size="small" />
                                        <div>
                                            <span className="block font-medium text-black">{answer.user.username}</span>                                            <TimeAgo date={answer.createdAt} />
                                        </div>
                                    </div>

                                    {/* Contenu de la réponse avec style amélioré */}
                                    <div className="mt-2 prose prose-indigo prose-sm max-w-none text-gray-800">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {answer.content}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
                                        <button
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                                                hasLiked
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                            }`}
                                            onClick={() => handleLike(answer._id)}
                                        >
                                            <FaThumbsUp size={14} />
                                            <span>{answer.likes}</span>
                                            <span className="sr-only sm:not-sr-only sm:ml-1">J&apos;aime</span>
                                        </button>

                                        {(isQuestionOwner || isStaff) && question.status !== "Résolue" && !isBestAnswer && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                                                                isValidated
                                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                    : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
                                                            }`}
                                                            onClick={() => !isValidated && handleValidate(answer._id)}
                                                            disabled={isValidated}
                                                        >
                                                            <FaCheckCircle size={14} />
                                                            <span className="sr-only sm:not-sr-only">
                                                                {isValidated ? "Déjà validée" : "Valider cette réponse"}
                                                            </span>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {isValidated
                                                            ? "Cette réponse a déjà été validée"
                                                            : "Marquer cette réponse comme validée"}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Snackbar notifications */}
            {snackbarMessage && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl z-50 flex items-center animate-fade-in">
                    <span className="mr-2">✓</span>
                    {snackbarMessage}
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AnswerList;