"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BadgeCheck, BookOpen, ChevronRight, Download, Dumbbell, Layers, PartyPopper, Play, Trophy, Users } from "lucide-react";
import { SubjectLabel, LevelChip } from "@/components/wk/primitives";
import CourseDescription from "../CourseDescription";
import { useCourse } from "./CourseShell";
import { countLessons, courseHref, exercisesHref, flattenCurriculum, lessonHref, quizzesHref } from "../courseLinks";

// Chargé seulement à l'ouverture de l'onglet : évaluation, compétences et fiches
// font chacune leur propre appel réseau.
const CourseResources = dynamic(() => import("./CourseResources"), {
    loading: () => <div className="h-40 animate-pulse rounded-3xl bg-[var(--wk-paper-2)]" />,
});

type Tab = "sommaire" | "ressources";

/**
 * Accueil d'un cours : titre, description, reprise de lecture, téléchargement
 * PDF et sommaire. Évaluation, compétences et fiches sont regroupées dans
 * l'onglet « Ressources ».
 */
export default function CourseOverview() {
    const { curriculum, lastLessonId, percentage, readLessons } = useCourse();
    const [tab, setTab] = useState<Tab>("sommaire");

    const items = flattenCurriculum(curriculum);
    const first = items[0];
    const totalLessons = countLessons(curriculum);
    const resume = lastLessonId ? items.find((i) => i.kind === "lesson" && i.id === lastLessonId) : undefined;
    const done = totalLessons > 0 && percentage === 100;
    const readCount = curriculum.sections.reduce((n, s) => n + s.lessons.filter((l) => readLessons.has(l._id)).length, 0);
    const started = readCount > 0 && !done;
    const totalExercises = curriculum.sections.reduce((n, s) => n + s.exercisesCount, 0);
    const base = courseHref(curriculum);

    return (
        <div className="mx-auto max-w-5xl">
            {/* En-tête */}
            <header>
                <div className="flex flex-wrap items-center gap-2.5">
                    <SubjectLabel subject={curriculum.matiere} />
                    <LevelChip level={curriculum.niveau} />
                    {curriculum.verifiedBy && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                            <BadgeCheck className="h-3.5 w-3.5" /> Vérifié par {curriculum.verifiedBy.username}
                        </span>
                    )}
                </div>
                <h1 className="font-serif-display mt-4 text-[clamp(2.2rem,4.5vw,3.75rem)] leading-[0.98]">{curriculum.title}</h1>
                {curriculum.description && (
                    <div className="mt-5 max-w-3xl text-base leading-relaxed text-[rgba(26,21,18,0.68)]">
                        <CourseDescription content={curriculum.description} />
                    </div>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[rgba(26,21,18,0.55)]">
                    <span className="inline-flex items-center gap-1.5">
                        <Layers className="h-4 w-4" /> {curriculum.sections.length} chapitre{curriculum.sections.length > 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" /> {totalLessons} leçon{totalLessons > 1 ? "s" : ""}
                    </span>
                    {curriculum.authors.length > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> Écrit par {curriculum.authors.map((a) => a.username).join(", ")}
                        </span>
                    )}
                </div>
            </header>

            {/* Commencer / reprendre + PDF */}
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <div className="flex flex-col justify-between gap-5 rounded-3xl bg-[var(--wk-ink)] p-6 text-[var(--wk-paper)]">
                    <div>
                        <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/55">
                            {done ? "Cours terminé" : started ? "Ta progression" : "Prêt à commencer ?"}
                        </p>
                        {started || done ? (
                            <>
                                <p className="font-serif-display mt-2 text-3xl leading-none">
                                    {percentage}%{" "}
                                    <span className="text-base text-white/60">· {readCount}/{totalLessons} leçons lues</span>
                                </p>
                                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
                                    <div className="wk-xp-fill" style={{ width: `${percentage}%` }} />
                                </div>
                            </>
                        ) : (
                            <p className="font-serif-display mt-2 text-3xl leading-tight">
                                {curriculum.sections.length} chapitre{curriculum.sections.length > 1 ? "s" : ""} à ton rythme.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {resume && started ? (
                            <Link href={resume.href} className="wk-btn-orange !py-2.5 text-sm">
                                <Play className="h-4 w-4" /> Reprendre : {resume.label}
                            </Link>
                        ) : first ? (
                            <Link href={first.href} className="wk-btn-orange !py-2.5 text-sm">
                                <Play className="h-4 w-4" /> {done ? "Revoir le cours" : "Commencer le cours"}
                            </Link>
                        ) : null}
                        {done && (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--wk-accent-2)]">
                                <PartyPopper className="h-4 w-4" /> Bravo !
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5">
                    <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Hors ligne</p>
                    <p className="font-serif-display text-2xl leading-tight">Télécharge le cours en PDF</p>
                    <div className="mt-auto flex flex-col gap-2">
                        <a href={`${base}/imprimer?pdf=1`} target="_blank" rel="noopener" className="wk-btn-ink !justify-center !py-2.5 text-sm">
                            <Download className="h-4 w-4" /> Le cours
                        </a>
                        {totalExercises > 0 && (
                            <a href={`${base}/imprimer/exercices?pdf=1`} target="_blank" rel="noopener" className="wk-btn-ghost !justify-center !py-2.5 text-sm">
                                <Dumbbell className="h-4 w-4" /> Le cahier d&apos;exercices
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Onglets */}
            <div role="tablist" aria-label="Contenu du cours" className="mt-10 inline-flex rounded-full border border-[rgba(26,21,18,0.1)] bg-white p-1">
                {(["sommaire", "ressources"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        role="tab"
                        aria-selected={tab === t}
                        onClick={() => setTab(t)}
                        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                            tab === t ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]" : "text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-ink)]"
                        }`}
                    >
                        {t === "sommaire" ? "Sommaire" : "Ressources"}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {tab === "sommaire" ? (
                    <ol className="space-y-4" aria-label="Chapitres du cours">
                        {curriculum.sections.map((section, index) => (
                            <li key={section._id} className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 sm:p-6">
                                <div className="flex items-baseline gap-4">
                                    <span className="font-serif-display text-3xl leading-none text-[var(--wk-accent)]">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <h2 className="font-serif-display text-2xl leading-tight">{section.title}</h2>
                                </div>
                                {(section.lessons.length > 0 || section.exercisesCount > 0 || section.quizzesCount > 0) && (
                                    <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
                                        {section.lessons.map((lesson) => (
                                            <li key={lesson._id}>
                                                <Link
                                                    href={lessonHref(curriculum, lesson)}
                                                    className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition hover:bg-[var(--wk-paper-2)]"
                                                >
                                                    <BookOpen className={`h-4 w-4 shrink-0 ${readLessons.has(lesson._id) ? "text-emerald-600" : "text-[rgba(26,21,18,0.4)]"}`} />
                                                    <span className="flex-1">{lesson.title}</span>
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.3)] transition group-hover:translate-x-0.5" />
                                                </Link>
                                            </li>
                                        ))}
                                        {section.exercisesCount > 0 && (
                                            <li>
                                                <Link href={exercisesHref(curriculum, section)} className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--wk-paper-2)]">
                                                    <Dumbbell className="h-4 w-4 shrink-0 text-emerald-600" />
                                                    <span className="flex-1">{section.exercisesCount} exercice{section.exercisesCount > 1 ? "s" : ""}</span>
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.3)]" />
                                                </Link>
                                            </li>
                                        )}
                                        {section.quizzesCount > 0 && (
                                            <li>
                                                <Link href={quizzesHref(curriculum, section)} className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[var(--wk-paper-2)]">
                                                    <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                                                    <span className="flex-1">{section.quizzesCount} quiz</span>
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.3)]" />
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <CourseResources curriculum={curriculum} />
                )}
            </div>
        </div>
    );
}
