"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AnswerPopup from "@/app/forum/_components/AnswerPopup";
import QuestionDetail from "@/app/forum/_components/QuestionView";
import AnswerList from "@/app/forum/_components/AnswerList";
import { QuestionSkeleton, AnswerSkeleton } from "@/app/forum/_components/QuestionSkeleton";
import {
    FaPlus,
    FaSearch,
    FaArrowLeft,
    FaHome,
    FaComments
} from "react-icons/fa";
import "katex/dist/katex.min.css";

// Import des composants Breadcrumb
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
        <div className="min-h-screen bg-gray-50">
            {/* Header avec dégradé */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="w-full md:w-auto">
                            <h1 className="text-xl sm:text-2xl font-bold truncate max-w-full">
                                {question ? question.title : "Chargement de la question..."}
                            </h1>

                            {/* Breadcrumb responsive */}
                            <div className="mt-2 text-indigo-100 overflow-x-auto pb-2 w-full">
                                <Breadcrumb className="whitespace-nowrap">
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href="/" className="flex items-center text-white hover:text-white">
                                                <FaHome className="mr-1 text-xs" />
                                                <span className="hidden xs:inline">Accueil</span>
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href="/forum" className="flex items-center text-white hover:text-white">
                                                <FaComments className="mr-1 text-xs" /> Forum
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>
                                                {question ? (
                                                    <span className="truncate inline-block max-w-[150px] sm:max-w-xs">
                                            {question.title}
                                        </span>
                                                ) : (
                                                    "Détails"
                                                )}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto">
                            <button
                                onClick={() => window.history.back()}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 sm:px-3 py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-all text-sm sm:text-base"
                            >
                                <FaArrowLeft /> <span className="hidden xs:inline">Retour</span>
                            </button>

                            <button
                                onClick={() => window.location.href = '/forum'}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 sm:px-3 py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-all text-sm sm:text-base"
                            >
                                <FaSearch /> <span className="hidden xs:inline">Parcourir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Contenu principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col items-center">
                    {/* Section de la question */}
                    <div className="w-full max-w-5xl">
                        {loading ? (
                            <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                                <QuestionSkeleton />
                            </div>
                        ) : error ? (
                            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                                <div className="flex items-center gap-3 text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <h3 className="text-lg font-semibold">Erreur</h3>
                                        <p>{error}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={fetchQuestion}
                                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Réessayer
                                </button>
                            </div>
                        ) : (
                            question && (
                                <QuestionDetail
                                    question={question}
                                    revisions={revisions}
                                    setShowAnswerPopup={setShowAnswerPopup}
                                />
                            )
                        )}
                    </div>

                    {/* Section des réponses */}
                    <div className="w-full max-w-5xl mt-6">
                        {loading ? (
                            <div className="bg-white rounded-xl shadow-md p-6 mt-8 animate-pulse">
                                <AnswerSkeleton />
                            </div>
                        ) : (
                            <AnswerList answers={answers} question={question} />
                        )}
                    </div>
                </div>
            </div>

            {/* Popup pour répondre */}
            {showAnswerPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <AnswerPopup
                        questionId={id as string}
                        onClose={() => setShowAnswerPopup(false)}
                    />
                </div>
            )}

            {/* Bouton flottant pour répondre, visible uniquement si l'utilisateur est connecté */}
            {session && !showAnswerPopup && (
                <button
                    className="fixed bottom-16 right-8 bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105 hover:rotate-90 z-30"
                    onClick={() => setShowAnswerPopup(true)}
                    aria-label="Répondre à cette question"
                >
                    <FaPlus className="text-xl" />
                </button>
            )}

            {/* Animation pour les squelettes de chargement */}
            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}