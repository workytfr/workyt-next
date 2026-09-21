"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Paperclip, BookOpen, Dumbbell, Hand } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import BookmarkButton from "@/components/BookmarkButton";
import { buildIdSlug } from "@/utils/slugify";
import { StatusChip, SubjectLabel, plainExcerpt, relativeTime } from "./forumUi";

export interface ForumQuestion {
    _id: string;
    title: string;
    user: { _id: string; username: string; points: number };
    subject: string;
    classLevel: string;
    points: number;
    createdAt: string;
    status?: string;
    description: { whatIDid: string; whatINeed: string };
    answerCount: number;
    attachments: Array<unknown>;
    contextType?: "lesson" | "exercise" | "general";
    contextTitle?: string;
    contextId?: string;
}

/**
 * Une question dans la grille du forum.
 *
 * Toute la carte est cliquable grâce à un lien « étiré » sur le titre (un vrai
 * <a>, accessible au clavier et aux lecteurs d'écran) ; les boutons internes
 * (favori) passent au-dessus avec `relative z-10`.
 */
export default function QuestionCard({ q }: { q: ForumQuestion }) {
    const href = `/forum/${buildIdSlug(q._id, q.title)}`;
    const unanswered = (q.answerCount || 0) === 0 && (!q.status || q.status === "Non validée");
    const excerpt = plainExcerpt(q.description?.whatINeed || q.description?.whatIDid, 200);
    const attachments = q.attachments?.length || 0;

    return (
        <article className="group relative flex h-full min-w-0 flex-col rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)] sm:p-6">
            {/* Matière · niveau · statut */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <SubjectLabel subject={q.subject} className="min-w-0" />
                <span className="shrink-0 rounded-full bg-[var(--wk-paper-2)] px-2 py-0.5 text-[11px] font-semibold text-[rgba(26,21,18,0.7)]">
                    {q.classLevel}
                </span>
                <StatusChip status={q.status} className="ml-auto shrink-0" />
            </div>

            <h2 className="font-serif-display mt-4 text-[1.35rem] leading-[1.15] text-[var(--wk-ink)] line-clamp-3 [overflow-wrap:anywhere]">
                <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--wk-accent)]">
                    {q.title}
                </Link>
            </h2>

            {excerpt && (
                <p className="mt-2.5 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3 [overflow-wrap:anywhere]">{excerpt}</p>
            )}

            {q.contextType && q.contextType !== "general" && q.contextTitle && (
                <span className="mt-3 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] px-2.5 py-1 text-[11px] font-medium text-[rgba(26,21,18,0.7)]">
                    {q.contextType === "lesson" ? <BookOpen className="h-3 w-3 shrink-0" /> : <Dumbbell className="h-3 w-3 shrink-0" />}
                    <span className="truncate">
                        {q.contextType === "lesson" ? "Leçon" : "Exercice"} : {q.contextTitle}
                    </span>
                </span>
            )}

            {unanswered && (
                <span className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-[#c24a0a]">
                    <Hand className="h-3.5 w-3.5" /> Personne n&apos;a encore répondu
                </span>
            )}

            {/* Auteur · réponses · mise */}
            <div className="mt-auto flex items-center gap-2.5 border-t border-[rgba(26,21,18,0.06)] pt-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <ProfileAvatar username={q.user.username} points={q.user.points} size="small" userId={q.user._id} />
                    <div className="min-w-0 leading-tight">
                        <UsernameDisplay username={q.user.username} userId={q.user._id} className="block truncate text-sm font-semibold" />
                        <span className="text-xs text-[rgba(26,21,18,0.5)]">{relativeTime(q.createdAt)}</span>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-[rgba(26,21,18,0.6)]">
                    <span className="inline-flex items-center gap-1" title={`${q.answerCount || 0} réponse(s)`}>
                        <MessageCircle className="h-4 w-4" /> {q.answerCount || 0}
                    </span>
                    {attachments > 0 && (
                        <span className="inline-flex items-center gap-1" title={`${attachments} pièce(s) jointe(s)`}>
                            <Paperclip className="h-3.5 w-3.5" /> {attachments}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800" title="Points misés sur la question">
                        <Image src="/badge/points.png" alt="" width={13} height={13} className="object-contain" /> {q.points}
                    </span>
                    <div className="relative z-10">
                        <BookmarkButton questionId={q._id} size="sm" />
                    </div>
                </div>
            </div>
        </article>
    );
}
