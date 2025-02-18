"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { FaCoins, FaReply, FaEllipsisH, FaExclamationCircle, FaQuestionCircle, FaPaperclip } from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSubjectColor, getLevelColor, educationData } from "@/data/educationData";
import Image from "next/image";

export default function ForumQuestionsPage() {
    const router = useRouter();
    const { data: session, status } = useSession(); // Récupère la session utilisateur
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [subject, setSubject] = useState("");
    const [classLevel, setClassLevel] = useState("");
    const [isFiltering, setIsFiltering] = useState(false);

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true);
            setIsFiltering(true);
            try {
                const response = await fetch(`/api/forum/questions?page=${page}&limit=10&title=${search}&subject=${subject}&classLevel=${classLevel}`);
                const data = await response.json();
                if (data.success) {
                    setQuestions(data.data);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (error) {
                console.error("Erreur de récupération des questions", error);
            } finally {
                setLoading(false);
                setIsFiltering(false);
            }
        }
        fetchQuestions();
    }, [page, search, subject, classLevel]);



    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gray-100 py-10 px-6 md:px-16">
            {/* 🔍 Barre de recherche + Bouton Déposer un exercice */}
            <div className="w-full max-w-5xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row flex-1 gap-4">
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

                {/* 🆕 Bouton Déposer un exercice aligné à droite */}
                {session && (
                    <Button
                        onClick={() => router.push("/forum/creer/")}
                        className="bg-black text-white hover:bg-orange-600 px-4 py-2"
                    >
                        Déposer un exercice
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="w-full max-w-5xl space-y-4">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="p-4 mb-4 shadow-md rounded-lg border w-full max-w-5xl mx-auto">
                            {/* Header : Profil + Badges + Date */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" /> {/* Avatar */}
                                    <Skeleton className="w-24 h-6 rounded-md" /> {/* Username */}
                                    <Skeleton className="w-16 h-6 rounded-md" /> {/* Badge Matière */}
                                    <Skeleton className="w-16 h-6 rounded-md" /> {/* Badge Niveau */}
                                    <Skeleton className="w-20 h-6 rounded-md" /> {/* Date */}
                                </div>
                                <Skeleton className="w-20 h-6 rounded-md" /> {/* Points */}
                            </div>

                            {/* Titre de la question */}
                            <Skeleton className="w-3/4 h-6 mt-3 rounded-md" />

                            {/* Contenu de la question (Ce que j'ai fait / Ce dont j'ai besoin) */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mt-4">
                                <Skeleton className="w-full h-16 rounded-md bg-orange-200" />
                                <Skeleton className="w-full h-16 rounded-md bg-red-200" />
                            </div>

                            {/* Footer : Réponses + Pièces jointes */}
                            <div className="flex justify-between items-center text-gray-500 text-sm mt-4">
                                <Skeleton className="w-24 h-6 rounded-md" />
                                <Skeleton className="w-16 h-6 rounded-md" />
                            </div>
                        </div>
                    ))}

                </div>
            ) : (
                questions.map((question) => (
                    <Card key={question._id} className="p-6 mb-6 shadow-lg rounded-xl border border-gray-200 w-full max-w-5xl mx-auto relative">

                        {/* ✅ En-tête avec utilisateur, badges et points */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <ProfileAvatar username={question.user.username} points={question.user.points} size="small" />
                                <span className="mt-1 text-gray-800 font-semibold">{question.user.username}</span>
                                <Badge className={`${getSubjectColor(question.subject)}`}>{question.subject}</Badge>
                                <Badge className={`${getLevelColor(question.classLevel)}`}>{question.classLevel}</Badge>
                                <TimeAgo date={question.createdAt} />
                            </div>
                            <div className="relative flex items-center">
                                {/* Points et FaCoins */}
                                <span className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-md">
        <FaCoins className="text-yellow-500 mr-1" /> {question.points} pts
    </span>

                                {/* ✅ Badge à côté des points, bien positionné */}
                                {question.status === "Validée" && (
                                    <div className="absolute -right-4 -top-2">
                                        <Image src="/badge/Valider.svg" alt="Validée" width={30} height={30} />
                                    </div>
                                )}
                                {question.status === "Résolue" && (
                                    <div className="absolute -right-4 -top-2">
                                        <Image src="/badge/Best.svg" alt="Résolue" width={30} height={30} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✅ Titre de la question */}
                        <h2
                            className="text-xl font-bold text-gray-800 mt-4 cursor-pointer hover:underline"
                            onClick={() => router.push(`/forum/${question._id}`)}
                        >
                            {question.title}
                        </h2>

                        {/* ✅ Contenu de la question */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mt-4">
                            <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-300 flex items-start gap-4 flex-1 shadow-sm">
                                <FaQuestionCircle className="text-blue-600 mt-1" />
                                <span>{question.description.whatIDid.substring(0, 150)}...</span>
                            </div>
                            <div className="bg-red-100 p-4 rounded-xl border-2 border-red-300 flex items-start gap-4 flex-1 shadow-sm">
                                <FaExclamationCircle className="text-red-600 mt-1" />
                                <span>{question.description.whatINeed.substring(0, 150)}...</span>
                            </div>
                        </div>

                        {/* ✅ Infos supplémentaires : Réponses & Pièces jointes */}
                        <div className="flex justify-between items-center text-gray-500 text-sm mt-4">
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
              Z          </div>
                    </Card>
                ))
            )}

            {/* ✅ Bouton Charger plus */}
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
