"use client";

import React, { useEffect, useState } from "react";
import CourseCard from "./_components/CourseCard";
import SubjectFilter from "./_components/SubjectFilter";
import SearchBar from "./_components/SearchBar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
    _id: string;
    title: string;
    description: string;
    matiere: string;
    niveau: string;
    image?: string;
    sections: { _id: string; title: string }[];
    authors: { _id: string; username: string; image?: string }[];
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCourses = async (currentPage: number) => {
        setIsLoading(true);

        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (selectedSubject) params.append("matiere", selectedSubject);
            if (selectedClass) params.append("niveau", selectedClass);
            params.append("page", currentPage.toString());
            params.append("limit", "30");

            const response = await fetch(`/api/cours?${params.toString()}`, { cache: "no-store" });
            const data = await response.json();

            setCourses(data.courses);
            setTotalPages(Math.ceil(data.total / 6));
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

    // Styles for the grain effect sections
    const grainSectionStyle = {
        backgroundImage: `url(/noise.webp)`,
        backgroundSize: "30%",
        backgroundBlendMode: 'overlay',
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white text-gray-800">
            {/* Header with grain effect */}
            <div
                className="py-8 mb-6 bg-gradient-to-r from-orange-100 to-orange-50"
                style={grainSectionStyle}
            >
                <div className="container mx-auto">
                    <h1 className="text-3xl font-bold text-orange-600 mb-2">Découvrez nos cours</h1>
                    <p className="text-gray-600">Explorez notre bibliothèque et trouvez les meilleurs ressources pédagogiques</p>
                </div>
            </div>

            <div className="container mx-auto pb-10">
                {/* Filtres et recherche */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm mb-8 border border-orange-100">
                    <SearchBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedClass={selectedClass}
                        onSelectClass={setSelectedClass}
                    />
                    <SubjectFilter selectedSubject={selectedSubject} onSelectSubject={setSelectedSubject} />
                </div>

                {/* Liste des cours (avec Skeleton si isLoading) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {isLoading
                        ? // Affichage du Skeleton quand les données chargent
                        [...Array(6)].map((_, index) => (
                            <div key={index} className="shadow-md rounded-lg p-4 bg-white animate-pulse border border-orange-50">
                                {/* Image */}
                                <Skeleton className="h-40 w-full rounded-lg mb-4" />

                                {/* Titre */}
                                <Skeleton className="h-6 w-3/4 mb-2" />

                                {/* Badges */}
                                <div className="flex gap-2 mb-3">
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                    <Skeleton className="h-4 w-12 rounded-md" />
                                </div>

                                {/* Description */}
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-4 w-5/6 mb-1" />
                                <Skeleton className="h-4 w-3/4 mb-3" />

                                {/* Profil auteur */}
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 w-1/3" />
                                </div>

                                {/* Bouton */}
                                <Skeleton className="h-10 w-full mt-4 rounded-md" />
                            </div>
                        ))
                        : // Affichage des cours une fois chargés
                        courses.map(course => (
                            <CourseCard key={course._id} course={course} />
                        ))}
                </div>

                {/* Section de pagination avec effet grain */}
                {totalPages > 1 && (
                    <div
                        className="flex justify-center mt-8 py-6 rounded-lg"
                        style={grainSectionStyle}
                    >
                        <Pagination>
                            <PaginationContent>
                                {/* Précédent */}
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={page > 1 ? () => fetchCourses(page - 1) : undefined}
                                        aria-disabled={page <= 1}
                                        className={`${page <= 1 ? "pointer-events-none opacity-50" : ""} bg-white border border-orange-200 hover:bg-orange-50`}
                                    />
                                </PaginationItem>

                                {/* Numéros de page */}
                                {[...Array(totalPages)].map((_, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            isActive={page === index + 1}
                                            onClick={() => fetchCourses(index + 1)}
                                            className={`${page === index + 1 ? "bg-orange-500 text-white" : "bg-white text-gray-700 hover:bg-orange-50"} border border-orange-200`}
                                        >
                                            {index + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                                {/* Suivant */}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={page < totalPages ? () => fetchCourses(page + 1) : undefined}
                                        aria-disabled={page >= totalPages}
                                        className={`${page >= totalPages ? "pointer-events-none opacity-50" : ""} bg-white border border-orange-200 hover:bg-orange-50`}
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