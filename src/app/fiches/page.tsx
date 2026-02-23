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
import { MdSearch, MdInsertComment, MdInfoOutline, MdClose } from "react-icons/md";
import { FiPlusCircle, FiBookmark } from "react-icons/fi";
import { SlidersHorizontal, ArrowUpDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import SubjectIcon from "@/components/fiches/SubjectIcon";
import InfoDrawer from "@/app/fiches/_components/InfoDrawer";
import { educationData, subjectColors, levelColors, subjectGradients } from "@/data/educationData";

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
            case "popular":
                return b.likes - a.likes;
            case "comments":
                return b.comments - a.comments;
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "recent":
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const handleDateRangeChange = (value: string) => {
        const selectedOption = dateRangeOptions.find((option) => option.label === value);
        if (selectedOption) {
            setFilters((prev) => ({
                ...prev,
                startDate: selectedOption.startDate,
                endDate: selectedOption.endDate,
            }));
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
        // Trigger search after state update
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

    const headerStyle = {
        backgroundImage: `linear-gradient(135deg, #FF8C42 0%, #FF5E78 50%, #FF4B6E 100%), url(/noise.webp)`,
        backgroundSize: "cover, 2%",
        backgroundBlendMode: "overlay",
    };

    const SkeletonCard = () => (
        <div className="flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
            <div className="h-24 bg-gray-200"></div>
            <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-3 w-8 bg-gray-200 rounded"></div>
                        <div className="h-3 w-8 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div
                className="pt-14 pb-8 px-4 sm:px-6 rounded-b-[2rem] shadow-lg mb-0"
                style={headerStyle}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white">Fiches de révision</h1>
                            <p className="text-white/80 text-base sm:text-lg mt-1">Découvrez et partagez des fiches de qualité</p>
                        </div>
                        <Link href="/fiches/creer" className="shrink-0">
                            <Button className="flex items-center gap-2 py-2.5 px-5 bg-white text-orange-500 hover:bg-orange-50 transition-all shadow-md rounded-full font-medium">
                                <FiPlusCircle size={18} />
                                <span className="hidden sm:inline">Déposer une fiche</span>
                                <span className="sm:hidden">Créer</span>
                            </Button>
                        </Link>
                    </div>

                    {/* Barre de recherche */}
                    <div className="relative flex items-center max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden mt-4">
                        <MdSearch size={22} className="text-gray-400 ml-4 sm:ml-5 shrink-0" />
                        <input
                            type="text"
                            placeholder="Rechercher une fiche..."
                            className="w-full py-3.5 sm:py-4 px-3 sm:px-4 outline-none text-base"
                            value={filters.query}
                            onChange={(e) => handleFilterChange("query", e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <div className="flex items-center gap-1.5 pr-2 sm:pr-3 shrink-0">
                            <Button
                                variant="ghost"
                                className={`rounded-full p-2 sm:p-2.5 transition-colors ${showFilters ? 'bg-orange-100 text-orange-500' : 'hover:bg-gray-100 text-gray-500'}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <SlidersHorizontal size={18} />
                            </Button>
                            <Button
                                className="rounded-full px-4 sm:px-5 py-2 bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 transition-opacity text-white text-sm sm:text-base"
                                onClick={handleSearch}
                            >
                                <span className="hidden sm:inline">Rechercher</span>
                                <MdSearch size={18} className="sm:hidden" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barre de navigation par matière - chips scrollables */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-stretch">
                    {/* Flèche gauche - en dehors de la zone scrollable pour ne pas intercepter les clics */}
                    {canScrollLeft && (
                        <button
                            type="button"
                            onClick={() => scrollSubjects("left")}
                            className="shrink-0 flex items-center justify-center w-10 bg-white border-r border-gray-100 hover:bg-gray-50 transition-colors"
                            aria-label="Défiler vers la gauche"
                        >
                            <ChevronLeft size={20} className="text-gray-500" />
                        </button>
                    )}

                    <div
                        ref={subjectScrollRef}
                        className="flex-1 flex items-center gap-2 px-4 sm:px-6 py-3 overflow-x-auto scrollbar-hide min-w-0"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {/* Chip "Toutes" */}
                        <button
                            onClick={() => handleSubjectChipClick("")}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                !activeSubjectFilter
                                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Toutes
                        </button>

                        {educationData.subjects.map((subject) => (
                            <button
                                key={subject}
                                onClick={() => handleSubjectChipClick(subject)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    activeSubjectFilter === subject
                                        ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                <SubjectIcon
                                    subject={subject}
                                    size={14}
                                    className={activeSubjectFilter === subject ? "text-white" : "text-gray-500"}
                                />
                                <span className="whitespace-nowrap">{subject.length > 25 ? subject.split("(")[0].trim() : subject}</span>
                            </button>
                        ))}
                    </div>

                    {/* Flèche droite - en dehors de la zone scrollable pour ne pas intercepter les clics */}
                    {canScrollRight && (
                        <button
                            type="button"
                            onClick={() => scrollSubjects("right")}
                            className="shrink-0 flex items-center justify-center w-10 bg-white border-l border-gray-100 hover:bg-gray-50 transition-colors"
                            aria-label="Défiler vers la droite"
                        >
                            <ChevronRight size={20} className="text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 pt-4">
                {/* Filtres avancés */}
                {showFilters && (
                    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm mb-4 border border-gray-100 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <SlidersHorizontal size={14} />
                                Filtres avancés
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Select
                                value={filters.level || "all"}
                                onValueChange={(value) => handleFilterChange("level", value === "all" ? "" : value)}
                            >
                                <SelectTrigger className="h-11 rounded-xl text-black">
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
                                <SelectTrigger className="h-11 rounded-xl text-black">
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
                                    className="h-11 rounded-xl text-gray-600 gap-2"
                                >
                                    <X size={14} /> Effacer les filtres
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Barre d'actions : résultats + tri + favoris */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {!loading && fiches.length > 0 && (
                            <span className="text-gray-600 font-medium text-sm">
                                {fiches.length} fiche{fiches.length > 1 ? "s" : ""} trouvée{fiches.length > 1 ? "s" : ""}
                            </span>
                        )}
                        {/* Filtres actifs */}
                        {activeSubjectFilter && (
                            <Badge className="bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1 pr-1">
                                <SubjectIcon subject={activeSubjectFilter} size={12} className="text-orange-500" />
                                {activeSubjectFilter.length > 20 ? activeSubjectFilter.split("(")[0].trim() : activeSubjectFilter}
                                <button onClick={() => handleSubjectChipClick("")} className="ml-1 p-0.5 rounded-full hover:bg-orange-100">
                                    <X size={12} />
                                </button>
                            </Badge>
                        )}
                        {filters.level && (
                            <Badge className="bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1 pr-1">
                                {filters.level}
                                <button onClick={() => { handleFilterChange("level", ""); handleSearch(); }} className="ml-1 p-0.5 rounded-full hover:bg-blue-100">
                                    <X size={12} />
                                </button>
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {/* Tri */}
                        <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200 px-2.5 py-1.5">
                            <ArrowUpDown size={14} className="text-gray-400" />
                            <select
                                className="text-sm bg-transparent outline-none text-gray-700 cursor-pointer"
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
                            <Button variant="outline" className="rounded-xl flex items-center gap-1.5 text-sm px-3">
                                <FiBookmark size={14} />
                                <span className="hidden sm:inline">Mes favoris</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Grille de fiches */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {[...Array(6)].map((_, index) => (
                            <SkeletonCard key={index} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
                        <p>{error}</p>
                    </div>
                ) : fiches.length === 0 ? (
                    <div className="text-center py-16 sm:py-20">
                        <div className="text-gray-300 mb-4">
                            <MdSearch size={56} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-700 mb-2">Aucune fiche trouvée</h3>
                        <p className="text-gray-500 mb-6">Essayez de modifier vos critères de recherche</p>
                        {hasActiveFilters && (
                            <Button onClick={clearAllFilters} variant="outline" className="rounded-full px-6 mb-4">
                                <X size={14} className="mr-2" /> Effacer les filtres
                            </Button>
                        )}
                        <div>
                            <Link href="/fiches/creer">
                                <Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-6">
                                    <FiPlusCircle size={16} className="mr-2" />
                                    Créer la première fiche
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {sortedFiches.map((fiche) => {
                            const gradient = subjectGradients[fiche.subject] || "from-gray-500 to-gray-400";

                            return (
                                <div
                                    key={fiche.id}
                                    className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                                >
                                    {/* En-tête coloré par matière */}
                                    <div className={`relative bg-gradient-to-r ${gradient} p-4 pb-6`}>
                                        <SubjectIcon subject={fiche.subject} size={24} className="text-white/90" />

                                        {fiche.status !== "Non Certifiée" && (
                                            <div className="absolute top-3 right-3">
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Image
                                                            src={`/badge/${fiche.status}.svg`}
                                                            alt={`Statut: ${fiche.status}`}
                                                            width={28}
                                                            height={28}
                                                            className="drop-shadow-md cursor-pointer"
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="flex items-center gap-2">
                                                            <MdInfoOutline size={16} className="text-blue-500" />
                                                            <span>Fiche <strong>{fiche.status}</strong></span>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-0.5 rounded-full">
                                                {fiche.level}
                                            </Badge>
                                            <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-0.5 rounded-full">
                                                {fiche.subject.length > 25 ? fiche.subject.split("(")[0].trim() : fiche.subject}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1 p-4 flex flex-col">
                                        <Link href={`/fiches/${fiche.id}`} className="flex-1">
                                            <h2 className="text-base font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                                                {fiche.title}
                                            </h2>
                                            <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                                                {fiche.content}
                                            </p>
                                        </Link>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <Link href={`/compte/${fiche.authors?._id}`} className="flex items-center gap-2 min-w-0">
                                                <ProfileAvatar
                                                    username={fiche.authors?.username || "Inconnu"}
                                                    points={fiche.authors?.points || 0}
                                                    userId={fiche.authors?._id}
                                                    size="small"
                                                />
                                                <span className="text-xs text-gray-600 truncate">
                                                    {fiche.authors?.username || "Inconnu"}
                                                </span>
                                            </Link>

                                            <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <PiFireSimpleFill className="text-orange-400" size={14} />
                                                    <span>{fiche.likes}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MdInsertComment className="text-blue-400" size={14} />
                                                    <span>{fiche.comments}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {fiches.length > 0 && pagination.totalPages > 1 && (
                    <div className="mt-10">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={pagination.page > 1 ? "#" : undefined}
                                        onClick={pagination.page > 1 ? () => handlePageChange(pagination.page - 1) : undefined}
                                        className={pagination.page === 1 ? "opacity-50 pointer-events-none" : ""}
                                    />
                                </PaginationItem>
                                {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                                    // Afficher les pages intelligemment
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
                                        <PaginationItem key={pageNum}>
                                            <PaginationLink
                                                href="#"
                                                isActive={pageNum === pagination.page}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={pageNum === pagination.page
                                                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl"
                                                    : "rounded-xl"}
                                            >
                                                {pageNum}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                                <PaginationItem>
                                    <PaginationNext
                                        href={pagination.page < pagination.totalPages ? "#" : undefined}
                                        onClick={pagination.page < pagination.totalPages ? () => handlePageChange(pagination.page + 1) : undefined}
                                        className={pagination.page === pagination.totalPages ? "opacity-50 pointer-events-none" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    );
}
