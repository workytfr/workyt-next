"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./../_components/SidebarCours";
import { Course, Lesson, Section, Exercise } from "./../_components/types";
import ExerciseCard from "./../_components/ExerciseCard";
import LessonView from "./../_components/LessonView";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, GraduationCap, Menu, X, ArrowLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Enhanced Noise component for grain effect
const Noise = ({ opacity = 0.05, scale = 1.5 }) => (
    <div
        className="absolute inset-0 w-full h-full transform pointer-events-none"
        style={{
            backgroundImage: "url(/noise.webp)",
            backgroundSize: "30%",
            opacity,
            transform: `scale(${scale})`,
            mixBlendMode: "overlay",
        }}
    />
);

// New component for orange gradient backgrounds
const OrangeGradient: React.FC<{ className?: string; children?: React.ReactNode }> = ({
                                                                                          className = "",
                                                                                          children,
                                                                                      }) => (
    <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-100 to-orange-50 opacity-80"></div>
        <Noise opacity={0.07} />
        <div className="relative z-10">{children}</div>
    </div>
);

interface CoursePageProps {
    params: { coursId: string };
}

export default function CoursePage({ params }: CoursePageProps) {
    const [cours, setCours] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedContent, setSelectedContent] = useState<Lesson | Exercise | Section | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Constrain width / prevent horizontal overflow, and move vertical scroll into <main>
    useEffect(() => {
        const styleTag = document.createElement("style");
        styleTag.innerHTML = `
  html, body {
    max-width: 100vw;
    overflow: hidden;         /* plus de défilement global */
  }
  #__next {
    max-width: 100%;
    height: 100%;
  }
  main {
    max-width: 100%;
    height: 100vh;            /* plein écran */
    overflow-y: auto;         /* scrollbar unique ici */
  }
  img {
    max-width: 100%;
    height: auto;
  }
`;
        document.head.appendChild(styleTag);
        return () => {
            if (styleTag.parentNode) {
                styleTag.parentNode.removeChild(styleTag);
            }
        };
    }, []);

    // Fetch course data
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/cours/${params.coursId}`,
                    { cache: "no-store" }
                );
                if (!res.ok) throw new Error("Cours introuvable");
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

    // Ferme la sidebar quand on sélectionne un contenu
    useEffect(() => {
        if (selectedContent) {
            setSidebarOpen(false);
        }
    }, [selectedContent]);

    // Lock body scroll when mobile sidebar open
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [sidebarOpen]);

    const toggleSidebar = () => setSidebarOpen((o) => !o);

    if (isLoading) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 overflow-x-hidden">
                {/* Sidebar Skeleton */}
                <div className="hidden md:block w-72 lg:w-80 p-4 bg-orange-50">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full mb-3" />
                    ))}
                </div>
                {/* Main Content Skeleton */}
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

    if (error || !cours) {
        return (
            <div className="p-6 text-red-500 bg-red-50 rounded-lg border border-red-200 m-4">
                Erreur : {error || "Cours introuvable"}
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 overflow-x-hidden">
            <Noise opacity={0.03} />

            {/* Mobile menu button */}
            <button
                onClick={toggleSidebar}
                className="md:hidden fixed bottom-6 left-6 z-50 p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-xl hover:shadow-orange-200/50 hover:scale-105 transition-all duration-300"
                aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
                {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Sidebar overlay (mobile) */}
            <div
                className={`fixed inset-0 z-40 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity md:hidden ${
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={`
          fixed inset-y-0 left-0 z-40 w-80 max-w-[85%] transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:shadow-md md:w-72 lg:w-80 md:max-w-none border-r border-orange-100
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                <OrangeGradient className="h-full">
                    <div className="md:hidden flex justify-end p-2">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-full hover:bg-orange-100/50 text-gray-700"
                            aria-label="Fermer le menu"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {/* On supprime le scroll interne de la sidebar : plus d’overflow-y-auto ici */}
                    <div>
                        {cours && <SidebarWrapper course={cours} onSelectContent={setSelectedContent} />}
                    </div>
                </OrangeGradient>
            </div>

            {/* Main content */}
            <main className="flex-1 p-4 md:p-8 bg-white/70 mt-14 md:mt-0 md:ml-0 relative rounded-tl-2xl md:rounded-none max-w-full">
                <Noise opacity={0.02} />
                <div className="relative z-10">
                    {selectedContent ? (
                        <>
                            <button
                                onClick={() => setSelectedContent(null)}
                                className="mb-6 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full flex items-center text-sm font-medium transition-colors shadow-sm"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Retour
                            </button>

                            {"exercises" in selectedContent ? (
                                <>
                                    <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 flex items-center">
                                        <span className="mr-2">{selectedContent.title}</span>
                                        <span className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-2"></span>
                                    </h1>
                                    <div className="flex flex-col space-y-6">
                                        {selectedContent.exercises?.map((exercise, index) => (
                                            <div key={exercise._id} className="relative overflow-hidden rounded-xl">
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 to-amber-500"></div>
                                                <ExerciseCard
                                                    exercise={{ ...exercise, content: exercise.content || "" }}
                                                    index={index}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : "content" in selectedContent ? (
                                <div className="relative">
                                    <div className="absolute top-0 left-0 w-16 h-1 bg-orange-500 rounded-full"></div>
                                    <LessonView title={selectedContent.title} content={selectedContent.content || ""} />
                                </div>
                            ) : (
                                <p className="text-gray-600">Aucun contenu disponible.</p>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Course header */}
                            <div className="relative overflow-hidden bg-white border border-orange-100 rounded-xl shadow-md mb-8 max-w-full">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400"></div>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-start justify-between flex-wrap">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{cours.title}</h1>
                                        <span className="text-orange-500">
                      <Sparkles className="w-6 h-6" />
                    </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 w-full">
                                        <Badge className="flex items-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium px-3 py-1 rounded-full shadow-sm">
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            <span className="truncate">{cours.matiere}</span>
                                        </Badge>
                                        <Badge className="flex items-center bg-gradient-to-r from-amber-500 to-orange-400 text-white font-medium px-3 py-1 rounded-full shadow-sm">
                                            <GraduationCap className="w-4 h-4 mr-1" />
                                            <span className="truncate">{cours.niveau}</span>
                                        </Badge>
                                    </div>
                                </div>
                                <div className="border-t border-orange-100 bg-orange-50/50 p-6 md:p-8 relative">
                                    <Noise opacity={0.04} />
                                    <div className="relative prose prose-sm md:prose-base text-gray-700 w-full max-w-full overflow-hidden prose-headings:text-orange-800 prose-a:text-orange-600">
                                        <ReactMarkdown className="break-words">{cours.description}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>

                            {/* Instruction message */}
                            <OrangeGradient className="rounded-xl border border-orange-100 shadow-md p-8 text-center max-w-full">
                                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white mb-4 shadow-md">
                                    <svg
                                        className="w-8 h-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
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
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

// Enhanced sidebar wrapper with orange theme
export function SidebarWrapper({
                                   course,
                                   onSelectContent,
                               }: {
    course: Course;
    onSelectContent: (content: any) => void;
}) {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header with enhanced orange accent */}
            <div className="flex-shrink-0 p-6 pb-4 relative">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    Sommaire du cours
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-2"></span>
                </h2>
                <div className="h-1 w-28 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full mt-3"></div>
            </div>

            {/* Sidebar content */}
            <div className="flex-grow relative overflow-hidden">
                <div className="absolute top-0 right-6 w-8 h-16 bg-orange-200/30 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 left-4 w-12 h-12 bg-amber-200/20 rounded-full blur-xl"></div>
                <Sidebar course={course} onSelectContent={onSelectContent} />
            </div>
        </div>
    );
}
