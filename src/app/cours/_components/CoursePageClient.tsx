"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "./SidebarCours";
import { Course, Lesson, Section, Exercise, Quiz, SelectedContent, QuizCompletionResult, NavigableItem } from "./types";
import ExerciseCard from "./ExerciseCard";
import LessonView from "./LessonView";
import QuizCard from "./QuizCard";
import QuizViewer from "./QuizViewer";
import CourseBreadcrumb from "./CourseBreadcrumb";
import ContentNavigation from "./ContentNavigation";
import CourseDescription from "./CourseDescription";
import { useCourseNavigation, navigableToSelected } from "./hooks/useCourseNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Menu, BookOpen, FileText, Trophy, ChevronRight } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/Drawer";
import "./styles/notion-theme.css";

// Skeleton pendant le chargement
function LoadingSkeleton() {
    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <div className="hidden md:block w-72 bg-[#f7f6f3] border-r border-[#e3e2e0] flex-shrink-0">
                <div className="p-4 border-b border-[#e3e2e0]">
                    <Skeleton className="h-5 w-3/4" />
                </div>
                <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </div>
            <main className="flex-1 p-8 md:p-12 overflow-y-auto overflow-x-hidden">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-4 w-1/4 mb-8" />
                <div className="space-y-4 max-w-3xl">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </main>
        </div>
    );
}

// Message d'erreur
function ErrorMessage({ error }: { error: string | null }) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
            <div className="text-center max-w-md">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-xl">!</span>
                </div>
                <h2 className="text-lg font-semibold text-[#37352f] mb-2">Erreur</h2>
                <p className="text-[#6b6b6b]">{error || "Cours introuvable"}</p>
            </div>
        </div>
    );
}

// Vue d'un contenu sélectionné
function ContentView({ content, onBack }: { content: SelectedContent; onBack: () => void }) {
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    useEffect(() => {
        if (content.kind === 'quizzes') {
            setQuizzes(content.quizzes);
        } else {
            setQuizzes([]);
        }
        setSelectedQuiz(null);
    }, [content]);

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

    const handleQuizComplete = (result: QuizCompletionResult) => {
        setQuizzes(prev => prev.map(quiz =>
            quiz._id === selectedQuiz?._id
                ? { ...quiz, completed: true, score: result.score, maxScore: result.maxScore, percentage: result.percentage }
                : quiz
        ));
    };

    if (selectedQuiz) {
        const completedQuiz = quizzes.find(q => q._id === selectedQuiz._id);
        const isCompleted = completedQuiz?.completed || false;

        return (
            <QuizViewer
                quiz={selectedQuiz as Quiz & { questions: NonNullable<Quiz['questions']> }}
                onClose={() => setSelectedQuiz(null)}
                onComplete={handleQuizComplete}
                isCompleted={isCompleted}
            />
        );
    }

    return (
        <div className="w-full overflow-x-hidden">
            <button
                onClick={onBack}
                className="notion-button notion-button-ghost mb-6 text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour au cours
            </button>

            <div className="max-w-3xl">
                {content.kind === 'lesson' ? (
                    <LessonView title={content.lesson.title} content={content.lesson.content || ""} />
                ) : content.kind === 'exercises' ? (
                    <ExerciseList exercises={content.exercises} title={content.sectionTitle} />
                ) : content.kind === 'quizzes' ? (
                    <QuizList quizzes={quizzes} title={content.sectionTitle} onStartQuiz={handleStartQuiz} isLoading={false} />
                ) : (
                    <p className="text-[#6b6b6b]">Aucun contenu disponible.</p>
                )}
            </div>
        </div>
    );
}

// Liste d'exercices
function ExerciseList({ exercises, title }: { exercises: Exercise[]; title: string }) {
    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e3e2e0]">
                <div className="w-12 h-12 bg-[#ecfdf5] rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#10b981]" />
                </div>
                <div>
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-medium">Exercices</p>
                    <h1 className="text-xl font-semibold text-[#37352f]">{title}</h1>
                </div>
            </div>
            
            <div className="space-y-6">
                {exercises.map((ex, idx) => (
                    <ExerciseCard key={ex._id} exercise={{ ...ex, content: ex.content || "" }} index={idx} />
                ))}
            </div>
        </div>
    );
}

// Liste de quiz
function QuizList({ quizzes, title, onStartQuiz, isLoading }: {
    quizzes: Quiz[];
    title: string;
    onStartQuiz: (quizId: string) => void;
    isLoading: boolean;
}) {
    const { data: session } = useSession();

    if (isLoading) {
        return (
            <div className="max-w-3xl">
                <Skeleton className="h-8 w-1/2 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e3e2e0]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#fffbeb] rounded-2xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-[#f59e0b]" />
                    </div>
                    <div>
                        <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-medium">Quiz</p>
                        <h1 className="text-xl font-semibold text-[#37352f]">{title}</h1>
                    </div>
                </div>
            </div>

            {!session?.user && (
                <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl px-4 py-3 mb-6">
                    <p className="text-sm text-[#3b82f6]">
                        Connectez-vous pour participer aux quiz et gagner des points !
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                    <QuizCard key={quiz._id} quiz={quiz} onStartQuiz={onStartQuiz} />
                ))}
            </div>
        </div>
    );
}

// Aperçu du cours
function CourseOverview({ cours, onOpenSidebar }: { cours: Course; onOpenSidebar?: () => void }) {
    return (
        <div className="max-w-3xl">
            <CourseHeader cours={cours} />
            
            <div className="notion-divider" />

            {/* Sections visibles sur mobile */}
            <div className="md:hidden mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[#9ca3af] uppercase tracking-wide">
                        Sections du cours
                    </h3>
                    <span className="text-xs text-[#9ca3af]">{cours.sections.length} sections</span>
                </div>
                <div className="space-y-2">
                    {cours.sections.slice(0, 5).map((section, index) => (
                        <button
                            key={section._id}
                            onClick={onOpenSidebar}
                            className="w-full flex items-center gap-3 p-3 bg-white border border-[#e3e2e0] rounded-xl hover:border-[#f97316] hover:bg-[#fff7ed] transition-colors text-left"
                        >
                            <div className="w-8 h-8 bg-[#f7f6f3] rounded-lg flex items-center justify-center text-sm font-medium text-[#6b6b6b]">
                                {index + 1}
                            </div>
                            <span className="text-sm font-medium text-[#37352f] truncate flex-1">
                                {section.title}
                            </span>
                            <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
                        </button>
                    ))}
                    {cours.sections.length > 5 && (
                        <button
                            onClick={onOpenSidebar}
                            className="w-full py-2.5 text-sm text-[#f97316] font-medium hover:underline"
                        >
                            + {cours.sections.length - 5} autres sections
                        </button>
                    )}
                </div>
            </div>
            
            <div className="bg-[#f7f6f3] rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <BookOpen className="w-7 h-7 text-[#9ca3af]" />
                </div>
                <h3 className="text-base font-medium text-[#37352f] mb-2">
                    Commencez votre apprentissage
                </h3>
                <p className="text-sm text-[#6b6b6b] max-w-md mx-auto">
                    Sélectionnez une section dans le menu de gauche pour accéder aux leçons, 
                    exercices et quiz.
                </p>
            </div>
        </div>
    );
}

// En-tête de l'aperçu
function CourseHeader({ cours }: { cours: Course }) {
    return (
        <div>
            <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-medium mb-2">
                {cours.matiere} • {cours.niveau}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#37352f] mb-4 tracking-tight">
                {cours.title}
            </h1>
            {cours.description && (
                <div className="text-sm text-[#6b6b6b] leading-relaxed">
                    <CourseDescription content={cours.description} />
                </div>
            )}
            
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-[#9ca3af]">
                <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    {cours.sections.length} section{cours.sections.length > 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
}

// SidebarWrapper
export function SidebarWrapper({
    course,
    onSelectContent,
    readLessons,
}: {
    course: Course;
    onSelectContent: (content: SelectedContent) => void;
    readLessons?: Set<string>;
}) {
    return (
        <div className="h-full flex flex-col bg-[#f7f6f3]">
            <div className="flex-shrink-0 p-4 border-b border-[#e3e2e0]">
                <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-medium mb-1">
                    Sommaire
                </p>
                <h2 className="text-sm font-semibold text-[#37352f] line-clamp-2">
                    {course.title}
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden notion-scrollbar">
                <Sidebar
                    course={course}
                    onSelectContent={(c) => onSelectContent(c)}
                    readLessons={readLessons}
                />
            </div>
        </div>
    );
}

// Composant principal
export default function CoursePage({ params }: { params: { coursId: string } }) {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const [cours, setCours] = useState<Course | null>(null);
    const [fullCourse, setFullCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [readLessons, setReadLessons] = useState<Set<string>>(new Set());
    const markReadTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const { prev, next } = useCourseNavigation(fullCourse, selectedContent);

    const updateUrl = useCallback((content: SelectedContent | null) => {
        const url = new URL(window.location.href);
        if (!content) {
            url.searchParams.delete('section');
            url.searchParams.delete('lesson');
            url.searchParams.delete('view');
        } else {
            url.searchParams.set('section', content.sectionId);
            if (content.kind === 'lesson') {
                url.searchParams.set('lesson', content.lesson._id);
                url.searchParams.delete('view');
            } else {
                url.searchParams.set('view', content.kind);
                url.searchParams.delete('lesson');
            }
        }
        window.history.replaceState({}, '', url.toString());
    }, []);

    const handleSelectContent = useCallback((content: SelectedContent) => {
        setSelectedContent(content);
        updateUrl(content);
        setDrawerOpen(false);
    }, [updateUrl]);

    const handleNavigate = useCallback((item: NavigableItem) => {
        const needsFetch =
            (item.kind === 'lesson' && item.lesson && !item.lesson.content) ||
            (item.kind === 'exercises') ||
            (item.kind === 'quizzes');

        if (needsFetch) {
            fetch(`/api/cours/${params.coursId}/sections/${item.sectionId}`)
                .then(res => res.json())
                .then(data => {
                    if (!data?.section) return;
                    const section = data.section;

                    if (item.kind === 'lesson') {
                        const lesson = section.lessons?.find((l: Lesson) => l._id === item.lesson?._id);
                        if (lesson) {
                            handleSelectContent({
                                kind: 'lesson',
                                lesson,
                                sectionId: item.sectionId,
                                sectionTitle: item.sectionTitle,
                            });
                        }
                    } else if (item.kind === 'exercises' && section.exercises) {
                        handleSelectContent({
                            kind: 'exercises',
                            exercises: section.exercises,
                            sectionId: item.sectionId,
                            sectionTitle: item.sectionTitle,
                        });
                    } else if (item.kind === 'quizzes' && section.quizzes) {
                        handleSelectContent({
                            kind: 'quizzes',
                            quizzes: section.quizzes,
                            sectionId: item.sectionId,
                            sectionTitle: item.sectionTitle,
                        });
                    }
                })
                .catch(console.error);
        } else {
            handleSelectContent(navigableToSelected(item));
        }
    }, [params.coursId, handleSelectContent]);

    const handleBackToOverview = useCallback(() => {
        setSelectedContent(null);
        updateUrl(null);
    }, [updateUrl]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/cours/${params.coursId}`);
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

    useEffect(() => {
        fetch(`/api/cours/${params.coursId}/full`)
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.cours) setFullCourse(data.cours); })
            .catch(() => {});
    }, [params.coursId]);

    useEffect(() => {
        if (!cours) return;
        const sectionId = searchParams.get('section');
        const lessonId = searchParams.get('lesson');
        const view = searchParams.get('view');

        if (sectionId) {
            fetch(`/api/cours/${params.coursId}/sections/${sectionId}`)
                .then(res => res.json())
                .then(data => {
                    if (!data?.section) return;
                    const section = data.section;

                    if (lessonId && section.lessons) {
                        const lesson = section.lessons.find((l: Lesson) => l._id === lessonId);
                        if (lesson) {
                            setSelectedContent({
                                kind: 'lesson',
                                lesson,
                                sectionId,
                                sectionTitle: section.title,
                            });
                        }
                    } else if (view === 'exercises' && section.exercises) {
                        setSelectedContent({
                            kind: 'exercises',
                            exercises: section.exercises,
                            sectionId,
                            sectionTitle: section.title,
                        });
                    } else if (view === 'quizzes' && section.quizzes) {
                        setSelectedContent({
                            kind: 'quizzes',
                            quizzes: section.quizzes,
                            sectionId,
                            sectionTitle: section.title,
                        });
                    }
                })
                .catch(console.error);
        }
    }, [cours, params.coursId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!session?.user || !cours) return;
        fetch(`/api/cours/${params.coursId}/progress`, {
            headers: { Authorization: `Bearer ${(session as any).accessToken || ''}` },
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.progress?.lessonsRead) {
                    setReadLessons(new Set(data.progress.lessonsRead));
                }
            })
            .catch(() => {});
    }, [session, cours, params.coursId]);

    useEffect(() => {
        if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
        if (!session?.user || !selectedContent || selectedContent.kind !== 'lesson') return;

        const lessonId = selectedContent.lesson._id;
        if (readLessons.has(lessonId)) return;

        markReadTimerRef.current = setTimeout(() => {
            fetch(`/api/cours/${params.coursId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(session as any).accessToken || ''}`,
                },
                body: JSON.stringify({ lessonId, sectionId: selectedContent.sectionId }),
            })
                .then(res => { if (res.ok) setReadLessons(prev => new Set([...prev, lessonId])); })
                .catch(() => {});
        }, 5000);

        return () => { if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current); };
    }, [selectedContent, session, params.coursId, readLessons]);

    if (isLoading) return <LoadingSkeleton />;
    if (error || !cours) return <ErrorMessage error={error} />;

    const breadcrumbSection = selectedContent ? selectedContent.sectionTitle : undefined;
    const breadcrumbContent = selectedContent?.kind === 'lesson' ? selectedContent.lesson.title : undefined;
    const breadcrumbKind = selectedContent?.kind;

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Sidebar desktop */}
            <div className="hidden md:block w-72 flex-shrink-0 bg-[#f7f6f3] border-r border-[#e3e2e0]">
                <SidebarWrapper
                    course={cours}
                    onSelectContent={handleSelectContent}
                    readLessons={readLessons}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden notion-scrollbar">
                <div className="max-w-4xl mx-auto px-6 md:px-12 py-8 md:py-12">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <CourseBreadcrumb
                            courseTitle={cours.title}
                            courseId={cours._id}
                            sectionTitle={breadcrumbSection}
                            contentTitle={breadcrumbContent}
                            contentKind={breadcrumbKind}
                            onNavigateToOverview={handleBackToOverview}
                        />
                    </div>

                    {/* Content */}
                    {selectedContent ? (
                        <>
                            <ContentView content={selectedContent} onBack={handleBackToOverview} />
                            <ContentNavigation
                                prev={prev}
                                next={next}
                                onNavigate={handleNavigate}
                            />
                        </>
                    ) : (
                        <CourseOverview 
                            cours={cours} 
                            onOpenSidebar={() => setDrawerOpen(true)}
                        />
                    )}
                </div>
            </main>

            {/* Mobile drawer - Bouton flottant amélioré */}
            <div className="md:hidden">
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <DrawerTrigger asChild>
                        <button
                            className="fixed z-50 left-4 bottom-6 pl-3 pr-4 py-3 bg-[#f97316] text-white rounded-full shadow-lg flex items-center gap-2 hover:bg-[#ea580c] transition-all"
                            aria-label="Ouvrir le sommaire"
                        >
                            <Menu className="w-5 h-5" />
                            <span className="text-sm font-medium">Sommaire</span>
                            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {cours.sections.length}
                            </span>
                        </button>
                    </DrawerTrigger>
                    <DrawerContent className="h-[85vh] p-0 rounded-t-3xl">
                        <div className="h-full overflow-y-auto overflow-x-hidden">
                            <SidebarWrapper
                                course={cours}
                                onSelectContent={handleSelectContent}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    );
}
