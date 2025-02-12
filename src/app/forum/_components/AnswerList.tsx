"use client";

import React, { useState } from "react";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { FaThumbsUp, FaReply, FaCheckCircle } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { useSession } from "next-auth/react"; // Vérifier si l'utilisateur est connecté
import Image from "next/image"; // ✅ Pour afficher les icônes
import "katex/dist/katex.min.css";

interface AnswerListProps {
    answers: any[];
    question: any; // ✅ Ajout de la question pour vérifier l'auteur
}

const AnswerList: React.FC<AnswerListProps> = ({ answers, question }) => {
    const { data: session } = useSession(); // ✅ Récupérer l'utilisateur connecté
    const [updatedAnswers, setUpdatedAnswers] = useState(answers); // ✅ État local pour les mises à jour des réponses

    console.log("Question data:", question); // 🔍 Vérification des données dans la console

    // ✅ Fonction pour liker / unliker une réponse
    const handleLike = async (answerId: string) => {
        if (!session) {
            alert("Vous devez être connecté pour liker une réponse.");
            return;
        }

        try {
            const response = await fetch(`/api/forum/answers/like?id=${answerId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setUpdatedAnswers((prevAnswers) =>
                    prevAnswers.map((answer) =>
                        answer._id === answerId ? { ...answer, likes: data.data.likes, likedBy: data.data.likedBy } : answer
                    )
                );
            } else {
                console.error("❌ Erreur lors du like :", data.message);
            }
        } catch (error) {
            console.error("❌ Erreur réseau :", error);
        }
    };

    // ✅ Fonction pour valider une réponse
    const handleValidate = async (answerId: string) => {
        if (!session) {
            alert("Vous devez être connecté pour valider une réponse.");
            return;
        }

        try {
            const response = await fetch(`/api/forum/answers/validate?id=${answerId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                setUpdatedAnswers((prevAnswers) =>
                    prevAnswers.map((answer) =>
                        answer._id === answerId ? { ...answer, status: data.data.status } : answer
                    )
                );
            } else {
                alert(data.message);
                console.error("❌ Erreur lors de la validation :", data.message);
            }
        } catch (error) {
            console.error("❌ Erreur réseau :", error);
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-xl font-semibold">Réponses ({updatedAnswers.length})</h3>
            {updatedAnswers.length === 0 ? (
                <p className="text-gray-500 text-sm mt-2">Aucune réponse pour l'instant. Soyez le premier à répondre !</p>
            ) : (
                updatedAnswers.map((answer) => {
                    // ✅ Vérification avant d'accéder à `question.user`
                    const isQuestionOwner = question?.user && session?.user.id === question.user._id;
                    const isStaff = session?.user.role && ["Admin", "Helpeur"].includes(session.user.role);
                    const isValidated = answer.status === "Validée";
                    const isBestAnswer = answer.status === "Meilleure Réponse";

                    return (
                        <div
                            key={answer._id}
                            className={`mt-4 p-4 rounded-md shadow relative ${
                                isBestAnswer
                                    ? "bg-green-100 border-l-4 border-green-500" // ✅ Fond vert clair pour "Meilleure Réponse"
                                    : isValidated
                                        ? "bg-orange-100 border-l-4 border-orange-500" // ✅ Fond orange pour "Validée"
                                        : "bg-gray-50"
                            }`}
                        >
                            {/* ✅ Icône de validation en haut à droite si la réponse est validée */}
                            {isValidated && !isBestAnswer && (
                                <div className="absolute top-2 right-2">
                                    <Image src="/badge/Valider.svg" alt="Validée" width={30} height={30} />
                                </div>
                            )}

                            {/* ✅ Icône "Meilleure Réponse" en haut à droite si c'est la meilleure réponse */}
                            {isBestAnswer && (
                                <div className="absolute top-2 right-2">
                                    <Image src="/badge/Best.svg" alt="Meilleure Réponse" width={30} height={30} />
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <ProfileAvatar username={answer.user.username} points={answer.user.points} size="small" />
                                <div className="text-sm text-gray-600">
                                    <span className="font-semibold">{answer.user.username}</span>
                                    <TimeAgo date={answer.createdAt} />
                                </div>
                            </div>
                            <ReactMarkdown
                                className="mt-2 text-gray-800"
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {answer.content}
                            </ReactMarkdown>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <span
                                    className={`flex items-center gap-1 cursor-pointer ${
                                        answer.likedBy.includes(session?.user.username) ? "text-blue-600" : "hover:text-blue-600"
                                    }`}
                                    onClick={() => handleLike(answer._id)}
                                >
                                    <FaThumbsUp /> {answer.likes} J'aime
                                </span>
                                <span className="flex items-center gap-1 cursor-pointer hover:text-green-600">
                                    <FaReply /> Répondre
                                </span>

                                {/* ✅ Bouton pour valider une réponse (uniquement visible pour le staff ou l'auteur de la question) */}
                                {(isQuestionOwner || isStaff) && (
                                    <button
                                        className={`flex items-center gap-1 px-3 py-1 rounded-md ${
                                            isBestAnswer
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-200 hover:bg-green-500 hover:text-white"
                                        }`}
                                        onClick={() => handleValidate(answer._id)}
                                    >
                                        <FaCheckCircle />
                                        {isBestAnswer ? "Validée" : "Valider"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default AnswerList;
