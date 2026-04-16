"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/Pagination";
import { PiFireSimpleFill } from "react-icons/pi";
import { MdSearch, MdInsertComment, MdInfoOutline } from "react-icons/md";
import { FiPlusCircle, FiBookmark } from "react-icons/fi";
import { SlidersHorizontal, ArrowUpDown, X, ChevronLeft, ChevronRight, FileText, Sparkles } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import SubjectIcon from "@/components/fiches/SubjectIcon";
import InfoDrawer from "@/app/fiches/_components/InfoDrawer";
import { educationData, subjectGradients } from "@/data/educationData";
import { buildIdSlug } from "@/utils/slugify";

interface Fiche {
    id: string;
    title: string;
    authors: { username: string; points: number; _id: string; role?: string };
    content: string;
    likes: number;
    comments: number;
    status: string;
    level: string;
    subject: string;
    createdAt: string;
}

export default function SearchPage() {
    const [fiches, setFiches] = useState<Fiche[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState("recent");
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({
        query: "",
        level: "",
        subject: "",
        startDate: "",
        endDate: "",
    });
    const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>("");

    const subjectScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const dateRangeOptions = [
        { label: "Tout", startDate: "", endDate: "" },
        { label: "Aujourd'hui", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
        { label: "Cette semaine", startDate: new Date(Date.now() - new Date().getDay() * 86400000).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
        { label: "Ce mois", startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
        { label: "Cette année", startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] },
    ];

    const checkScrollability = useCallback(() => {
        const el = subjectScrollRef.current;
        if (el) {
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
        }
    }, []);

    useEffect(() => {
        checkScrollability();
        const el = subjectScrollRef.current;
        if (el) {
            el.addEventListener("scroll", checkScrollability);
            window.addEventListener("resize", checkScrollability);
            return () => {
                el.removeEventListener("scroll", checkScrollability);
                window.removeEventListener("resize", checkScrollability);
            };
        }
    }, [checkScrollability]);

    const scrollSubjects = (direction: "left" | "right") => {
        const el = subjectScrollRef.current;
        if (el) {
            el.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
        }
    };

    const fetchFilteredData = async () => {
        setLoading(true);
        setError(null);

        try {
            const queryString = new URLSearchParams({
                query: filters.query || "",
                level: filters.level || "",
                subject: filters.subject || "",
                startDate: filters.startDate || "",
                endDate: filters.endDate || "",
                page: pagination.page.toString(),
            }).toString();

            const response = await fetch(`/api/fiches/search?${queryString}`);
            const data = await response.json();

            if (!data.success) {
                setError("Erreur lors de la récupération des fiches.");
                return;
            }

            setFiches(data.data);
            setPagination((prev) => ({
                ...prev,
                totalPages: data.pagination.totalPages,
            }));
        } catch (err) {
            setError("Erreur lors de la récupération des données.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilteredData();
    }, [pagination.page]);

    const sortedFiches = [...fiches].sort((a, b) => {
        switch (sortBy) {
            case "popular": return b.likes - a.likes;
            case "comments": return b.comments - a.comments;
            case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "recent":
            default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const handleDateRangeChange = (value: string) => {
        const selectedOption = dateRangeOptions.find((option) => option.label === value);
        if (selectedOption) {
            setFilters((prev) => ({ ...prev, startDate: selectedOption.startDate, endDate: selectedOption.endDate }));
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubjectChipClick = (subject: string) => {
        if (activeSubjectFilter === subject) {
            setActiveSubjectFilter("");
            setFilters((prev) => ({ ...prev, subject: "" }));
        } else {
            setActiveSubjectFilter(subject);
            setFilters((prev) => ({ ...prev, subject }));
        }
        setPagination((prev) => ({ ...prev, page: 1 }));
        setTimeout(() => fetchFilteredData(), 0);
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setActiveSubjectFilter(filters.subject);
        fetchFilteredData();
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page }));
        }
    };

    const clearAllFilters = () => {
        setFilters({ query: "", level: "", subject: "", startDate: "", endDate: "" });
        setActiveSubjectFilter("");
        setPagination((prev) => ({ ...prev, page: 1 }));
        setTimeout(() => fetchFilteredData(), 0);
    };

    const hasActiveFilters = filters.query || filters.level || filters.subject || filters.startDate;

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <header className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 text-xs font-medium mb-4">
                                <FileText className="w-3.5 h-3.5" />
                                Ressources communautaires
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                                Fiches de révision
                            </h1>
                            <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
                                Découvrez et partagez des fiches de qualité pour réviser efficacement.
                            </p>
                        </div>
                        <Link href="/fiches/creer" className="shrink-0">
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                                <FiPlusCircle size={16} />
                                Déposer une fiche
                            </button>
                        </Link>
                    </div>

                    {/* Search bar */}
                    <div className="relative flex items-center max-w-2xl mt-8">
                        <MdSearch size={20} className="absolute left-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher une fiche..."
                            className="w-full pl-10 pr-28 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                            value={filters.query}
                            onChange={(e) => handleFilterChange("query", e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <div className="absolute right-2 flex items-center gap-1.5">
                            <button
                                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-orange-100 text-orange-500' : 'hover:bg-gray-100 text-gray-400'}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <SlidersHorizontal size={16} />
                            </button>
                            <button
                                className="px-4 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                                onClick={handleSearch}
                            >
                                Rechercher
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Subject chips */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto flex items-stretch">
                    {canScrollLeft && (
                        <button
                            type="button"
                            onClick={() => scrollSubjects("left")}
                            className="shrink-0 flex items-center justify-center w-10 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft size={18} className="text-gray-400" />
                        </button>
                    )}
                    <div
                        ref={subjectScrollRef}
                        className="flex-1 flex items-center gap-1.5 px-4 sm:px-6 py-2.5 overflow-x-auto min-w-0"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        <button
                            onClick={() => handleSubjectChipClick("")}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                !activeSubjectFilter
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            Toutes
                        </button>
                        {educationData.subjects.map((subject) => (
                            <button
                                key={subject}
                                onClick={() => handleSubjectChipClick(subject)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    activeSubjectFilter === subject
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <SubjectIcon
                                    subject={subject}
                                    size={12}
                                    className={activeSubjectFilter === subject ? "text-white" : "text-gray-400"}
                                />
                                <span className="whitespace-nowrap">{subject.length > 25 ? subject.split("(")[0].trim() : subject}</span>
                            </button>
                        ))}
                    </div>
                    {canScrollRight && (
                        <button
                            type="button"
                            onClick={() => scrollSubjects("right")}
                            className="shrink-0 flex items-center justify-center w-10 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronRight size={18} className="text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 pt-6">
                {/* Advanced filters */}
                {showFilters && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-gray-100 mb-5 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <SlidersHorizontal size={12} /> Filtres avancés
                            </span>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Select
                                value={filters.level || "all"}
                                onValueChange={(value) => handleFilterChange("level", value === "all" ? "" : value)}
                            >
                                <SelectTrigger className="h-10 rounded-xl text-sm text-black">
                                    <SelectValue placeholder="Tous les niveaux" className="text-black" />
                                </SelectTrigger>
                                <SelectContent className="text-black">
                                    <SelectItem value="all" className="text-black">Tous les niveaux</SelectItem>
                                    {educationData.levels.map((level) => (
                                        <SelectItem key={level} value={level} className="text-black">{level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.startDate && filters.endDate ? "Autre" : "Tout"}
                                onValueChange={handleDateRangeChange}
                            >
                                <SelectTrigger className="h-10 rounded-xl text-sm text-black">
                                    <SelectValue placeholder="Filtrer par date" className="text-black" />
                                </SelectTrigger>
                                <SelectContent className="text-black">
                                    {dateRangeOptions.map((option) => (
                                        <SelectItem key={option.label} value={option.label} className="text-black">{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    onClick={clearAllFilters}
                                    className="h-10 rounded-xl text-gray-600 gap-2 text-sm"
                                >
                                    <X size={14} /> Effacer
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Action bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {!loading && fiches.length > 0 && (
                            <span className="text-sm text-gray-500">
                                <span className="font-medium text-gray-800">{fiches.length}</span> fiche{fiches.length > 1 ? "s" : ""}
                            </span>
                        )}
                        {activeSubjectFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600">
                                <SubjectIcon subject={activeSubjectFilter} size={10} className="text-gray-500" />
                                {activeSubjectFilter.length > 20 ? activeSubjectFilter.split("(")[0].trim() : activeSubjectFilter}
                                <button onClick={() => handleSubjectChipClick("")} className="ml-0.5 hover:text-gray-900">
                                    <X size={10} />
                                </button>
                            </span>
                        )}
                        {filters.level && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600">
                                {filters.level}
                                <button onClick={() => { handleFilterChange("level", ""); handleSearch(); }} className="ml-0.5 hover:text-gray-900">
                                    <X size={10} />
                                </button>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5">
                            <ArrowUpDown size={12} className="text-gray-400" />
                            <select
                                className="text-xs bg-transparent outline-none text-gray-600 cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="recent">Récents</option>
                                <option value="popular">Populaires</option>
                                <option value="comments">Commentés</option>
                                <option value="oldest">Anciens</option>
                            </select>
                        </div>
                        <InfoDrawer />
                        <Link href="/fiches/favoris">
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                <FiBookmark size={12} />
                                <span className="hidden sm:inline">Favoris</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Cards grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                <div className="h-20 bg-gray-100" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-full" />
                                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                                    <div className="flex justify-between pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-gray-100 rounded-full" />
                                            <div className="h-3 w-14 bg-gray-100 rounded" />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="h-3 w-6 bg-gray-100 rounded" />
                                            <div className="h-3 w-6 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-16 text-red-500 text-sm">{error}</div>
                ) : fiches.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <MdSearch size={28} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Aucune fiche trouvée</h3>
                        <p className="text-sm text-gray-500 mb-5">Modifiez vos critères ou créez la première fiche</p>
                        <div className="flex items-center justify-center gap-3">
                            {hasActiveFilters && (
                                <button onClick={clearAllFilters} className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200">
                                    Effacer les filtres
                                </button>
                            )}
                            <Link href="/fiches/creer">
                                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                                    <FiPlusCircle size={14} />
                                    Créer une fiche
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedFiches.map((fiche) => {
                            const gradient = subjectGradients[fiche.subject] || "from-gray-500 to-gray-400";
                            return (
                                <Link
                                    key={fiche.id}
                                    href={`/fiches/${buildIdSlug(fiche.id, fiche.title)}`}
                                    className="group flex flex-col rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 overflow-hidden"
                                >
                                    {/* Colored header */}
                                    <div className={`relative bg-gradient-to-r ${gradient} px-4 py-4`}>
                                        <div className="flex items-center justify-between">
                                            <SubjectIcon subject={fiche.subject} size={20} className="text-white/90" />
                                            {fiche.status !== "Non Certifiée" && (
                                                <Image
                                                    src={`/badge/${fiche.status}.svg`}
                                                    alt={fiche.status}
                                                    width={22}
                                                    height={22}
                                                    className="drop-shadow-md"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white font-medium">
                                                {fiche.level}
                                            </span>
                                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white font-medium">
                                                {fiche.subject.length > 25 ? fiche.subject.split("(")[0].trim() : fiche.subject}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 flex flex-col">
                                        <h2 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-1.5">
                                            {fiche.title}
                                        </h2>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
                                            {fiche.content}
                                        </p>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <ProfileAvatar
                                                    username={fiche.authors?.username || "Inconnu"}
                                                    points={fiche.authors?.points || 0}
                                                    userId={fiche.authors?._id}
                                                    size="small"
                                                />
                                                <span className="text-xs text-gray-500 truncate">
                                                    {fiche.authors?.username || "Inconnu"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                                                <span className="inline-flex items-center gap-1">
                                                    <PiFireSimpleFill className="text-orange-400" size={12} />
                                                    {fiche.likes}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <MdInsertComment className="text-blue-400" size={12} />
                                                    {fiche.comments}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {fiches.length > 0 && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-10 pt-8 border-t border-gray-100">
                        <button
                            onClick={() => pagination.page > 1 && handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Précédent</span>
                        </button>

                        <div className="flex items-center gap-1 px-2">
                            {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                                let pageNum: number;
                                if (pagination.totalPages <= 5) {
                                    pageNum = index + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = index + 1;
                                } else if (pagination.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + index;
                                } else {
                                    pageNum = pagination.page - 2 + index;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                            pageNum === pagination.page
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => pagination.page < pagination.totalPages && handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="hidden sm:inline">Suivant</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
