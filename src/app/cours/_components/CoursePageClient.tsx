"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./../_components/SidebarCours";
import { Course, Lesson, Section, Exercise } from "./../_components/types";
import ExerciseCard from "./../_components/ExerciseCard";
import LessonView from "./../_components/LessonView";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

// Noise component for subtle grain
const Noise = ({ opacity = 0.05, scale = 1.5 }) => (
    <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
            backgroundImage: "url(/noise.webp)",
            backgroundSize: "30%",
            opacity,
            transform: `scale(${scale})`,
            mixBlendMode: "overlay",
        }}
    />
);

// Orange gradient wrapper
const OrangeGradient: React.FC<{ className?: string; children?: React.ReactNode }> = ({
                                                                                          className = "",
                                                                                          children,
                                                                                      }) => (
    <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-100 to-orange-50 opacity-80" />
        <Noise opacity={0.07} />
        <div className="relative z-10">{children}</div>
    </div>
);

// Skeleton pendant le chargement
function LoadingSkeleton() {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 overflow-x-hidden">
            <div className="w-full md:w-72 lg:w-80 p-4 bg-orange-50">
                <Skeleton className="h-6 w-3/4 mb-4" />
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full mb-3" />
                ))}
            </div>
            <main className="flex-1 p-4 md:p-6 bg-gradient-to-br from-white to-orange-50">
                <Skeleton className="h-8 w-full md:w-1/2 mb-4" />
                <Skeleton className="h-4 w-1/2 md:w-1/4 mb-6" />
                <Skeleton className="h-10 w-1/3 md:w-1/5 mb-6" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            </main>
        </div>
    );
}

// Message d'erreur
function ErrorMessage({ error }: { error: string | null }) {
    return (
        <div className="p-6 text-red-500 bg-red-50 rounded-lg border border-red-200 m-4">
            Erreur : {error || "Cours introuvable"}
        </div>
    );
}

// Vue d'un contenu sélectionné
function ContentView({ content, onBack }: { content: any; onBack: () => void }) {
    return (
        <>
            <button
                onClick={onBack}
                className="mb-6 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full flex items-center text-sm font-medium shadow-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
            </button>
            {"exercises" in content ? (
                <ExerciseList exercises={content.exercises} title={content.title} />
            ) : "content" in content ? (
                <LessonView title={content.title} content={content.content || ""} />
            ) : (
                <p className="text-gray-600">Aucun contenu disponible.</p>
            )}
        </>
    );
}

// Liste d'exercices
function ExerciseList({ exercises, title }: { exercises: Exercise[]; title: string }) {
    return (
        <>
            <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">{title}</h1>
            <div className="flex flex-col space-y-6">
                {exercises.map((ex, idx) => (
                    <div key={ex._id} className="relative overflow-hidden rounded-xl">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 to-amber-500" />
                        <ExerciseCard exercise={{ ...ex, content: ex.content || "" }} index={idx} />
                    </div>
                ))}
            </div>
        </>
    );
}

// Aperçu du cours
function CourseOverview({ cours }: { cours: Course }) {
    return (
        <>
            <CourseHeader cours={cours} />
            <Instruction />
        </>
    );
}

// En-tête de l'aperçu
function CourseHeader({ cours }: { cours: Course }) {
    return (
        <div className="relative overflow-hidden bg-white border border-orange-100 rounded-xl shadow-md mb-8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{cours.title}</h1>
                <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <div className="border-t border-orange-100 bg-orange-50/50 p-6 md:p-8 relative">
                <Noise opacity={0.04} />
                <div className="prose prose-sm md:prose-base text-gray-700 max-w-full overflow-hidden prose-headings:text-orange-800 prose-a:text-orange-600">
                    <ReactMarkdown className="break-words">{cours.description}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}

// Bloc d'instructions
function Instruction() {
    return (
        <OrangeGradient className="rounded-xl border border-orange-100 shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white mb-4 shadow-md">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <p className="text-base md:text-lg text-gray-800 font-medium">
                Sélectionnez une leçon ou un exercice dans le sommaire pour voir son contenu.
            </p>
            <p className="text-sm mt-2 text-gray-600">
                Naviguez entre les leçons et les exercices pour avancer dans votre cours.
            </p>
        </OrangeGradient>
    );
}

// SidebarWrapper : on passe la fermeture automatique dans le onSelect
export function SidebarWrapper({
                                   course,
                                   onSelectContent,
                               }: {
    course: Course;
    onSelectContent: (content: any) => void;
}) {
    return (
        <div className="h-full flex flex-col overflow-hidden sidebar-wrapper">
            <div className="flex-shrink-0 p-6 pb-4 relative">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    Sommaire du cours
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-2" />
                </h2>
                <div className="h-1 w-28 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full mt-3" />
            </div>
            <div className="flex-grow relative overflow-hidden sidebar">
                <Sidebar
                    course={course}
                    onSelectContent={(c) => {
                        onSelectContent(c);       // sélectionne
                    }}
                />
            </div>
        </div>
    );
}

// Bouton flottant pour afficher la sidebar (visible uniquement sur mobile)
function FloatingMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="fixed z-50 left-4 top-1/2 transform -translate-y-1/2 p-3 bg-orange-500 text-white rounded-full shadow-lg md:hidden flex items-center justify-center hover:bg-orange-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
            aria-label="Afficher menu"
        >
            <ChevronRight className="w-5 h-5" />
        </button>
    );
}

export default function CoursePage({ params }: { params: { coursId: string } }) {
    const [cours, setCours] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedContent, setSelectedContent] = useState<Lesson | Exercise | Section | null>(null);

    // contrôle mobile de l'affichage de la sidebar
    const [showSidebar, setShowSidebar] = useState(true);

    // Injection CSS globale pour un seul scroll
    useEffect(() => {
        const styleTag = document.createElement("style");
        styleTag.innerHTML = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #__next, .root-container { width:100%; height:100%; margin:0; padding:0; overflow:hidden !important; }
  main { height:100%; flex:1; overflow-y:auto; overflow-x:hidden; }
  img { max-width:100%; height:auto; }
`;
        document.head.appendChild(styleTag);
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);
    // Fetch
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cours/${params.coursId}`, {
                    cache: "no-store",
                });
                if (!res.ok) throw new Error("Cours introuvable");
                const data = await res.json();
                setCours(data.cours);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourse();
    }, [params.coursId]);

    if (isLoading) return <LoadingSkeleton />;
    if (error || !cours) return <ErrorMessage error={error} />;

    return (
        <div className="root-container flex h-screen bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
            <Noise opacity={0.03} />

            {/* Sidebar desktop + mobile */}
            <div
                className={`sticky top-0 z-40 w-full md:w-72 lg:w-80 bg-white/80 border-b border-orange-100 md:border-b-0 md:border-r ${
                    showSidebar ? "block" : "hidden md:block"
                }`}
            >
                <OrangeGradient className="h-full">
                    {/* bouton fermer mobile */}
                    <div className="flex justify-end p-3 md:hidden">
                        <button
                            onClick={() => setShowSidebar(false)}
                            aria-label="Cacher menu"
                            className="text-orange-500"
                        >
                            <ChevronLeft />
                        </button>
                    </div>
                    <SidebarWrapper
                        course={cours}
                        onSelectContent={(c) => {
                            setSelectedContent(c);
                            setShowSidebar(false); // masque sur mobile à la sélection
                        }}
                    />
                </OrangeGradient>
            </div>

            {/* Main — seul conteneur scrollable */}
            <main className="flex-1 relative h-full overflow-y-auto p-4 md:p-8 bg-white/70 rounded-tl-2xl">
                {selectedContent ? (
                    <ContentView content={selectedContent} onBack={() => setSelectedContent(null)} />
                ) : (
                    <CourseOverview cours={cours} />
                )}
            </main>

            {/* Bouton flottant toujours visible lors du défilement (uniquement sur mobile) */}
            {!showSidebar && (
                <FloatingMenuButton onClick={() => setShowSidebar(true)} />
            )}
        </div>
    );
}