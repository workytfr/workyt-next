"use client";

import React, { useState } from "react";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { FaThumbsUp, FaCheckCircle } from "react-icons/fa";
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

    // ✅ Fonction pour afficher une notification Snackbar
    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setTimeout(() => setSnackbarMessage(null), 3000);
    };

    // ✅ Fonction pour liker / unliker une réponse
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
                showSnackbar("Réponse likée avec succès !");
            } else {
                showSnackbar("Erreur lors du like.");
                console.error("❌ Erreur lors du like :", data.message);
            }
        } catch (error) {
            showSnackbar("Erreur réseau.");
            console.error("❌ Erreur réseau :", error);
        }
    };

    // ✅ Fonction pour valider une réponse
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
        <div className="mt-6 w-full max-w-5xl">
            <h3 className="text-xl font-semibold mb-4">Réponses ({updatedAnswers.length})</h3>
            {updatedAnswers.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune réponse pour l'instant. Soyez le premier à répondre !</p>
            ) : (
                updatedAnswers.map((answer) => {
                    const isQuestionOwner = question?.user && session?.user.id === question.user._id;
                    const isStaff = session?.user.role && ["Admin", "Helpeur"].includes(session.user.role);
                    const isValidated = answer.status === "Validée";
                    const isBestAnswer = answer.status === "Meilleure Réponse";

                    return (
                        <div
                            key={answer._id}
                            className={`relative p-6 bg-white shadow-lg rounded-xl border border-gray-200 mb-4 ${
                                isBestAnswer
                                    ? "border-l-4 border-green-500"
                                    : isValidated
                                        ? "border-l-4 border-orange-500"
                                        : "border-l-4 border-gray-300"
                            }`}
                        >
                            {/* ✅ Badge en haut à droite */}
                            <div className="absolute top-4 right-4">
                                {isValidated && !isBestAnswer && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Image src="/badge/Valider.svg" alt="Validée" width={40} height={40} />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Réponse validée par un membre du staff.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {isBestAnswer && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Image src="/badge/Best.svg" alt="Meilleure Réponse" width={40} height={40} />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Meilleure réponse choisie par l'auteur.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>

                            {/* ✅ Utilisateur et Métadonnées */}
                            <div className="flex items-center gap-4 mb-3">
                                <ProfileAvatar username={answer.user.username} points={answer.user.points} size="small" />
                                <div className="text-sm">
                                    <span className="block font-semibold">{answer.user.username}</span>
                                    <TimeAgo date={answer.createdAt} />
                                </div>
                            </div>

                            {/* ✅ Contenu de la réponse */}
                            <ReactMarkdown
                                className="text-gray-800 leading-relaxed"
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {answer.content}
                            </ReactMarkdown>

                            {/* ✅ Actions : Like & Valider */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
                                <button
                                    className={`flex items-center gap-1 ${
                                        answer.likedBy.includes(session?.user.username) ? "text-blue-600" : "hover:text-blue-600"
                                    }`}
                                    onClick={() => handleLike(answer._id)}
                                >
                                    <FaThumbsUp /> {answer.likes} J&apos;aime
                                </button>

                                {(isQuestionOwner || isStaff) && question.status !== "Résolue" && !isBestAnswer && (
                                    <button
                                        className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                                            isValidated
                                                ? "bg-gray-300 text-gray-600 cursor-not-allowed opacity-50"
                                                : "bg-gray-200 hover:bg-green-500 hover:text-white"
                                        }`}
                                        onClick={() => !isValidated && handleValidate(answer._id)}
                                        disabled={isValidated}
                                    >
                                        <FaCheckCircle />
                                        {isValidated ? "Déjà validée" : "Valider"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}

            {/* ✅ Snackbar pour afficher les notifications */}
            {snackbarMessage && (
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
};

export default AnswerList;
