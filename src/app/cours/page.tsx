"use client";

import React, { useEffect, useState } from "react";
import CourseCard from "./_components/CourseCard";
import SubjectFilter from "./_components/SubjectFilter";
import SearchBar from "./_components/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseListing } from "./_components/types";
import { BookOpen, ChevronLeft, ChevronRight, Filter, X, GraduationCap } from "lucide-react";
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
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <header className="border-b border-gray-100">
                <div className="max-w-[1400px] mx-auto px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium mb-4">
                            <GraduationCap className="w-3.5 h-3.5" />
                            Bibliothèque pédagogique
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                            Découvrez nos cours
                        </h1>
                        <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
                            Explorez notre bibliothèque de ressources pédagogiques structurées
                            et trouvez les cours adaptés à votre niveau.
                        </p>
                    </div>
                </div>
            </header>

            {/* Filters + content */}
            <main className="max-w-[1400px] mx-auto px-6 py-8 sm:py-12">
                {/* Filter bar */}
                <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-4 sm:p-5 mb-8">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="flex-1">
                            <SearchBar
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                selectedClass={selectedClass}
                                onSelectClass={setSelectedClass}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <SubjectFilter
                                selectedSubject={selectedSubject}
                                onSelectSubject={setSelectedSubject}
                            />
                        </div>
                    </div>

                    {/* Active filters */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200/60">
                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                <Filter className="w-3 h-3" />
                                Filtres :
                            </span>

                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-gray-700 border border-gray-200">
                                    {searchQuery.length > 20 ? searchQuery.substring(0, 20) + "..." : searchQuery}
                                    <button onClick={() => setSearchQuery("")} className="hover:text-orange-500 ml-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}

                            {selectedSubject && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-gray-700 border border-gray-200">
                                    {selectedSubject}
                                    <button onClick={() => setSelectedSubject("")} className="hover:text-orange-500 ml-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}

                            {selectedClass && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-gray-700 border border-gray-200">
                                    {selectedClass}
                                    <button onClick={() => setSelectedClass("")} className="hover:text-orange-500 ml-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}

                            <button
                                onClick={() => { setSearchQuery(""); setSelectedSubject(""); setSelectedClass(""); }}
                                className="text-xs text-orange-500 hover:text-orange-600 font-medium ml-auto"
                            >
                                Tout effacer
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {!isLoading && (
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-800">{totalCourses}</span> cours disponibles
                        </p>
                    </div>
                )}

                {/* Course grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
                    {isLoading
                        ? [...Array(8)].map((_, index) => (
                            <div key={index} className="rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                                <Skeleton className="h-40 w-full" />
                                <div className="p-4 space-y-3 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-5 w-14 rounded-full" />
                                        <Skeleton className="h-5 w-10 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))
                        : courses.map(course => (
                            <CourseCard key={course._id} course={course} />
                        ))}
                </div>

                {/* Empty state */}
                {!isLoading && courses.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-7 h-7 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Aucun cours trouve</h3>
                        <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
                            Modifiez vos critères de recherche ou réinitialisez les filtres.
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={() => { setSearchQuery(""); setSelectedSubject(""); setSelectedClass(""); }}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-12 pt-8 border-t border-gray-100">
                        <button
                            onClick={() => fetchCourses(page - 1)}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Précédent
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
                                            onClick={() => fetchCourses(p)}
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
                            onClick={() => fetchCourses(page + 1)}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
