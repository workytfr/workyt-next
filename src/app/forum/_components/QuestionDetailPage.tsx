"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AnswerPopup from "@/app/forum/_components/AnswerPopup";
import QuestionDetail from "@/app/forum/_components/QuestionView";
import AnswerList from "@/app/forum/_components/AnswerList";
import { QuestionSkeleton, AnswerSkeleton } from "@/app/forum/_components/QuestionSkeleton";
import { FaPlus } from "react-icons/fa";
import "katex/dist/katex.min.css";

// Import des composants Breadcrumb depuis votre module
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/Breadcrumb";

export default function QuestionDetailPage({ id: propId }: { id?: string }) {
    const { data: session } = useSession();
    const params = useParams();
    // Utilisez l'ID passé en prop s'il existe, sinon récupérez-le depuis l'URL
    const id = propId || params?.id;

    const [question, setQuestion] = useState<any>(null);
    const [answers, setAnswers] = useState<any[]>([]);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnswerPopup, setShowAnswerPopup] = useState(false);

    const fetchQuestion = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/forum/questions/${id}?page=1&limit=10`);
            const data = await response.json();

            if (!data.success) {
                throw new Error("Échec de récupération des données.");
            }

            setQuestion(data.question);
            setAnswers(data.answers);
            setRevisions(data.revisions);
        } catch (error) {
            console.error("Erreur de récupération de la question", error);
            setError("Une erreur s'est produite lors du chargement des données.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchQuestion();
    }, [fetchQuestion]);

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-4 bg-white text-black relative">
            {/* Breadcrumb */}
            <div className="w-full max-w-5xl mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/forum">Forum</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                {question ? question.title : "Détails de la question"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {loading ? (
                <QuestionSkeleton />
            ) : error ? (
                <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>
            ) : (
                question && (
                    <QuestionDetail
                        question={question}
                        revisions={revisions}
                        setShowAnswerPopup={setShowAnswerPopup}
                    />
                )
            )}

            <div className="w-full max-w-5xl mt-6">
                {loading ? <AnswerSkeleton /> : <AnswerList answers={answers} question={question} />}
            </div>

            {showAnswerPopup && (
                <AnswerPopup
                    questionId={id as string}
                    onClose={() => setShowAnswerPopup(false)}
                />
            )}

            {/* Bouton flottant pour répondre, visible uniquement si l'utilisateur est connecté */}
            {session && (
                <button
                    className="fixed bottom-24 right-6 bg-black text-white px-5 py-3 rounded-full flex items-center gap-2 shadow-xl hover:bg-gray-800 transition duration-300"
                    onClick={() => setShowAnswerPopup(true)}
                >
                    <FaPlus className="text-lg" /> Répondre
                </button>
            )}
        </div>
    );
}
