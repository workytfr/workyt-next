"use client";

import React from "react";
import Image from "next/image";
import { MessageCircle, Paperclip, BookOpen, Dumbbell, Hand } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import BookmarkButton from "@/components/BookmarkButton";
import { buildIdSlug } from "@/utils/slugify";
import { StatusChip, plainExcerpt, relativeTime } from "./forumUi";
import AuthorLevel from "@/components/ui/AuthorLevel";
import ContentCard from "@/components/wk/ContentCard";

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
 * Une question dans la grille du forum. Même carte que les fiches
 * (ContentCard) : toute la carte est cliquable, le favori passe au-dessus.
 */
export default function QuestionCard({ q }: { q: ForumQuestion }) {
    const href = `/forum/${buildIdSlug(q._id, q.title)}`;
    const unanswered = (q.answerCount || 0) === 0 && (!q.status || q.status === "Non validée");
    const excerpt = plainExcerpt(q.description?.whatINeed || q.description?.whatIDid, 200);
    const attachments = q.attachments?.length || 0;

    return (
        <ContentCard
            href={href}
            title={q.title}
            subject={q.subject}
            level={q.classLevel}
            status={<StatusChip status={q.status} />}
            excerpt={excerpt}
            avatar={<ProfileAvatar username={q.user.username} points={q.user.points} size="small" userId={q.user._id} />}
            authorName={
                <>
                    <UsernameDisplay username={q.user.username} userId={q.user._id} className="truncate text-sm font-semibold" />
                    <AuthorLevel points={q.user.points} />
                </>
            }
            meta={relativeTime(q.createdAt)}
            stats={
                <>
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
                </>
            }
            action={<BookmarkButton questionId={q._id} size="sm" />}
        >
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
        </ContentCard>
    );
}
