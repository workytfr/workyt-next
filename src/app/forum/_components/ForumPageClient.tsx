"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    FaCoins,
    FaReply,
    FaEllipsisH,
    FaExclamationCircle,
    FaQuestionCircle,
    FaPaperclip,
    FaSearch,
    FaFilter,
    FaChevronRight,
    FaChevronLeft
} from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSubjectColor, getLevelColor, educationData } from "@/data/educationData";
import Image from "next/image";
import { motion } from "framer-motion";

// Types pour éviter les erreurs TS2339: Property does not exist on type 'never'
interface User {
    username: string;
    points: number;
    _id: string; // Added _id for ProfileAvatar
}

interface Description {
    whatIDid: string;
    whatINeed: string;
}

interface Question {
    _id: string;
    title: string;
    user: User;
    subject: string;
    classLevel: string;
    points: number;
    createdAt: string;
    status?: string;
    description: Description;
    answerCount: number;
    attachments: Array<any>;
}

interface PaginationData {
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

interface QuestionsResponse {
    success: boolean;
    data: Question[];
    pagination: PaginationData;
}

export default function ForumPageClient() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const [subject, setSubject] = useState<string>("");
    const [classLevel, setClassLevel] = useState<string>("");
    const [isFiltering, setIsFiltering] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState<boolean>(false);

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true);
            setIsFiltering(true);
            try {
                const response = await fetch(`/api/forum/questions?page=${page}&limit=10&title=${search}&subject=${subject}&classLevel=${classLevel}`);
                const data: QuestionsResponse = await response.json();
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

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPage(1);
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header avec titre et stats */}
                <div className="mb-6 md:mb-8 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Forum d&apos;entraide</h1>
                    <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
                        Posez vos questions, partagez vos connaissances et gagnez des points en aidant les autres
                    </p>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="mb-6 md:mb-8 bg-white rounded-xl shadow-md p-3 sm:p-4">
                    <form onSubmit={handleSearch} className="flex flex-col space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="relative flex-grow">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Rechercher par mot-clé..."
                                    value={search}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    className="pl-10 py-2 sm:py-3 border-gray-300 bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 rounded-lg w-full text-current"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none"
                                >
                                    <FaFilter /> Filtres
                                </Button>
                                {session && (
                                    <Button
                                        onClick={() => router.push("/forum/creer/")}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md flex-1 sm:flex-none transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2"
                                    >
                                        <span className="hidden sm:inline">Déposer un exercice</span>
                                        <span className="inline sm:hidden">Déposer</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Filtres dépliables */}
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200"
                            >
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Matière</label>
                                    <select
                                        value={subject}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                            setSubject(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-sm sm:text-base"
                                    >
                                        <option value="">Toutes les matières</option>
                                        {educationData.subjects.map((subj, index) => (
                                            <option key={index} value={subj} className="text-gray-900">{subj}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Niveau</label>
                                    <select
                                        value={classLevel}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                            setClassLevel(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-sm sm:text-base"
                                    >
                                        <option value="">Tous niveaux</option>
                                        {educationData.levels.map((lvl, index) => (
                                            <option key={index} value={lvl} className="text-gray-900">{lvl}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <Button
                                        type="submit"
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 text-sm sm:text-base"
                                        disabled={isFiltering}
                                    >
                                        {isFiltering ? "Filtrage..." : "Appliquer les filtres"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </form>
                </div>

                {/* Contenu principal - Liste des questions */}
                {loading ? (
                    <div className="space-y-4 sm:space-y-6">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="bg-white p-4 sm:p-6 mb-3 sm:mb-4 shadow-md rounded-xl border border-gray-200">
                                <div className="flex flex-wrap justify-between items-center">
                                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                        <Skeleton className="w-8 sm:w-10 h-8 sm:h-10 rounded-full" />
                                        <Skeleton className="w-24 sm:w-32 h-5 sm:h-6 rounded-md" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="w-14 sm:w-16 h-5 sm:h-6 rounded-md" />
                                        <Skeleton className="w-14 sm:w-16 h-5 sm:h-6 rounded-md" />
                                    </div>
                                </div>
                                <Skeleton className="w-full sm:w-3/4 h-6 sm:h-8 mt-3 sm:mt-4 rounded-md" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                                    <Skeleton className="h-20 sm:h-24 rounded-lg bg-blue-50" />
                                    <Skeleton className="h-20 sm:h-24 rounded-lg bg-red-50" />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between mt-4 sm:mt-6 gap-3">
                                    <Skeleton className="w-24 sm:w-32 h-5 sm:h-6 rounded-md" />
                                    <Skeleton className="w-full sm:w-24 h-8 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : questions.length > 0 ? (
                    <motion.div
                        className="space-y-4 sm:space-y-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {questions.map((question) => (
                            <motion.div key={question._id} variants={itemVariants}>
                                <Card
                                    className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                                    onClick={() => router.push(`/forum/${question._id}`)}
                                >
                                    {/* En-tête avec status badge */}
                                    <div className="relative">
                                        {question.status === "Validée" && (
                                            <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 md:-right-4 md:-top-4 z-10">
                                                <Image
                                                    src="/badge/Valider.svg"
                                                    alt="Validée"
                                                    width={36}
                                                    height={36}
                                                    className="drop-shadow-md sm:w-10 sm:h-10"
                                                />
                                            </div>
                                        )}
                                        {question.status === "Résolue" && (
                                            <div className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 md:-right-4 md:-top-4 z-10">
                                                <Image
                                                    src="/badge/Best.svg"
                                                    alt="Résolue"
                                                    width={36}
                                                    height={36}
                                                    className="drop-shadow-md sm:w-10 sm:h-10"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Header: User info and badges - Amélioration pour mobile */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 pr-6 sm:pr-0">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <ProfileAvatar 
                                                username={question.user.username} 
                                                points={question.user.points} 
                                                size="small"
                                                userId={question.user._id}
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm sm:text-base">{question.user.username}</p>
                                                <TimeAgo date={question.createdAt}/>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs">
                                            <Badge className={`${getSubjectColor(question.subject)} text-xs`}>{question.subject}</Badge>
                                            <Badge className={`${getLevelColor(question.classLevel)} text-xs`}>{question.classLevel}</Badge>
                                            <span className="flex items-center text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
                                                <FaCoins className="text-amber-500 mr-1" /> {question.points} pts
                                            </span>
                                        </div>
                                    </div>

                                    {/* Titre de la question */}
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-3 sm:mt-4 group-hover:text-blue-600 cursor-pointer line-clamp-2">
                                        {question.title}
                                    </h2>

                                    {/* Contenu de la question */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5">
                                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border border-blue-200 flex items-start gap-2 sm:gap-3">
                                            <FaQuestionCircle className="text-blue-600 mt-1 flex-shrink-0" />
                                            <p className="text-xs sm:text-sm text-gray-700 line-clamp-3">
                                                {question.description.whatIDid.substring(0, 150)}...
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 sm:p-4 rounded-xl border border-red-200 flex items-start gap-2 sm:gap-3">
                                            <FaExclamationCircle className="text-red-600 mt-1 flex-shrink-0" />
                                            <p className="text-xs sm:text-sm text-gray-700 line-clamp-3">
                                                {question.description.whatINeed.substring(0, 150)}...
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer with stats and actions */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
                                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FaReply className="text-blue-500" /> {question.answerCount || 0} réponses
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FaPaperclip className="text-gray-400" /> {question.attachments?.length || 0} pièces jointes
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="text-xs sm:text-sm border-blue-200 hover:bg-blue-50 text-blue-600 w-full sm:w-auto justify-center"
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                router.push(`/forum/${question._id}`);
                                            }}
                                        >
                                            Voir et répondre
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="bg-white p-6 sm:p-10 rounded-xl shadow text-center">
                        <div className="mb-4 text-gray-400">
                            <FaSearch className="mx-auto text-3xl sm:text-4xl" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">Aucun résultat trouvé</h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Essayez de modifier vos critères de recherche</p>
                        <Button
                            onClick={() => {
                                setSearch("");
                                setSubject("");
                                setClassLevel("");
                                setPage(1);
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base"
                        >
                            Effacer les filtres
                        </Button>
                    </div>
                )}

                {/* Pagination - Version responsive */}
                {questions.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center mt-6 sm:mt-10">
                        <div className="inline-flex rounded-md shadow-sm">
                            <Button
                                className="rounded-l-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => setPage((prevPage) => Math.max(prevPage - 1, 1))}
                                disabled={page === 1 || loading}
                            >
                                <FaChevronLeft className="mr-1" />
                                <span className="hidden xs:inline">Précédent</span>
                            </Button>
                            <div className="bg-white text-gray-700 border-t border-b border-gray-300 px-2 sm:px-4 py-2 flex items-center text-xs sm:text-sm">
                                <span className="font-medium">Page {page}/{totalPages}</span>
                            </div>
                            <Button
                                className="rounded-r-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => setPage((prevPage) => prevPage + 1)}
                                disabled={page >= totalPages || loading}
                            >
                                <span className="hidden xs:inline">Suivant</span>
                                <FaChevronRight className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 