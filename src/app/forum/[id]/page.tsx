"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { FaClock, FaCoins, FaPaperclip, FaExclamationCircle, FaQuestionCircle } from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { getSubjectColor, getLevelColor } from "@/data/educationData";
import AnswerPopup from "@/app/forum/_components/AnswerPopup";
import AnswerList from "@/app/forum/_components/AnswerList";

export default function QuestionDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [question, setQuestion] = useState<any>(null);
    const [answers, setAnswers] = useState<any[]>([]);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showAnswerPopup, setShowAnswerPopup] = useState(false);

    useEffect(() => {
        async function fetchQuestion() {
            setLoading(true);
            try {
                const response = await fetch(`/api/forum/questions/${id}?page=${page}&limit=5`);
                const data = await response.json();
                if (data.success) {
                    setQuestion(data.question);
                    setAnswers(data.answers);
                    setRevisions(data.revisions);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (error) {
                console.error("Erreur de récupération de la question", error);
            } finally {
                setLoading(false);
            }
        }
        fetchQuestion();
    }, [id, page]);

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gray-100 py-10 px-6 md:px-16">
            {loading ? (
                <Skeleton className="w-full max-w-5xl h-64 rounded-md" />
            ) : (
                question && (
                    <>
                        <div className="w-full max-w-5xl p-6 bg-white shadow-lg rounded-lg">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <ProfileAvatar username={question.user.username} points={question.user.points} size="small" />
                                    <Badge className={`${getSubjectColor(question.subject)}`}>{question.subject}</Badge>
                                    <Badge className={`${getLevelColor(question.classLevel)}`}>{question.classLevel}</Badge>
                                    <TimeAgo date={question.createdAt} />
                                </div>
                                <span className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-md">
                                    <FaCoins className="text-yellow-500 mr-1" /> {question.points} pts
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold mt-4">{question.title}</h2>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mt-2">
                                <div className="bg-orange-200 p-3 rounded-md flex items-start gap-2 flex-1">
                                    <FaQuestionCircle className="text-orange-600 mt-1" />
                                    <span>{question.description.whatIDid}</span>
                                </div>
                                <div className="bg-red-200 p-3 rounded-md flex items-start gap-2 flex-1">
                                    <FaExclamationCircle className="text-red-600 mt-1" />
                                    <span>{question.description.whatINeed}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-gray-500 text-sm mt-4">
                                <span className="flex items-center gap-1">
                                    <FaPaperclip /> Pièces jointes ({question.attachments?.length || 0})
                                </span>
                            </div>
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold">Fiches de Révision Suggérées</h3>
                                {revisions.map((revision) => (
                                    <div key={revision._id} className="mt-4 p-4 bg-blue-50 rounded-md shadow">
                                        <div className="flex items-center gap-4">
                                            <ProfileAvatar username={revision.author.username} points={revision.author.points} size="small" />
                                            <span className="font-bold">{revision.title}</span>
                                        </div>
                                        <p className="mt-2">{revision.content.substring(0, 150)}...</p>
                                        <Button className="mt-2" onClick={() => router.push(`/revisions/${revision._id}`)}>Voir la fiche</Button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-center">
                                <Button onClick={() => setShowAnswerPopup(true)} className="px-6 py-2 text-white bg-blue-600 rounded-md">
                                    Répondre
                                </Button>
                            </div>
                        </div>

                        {/* Affichage des réponses en dehors de la carte principale */}
                        <div className="w-full max-w-5xl mt-6">
                            <AnswerList answers={answers} />
                        </div>
                    </>
                )
            )}
            {showAnswerPopup && <AnswerPopup questionId={Array.isArray(id) ? id[0] : id} onClose={() => setShowAnswerPopup(false)} />}
        </div>
    );
}
