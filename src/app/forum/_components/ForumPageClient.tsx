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
    FaChevronLeft,
    FaInfoCircle,
    FaTimes,
    FaTrophy,
    FaUserGraduate,
    FaLightbulb,
    FaHeart
} from "react-icons/fa";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
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
    const { data: session, status: sessionStatus } = useSession();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const [subject, setSubject] = useState<string>("");
    const [classLevel, setClassLevel] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [isFiltering, setIsFiltering] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true);
            setIsFiltering(true);
            try {
                const response = await fetch(`/api/forum/questions?page=${page}&limit=10&title=${search}&subject=${subject}&classLevel=${classLevel}&status=${status}`);
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
    }, [page, search, subject, classLevel, status]);

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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Forum d&apos;entraide</h1>
                            <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
                                Posez vos questions, partagez vos connaissances et gagnez des points en aidant les autres
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowInfoModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 self-start sm:self-auto"
                        >
                            <FaInfoCircle className="text-sm" />
                            <span className="text-sm">Comment ça marche ?</span>
                        </Button>
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="mb-6 md:mb-8 bg-white rounded-xl shadow-md p-3 sm:p-4">
                    <form onSubmit={handleSearch} className="flex flex-col space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="relative flex-grow">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Rechercher dans les titres, descriptions et contenus..."
                                    value={search}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    className="pl-10 py-2 sm:py-3 border-gray-300 bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 rounded-lg w-full text-current"
                                />
                                {search && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <button
                                            onClick={() => setSearch("")}
                                            className="text-gray-400 hover:text-gray-600 text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-none transition-all duration-200 ${
                                        showFilters || subject || classLevel || status
                                            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    }`}
                                >
                                    <FaFilter className={showFilters ? "animate-pulse" : ""} /> 
                                    <span>
                                        {showFilters ? "Masquer les filtres" : "Filtres"}
                                        {(subject || classLevel || status) && (
                                            <span className="ml-1 text-xs bg-white text-orange-500 rounded-full px-1.5 py-0.5">
                                                {[subject, classLevel, status].filter(Boolean).length}
                                            </span>
                                        )}
                                    </span>
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

                        {/* Filtres ludiques dépliables */}
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, y: -20 }}
                                animate={{ height: "auto", opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: -20 }}
                                transition={{ 
                                    duration: 0.4,
                                    ease: "easeInOut",
                                    staggerChildren: 0.1
                                }}
                                className="pt-4 sm:pt-6 border-t border-gray-200"
                            >
                                {/* Filtres par badges colorés */}
                                <div className="space-y-6">
                                    {/* Filtre Matières - Style badges */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                            Choisir une matière
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    setSubject("");
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    subject === "" 
                                                        ? "bg-orange-500 text-white shadow-md transform scale-105" 
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                🎯 Toutes
                                            </button>
                                            {educationData.subjects.map((subj, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSubject(subj);
                                                        setPage(1);
                                                    }}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                        subject === subj 
                                                            ? "bg-blue-500 text-white shadow-md transform scale-105" 
                                                            : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
                                                    }`}
                                                >
                                                    {subj}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Filtre Niveaux - Style étoiles */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Sélectionner un niveau
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    setClassLevel("");
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    classLevel === "" 
                                                        ? "bg-orange-500 text-white shadow-md transform scale-105" 
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                ⭐ Tous
                                            </button>
                                            {educationData.levels.map((lvl, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setClassLevel(lvl);
                                                        setPage(1);
                                                    }}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                        classLevel === lvl 
                                                            ? "bg-green-500 text-white shadow-md transform scale-105" 
                                                            : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                                                    }`}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Filtre Statuts - Style badges avec icônes */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                            Filtrer par statut
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => {
                                                    setStatus("");
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    status === "" 
                                                        ? "bg-orange-500 text-white shadow-md transform scale-105" 
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                🔍 Tous
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setStatus("Non validée");
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    status === "Non validée" 
                                                        ? "bg-yellow-500 text-white shadow-md transform scale-105" 
                                                        : "bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700"
                                                }`}
                                            >
                                                ⏳ Non validée
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setStatus("Validée");
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    status === "Validée" 
                                                        ? "bg-blue-500 text-white shadow-md transform scale-105" 
                                                        : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
                                                }`}
                                            >
                                                ✅ Validée
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setStatus("Résolue");
                                                    setPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    status === "Résolue" 
                                                        ? "bg-green-500 text-white shadow-md transform scale-105" 
                                                        : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                                                }`}
                                            >
                                                🏆 Résolue
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Actions */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>Filtres actifs :</span>
                                            <div className="flex gap-1">
                                                {subject && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                        {subject}
                                                    </span>
                                                )}
                                                {classLevel && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                        {classLevel}
                                                    </span>
                                                )}
                                                {status && (
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                        {status}
                                                    </span>
                                                )}
                                                {!subject && !classLevel && !status && (
                                                    <span className="text-gray-400">Aucun</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    setSearch("");
                                                    setSubject("");
                                                    setClassLevel("");
                                                    setStatus("");
                                                    setPage(1);
                                                }}
                                                className="text-gray-600 hover:text-gray-800 text-sm bg-gray-100 hover:bg-gray-200"
                                            >
                                                🗑️ Effacer tout
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 sm:px-6 text-sm sm:text-base shadow-md"
                                                disabled={isFiltering}
                                            >
                                                {isFiltering ? "🔄 Filtrage..." : "✨ Appliquer"}
                                            </Button>
                                        </div>
                                    </motion.div>
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
                                                <UsernameDisplay 
                                                    username={question.user.username}
                                                    userId={question.user._id}
                                                    className="font-semibold text-sm sm:text-base block"
                                                />
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
                                            <div>
                                                <p className="text-xs font-medium text-blue-800 mb-1">Ce que j&apos;ai fait :</p>
                                                <p className="text-xs sm:text-sm text-gray-700 line-clamp-3">
                                                    {question.description.whatIDid.length > 150 
                                                        ? question.description.whatIDid.substring(0, 150) + "..." 
                                                        : question.description.whatIDid}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 sm:p-4 rounded-xl border border-red-200 flex items-start gap-2 sm:gap-3">
                                            <FaExclamationCircle className="text-red-600 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-red-800 mb-1">Ce dont j&apos;ai besoin :</p>
                                                <p className="text-xs sm:text-sm text-gray-700 line-clamp-3">
                                                    {question.description.whatINeed.length > 150 
                                                        ? question.description.whatINeed.substring(0, 150) + "..." 
                                                        : question.description.whatINeed}
                                                </p>
                                            </div>
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

                {/* Modal d'information */}
                {showInfoModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header de la modal */}
                            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FaInfoCircle className="text-2xl" />
                                        <h2 className="text-xl font-bold">Guide du Forum Workyt</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowInfoModal(false)}
                                        className="text-white hover:text-gray-200 transition-colors"
                                    >
                                        <FaTimes className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenu de la modal */}
                            <div className="p-6 space-y-6">
                                {/* Système de Points du Forum */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaCoins className="text-2xl text-amber-600" />
                                        <h3 className="text-lg font-bold text-gray-800">Système de Points du Forum</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-lg border border-amber-200">
                                            <h4 className="font-semibold text-gray-700 mb-3">💰 Comment ça marche :</h4>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-amber-500 mt-1">•</span>
                                                    <span><strong>Vous misez des points</strong> (1 à 15) quand vous posez une question</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-amber-500 mt-1">•</span>
                                                    <span><strong>Les Helpeurs répondent</strong> et gagnent +2 points par réponse</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-amber-500 mt-1">•</span>
                                                    <span><strong>Vous validez la meilleure réponse</strong> → elle reçoit TOUS vos points misés !</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-amber-500 mt-1">•</span>
                                                    <span><strong>Les likes</strong> donnent +1 point à l&apos;auteur de la réponse</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <h4 className="font-semibold text-green-700 mb-2">✅ Gagner des points :</h4>
                                                <div className="space-y-1 text-sm text-green-600">
                                                    <div>• <strong>+2 pts</strong> - Répondre à une question</div>
                                                    <div>• <strong>+1 pt</strong> - Recevoir un like</div>
                                                    <div>• <strong>+X pts</strong> - Avoir sa réponse validée (X = points misés)</div>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <h4 className="font-semibold text-blue-700 mb-2">🎯 Utiliser ses points :</h4>
                                                <div className="space-y-1 text-sm text-blue-600">
                                                    <div>• <strong>Miser 1-15 pts</strong> - Pour poser une question</div>
                                                    <div>• <strong>Débloquer des badges</strong> - En participant</div>
                                                    <div>• <strong>Monter dans les classements</strong></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comment poser une bonne question */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaQuestionCircle className="text-2xl text-green-600" />
                                        <h3 className="text-lg font-bold text-gray-800">Comment poser une belle question ?</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3">✅ À faire :</h4>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 mt-1">•</span>
                                                    <span><strong>Titre clair</strong> : &quot;Problème de calcul avec les fractions&quot;</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 mt-1">•</span>
                                                    <span><strong>Décrivez ce que vous avez fait</strong> : Montrez vos tentatives</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 mt-1">•</span>
                                                    <span><strong>Précisez ce dont vous avez besoin</strong> : Aide, explication, correction...</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 mt-1">•</span>
                                                    <span><strong>Ajoutez des images</strong> : Photos de votre travail, schémas</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 mt-1">•</span>
                                                    <span><strong>Choisissez la bonne matière et le bon niveau</strong></span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3">❌ À éviter :</h4>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-red-500 mt-1">•</span>
                                                    <span><strong>Titre vague</strong> : &quot;Aide maths&quot; ou &quot;Urgent !&quot;</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-red-500 mt-1">•</span>
                                                    <span><strong>Demander directement la réponse</strong> sans essayer</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-red-500 mt-1">•</span>
                                                    <span><strong>Poster plusieurs fois la même question</strong></span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-red-500 mt-1">•</span>
                                                    <span><strong>Être impoli ou impatient</strong></span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Statuts des Questions */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaTrophy className="text-2xl text-purple-600" />
                                        <h3 className="text-lg font-bold text-gray-800">Statuts des Questions</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                                                <h4 className="font-semibold text-yellow-700">Non validée</h4>
                                            </div>
                                            <p className="text-sm text-yellow-600">Question en attente de réponses. Les Helpeurs peuvent répondre et gagner des points.</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                                <h4 className="font-semibold text-blue-700">Validée</h4>
                                            </div>
                                            <p className="text-sm text-blue-600">Une réponse a été validée par le <strong>staff</strong> (Admin, Correcteur, Helpeur). <strong>Les points sont distribués</strong> et personne ne peut plus répondre.</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                                <h4 className="font-semibold text-green-700">Résolue</h4>
                                            </div>
                                            <p className="text-sm text-green-600">L&apos;<strong>auteur de la question</strong> a choisi une &quot;Meilleure Réponse&quot;. Les points sont distribués et <strong>personne ne peut plus répondre</strong>.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rôle d'un Helpeur */}
                                <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 p-6 rounded-xl border border-indigo-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaUserGraduate className="text-2xl text-indigo-600" />
                                        <h3 className="text-lg font-bold text-gray-800">Le rôle d&apos;un Helpeur</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FaLightbulb className="text-blue-600 text-xl" />
                                            </div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Expliquer</h4>
                                            <p className="text-sm text-gray-600">Donnez des explications claires et détaillées, pas juste la réponse</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FaHeart className="text-green-600 text-xl" />
                                            </div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Encourager</h4>
                                            <p className="text-sm text-gray-600">Soyez patient et encourageant avec les autres élèves</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FaTrophy className="text-yellow-600 text-xl" />
                                            </div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Valider</h4>
                                            <p className="text-sm text-gray-600">Seul l&apos;auteur de la question peut valider une réponse comme &quot;Meilleure Réponse&quot;</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Conseils pratiques du Forum */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FaLightbulb className="text-yellow-500" />
                                        Conseils pratiques du Forum
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Pour poser une question :</h4>
                                            <ul className="space-y-1 text-gray-600">
                                                <li>• <strong>Misez des points</strong> (1-15) selon l&apos;urgence</li>
                                                <li>• <strong>Plus de points</strong> = plus d&apos;Helpeurs motivés</li>
                                                <li>• <strong>Validez la meilleure réponse</strong> pour distribuer vos points</li>
                                                <li>• <strong>Utilisez les filtres</strong> pour voir des questions similaires</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Pour répondre (Helpeurs) :</h4>
                                            <ul className="space-y-1 text-gray-600">
                                                <li>• <strong>+2 points</strong> automatiques par réponse</li>
                                                <li>• <strong>+X points</strong> si votre réponse est validée</li>
                                                <li>• <strong>Lisez attentivement</strong> la question avant de répondre</li>
                                                <li>• <strong>Donnez des explications</strong> détaillées, pas juste la réponse</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-blue-700 mb-2">💡 Différence importante :</h4>
                                        <div className="text-sm text-blue-600 space-y-2">
                                            <p>
                                                <strong>🔵 Validée par le staff :</strong> La question passe en statut &quot;Validée&quot;, 
                                                <strong>les points sont distribués</strong> et personne ne peut plus répondre.
                                            </p>
                                            <p>
                                                <strong>🟢 Résolue par l&apos;auteur :</strong> L&apos;auteur choisit une &quot;Meilleure Réponse&quot;, 
                                                <strong>les points sont distribués</strong> et personne ne peut plus répondre.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer de la modal */}
                            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-xl border-t border-gray-200">
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => setShowInfoModal(false)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                                    >
                                        J&apos;ai compris !
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
} 