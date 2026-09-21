"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Layers, ArrowUpRight } from "lucide-react";
import BookmarkButton from "@/components/BookmarkButton";
import ProfileAvatar from "@/components/ui/profile";
import { SubjectLabel, LevelChip } from "@/components/wk/primitives";
import { buildIdSlug } from "@/utils/slugify";
import CourseDescription from "./CourseDescription";
import { CourseListing } from "./types";

/**
 * Un cours dans le catalogue. Même construction que les cartes du forum :
 * lien « étiré » sur le titre (toute la carte est cliquable, au clavier aussi),
 * le favori passe au-dessus avec `relative z-10`.
 */
export default function CourseCard({ course }: { course: CourseListing }) {
    const href = `/cours/${buildIdSlug(course._id, course.title)}`;
    const chapters = course.sections.length;
    const firstAuthor = course.authors[0];

    return (
        <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)]">
            {/* Visuel */}
            <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[var(--wk-paper-2)]">
                {course.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={course.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                    />
                ) : (
                    <div className="wk-dotgrid flex h-full w-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-[rgba(26,21,18,0.25)]" />
                    </div>
                )}
                <LevelChip level={course.niveau} className="absolute left-4 top-4 !bg-white/95 shadow-sm backdrop-blur" />
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
                <SubjectLabel subject={course.matiere} />

                <h2 className="font-serif-display mt-2.5 text-[1.4rem] leading-[1.12] text-[var(--wk-ink)] line-clamp-2">
                    <Link
                        href={href}
                        className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--wk-accent)]"
                    >
                        {course.title}
                    </Link>
                </h2>

                {course.description && (
                    <div className="mt-2.5 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3">
                        <CourseDescription content={course.description} maxLength={140} />
                    </div>
                )}

                {/* Premiers chapitres */}
                {chapters > 0 && (
                    <ol className="mt-4 space-y-1.5 border-t border-[rgba(26,21,18,0.06)] pt-4">
                        {course.sections.slice(0, 3).map((s, i) => (
                            <li key={s._id} className="flex items-center gap-2.5 text-xs text-[rgba(26,21,18,0.7)]">
                                <span className="font-mono-ui w-5 shrink-0 text-[10px] text-[var(--wk-accent)]">{String(i + 1).padStart(2, "0")}</span>
                                <span className="truncate">{s.title}</span>
                            </li>
                        ))}
                        {chapters > 3 && (
                            <li className="pl-[1.875rem] text-xs font-semibold text-[rgba(26,21,18,0.5)]">+ {chapters - 3} autre{chapters - 3 > 1 ? "s" : ""} chapitre{chapters - 3 > 1 ? "s" : ""}</li>
                        )}
                    </ol>
                )}

                {/* Auteur · chapitres · favori */}
                <div className="mt-auto flex items-center gap-2.5 pt-5">
                    {firstAuthor ? (
                        <>
                            <ProfileAvatar username={firstAuthor.username} image={firstAuthor.image} size="small" userId={firstAuthor._id} showPoints={false} />
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[rgba(26,21,18,0.7)]">{firstAuthor.username}</span>
                        </>
                    ) : (
                        <span className="min-w-0 flex-1 text-xs font-semibold text-[rgba(26,21,18,0.7)]">Workyt</span>
                    )}
                    {chapters > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-[rgba(26,21,18,0.55)]">
                            <Layers className="h-3.5 w-3.5" /> {chapters}
                        </span>
                    )}
                    <div className="relative z-10">
                        <BookmarkButton courseId={course._id} size="sm" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[rgba(26,21,18,0.35)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--wk-accent)]" />
                </div>
            </div>
        </article>
    );
}
