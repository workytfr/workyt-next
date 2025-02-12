"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { FaCoins, FaReply, FaEllipsisH, FaExclamationCircle, FaQuestionCircle, FaPaperclip } from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSubjectColor, getLevelColor, educationData } from "@/data/educationData";

export default function ForumQuestionsPage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [subject, setSubject] = useState("");
    const [classLevel, setClassLevel] = useState("");

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true);
            try {
                const response = await fetch(`/api/forum/questions?page=${page}&limit=5&title=${search}&subject=${subject}&classLevel=${classLevel}`);
                const data = await response.json();
                if (data.success) {
                    setQuestions((prevQuestions) => [...prevQuestions, ...data.data]);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (error) {
                console.error("Erreur de récupération des questions", error);
            } finally {
                setLoading(false);
            }
        }
        fetchQuestions();
    }, [page, search, subject, classLevel]);


    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gray-100 py-10 px-6 md:px-16">
            {/* Barre de recherche */}
            <div className="w-full max-w-5xl flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <Input
                    type="text"
                    placeholder="Rechercher par mot-clé..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                        setQuestions([]);
                    }}
                    className="p-3 border rounded-md flex-1"
                />
                <select
                    value={subject}
                    onChange={(e) => {
                        setSubject(e.target.value);
                        setPage(1);
                        setQuestions([]);
                    }}
                    className="p-3 border rounded-md flex-1"
                >
                    <option value="">Toutes les matières</option>
                    {educationData.subjects.map((subj, index) => (
                        <option key={index} value={subj}>{subj}</option>
                    ))}
                </select>
                <select
                    value={classLevel}
                    onChange={(e) => {
                        setClassLevel(e.target.value);
                        setPage(1);
                        setQuestions([]);
                    }}
                    className="p-3 border rounded-md flex-1"
                >
                    <option value="">Tous niveaux</option>
                    {educationData.levels.map((lvl, index) => (
                        <option key={index} value={lvl}>{lvl}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="w-full max-w-5xl space-y-4">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="p-4 mb-4 shadow-md rounded-lg border w-full max-w-5xl mx-auto">
                            <div className="flex justify-between items-center">
                                <Skeleton className="w-12 h-12 rounded-full"/>
                                <Skeleton className="w-32 h-6" />
                                <Skeleton className="w-16 h-6" />
                            </div>
                            <Skeleton className="w-3/4 h-6 mt-2" />
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mt-2">
                                <Skeleton className="w-full h-12 bg-orange-200 rounded-md" />
                                <Skeleton className="w-full h-12 bg-red-200 rounded-md" />
                            </div>
                            <div className="flex justify-between items-center text-gray-500 text-sm mt-2">
                                <Skeleton className="w-24 h-6" />
                                <Skeleton className="w-16 h-6" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
            questions.map((question) => (
                <Card key={question._id} className="p-4 mb-4 shadow-md rounded-lg border w-full max-w-5xl mx-auto">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <ProfileAvatar username={question.user.username} points={question.user.points} size="small"/>
                            <Badge className={`${getSubjectColor(question.subject)}`}>{question.subject}</Badge>
                            <Badge className={`${getLevelColor(question.classLevel)}`}>{question.classLevel}</Badge>
                            <TimeAgo date={question.createdAt}/>
                        </div>
                        <span className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-md">
                            <FaCoins className="text-yellow-500 mr-1"/> {question.points} pts
                        </span>
                    </div>
                    <p className="text-lg font-medium mt-2" onClick={() => router.push(`/forum/${question._id}`)}>{question.title}</p>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mt-2">
                        <div className="bg-orange-200 p-3 rounded-md flex items-start gap-2 flex-1">
                            <FaQuestionCircle className="text-orange-600 mt-1" />
                            <span>{question.description.whatIDid.substring(0, 150)}...</span>
                        </div>
                        <div className="bg-red-200 p-3 rounded-md flex items-start gap-2 flex-1">
                            <FaExclamationCircle className="text-red-600 mt-1" />
                            <span>{question.description.whatINeed.substring(0, 150)}...</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 text-sm mt-2">
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center gap-1">
                                <FaReply /> Réponses ({question.answerCount || 0})
                            </span>
                            <span className="flex items-center gap-1">
                                <FaPaperclip /> Pièces jointes ({question.attachments?.length || 0})
                            </span>
                            <FaEllipsisH className="cursor-pointer" />
                        </div>
                        <Button variant="outline" onClick={() => router.push(`/forum/${question._id}`)}>Répondre</Button>
                    </div>
                </Card>
            ))
            )}

            {page < totalPages && (
                <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={loading}
                >
                    {loading ? "Chargement..." : "Charger plus"}
                </Button>
            )}
        </div>
    );
}
