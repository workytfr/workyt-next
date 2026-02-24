"use client";

import React, { useEffect, useState } from "react";
import CourseCard from "./_components/CourseCard";
import SubjectFilter from "./_components/SubjectFilter";
import SearchBar from "./_components/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseListing } from "./_components/types";
import { BookOpen, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import "@/app/cours/_components/styles/notion-theme.css";

export default function CoursesPage() {
    const [courses, setCourses] = useState<CourseListing[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCourses, setTotalCourses] = useState(0);

    const fetchCourses = async (currentPage: number) => {
        setIsLoading(true);

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (selectedSubject) params.append("matiere", selectedSubject);
            if (selectedClass) params.append("niveau", selectedClass);
            params.append("page", currentPage.toString());
            const pageLimit = 12;
            params.append("limit", pageLimit.toString());

            const response = await fetch(`/api/cours?${params.toString()}`, { cache: "no-store" });
            const data = await response.json();

            setCourses(data.courses);
            setTotalCourses(data.total || 0);
            setTotalPages(Math.ceil(data.total / pageLimit));
            setPage(currentPage);
        } catch (error) {
            console.error("Erreur lors de la récupération des cours :", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses(1);
    }, [searchQuery, selectedSubject, selectedClass]);

    const hasActiveFilters = searchQuery || selectedSubject || selectedClass;

    return (
        <div className="notion-layout notion-animate-fade-in min-h-screen">
            {/* Header minimaliste */}
            <header className="bg-white">
                <div className="notion-container-wide py-16 md:py-20">
                    <div className="max-w-2xl">
                        <h1 className="notion-title-large mb-5">
                            Découvrez nos cours
                        </h1>
                        <p className="notion-subtitle text-lg">
                            Explorez notre bibliothèque de ressources pédagogiques structurées 
                            et trouvez les cours adaptés à votre niveau.
                        </p>
                    </div>
                </div>
            </header>

            {/* Filtres et contenu */}
            <main className="notion-container-wide py-12 md:py-16 overflow-x-hidden">
                {/* Barre de filtres */}
                <div className="bg-[#f7f6f3] rounded-2xl p-4 md:p-5 mb-8 md:mb-12">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Recherche */}
                        <div className="flex-1">
                            <SearchBar
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                selectedClass={selectedClass}
                                onSelectClass={setSelectedClass}
                            />
                        </div>
                        
                        {/* Filtres */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <SubjectFilter 
                                selectedSubject={selectedSubject} 
                                onSelectSubject={setSelectedSubject} 
                            />
                        </div>
                    </div>

                    {/* Filtres actifs */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#e3e2e0]">
                            <span className="text-xs text-[#9ca3af] font-medium flex items-center gap-1">
                                <Filter className="w-3 h-3" />
                                Filtres actifs :
                            </span>
                            
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs text-[#37352f] border border-[#e3e2e0]">
                                    Recherche: {searchQuery.length > 20 ? searchQuery.substring(0, 20) + "..." : searchQuery}
                                    <button 
                                        onClick={() => setSearchQuery("")}
                                        className="hover:text-[#f97316]"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            
                            {selectedSubject && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs text-[#37352f] border border-[#e3e2e0]">
                                    Matière: {selectedSubject}
                                    <button 
                                        onClick={() => setSelectedSubject("")}
                                        className="hover:text-[#f97316]"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            
                            {selectedClass && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs text-[#37352f] border border-[#e3e2e0]">
                                    Classe: {selectedClass}
                                    <button 
                                        onClick={() => setSelectedClass("")}
                                        className="hover:text-[#f97316]"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedSubject("");
                                    setSelectedClass("");
                                }}
                                className="text-xs text-[#f97316] hover:text-[#ea580c] font-medium ml-auto"
                            >
                                Tout effacer
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {!isLoading && (
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-[#6b6b6b]">
                            <span className="font-medium text-[#37352f]">{totalCourses}</span> cours disponibles
                        </p>
                    </div>
                )}

                {/* Grille des cours - même hauteur */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                    {isLoading
                        ? // Skeletons
                        [...Array(8)].map((_, index) => (
                            <div key={index} className="notion-card p-0 rounded-3xl overflow-hidden flex flex-col h-full">
                                <Skeleton className="h-44 w-full flex-shrink-0" />
                                <div className="p-5 flex flex-col flex-grow space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                        <Skeleton className="h-6 w-12 rounded-full" />
                                    </div>
                                    <div className="mt-auto pt-4">
                                        <Skeleton className="h-8 w-full" />
                                    </div>
                                </div>
                            </div>
                        ))
                        : // Cours
                        courses.map(course => (
                            <CourseCard key={course._id} course={course} />
                        ))}
                </div>

                {/* État vide */}
                {!isLoading && courses.length === 0 && (
                    <div className="notion-empty py-16">
                        <BookOpen className="notion-empty-icon w-16 h-16" />
                        <h3 className="notion-empty-title text-lg">Aucun cours trouvé</h3>
                        <p className="notion-empty-text max-w-md mx-auto">
                            Essayez de modifier vos critères de recherche ou réinitialisez les filtres.
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedSubject("");
                                    setSelectedClass("");
                                }}
                                className="mt-4 px-6 py-2.5 bg-[#f97316] text-white rounded-full text-sm font-medium hover:bg-[#ea580c] transition-colors"
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-[#e3e2e0]">
                        <button
                            onClick={() => fetchCourses(page - 1)}
                            disabled={page <= 1}
                            className="notion-button notion-button-ghost disabled:opacity-40 disabled:cursor-not-allowed rounded-full"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Précédent
                        </button>

                        <div className="flex items-center gap-1 px-4">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && (
                                            <span className="px-2 text-[#9ca3af]">...</span>
                                        )}
                                        <button
                                            onClick={() => fetchCourses(p)}
                                            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                                                page === p
                                                    ? "bg-[#37352f] text-white"
                                                    : "text-[#6b6b6b] hover:bg-[#f1f1ef]"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}
                        </div>

                        <button
                            onClick={() => fetchCourses(page + 1)}
                            disabled={page >= totalPages}
                            className="notion-button notion-button-ghost disabled:opacity-40 disabled:cursor-not-allowed rounded-full"
                        >
                            Suivant
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
