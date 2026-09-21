"use client";

import React, { useEffect, useState } from "react";
import { Flame, CalendarDays, CircleHelp, BookOpen, ClipboardCheck, AlertCircle } from "lucide-react";
import { api, formatDate } from "../../_lib/client";
import { Spinner } from "../ui";

interface Progress {
    grade: string | null;
    track: string | null;
    specialities: string[];
    upcomingExams: { subject: string; type: string; date: string }[];
    streak: { current: number; longest: number; lastActivity: string | null } | null;
    quizzes: { title: string; course: string | null; score: number; maxScore: number; wrong: number; total: number; completedAt: string }[];
    courses: { title: string; subject: string | null; lessonsRead: number; sectionsCompleted: number; lastAccessedAt: string }[];
    evaluations: { course: string; status: string; grade: number | null; submittedAt: string }[];
}

const EXAM_LABELS: Record<string, string> = {
    controle: "Contrôle",
    brevet: "Brevet",
    bac: "Bac",
    partiel: "Partiel",
    concours: "Concours",
};

/**
 * Le travail réel de l'élève sur Workyt, pour que le bénévole ne travaille pas
 * à l'aveugle. Réservé au bénévole en charge et à la modération.
 */
export default function ProgressPanel({ mentorshipId, studentName }: { mentorshipId: string; studentName: string }) {
    const [data, setData] = useState<Progress | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let alive = true;
        api<Progress>(`/api/suivi/${mentorshipId}/progress`)
            .then((d) => alive && setData(d))
            .catch(() => alive && setError(true));
        return () => {
            alive = false;
        };
    }, [mentorshipId]);

    if (error) return <p className="text-sm text-[rgba(26,21,18,0.55)]">Progression indisponible.</p>;
    if (!data) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    const empty = !data.quizzes.length && !data.courses.length && !data.evaluations.length;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-serif-display text-2xl">Sa progression</h3>
                <p className="mt-1 text-xs text-[rgba(26,21,18,0.55)]">
                    Ce que {studentName} fait sur Workyt ces dernières semaines. Visible de toi seul.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {data.grade && <span className="wk-chip">{data.grade}{data.track ? ` · ${data.track}` : ""}</span>}
                {data.specialities.map((s) => (
                    <span key={s} className="wk-chip">{s}</span>
                ))}
                {data.streak && (
                    <span className="wk-chip">
                        <Flame className="h-3.5 w-3.5 text-[var(--wk-accent)]" /> Série : {data.streak.current} j
                    </span>
                )}
            </div>

            {data.upcomingExams.length > 0 && (
                <section>
                    <h4 className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Examens à venir</h4>
                    <ul className="space-y-1.5">
                        {data.upcomingExams.map((e, i) => (
                            <li key={i} className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm">
                                <CalendarDays className="h-4 w-4 text-amber-700" />
                                <span className="font-semibold">{EXAM_LABELS[e.type] || e.type}</span>
                                <span className="text-[rgba(26,21,18,0.65)]">{e.subject}</span>
                                <span className="ml-auto text-xs text-amber-800">{formatDate(e.date)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {empty && (
                <div className="rounded-2xl border border-dashed border-[rgba(26,21,18,0.15)] p-5 text-center text-sm text-[rgba(26,21,18,0.55)]">
                    Pas encore d&apos;activité récente. Assigne-lui un quiz : tu verras ici ses résultats.
                </div>
            )}

            {data.quizzes.length > 0 && (
                <section>
                    <h4 className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Quiz récents</h4>
                    <ul className="space-y-1.5">
                        {data.quizzes.map((q, i) => {
                            const pct = q.maxScore ? Math.round((q.score / q.maxScore) * 100) : 0;
                            return (
                                <li key={i} className="rounded-xl border border-[rgba(26,21,18,0.08)] bg-white px-3 py-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CircleHelp className="h-4 w-4 shrink-0 text-[#9b6ef3]" />
                                        <span className="min-w-0 flex-1 truncate font-medium">{q.title}</span>
                                        <span className={`text-xs font-bold ${pct >= 70 ? "text-emerald-700" : pct >= 40 ? "text-amber-700" : "text-rose-700"}`}>
                                            {q.score}/{q.maxScore}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 pl-6 text-[11px] text-[rgba(26,21,18,0.55)]">
                                        {q.wrong > 0 && (
                                            <span className="inline-flex items-center gap-1 text-rose-700">
                                                <AlertCircle className="h-3 w-3" /> {q.wrong} erreur{q.wrong > 1 ? "s" : ""} sur {q.total}
                                            </span>
                                        )}
                                        <span className="ml-auto">{formatDate(q.completedAt, { day: "numeric", month: "short" })}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {data.courses.length > 0 && (
                <section>
                    <h4 className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Cours consultés</h4>
                    <ul className="space-y-1.5">
                        {data.courses.map((c, i) => (
                            <li key={i} className="flex items-center gap-2 rounded-xl border border-[rgba(26,21,18,0.08)] bg-white px-3 py-2 text-sm">
                                <BookOpen className="h-4 w-4 shrink-0 text-[var(--wk-accent)]" />
                                <span className="min-w-0 flex-1 truncate font-medium">{c.title}</span>
                                <span className="text-[11px] text-[rgba(26,21,18,0.55)]">
                                    {c.lessonsRead} leçon{c.lessonsRead > 1 ? "s" : ""} lue{c.lessonsRead > 1 ? "s" : ""}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {data.evaluations.length > 0 && (
                <section>
                    <h4 className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Évaluations</h4>
                    <ul className="space-y-1.5">
                        {data.evaluations.map((e, i) => (
                            <li key={i} className="flex items-center gap-2 rounded-xl border border-[rgba(26,21,18,0.08)] bg-white px-3 py-2 text-sm">
                                <ClipboardCheck className="h-4 w-4 shrink-0 text-[#e0a526]" />
                                <span className="min-w-0 flex-1 truncate font-medium">{e.course}</span>
                                <span className="text-xs font-bold">{e.grade !== null ? `${e.grade}/20` : "en correction"}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
