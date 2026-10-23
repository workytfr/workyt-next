"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import ExerciseCard from "../ExerciseCard";
import QuizCard from "../QuizCard";
import QuizViewer from "../QuizViewer";
import AskQuestionModal from "./AskQuestionModal";
import LessonReader, { type ReaderLesson } from "./LessonReader";
import { ReadingBreadcrumb, ReadingFooter } from "./ReadingNav";
import { useReaderData } from "./useReaderData";
import type { RenderedLesson } from "@/lib/lessonHtml";
import type { Quiz, QuizCompletionResult } from "../types";

function Loading() {
    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
        </div>
    );
}

function NotFound() {
    return (
        <div className="mx-auto max-w-md py-20 text-center">
            <p className="font-serif-display text-3xl">Contenu introuvable</p>
            <p className="mt-2 text-[rgba(26,21,18,0.65)]">Il a peut-être été déplacé, ou n&apos;est pas encore publié.</p>
        </div>
    );
}

/* ─────────────── Leçon ─────────────── */

export interface LessonPayload {
    lesson: ReaderLesson;
    rendered: RenderedLesson;
}

export function LessonPage({ courseId, lessonId, initial }: { courseId: string; lessonId: string; initial: LessonPayload | null }) {
    const { data, error } = useReaderData<LessonPayload>(courseId, `lesson=${lessonId}`, initial);
    if (error) return <NotFound />;
    if (!data) return <Loading />;

    return (
        <div className="max-w-[68rem]">
            <ReadingBreadcrumb kind="lesson" id={data.lesson._id} label={data.lesson.title} />
            <LessonReader
                key={data.lesson._id}
                lesson={data.lesson}
                rendered={data.rendered}
                after={<ReadingFooter kind="lesson" id={data.lesson._id} />}
            />
        </div>
    );
}

/* ─────────────── Exercices d'un chapitre ─────────────── */

export interface ExercisesPayload {
    exercises: { sectionId: string; sectionTitle: string; exercises: any[] };
}

export function ExercisesPage({ courseId, sectionId, initial }: { courseId: string; sectionId: string; initial: ExercisesPayload | null }) {
    const { data, error } = useReaderData<ExercisesPayload>(courseId, `exercices=${sectionId}`, initial);
    const [asking, setAsking] = useState<{ _id: string; title: string } | null>(null);
    if (error) return <NotFound />;
    if (!data) return <Loading />;
    const { sectionTitle, exercises } = data.exercises;

    return (
        <div className="max-w-[56rem]">
            <ReadingBreadcrumb kind="exercises" id={sectionId} label="Exercices" />
            <header className="mb-8 border-b border-[rgba(26,21,18,0.1)] pb-6">
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--wk-accent)]">Exercices</p>
                <h1 className="font-serif-display mt-2 text-3xl leading-[1.05] md:text-[2.6rem]">{sectionTitle}</h1>
                <p className="mt-2 text-sm text-[rgba(26,21,18,0.6)]">
                    {exercises.length} exercice{exercises.length > 1 ? "s" : ""}, du plus simple au plus corsé. Essaie avant de regarder la correction !
                </p>
            </header>
            <div className="space-y-6">
                {exercises.map((ex, i) => (
                    <ExerciseCard
                        key={ex._id}
                        exercise={{ ...ex, content: ex.content || "" }}
                        index={i}
                        onAskQuestion={() => setAsking({ _id: ex._id, title: ex.title })}
                    />
                ))}
            </div>
            <ReadingFooter kind="exercises" id={sectionId} />

            {asking && (
                <AskQuestionModal
                    open
                    onClose={() => setAsking(null)}
                    contextType="exercise"
                    contextId={asking._id}
                    contextTitle={asking.title}
                />
            )}
        </div>
    );
}

/* ─────────────── Quiz d'un chapitre ─────────────── */

export interface QuizzesPayload {
    quizzes: { sectionId: string; sectionTitle: string; quizzes: Quiz[] };
}

export function QuizzesPage({ courseId, sectionId, initial }: { courseId: string; sectionId: string; initial: QuizzesPayload | null }) {
    const { data: session } = useSession();
    const { data, error } = useReaderData<QuizzesPayload>(courseId, `quiz=${sectionId}`, initial);
    const [results, setResults] = useState<Record<string, QuizCompletionResult>>({});
    const [running, setRunning] = useState<Quiz | null>(null);

    if (error) return <NotFound />;
    if (!data) return <Loading />;
    const { sectionTitle, quizzes } = data.quizzes;

    const start = async (quizId: string) => {
        const res = await fetch(`/api/quizzes/${quizId}`).catch(() => null);
        if (res?.ok) setRunning((await res.json()).quiz);
    };

    if (running) {
        return (
            <div className="mx-auto max-w-3xl">
                <QuizViewer
                    quiz={running as Quiz & { questions: NonNullable<Quiz["questions"]> }}
                    onClose={() => setRunning(null)}
                    onComplete={(result) => setResults((prev) => ({ ...prev, [running._id]: result }))}
                    isCompleted={!!results[running._id]}
                />
            </div>
        );
    }

    return (
        <div className="max-w-[56rem]">
            <ReadingBreadcrumb kind="quizzes" id={sectionId} label="Quiz" />
            <header className="mb-8 border-b border-[rgba(26,21,18,0.1)] pb-6">
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--wk-accent)]">Quiz</p>
                <h1 className="font-serif-display mt-2 text-3xl leading-[1.05] md:text-[2.6rem]">{sectionTitle}</h1>
            </header>
            {!session?.user && (
                <p className="mb-6 rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white px-4 py-3 text-sm text-[rgba(26,21,18,0.7)]">
                    Connecte-toi pour enregistrer ton score et gagner des points.
                </p>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {quizzes.map((quiz) => {
                    const r = results[quiz._id];
                    return (
                        <QuizCard
                            key={quiz._id}
                            quiz={r ? { ...quiz, completed: true, score: r.score, maxScore: r.maxScore, percentage: r.percentage } : quiz}
                            onStartQuiz={start}
                        />
                    );
                })}
            </div>
            <ReadingFooter kind="quizzes" id={sectionId} />
        </div>
    );
}
