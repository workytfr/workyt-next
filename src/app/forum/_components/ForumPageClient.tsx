"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FaCoins,
    FaReply,
    FaExclamationCircle,
    FaQuestionCircle,
    FaPaperclip,
    FaInfoCircle,
    FaTimes,
    FaTrophy,
    FaUserGraduate,
    FaLightbulb,
    FaHeart
} from "react-icons/fa";
import {
    Search,
    SlidersHorizontal,
    Plus,
    ChevronLeft,
    ChevronRight,
    X,
    MessageCircle,
    HelpCircle,
    ArrowRight,
    Users,
    Zap,
    BookOpen,
    Dumbbell,
} from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import TimeAgo from "@/components/ui/TimeAgo";
import { Badge } from "@/components/ui/Badge";
import { getSubjectColor, getLevelColor, educationData } from "@/data/educationData";
import Image from "next/image";
import { motion } from "framer-motion";
import BookmarkButton from "@/components/BookmarkButton";
import { buildIdSlug } from "@/utils/slugify";

interface User {
    username: string;
    points: number;
    _id: string;
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
    contextType?: 'lesson' | 'exercise' | 'general';
    contextTitle?: string;
    contextId?: string;
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
    const searchParams = useSearchParams();
    const { data: session } = useSession();
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
    const [contextFilter, setContextFilter] = useState<string>(searchParams.get("contextType") || "");
    const [contextIdFilter, setContextIdFilter] = useState<string>(searchParams.get("contextId") || "");

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true);
            setIsFiltering(true);
            try {
                let url = `/api/forum/questions?page=${page}&limit=10&title=${search}&subject=${subject}&classLevel=${classLevel}&status=${status}`;
                if (contextFilter) url += `&contextType=${contextFilter}`;
                if (contextIdFilter) url += `&contextId=${contextIdFilter}`;
                const response = await fetch(url);
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
    }, [page, search, subject, classLevel, status, contextFilter, contextIdFilter]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPage(1);
    };

    const activeFilterCount = [subject, classLevel, status, contextFilter].filter(Boolean).length;
    const hasActiveFilters = activeFilterCount > 0 || search;

    const clearAll = () => {
        setSearch(""); setSubject(""); setClassLevel(""); setStatus("");
        setContextFilter(""); setContextIdFilter(""); setPage(1);
    };

    const statusOptions = [
        { value: "", label: "Tous", dot: "bg-gray-300" },
        { value: "Non validée", label: "En attente", dot: "bg-amber-400" },
        { value: "Validée", label: "Validée", dot: "bg-orange-500" },
        { value: "Résolue", label: "Résolue", dot: "bg-emerald-500" },
    ];

    const contextOptions = [
        { value: "", label: "Tout" },
        { value: "lesson", label: "Leçons" },
        { value: "exercise", label: "Exercices" },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <header className="border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-medium mb-4">
                                <MessageCircle className="w-3.5 h-3.5" />
                                Communauté d&apos;entraide
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                                Forum d&apos;entraide
                            </h1>
                            <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
                                Posez vos questions, partagez vos connaissances et gagnez des points en aidant les autres.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">Comment ça marche</span>
                            </button>
                            {session && (
                                <button
                                    onClick={() => router.push("/forum/creer/")}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Poser une question
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Search + Filter bar */}
                <div className="mb-6">
                    <form onSubmit={handleSearch} className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une question..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                showFilters || activeFilterCount > 0
                                    ? "border-orange-200 bg-orange-50 text-orange-600"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">Filtres</span>
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Expandable filters */}
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-3 p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100"
                        >
                            <div className="space-y-4">
                                {/* Matière */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Matière</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        <FilterChip active={!subject} onClick={() => { setSubject(""); setPage(1); }}>Toutes</FilterChip>
                                        {educationData.subjects.map((s) => (
                                            <FilterChip key={s} active={subject === s} onClick={() => { setSubject(s); setPage(1); }}>
                                                {s}
                                            </FilterChip>
                                        ))}
                                    </div>
                                </div>

                                {/* Niveau */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Niveau</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        <FilterChip active={!classLevel} onClick={() => { setClassLevel(""); setPage(1); }}>Tous</FilterChip>
                                        {educationData.levels.map((l) => (
                                            <FilterChip key={l} active={classLevel === l} onClick={() => { setClassLevel(l); setPage(1); }}>
                                                {l}
                                            </FilterChip>
                                        ))}
                                    </div>
                                </div>

                                {/* Statut + Type */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Statut</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {statusOptions.map((opt) => (
                                                <FilterChip key={opt.value} active={status === opt.value} onClick={() => { setStatus(opt.value); setPage(1); }}>
                                                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                                                    {opt.label}
                                                </FilterChip>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Type</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {contextOptions.map((opt) => (
                                                <FilterChip
                                                    key={opt.value}
                                                    active={contextFilter === opt.value}
                                                    onClick={() => { setContextFilter(opt.value); setContextIdFilter(""); setPage(1); }}
                                                >
                                                    {opt.value === "lesson" && <BookOpen className="w-3 h-3" />}
                                                    {opt.value === "exercise" && <Dumbbell className="w-3 h-3" />}
                                                    {opt.label}
                                                </FilterChip>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {hasActiveFilters && (
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                                        <div className="flex flex-wrap gap-1.5">
                                            {subject && <ActiveBadge label={subject} onClear={() => setSubject("")} />}
                                            {classLevel && <ActiveBadge label={classLevel} onClear={() => setClassLevel("")} />}
                                            {status && <ActiveBadge label={status} onClear={() => setStatus("")} />}
                                            {contextFilter && <ActiveBadge label={contextFilter === 'lesson' ? 'Leçons' : 'Exercices'} onClear={() => setContextFilter("")} />}
                                        </div>
                                        <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                                            Tout effacer
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Question list */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-gray-100 p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="w-28 h-4 rounded" />
                                        <Skeleton className="w-16 h-3 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="w-3/4 h-5 rounded mb-3" />
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-20 rounded-xl" />
                                    <Skeleton className="h-20 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : questions.length > 0 ? (
                    <div className="space-y-3">
                        {questions.map((question, index) => (
                            <motion.div
                                key={question._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <article
                                    className="group relative rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 cursor-pointer overflow-hidden"
                                    onClick={() => router.push(`/forum/${buildIdSlug(question._id, question.title)}`)}
                                >
                                    {/* Status indicator line */}
                                    {question.status && question.status !== "Non validée" && (
                                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                                            question.status === "Validée" ? "bg-orange-500" : "bg-emerald-500"
                                        }`} />
                                    )}

                                    <div className="p-5 sm:p-6">
                                        {/* Top row: user + badges + SVG status */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
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
                                                        className="font-medium text-sm block"
                                                    />
                                                    <TimeAgo date={question.createdAt} />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Badge className={`${getSubjectColor(question.subject)} text-xs`}>{question.subject}</Badge>
                                                <Badge className={`${getLevelColor(question.classLevel)} text-xs`}>{question.classLevel}</Badge>
                                                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                                                    <Image src="/badge/points.png" alt="Points" width={14} height={14} className="object-contain" /> {question.points}
                                                </span>
                                                {question.contextType && question.contextType !== 'general' && question.contextTitle && (
                                                    <Badge className="bg-purple-50 text-purple-600 border border-purple-100 text-xs">
                                                        {question.contextType === 'lesson' ? 'Leçon' : 'Exercice'} : {question.contextTitle.length > 25 ? question.contextTitle.substring(0, 25) + '...' : question.contextTitle}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Title + SVG badge */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors flex-1">
                                                {question.title}
                                            </h2>
                                            {question.status === "Validée" && (
                                                <Image
                                                    src="/badge/Valider.svg"
                                                    alt="Validée"
                                                    width={32}
                                                    height={32}
                                                    className="shrink-0 drop-shadow-sm"
                                                />
                                            )}
                                            {question.status === "Résolue" && (
                                                <Image
                                                    src="/badge/Best.svg"
                                                    alt="Résolue"
                                                    width={32}
                                                    height={32}
                                                    className="shrink-0 drop-shadow-sm"
                                                />
                                            )}
                                        </div>

                                        {/* Description cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                                            <div className="rounded-xl bg-blue-50/60 border border-blue-100/60 p-3">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FaQuestionCircle className="text-blue-500 text-xs" />
                                                    <span className="text-xs font-medium text-blue-700">Ce que j&apos;ai fait</span>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    {question.description.whatIDid.length > 120
                                                        ? question.description.whatIDid.substring(0, 120) + "..."
                                                        : question.description.whatIDid}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-orange-50/60 border border-orange-100/60 p-3">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FaExclamationCircle className="text-orange-500 text-xs" />
                                                    <span className="text-xs font-medium text-orange-700">Ce dont j&apos;ai besoin</span>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    {question.description.whatINeed.length > 120
                                                        ? question.description.whatINeed.substring(0, 120) + "..."
                                                        : question.description.whatINeed}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <BookmarkButton questionId={question._id} size="sm" />
                                                </div>
                                                <span className="inline-flex items-center gap-1">
                                                    <FaReply className="text-blue-400" /> {question.answerCount || 0} réponses
                                                </span>
                                                {(question.attachments?.length || 0) > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <FaPaperclip /> {question.attachments.length} pièces jointes
                                                    </span>
                                                )}
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-orange-500 transition-colors">
                                                Voir <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-7 h-7 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Aucun résultat</h3>
                        <p className="text-sm text-gray-500 mb-5">Modifiez vos critères de recherche</p>
                        {hasActiveFilters && (
                            <button onClick={clearAll} className="text-sm font-medium text-orange-500 hover:text-orange-600">
                                Effacer les filtres
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {questions.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-10 pt-8 border-t border-gray-100">
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Précédent</span>
                        </button>

                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && (
                                            <span className="px-1.5 text-gray-300">...</span>
                                        )}
                                        <button
                                            onClick={() => setPage(p)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                                page === p
                                                    ? "bg-gray-900 text-white"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}
                        </div>

                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="hidden sm:inline">Suivant</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>

            {/* Info modal */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Guide du Forum</h2>
                                    <p className="text-xs text-gray-500">Tout ce qu&apos;il faut savoir</p>
                                </div>
                            </div>
                            <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <FaTimes className="text-lg" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Système de Points */}
                            <section className="rounded-xl border border-amber-100 bg-amber-50/50 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaCoins className="text-lg text-amber-600" />
                                    <h3 className="font-bold text-gray-900">Système de Points</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white rounded-lg p-3 border border-amber-100">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">Gagner des points</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            <li><strong>+2 pts</strong> – Répondre à une question</li>
                                            <li><strong>+1 pt</strong> – Recevoir un like</li>
                                            <li><strong>+X pts</strong> – Réponse validée (X = mise)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-amber-100">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">Utiliser ses points</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            <li><strong>Miser 1-15 pts</strong> pour poser une question</li>
                                            <li><strong>Plus de mise</strong> = plus de motivation</li>
                                            <li><strong>Valider</strong> distribue vos points</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Poser une bonne question */}
                            <section className="rounded-xl border border-gray-100 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaQuestionCircle className="text-lg text-blue-500" />
                                    <h3 className="font-bold text-gray-900">Poser une bonne question</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                                    <div>
                                        <p className="font-semibold text-gray-700 mb-2">À faire</p>
                                        <ul className="space-y-1">
                                            <li>Titre clair et précis</li>
                                            <li>Montrer vos tentatives</li>
                                            <li>Préciser ce dont vous avez besoin</li>
                                            <li>Ajouter des images si possible</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-700 mb-2">À éviter</p>
                                        <ul className="space-y-1">
                                            <li>Titre vague (&quot;Aide maths&quot;)</li>
                                            <li>Demander la réponse directement</li>
                                            <li>Poster la même question</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Statuts des questions */}
                            <section className="rounded-xl border border-gray-100 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaTrophy className="text-lg text-purple-500" />
                                    <h3 className="font-bold text-gray-900">Statuts des questions</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                                            <span className="text-xs font-semibold text-amber-700">En attente</span>
                                        </div>
                                        <p className="text-xs text-amber-600">Attend des réponses de la communauté.</p>
                                    </div>
                                    <div className="rounded-lg bg-orange-50 border border-orange-100 p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                                            <span className="text-xs font-semibold text-orange-700">Validée</span>
                                        </div>
                                        <p className="text-xs text-orange-600">Réponse validée par le staff.</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-semibold text-emerald-700">Résolue</span>
                                        </div>
                                        <p className="text-xs text-emerald-600">Meilleure réponse choisie par l&apos;auteur.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Rôle d'un Helpeur */}
                            <section className="rounded-xl border border-gray-100 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaUserGraduate className="text-lg text-indigo-500" />
                                    <h3 className="font-bold text-gray-900">Le rôle d&apos;un Helpeur</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                                            <FaLightbulb className="text-blue-500" />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-700">Expliquer</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Des réponses claires et détaillées</p>
                                    </div>
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                                            <FaHeart className="text-green-500" />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-700">Encourager</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Patience et bienveillance</p>
                                    </div>
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                                            <FaTrophy className="text-amber-500" />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-700">Valider</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">Choisir la meilleure réponse</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                J&apos;ai compris !
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

/* Reusable filter chip */
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
        >
            {children}
        </button>
    );
}

/* Active filter badge */
function ActiveBadge({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600">
            {label}
            <button onClick={onClear} className="hover:text-gray-900">
                <X className="w-3 h-3" />
            </button>
        </span>
    );
}
