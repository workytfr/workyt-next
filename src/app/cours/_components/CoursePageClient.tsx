"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "./SidebarCours";
import { Course, Lesson, Section, Exercise, Quiz, SelectedContent, QuizCompletionResult, NavigableItem } from "./types";
import ExerciseCard from "./ExerciseCard";
import ContextualQuestionModal from "./ContextualQuestionModal";
import LessonView from "./LessonView";
import QuizCard from "./QuizCard";
import QuizViewer from "./QuizViewer";
import CourseBreadcrumb from "./CourseBreadcrumb";
import ContentNavigation from "./ContentNavigation";
import CourseDescription from "./CourseDescription";
import CourseFichesSection from "./CourseFichesSection";
import CourseCompetencies from "./CourseCompetencies";
import CourseEvaluation from "./CourseEvaluation";
import { useCourseNavigation, navigableToSelected } from "./hooks/useCourseNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, Menu, BookOpen, FileText, Trophy, ChevronRight, HelpCircle, FileCheck, BadgeCheck, Users, Play, PartyPopper, HeartHandshake, Layers } from "lucide-react";
import { SubjectLabel, LevelChip } from "@/components/wk/primitives";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/Drawer";
import "./styles/notion-theme.css";

// Skeleton pendant le chargement
function LoadingSkeleton() {
    return (
        <div className="flex h-[calc(100dvh-48px)] bg-white overflow-hidden">
            <div className="hidden md:block w-72 bg-[#f5efe3] border-r border-[#e8dfd0] flex-shrink-0">
                <div className="p-4 border-b border-[#e8dfd0]">
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
        <div className="min-h-[calc(100dvh-48px)] bg-white flex items-center justify-center p-4 overflow-hidden">
            <div className="text-center max-w-md">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-xl">!</span>
                </div>
                <h2 className="text-lg font-semibold text-[#1a1512] mb-2">Erreur</h2>
                <p className="text-[#6b625a]">{error || "Cours introuvable"}</p>
            </div>
        </div>
    );
}

// Vue d'un contenu sélectionné
function ContentView({ content, onBack, courseId }: { content: SelectedContent; onBack: () => void; courseId: string }) {
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
                const data = await response.json();
                setSelectedQuiz(data.quiz);
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
            <div className="w-full min-w-0">
                <div className="max-w-3xl">
                    <QuizViewer
                        quiz={selectedQuiz as Quiz & { questions: NonNullable<Quiz['questions']> }}
                        onClose={() => setSelectedQuiz(null)}
                        onComplete={handleQuizComplete}
                        isCompleted={isCompleted}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0">
            <button
                onClick={onBack}
                className="notion-button notion-button-ghost mb-6 text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour au cours
            </button>

            <div className="max-w-3xl">
                {content.kind === 'lesson' ? (
                    <LessonView title={content.lesson.title} content={content.lesson.content || ""} audioUrl={content.lesson.audioUrl} lessonId={content.lesson._id} courseId={courseId} sectionId={content.sectionId} />
                ) : content.kind === 'exercises' ? (
                    <ExerciseList exercises={content.exercises} title={content.sectionTitle} />
                ) : content.kind === 'quizzes' ? (
                    <QuizList quizzes={quizzes} title={content.sectionTitle} onStartQuiz={handleStartQuiz} isLoading={false} />
                ) : (
                    <p className="text-[#6b625a]">Aucun contenu disponible.</p>
                )}
            </div>
        </div>
    );
}

// Liste d'exercices
function ExerciseList({ exercises, title }: { exercises: Exercise[]; title: string }) {
    const [qaExercise, setQaExercise] = useState<{ _id: string; title: string } | null>(null);

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e8dfd0]">
                <div className="w-12 h-12 bg-[#ecfdf5] rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#10b981]" />
                </div>
                <div>
                    <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[#ff6a1a]">Exercices</p>
                    <h1 className="font-serif-display text-3xl leading-tight text-[#1a1512]">{title}</h1>
                </div>
            </div>

            <div className="space-y-6">
                {exercises.map((ex, idx) => (
                    <ExerciseCard
                        key={ex._id}
                        exercise={{ ...ex, content: ex.content || "" }}
                        index={idx}
                        onAskQuestion={() => setQaExercise({ _id: ex._id, title: ex.title })}
                    />
                ))}
            </div>

            {qaExercise && (
                <ContextualQuestionModal
                    isOpen={!!qaExercise}
                    onClose={() => setQaExercise(null)}
                    contextType="exercise"
                    contextId={qaExercise._id}
                    contextTitle={qaExercise.title}
                />
            )}
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
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e8dfd0]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#fffbeb] rounded-2xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-[#f59e0b]" />
                    </div>
                    <div>
                        <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[#ff6a1a]">Quiz</p>
                        <h1 className="font-serif-display text-3xl leading-tight text-[#1a1512]">{title}</h1>
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

// Stats du cours (questions forum + fiches)
function CourseStats({ courseId }: { courseId: string }) {
    const [questionsCount, setQuestionsCount] = useState(0);
    const [fichesCount, setFichesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [qRes, fRes] = await Promise.all([
                    fetch(`/api/forum/questions/by-course?courseId=${courseId}`),
                    fetch(`/api/fiches/by-course?courseId=${courseId}`),
                ]);
                if (qRes.ok) {
                    const qData = await qRes.json();
                    setQuestionsCount(qData.total || 0);
                }
                if (fRes.ok) {
                    const fData = await fRes.json();
                    setFichesCount(fData.total || 0);
                }
            } catch { /* silently fail */ } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [courseId]);

    if (loading) return null;
    if (questionsCount === 0 && fichesCount === 0) return null;

    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <p className="text-lg font-bold text-purple-700">{questionsCount}</p>
                    <p className="text-xs text-purple-500">question{questionsCount > 1 ? 's' : ''} de forum</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <p className="text-lg font-bold text-orange-700">{fichesCount}</p>
                    <p className="text-xs text-orange-500">fiche{fichesCount > 1 ? 's' : ''} de révision</p>
                </div>
            </div>
        </div>
    );
}

// Aperçu du cours : en-tête, reprise, table des chapitres, entrées d'aide
function CourseOverview({
    cours,
    fullCourse,
    flatItems,
    onNavigate,
    onOpenSidebar,
    progress,
    onResume,
}: {
    cours: Course;
    fullCourse: Course | null;
    flatItems: NavigableItem[];
    onNavigate: (item: NavigableItem) => void;
    onOpenSidebar?: () => void;
    progress?: {
        percentage: number;
        totalLessons: number;
        lessonsReadCount: number;
        lastLessonId: string | null;
    } | null;
    onResume?: () => void;
}) {
    const canResume = !!(progress?.lastLessonId && progress.percentage > 0 && progress.percentage < 100 && onResume);
    const done = !!progress && progress.totalLessons > 0 && progress.percentage === 100;
    const first = flatItems[0];

    // Les chapitres, avec leur contenu quand le cours complet est chargé
    const chapters = (fullCourse ?? cours).sections.map((section, index) => {
        const firstItem = flatItems.find((i) => i.sectionId === section._id);
        return {
            id: section._id,
            index,
            title: section.title,
            lessons: section.lessons?.length ?? 0,
            exercises: section.exercises?.length ?? 0,
            quizzes: section.quizzes?.length ?? 0,
            known: !!fullCourse,
            firstItem,
        };
    });

    const helpQs = new URLSearchParams({ subject: cours.matiere, level: cours.niveau });

    return (
        <div>
            <CourseHeader cours={cours} />

            {/* Commencer / reprendre + progression */}
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex flex-col justify-between gap-5 rounded-3xl bg-[var(--wk-ink)] p-6 text-[var(--wk-paper)]">
                    <div>
                        <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/55">
                            {done ? "Cours terminé" : canResume ? "Ta progression" : "Prêt à commencer ?"}
                        </p>
                        {progress && progress.totalLessons > 0 ? (
                            <>
                                <p className="font-serif-display mt-2 text-3xl leading-none">
                                    {progress.percentage}%{" "}
                                    <span className="text-base text-white/60">
                                        · {progress.lessonsReadCount}/{progress.totalLessons} leçons lues
                                    </span>
                                </p>
                                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
                                    <div className="wk-xp-fill" style={{ width: `${progress.percentage}%` }} />
                                </div>
                            </>
                        ) : (
                            <p className="font-serif-display mt-2 text-3xl leading-tight">
                                {chapters.length} chapitre{chapters.length > 1 ? "s" : ""} à ton rythme.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canResume ? (
                            <button type="button" onClick={onResume} className="wk-btn-orange !py-2.5 text-sm">
                                <Play className="h-4 w-4" /> Reprendre où j&apos;en étais
                            </button>
                        ) : first ? (
                            <button type="button" onClick={() => onNavigate(first)} className="wk-btn-orange !py-2.5 text-sm">
                                <Play className="h-4 w-4" /> {done ? "Revoir le cours" : "Commencer le cours"}
                            </button>
                        ) : (
                            <button type="button" onClick={onOpenSidebar} className="wk-btn-orange !py-2.5 text-sm md:hidden">
                                <Menu className="h-4 w-4" /> Voir le sommaire
                            </button>
                        )}
                        {done && <span className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-[var(--wk-accent-2)]"><PartyPopper className="h-4 w-4" /> Bravo !</span>}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <Link
                        href={`/forum/creer?subject=${encodeURIComponent(cours.matiere)}&classLevel=${encodeURIComponent(cours.niveau)}`}
                        className="group flex items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.2)]"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-paper-2)] text-[var(--wk-ink)]">
                            <HelpCircle className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-semibold">Une question sur ce cours ?</span>
                            <span className="block text-sm text-[rgba(26,21,18,0.6)]">La communauté du forum te répond.</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.35)] transition group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                        href={`/suivi?${helpQs}#demande`}
                        className="group flex items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--wk-accent)]"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-accent)] text-white">
                            <HeartHandshake className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-semibold">Besoin d&apos;être accompagné ?</span>
                            <span className="block text-sm text-[rgba(26,21,18,0.6)]">Un bénévole te suit sur ce chapitre.</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.35)] transition group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>

            {/* Stats questions + fiches */}
            <div className="mt-6">
                <CourseStats courseId={cours._id} />
            </div>

            {/* Table des chapitres */}
            <section className="mt-10" aria-label="Chapitres du cours">
                <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="font-serif-display text-3xl">Les chapitres</h2>
                    <span className="text-sm text-[rgba(26,21,18,0.55)]">{chapters.length} au total</span>
                </div>
                <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {chapters.map((c) => {
                        const clickable = !!c.firstItem;
                        const inner = (
                            <>
                                <span className="font-serif-display w-10 shrink-0 text-3xl leading-none text-[var(--wk-accent)]">
                                    {String(c.index + 1).padStart(2, "0")}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold leading-snug">{c.title}</span>
                                    {c.known && (
                                        <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[rgba(26,21,18,0.55)]">
                                            {c.lessons > 0 && (
                                                <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {c.lessons} leçon{c.lessons > 1 ? "s" : ""}</span>
                                            )}
                                            {c.exercises > 0 && (
                                                <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {c.exercises} exercice{c.exercises > 1 ? "s" : ""}</span>
                                            )}
                                            {c.quizzes > 0 && (
                                                <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {c.quizzes} quiz</span>
                                            )}
                                        </span>
                                    )}
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.3)] transition group-hover:translate-x-0.5 group-hover:text-[var(--wk-accent)]" />
                            </>
                        );
                        const cls = "group flex w-full items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.2)] hover:shadow-[0_12px_32px_rgba(26,21,18,0.07)]";
                        return (
                            <li key={c.id}>
                                {clickable ? (
                                    <button type="button" onClick={() => onNavigate(c.firstItem!)} className={cls}>{inner}</button>
                                ) : (
                                    // Contenu pas encore chargé (ou chapitre vide) : on ouvre le sommaire
                                    <button type="button" onClick={onOpenSidebar} className={cls}>{inner}</button>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </section>
        </div>
    );
}

// En-tête de l'aperçu
function CourseHeader({ cours }: { cours: Course }) {
    return (
        <header>
            <div className="flex flex-wrap items-center gap-2.5">
                <SubjectLabel subject={cours.matiere} />
                <LevelChip level={cours.niveau} />
                {cours.verifiedBy && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <BadgeCheck className="h-3.5 w-3.5" /> Vérifié par {cours.verifiedBy.username}
                    </span>
                )}
            </div>
            <h1 className="font-serif-display mt-4 max-w-4xl text-[clamp(2.2rem,4.5vw,3.75rem)] leading-[0.98] text-[var(--wk-ink)]">
                {cours.title}
            </h1>
            {cours.description && (
                <div className="mt-5 max-w-3xl text-base leading-relaxed text-[rgba(26,21,18,0.68)]">
                    <CourseDescription content={cours.description} />
                </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[rgba(26,21,18,0.55)]">
                <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    {cours.sections.length} chapitre{cours.sections.length > 1 ? "s" : ""}
                </span>
                {cours.authors && cours.authors.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Écrit par {cours.authors.map((a) => a.username).join(", ")}
                    </span>
                )}
            </div>
        </header>
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
        <div className="h-full flex flex-col bg-[#f5efe3]">
            <div className="flex-shrink-0 p-4 border-b border-[#e8dfd0]">
                <p className="font-mono-ui mb-1.5 text-[10px] uppercase tracking-[0.18em] text-[#8f857b]">
                    Sommaire
                </p>
                <h2 className="font-serif-display text-lg leading-tight text-[#1a1512] line-clamp-2">
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
export default function CoursePage({ params, initialCours }: { params: { coursId: string }; initialCours?: Course | null }) {
    const searchParams = useSearchParams();
    const { data: session, status: sessionStatus } = useSession();
    const accessToken = (session as any)?.accessToken as string | undefined;
    const authHeaders: Record<string, string> = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};
    const [cours, setCours] = useState<Course | null>(initialCours ?? null);
    const [fullCourse, setFullCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(!initialCours);
    const [error, setError] = useState<string | null>(null);
    const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [readLessons, setReadLessons] = useState<Set<string>>(new Set());
    const [courseProgress, setCourseProgress] = useState<{
        percentage: number;
        totalLessons: number;
        lessonsReadCount: number;
        lastLessonId: string | null;
        lastSectionId: string | null;
    } | null>(null);
    const markReadTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const { prev, next, flatItems } = useCourseNavigation(fullCourse, selectedContent);

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
            fetch(`/api/cours/${params.coursId}/sections/${item.sectionId}`, { headers: authHeaders })
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
        // Si le cours a été pré-chargé côté serveur, on saute le fetch initial.
        if (initialCours) return;
        // Attendre que la session soit résolue (loaded ou unauthenticated) avant de fetch
        // pour éviter d'envoyer une requête sans le Bearer token quand on est admin.
        if (sessionStatus === "loading") return;

        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/cours/${params.coursId}`, { headers: authHeaders });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.coursId, initialCours, sessionStatus, accessToken]);

    useEffect(() => {
        if (sessionStatus === "loading") return;
        fetch(`/api/cours/${params.coursId}/full`, { headers: authHeaders })
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.cours) setFullCourse(data.cours); })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.coursId, sessionStatus, accessToken]);

    useEffect(() => {
        if (!cours) return;
        const sectionId = searchParams.get('section');
        const lessonId = searchParams.get('lesson');
        const view = searchParams.get('view');

        if (sectionId) {
            fetch(`/api/cours/${params.coursId}/sections/${sectionId}`, { headers: authHeaders })
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
                    setCourseProgress({
                        percentage: data.progress.percentage || 0,
                        totalLessons: data.progress.totalLessons || 0,
                        lessonsReadCount: data.progress.lessonsRead.length,
                        lastLessonId: data.progress.lastLessonId || null,
                        lastSectionId: data.progress.lastSectionId || null,
                    });
                }
            })
            .catch(() => {});
    }, [session, cours, params.coursId]);

    // Reprendre le cours là où l'élève s'était arrêté
    const handleResumeCourse = () => {
        if (!courseProgress?.lastLessonId || !cours) return;
        for (const section of cours.sections) {
            const lesson = (section as any).lessons?.find(
                (l: any) => l._id === courseProgress.lastLessonId
            );
            if (lesson) {
                handleSelectContent({
                    kind: 'lesson',
                    lesson,
                    sectionId: section._id,
                    sectionTitle: section.title,
                });
                return;
            }
        }
    };

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
                .then(res => {
                    if (res.ok) {
                        setReadLessons(prev => new Set([...prev, lessonId]));
                        // Met à jour localement la progression affichée (barre + reprendre)
                        setCourseProgress(prev => {
                            const total = prev?.totalLessons || 0;
                            const count = (prev?.lessonsReadCount || 0) + 1;
                            return {
                                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
                                totalLessons: total,
                                lessonsReadCount: count,
                                lastLessonId: lessonId,
                                lastSectionId: selectedContent.sectionId,
                            };
                        });
                    }
                })
                .catch(() => {});
        }, 5000);

        return () => { if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current); };
    }, [selectedContent, session, params.coursId, readLessons]);

    if (isLoading) return <LoadingSkeleton />;
    if (error || !cours) return <ErrorMessage error={error} />;

    const breadcrumbSection = selectedContent ? selectedContent.sectionTitle : undefined;
    const breadcrumbContent = selectedContent?.kind === 'lesson' ? selectedContent.lesson.title : undefined;
    const breadcrumbKind = selectedContent?.kind;

    const isUnpublished = (cours as any)?.status && (cours as any).status !== "publie";
    const statusLabel: Record<string, string> = {
        en_attente_verification: "À vérifier",
        en_attente_publication: "En attente de publication",
        annule: "Annulé",
        brouillon: "Brouillon",
    };
    const currentStatusLabel = statusLabel[(cours as any)?.status] ?? "Non publié";

    return (
        <div className="flex flex-col h-[calc(100dvh-48px)] bg-[var(--wk-paper)] text-[var(--wk-ink)] overflow-hidden">
            {/* Bannière prévisualisation pour les cours non publiés */}
            {isUnpublished && (
                <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 text-sm">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                        ⚠
                    </span>
                    <span className="text-amber-900">
                        <b>Mode prévisualisation</b> — Ce cours n'est pas encore publié ({currentStatusLabel}). Les visiteurs ne le verront pas tant qu'il n'est pas publié.
                    </span>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
            {/* Sidebar desktop */}
            <div className="hidden md:block w-80 flex-shrink-0 bg-[#f5efe3] border-r border-[#e8dfd0]">
                <SidebarWrapper
                    course={cours}
                    onSelectContent={handleSelectContent}
                    readLessons={readLessons}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden notion-scrollbar">
                {/* Accueil du cours : pleine largeur ; leçon, exercices, quiz : largeur de lecture */}
                <div className={`${selectedContent ? "max-w-4xl" : "max-w-6xl"} mx-auto px-5 md:px-10 xl:px-14 py-8 md:py-12`}>
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
                            <ContentView content={selectedContent} onBack={handleBackToOverview} courseId={cours._id} />
                            <ContentNavigation
                                prev={prev}
                                next={next}
                                onNavigate={handleNavigate}
                            />
                            {/* Fin du cours : on propose l'évaluation là où l'élève termine */}
                            {!next && (
                                <div className="mt-10">
                                    <CourseEvaluation courseId={cours._id} />
                                </div>
                            )}
                        </>
                    ) : (
                        <CourseOverview
                            cours={cours}
                            fullCourse={fullCourse}
                            flatItems={flatItems}
                            onNavigate={handleNavigate}
                            onOpenSidebar={() => setDrawerOpen(true)}
                            progress={courseProgress}
                            onResume={handleResumeCourse}
                        />
                    )}

                    {/* Évaluation du trimestre */}
                    {!selectedContent && (
                        <CourseEvaluation courseId={cours._id} />
                    )}

                    {/* Compétences du programme — au-dessus des fiches */}
                    {!selectedContent && (
                        <CourseCompetencies courseId={cours._id} />
                    )}

                    {/* Fiches de révision — fin du cours */}
                    {!selectedContent && (
                        <CourseFichesSection
                            courseId={cours._id}
                            courseTitle={cours.title}
                            courseMatiere={cours.matiere}
                            courseNiveau={cours.niveau}
                        />
                    )}
                </div>
            </main>

            {/* Mobile drawer - Bouton flottant amélioré */}
            <div className="md:hidden">
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <DrawerTrigger asChild>
                        <button
                            className="fixed z-50 left-4 bottom-6 pl-3 pr-4 py-3 bg-[#ff6a1a] text-white rounded-full shadow-lg flex items-center gap-2 hover:bg-[#e85a0c] transition-all"
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
                                readLessons={readLessons}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
            </div>
        </div>
    );
}
