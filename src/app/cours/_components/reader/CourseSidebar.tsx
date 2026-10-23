"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, Dumbbell, Trophy } from "lucide-react";
import { useCourse } from "./CourseShell";
import { courseHref, exercisesHref, lessonHref, quizzesHref } from "../courseLinks";

/**
 * Sommaire du cours : les chapitres et leurs leçons, une coche par leçon lue.
 * Seul le chapitre en cours est déplié par défaut.
 */
export default function CourseSidebar({ className = "" }: { className?: string }) {
    const { curriculum, readLessons, percentage } = useCourse();
    const pathname = usePathname();
    const activeRef = useRef<HTMLAnchorElement>(null);

    const isActive = (href: string) => pathname === href;
    const currentSection = curriculum.sections.find(
        (s) =>
            s.lessons.some((l) => isActive(lessonHref(curriculum, l))) ||
            isActive(exercisesHref(curriculum, s)) ||
            isActive(quizzesHref(curriculum, s))
    );

    const [open, setOpen] = useState<Set<string>>(() => new Set(currentSection ? [currentSection._id] : []));

    // Le chapitre courant s'ouvre quand on y navigue
    const [openedFor, setOpenedFor] = useState(currentSection?._id);
    if (currentSection && openedFor !== currentSection._id) {
        setOpenedFor(currentSection._id);
        if (!open.has(currentSection._id)) setOpen(new Set(open).add(currentSection._id));
    }

    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "nearest" });
    }, [pathname]);

    const toggle = (id: string) =>
        setOpen((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const itemCls = (active: boolean) =>
        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm leading-snug transition ${
            active
                ? "bg-[var(--wk-ink)] font-semibold text-[var(--wk-paper)]"
                : "text-[rgba(26,21,18,0.75)] hover:bg-[var(--wk-paper-2)] hover:text-[var(--wk-ink)]"
        }`;

    return (
        <nav aria-label="Sommaire du cours" className={`flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white ${className}`}>
            <div className="border-b border-[rgba(26,21,18,0.06)] p-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Sommaire</p>
                <Link href={courseHref(curriculum)} className="font-serif-display mt-1 line-clamp-2 block text-lg leading-tight hover:text-[var(--wk-accent)]">
                    {curriculum.title}
                </Link>
                <div className="mt-3 flex items-center gap-2">
                    <div className="wk-xp-bar h-2 flex-1">
                        <div className="wk-xp-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[rgba(26,21,18,0.6)]">{percentage}%</span>
                </div>
            </div>

            <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 notion-scrollbar">
                {curriculum.sections.map((section, index) => {
                    const expanded = open.has(section._id);
                    const read = section.lessons.filter((l) => readLessons.has(l._id)).length;
                    const done = section.lessons.length > 0 && read === section.lessons.length;
                    return (
                        <li key={section._id}>
                            <button
                                type="button"
                                onClick={() => toggle(section._id)}
                                aria-expanded={expanded}
                                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--wk-paper-2)]"
                            >
                                <span className={`font-serif-display w-6 shrink-0 text-lg leading-none ${done ? "text-emerald-600" : "text-[var(--wk-accent)]"}`}>
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{section.title}</span>
                                <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-[rgba(26,21,18,0.4)] transition ${expanded ? "rotate-180" : ""}`} />
                            </button>

                            {expanded && (
                                <ul className="mb-2 ml-4 space-y-0.5 border-l border-[rgba(26,21,18,0.08)] pl-2">
                                    {section.lessons.map((lesson) => {
                                        const href = lessonHref(curriculum, lesson);
                                        const active = isActive(href);
                                        const isRead = readLessons.has(lesson._id);
                                        return (
                                            <li key={lesson._id}>
                                                <Link href={href} ref={active ? activeRef : undefined} className={itemCls(active)} aria-current={active ? "page" : undefined}>
                                                    <span
                                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                            isRead ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-white/40" : "border-[rgba(26,21,18,0.2)]"
                                                        }`}
                                                    >
                                                        {isRead && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">{lesson.title}</span>
                                                    {lesson.status && lesson.status !== "Validée" && (
                                                        <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">à valider</span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                    {section.exercisesCount > 0 && (
                                        <li>
                                            <Link href={exercisesHref(curriculum, section)} className={itemCls(isActive(exercisesHref(curriculum, section)))}>
                                                <Dumbbell className="h-4 w-4 shrink-0" />
                                                <span className="flex-1">Exercices</span>
                                                <span className="text-xs opacity-60">{section.exercisesCount}</span>
                                            </Link>
                                        </li>
                                    )}
                                    {section.quizzesCount > 0 && (
                                        <li>
                                            <Link href={quizzesHref(curriculum, section)} className={itemCls(isActive(quizzesHref(curriculum, section)))}>
                                                <Trophy className="h-4 w-4 shrink-0" />
                                                <span className="flex-1">Quiz</span>
                                                <span className="text-xs opacity-60">{section.quizzesCount}</span>
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
