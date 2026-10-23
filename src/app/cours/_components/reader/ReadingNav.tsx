"use client";

import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Dumbbell, Home, Trophy } from "lucide-react";
import CourseEvaluation from "../CourseEvaluation";
import { useCourse } from "./CourseShell";
import { courseHref, findNeighbours, type NavItem, type NavKind } from "../courseLinks";

const KIND_ICON = { lesson: BookOpen, exercises: Dumbbell, quizzes: Trophy } as const;

/** Fil d'Ariane : Cours › Chapitre › élément courant */
export function ReadingBreadcrumb({ kind, id, label }: { kind: NavKind; id: string; label: string }) {
    const { curriculum } = useCourse();
    const { current } = findNeighbours(curriculum, kind, id);

    return (
        <nav aria-label="Fil d'Ariane" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-[rgba(26,21,18,0.55)] print:hidden">
            <Link href="/cours" className="inline-flex items-center gap-1 hover:text-[var(--wk-ink)]">
                <Home className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Cours</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link href={courseHref(curriculum)} className="max-w-[260px] truncate hover:text-[var(--wk-ink)]">
                {curriculum.title}
            </Link>
            {current && (
                <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-[220px] truncate">{current.sectionTitle}</span>
                </>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[240px] truncate font-semibold text-[var(--wk-accent)]">{label}</span>
        </nav>
    );
}

function NavCard({ item, dir }: { item: NavItem | null; dir: "prev" | "next" }) {
    if (!item) return <div className="hidden flex-1 sm:block" />;
    const Icon = KIND_ICON[item.kind];
    const next = dir === "next";
    return (
        <Link
            href={item.href}
            className={`group flex flex-1 items-center gap-3 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.2)] ${next ? "text-right" : ""}`}
        >
            {!next && <ChevronLeft className="h-5 w-5 shrink-0 text-[rgba(26,21,18,0.4)] transition group-hover:-translate-x-0.5" />}
            <span className="min-w-0 flex-1">
                <span className="font-mono-ui block text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">{next ? "Suivant" : "Précédent"}</span>
                <span className={`mt-1 flex items-center gap-2 font-semibold ${next ? "justify-end" : ""}`}>
                    <Icon className="h-4 w-4 shrink-0 text-[var(--wk-accent)]" />
                    <span className="truncate">{item.label}</span>
                </span>
            </span>
            {next && <ChevronRight className="h-5 w-5 shrink-0 text-[rgba(26,21,18,0.4)] transition group-hover:translate-x-0.5" />}
        </Link>
    );
}

/** Précédent / suivant, et l'évaluation du cours après le dernier élément */
export function ReadingFooter({ kind, id }: { kind: NavKind; id: string }) {
    const { curriculum } = useCourse();
    const { prev, next, isLast } = findNeighbours(curriculum, kind, id);

    return (
        <div className="mt-14 print:hidden">
            {(prev || next) && (
                <div className="flex flex-col gap-3 border-t border-[rgba(26,21,18,0.1)] pt-8 sm:flex-row">
                    <NavCard item={prev} dir="prev" />
                    <NavCard item={next} dir="next" />
                </div>
            )}
            {isLast && (
                <div className="mt-10">
                    <CourseEvaluation courseId={curriculum._id} />
                </div>
            )}
        </div>
    );
}
