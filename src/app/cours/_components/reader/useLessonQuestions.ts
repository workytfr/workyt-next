"use client";

import { useCallback, useEffect, useState } from "react";
import type { PassageAnchor } from "./passageAnchor";

export interface LessonQuestion {
    _id: string;
    title: string;
    slug?: string;
    status: string;
    createdAt: string;
    answerCount: number;
    anchor?: PassageAnchor;
    description?: { whatINeed?: string };
    user?: { _id: string; username: string };
}

/** Nombre de questions affichées dans la leçon ; au-delà, lien vers le forum */
export const LESSON_QUESTIONS_LIMIT = 10;

/** Questions les plus récentes posées sur une leçon */
export function useLessonQuestions(lessonId: string) {
    const [questions, setQuestions] = useState<LessonQuestion[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        let alive = true;
        fetch(`/api/forum/questions/by-context?type=lesson&id=${lessonId}&limit=${LESSON_QUESTIONS_LIMIT}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!alive || !data?.success) return;
                setQuestions(data.data);
                setTotal(data.pagination.totalQuestions);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [lessonId]);

    /** Ajoute en tête une question qui vient d'être publiée */
    const add = useCallback((q: LessonQuestion) => {
        setQuestions((prev) => [q, ...prev.filter((p) => p._id !== q._id)].slice(0, LESSON_QUESTIONS_LIMIT));
        setTotal((t) => t + 1);
    }, []);

    return { questions, total, add };
}
