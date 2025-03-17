"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./../_components/SidebarCours";
import { Course, Lesson, Section, Exercise } from "./../_components/types";
import ExerciseCard from "./../_components/ExerciseCard";
import LessonView from "./../_components/LessonView";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, GraduationCap } from "lucide-react";
import ReactMarkdown from "react-markdown";


interface CoursePageProps {
    params: { coursId: string };
}

export default function CoursePage({ params }: CoursePageProps) {
    const [cours, setCours] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedContent, setSelectedContent] = useState<Lesson | Exercise | Section | null>(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/cours/${params.coursId}`,
                    { cache: "no-store" }
                );

                if (!res.ok) {
                    throw new Error("Cours introuvable");
                }

                const data = await res.json();
                setCours(data?.cours);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourse();
    }, [params.coursId]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen">
                {/* ✅ Sidebar Skeleton */}
                <div className="w-1/4 p-4 bg-gray-100 border-r">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full mb-3" />
                    ))}
                </div>

                {/* ✅ Main Content Skeleton */}
                <main className="flex-1 p-6 bg-white shadow-md rounded-lg">
                    <Skeleton className="h-8 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-1/4 mb-6" />

                    <Skeleton className="h-10 w-1/5 mb-6" />

                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (error || !cours) {
        return <div className="p-4 text-red-500">Erreur : {error || "Cours introuvable"}</div>;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar course={cours} onSelectContent={setSelectedContent} />

            <main className="flex-1 p-6 bg-white shadow-md rounded-lg">
                {selectedContent ? (
                    <>
                        <button
                            onClick={() => setSelectedContent(null)}
                            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            ← Retour
                        </button>

                        {/* ✅ Gestion des exercices sous forme de cartes */}
                        {"exercises" in selectedContent ? (
                            <>
                                <h1 className="text-2xl font-bold mb-3">Exercices de {selectedContent.title}</h1>
                                <div className="flex flex-col space-y-6">
                                    {selectedContent.exercises?.map((exercise, index) => (
                                        <ExerciseCard
                                            key={exercise._id}
                                            exercise={{ ...exercise, content: exercise.content || "" }}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* ✅ Utilisation de `LessonView` pour afficher le contenu des leçons */}
                                {"content" in selectedContent ? (
                                    <LessonView
                                        title={selectedContent.title}
                                        content={selectedContent.content || ""}
                                    />
                                ) : (
                                    <p className="text-gray-600">Aucun contenu disponible.</p>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {/* ✅ En-tête amélioré */}
                        <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">{cours.title}</h1>
                            <div className="flex items-center gap-4 mt-3">
                                <Badge className="flex items-center bg-blue-500 text-white">
                                    <BookOpen className="w-4 h-4 mr-1" />
                                    {cours.matiere}
                                </Badge>
                                <Badge className="flex items-center bg-green-500 text-white">
                                    <GraduationCap className="w-4 h-4 mr-1" />
                                    {cours.niveau}
                                </Badge>
                            </div>
                            <div className="prose prose-lg text-gray-700 mt-3">
                                <ReactMarkdown>{cours.description}</ReactMarkdown>
                            </div>
                        </div>

                        {/* ✅ Message d’instruction */}
                        <p className="text-lg text-gray-600 text-center mt-6">
                            Sélectionnez une leçon ou un exercice pour voir son contenu.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}
