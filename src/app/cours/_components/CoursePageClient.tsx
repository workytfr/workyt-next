"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./../_components/SidebarCours";
import { Course, Lesson, Section, Exercise } from "./../_components/types";
import ExerciseCard from "./../_components/ExerciseCard";
import LessonView from "./../_components/LessonView";
import QuizCard from "./../_components/QuizCard";
import QuizViewer from "./../_components/QuizViewer";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

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
            <div className="w-full md:w-72 lg:w-80 p-3 sm:p-4 bg-orange-50">
                <Skeleton className="h-5 sm:h-6 w-3/4 mb-3 sm:mb-4" />
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-3 sm:h-4 w-full mb-2 sm:mb-3" />
                ))}
            </div>
            <main className="flex-1 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-white to-orange-50">
                <Skeleton className="h-6 sm:h-8 w-full md:w-1/2 mb-3 sm:mb-4" />
                <Skeleton className="h-3 sm:h-4 w-1/2 md:w-1/4 mb-4 sm:mb-6" />
                <Skeleton className="h-8 sm:h-10 w-1/3 md:w-1/5 mb-4 sm:mb-6" />
                <div className="space-y-3 sm:space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 sm:h-16 w-full rounded-lg" />
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
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);

    useEffect(() => {
        if (content.type === 'quizzes' && content.quizzes) {
            setQuizzes(content.quizzes);
        } else if (content.type === 'exercises') {
            // Réinitialiser les quiz si on affiche explicitement des exercices
            setQuizzes([]);
        } else if ("quizzes" in content && content.quizzes) {
            setQuizzes(content.quizzes);
        } else if ("_id" in content && content._id && !("exercises" in content)) {
            // Charger les quiz de la section seulement si ce n'est pas pour les exercices
            fetchQuizzes(content._id);
        } else if ("exercises" in content) {
            // Réinitialiser les quiz si on affiche explicitement des exercices
            setQuizzes([]);
        }
    }, [content]);

    const fetchQuizzes = async (sectionId: string) => {
        setIsLoadingQuizzes(true);
        try {
            const response = await fetch(`/api/sections/${sectionId}/quizzes`);
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des quiz:', error);
        } finally {
            setIsLoadingQuizzes(false);
        }
    };

    const handleStartQuiz = async (quizId: string) => {
        try {
            const response = await fetch(`/api/quizzes/${quizId}`);
            if (response.ok) {
                const quiz = await response.json();
                setSelectedQuiz(quiz);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du quiz:', error);
        }
    };

    const handleQuizComplete = (result: any) => {
        // Mettre à jour la liste des quiz avec les nouvelles informations de completion
        setQuizzes(prev => prev.map(quiz => 
            quiz._id === selectedQuiz._id 
                ? { ...quiz, completed: true, score: result.score, maxScore: result.maxScore, percentage: result.percentage }
                : quiz
        ));
    };

    if (selectedQuiz) {
        // Vérifier si le quiz est déjà complété
        const completedQuiz = quizzes.find(q => q._id === selectedQuiz._id);
        const isCompleted = completedQuiz?.completed || false;
        
        return (
            <QuizViewer 
                quiz={selectedQuiz} 
                onClose={() => setSelectedQuiz(null)}
                onComplete={handleQuizComplete}
                isCompleted={isCompleted}
            />
        );
    }

    return (
        <div className="w-full max-w-none overflow-hidden">
            <button
                onClick={onBack}
                className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full flex items-center text-sm font-medium shadow-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
            </button>
            
            <div className="w-full overflow-hidden">
                {content.type === 'exercises' ? (
                    <ExerciseList exercises={content.exercises} title={content.title} />
                ) : content.type === 'quizzes' ? (
                    <QuizList quizzes={quizzes} title={content.title} onStartQuiz={handleStartQuiz} isLoading={isLoadingQuizzes} />
                ) : "content" in content ? (
                    <LessonView title={content.title} content={content.content || ""} />
                ) : "exercises" in content ? (
                    <ExerciseList exercises={content.exercises} title={content.title} />
                ) : "quizzes" in content && quizzes.length > 0 ? (
                    <QuizList quizzes={quizzes} title={content.title} onStartQuiz={handleStartQuiz} isLoading={isLoadingQuizzes} />
                ) : (
                    <p className="text-gray-600">Aucun contenu disponible.</p>
                )}
            </div>
        </div>
    );
}

// Liste d'exercices
function ExerciseList({ exercises, title }: { exercises: Exercise[]; title: string }) {
    return (
        <div className="w-full max-w-none overflow-hidden">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 break-words">{title}</h1>
            <div className="flex flex-col space-y-4 sm:space-y-6">
                {exercises.map((ex, idx) => (
                    <div key={ex._id} className="relative overflow-hidden rounded-xl">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 to-amber-500" />
                        <ExerciseCard exercise={{ ...ex, content: ex.content || "" }} index={idx} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Liste de quiz
function QuizList({ quizzes, title, onStartQuiz, isLoading }: { 
    quizzes: any[]; 
    title: string; 
    onStartQuiz: (quizId: string) => void;
    isLoading: boolean;
}) {
    const { data: session } = useSession();

    if (isLoading) {
        return (
            <div className="w-full max-w-none overflow-hidden">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 break-words">{title}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 sm:h-48 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-none overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 break-words">{title}</h1>
                {!session?.user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2">
                        <p className="text-xs sm:text-sm text-blue-700">
                            💡 Connectez-vous pour participer aux quiz et gagner des points !
                        </p>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {quizzes.map((quiz) => (
                    <QuizCard key={quiz._id} quiz={quiz} onStartQuiz={onStartQuiz} />
                ))}
            </div>
        </div>
    );
}

// Aperçu du cours
function CourseOverview({ cours }: { cours: Course }) {
    return (
        <div className="w-full max-w-none overflow-hidden">
            <CourseHeader cours={cours} />
            <Instruction />
        </div>
    );
}

// En-tête de l'aperçu
function CourseHeader({ cours }: { cours: Course }) {
    return (
        <div className="relative overflow-hidden bg-white border border-orange-100 rounded-xl shadow-md mb-6 sm:mb-8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400" />
            <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row justify-between items-start">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 break-words">{cours.title}</h1>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
            </div>
            <div className="border-t border-orange-100 bg-orange-50/50 p-4 sm:p-6 md:p-8 relative">
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
        <OrangeGradient className="rounded-xl border border-orange-100 shadow-md p-4 sm:p-6 md:p-8 text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white mb-3 sm:mb-4 shadow-md">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-gray-800 font-medium">
                Sélectionnez une leçon ou un exercice dans le sommaire pour voir son contenu.
            </p>
            <p className="text-xs sm:text-sm mt-2 text-gray-600">
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
    onSelectContent: (content: Lesson | Exercise | Section | { type: string; title: string; exercises?: any[]; quizzes?: any[] }) => void;
}) {
    return (
        <div className="h-full flex flex-col overflow-hidden sidebar-wrapper">
            <div className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 relative">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                    Sommaire du cours
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 ml-2" />
                </h2>
                <div className="h-1 w-20 sm:w-28 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full mt-2 sm:mt-3" />
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
    const [selectedContent, setSelectedContent] = useState<Lesson | Exercise | Section | { type: string; title: string; exercises?: any[]; quizzes?: any[] } | null>(null);

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
                const res = await fetch(`/api/cours/${params.coursId}`, {
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
            <main className="flex-1 relative h-full overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-6 lg:p-8 bg-white/70 rounded-tl-2xl">
                <div className="w-full max-w-none">
                    {selectedContent ? (
                        <ContentView content={selectedContent} onBack={() => setSelectedContent(null)} />
                    ) : (
                        <CourseOverview cours={cours} />
                    )}
                </div>
            </main>

            {/* Bouton flottant toujours visible lors du défilement (uniquement sur mobile) */}
            {!showSidebar && (
                <FloatingMenuButton onClick={() => setShowSidebar(true)} />
            )}
        </div>
    );
}