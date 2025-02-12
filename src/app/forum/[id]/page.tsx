"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react"; // 🔹 Importation de useSession
import AnswerPopup from "@/app/forum/_components/AnswerPopup";
import QuestionDetail from "@/app/forum/_components/QuestionView";
import AnswerList from "@/app/forum/_components/AnswerList";
import { QuestionSkeleton, AnswerSkeleton } from "@/app/forum/_components/QuestionSkeleton";
import { FaPlus } from "react-icons/fa";
import "katex/dist/katex.min.css";

export default function QuestionDetailPage() {
    const { data: session } = useSession(); // 🔹 Récupération de la session utilisateur
    const router = useRouter();
    const { id } = useParams();
    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [revisions, setRevisions] = useState([]);
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

            if (!data.success) throw new Error("Échec de récupération des données.");

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

            {/* 🚀 Bouton flottant noir, affiché uniquement si l'utilisateur est connecté */}
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
