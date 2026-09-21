"use client";

import React from "react";
import Link from "next/link";
import { Paperclip, Download, BookOpen, CheckCircle2, PenLine, Quote, FileText, ArrowUpRight, Target } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import MentionMarkdown from "./MentionMarkdown";
import { buildIdSlug } from "@/utils/slugify";
import ReportButton from "@/components/ReportButton";
import BookmarkButton from "@/components/BookmarkButton";
import { relativeTime } from "./forumUi";
import "katex/dist/katex.min.css";

/**
 * Le corps d'une question. Titre, auteur et statut sont affichés par l'en-tête
 * de la page (QuestionDetailPage) : cette carte se concentre sur le contenu.
 */
const QuestionDetail = ({
    question,
    revisions,
    onAnswerClick,
    onQuote,
}: {
    question: any;
    revisions: any[];
    onAnswerClick: () => void;
    onQuote?: (text: string, userId: string, username: string) => void;
}) => {
    // Extension d'un fichier joint, sans la query string
    const getFileExtension = (url: string) => {
        try {
            return url.split("?")[0].split(".").pop()?.toLowerCase();
        } catch {
            return null;
        }
    };

    const attachments: string[] = question.attachments || [];
    const closed = question.status === "Résolue" || question.status === "Validée";

    return (
        <article className="overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white">
            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-b border-[rgba(26,21,18,0.06)] px-5 py-3">
                <BookmarkButton questionId={question._id} size="sm" />
                <ReportButton contentId={question._id} contentType="forum_question" variant="button" size="sm" />
            </div>

            <div className="space-y-6 p-5 sm:p-7">
                {/* Ressource à l'origine de la question */}
                {question.contextType && question.contextType !== "general" && question.contextTitle && (
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] px-4 py-3">
                        <BookOpen className="h-4 w-4 shrink-0 text-[var(--wk-accent)]" />
                        <span className="text-sm text-[rgba(26,21,18,0.75)]">
                            À propos {question.contextType === "lesson" ? "de la leçon" : "de l'exercice"} : <strong>{question.contextTitle}</strong>
                        </span>
                        {question.courseId && (
                            <Link
                                href={`/cours/${question.courseId}?section=${question.sectionId || ""}&lesson=${question.contextType === "lesson" ? question.contextId : ""}`}
                                className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-[var(--wk-accent)] hover:underline"
                            >
                                Voir la ressource <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                )}

                {/* Les deux temps de la question, en sections numérotées comme la page d'accueil */}
                {[
                    { n: "01", title: "Ce que j'ai fait", Icon: PenLine, tile: "bg-[var(--wk-ink)] text-[var(--wk-accent-2)]", content: question.description.whatIDid },
                    { n: "02", title: "Ce dont j'ai besoin", Icon: Target, tile: "bg-[var(--wk-accent)] text-white", content: question.description.whatINeed },
                ].map((part, i) => (
                    <section
                        key={part.n}
                        className={`grid grid-cols-1 gap-4 md:grid-cols-[190px_minmax(0,1fr)] md:gap-8 ${i > 0 ? "border-t border-dashed border-[rgba(26,21,18,0.14)] pt-6" : ""}`}
                    >
                        <header className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${part.tile}`} aria-hidden="true">
                                <part.Icon className="h-5 w-5" />
                            </span>
                            <div>
                                <span className="font-mono-ui block text-[11px] uppercase tracking-[0.18em] text-[var(--wk-accent)]">{part.n}</span>
                                <h2 className="font-serif-display text-2xl leading-tight">{part.title}</h2>
                            </div>
                        </header>
                        <MentionMarkdown
                            content={part.content}
                            knownUsers={[question.user].filter(Boolean)}
                            className="prose max-w-none overflow-x-auto text-[rgba(26,21,18,0.85)] md:pt-1"
                        />
                    </section>
                ))}

                {/* Pièces jointes */}
                {attachments.length > 0 && (
                    <section>
                        <h2 className="font-mono-ui mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.55)]">
                            <Paperclip className="h-3.5 w-3.5" /> Pièces jointes ({attachments.length})
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {attachments.map((url, index) => {
                                const ext = getFileExtension(url);
                                const isImage = ["jpeg", "jpg", "png", "gif", "webp"].includes(ext || "");
                                const proxyUrl = `/api/file-proxy?questionId=${String(question._id ?? question.id ?? "")}&index=${index}`;
                                return (
                                    <a
                                        key={index}
                                        href={proxyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative block overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)]"
                                    >
                                        {isImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={proxyUrl} alt={`Pièce jointe ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                                        ) : (
                                            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2">
                                                <FileText className="h-8 w-8 text-[rgba(26,21,18,0.35)]" />
                                                <span className="text-xs font-semibold uppercase text-[rgba(26,21,18,0.6)]">{ext || "Fichier"}</span>
                                            </div>
                                        )}
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--wk-ink)]">
                                                <Download className="h-3.5 w-3.5" /> Ouvrir
                                            </span>
                                        </span>
                                    </a>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Fiches de révision liées */}
                {revisions && revisions.length > 0 && (
                    <section>
                        <h2 className="font-mono-ui mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                            <BookOpen className="h-3.5 w-3.5" /> Fiches de révision ({revisions.length})
                        </h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {revisions.map((revision) => (
                                <Link
                                    key={revision._id}
                                    href={`/fiches/${buildIdSlug(revision._id, revision.title || "")}`}
                                    className="group rounded-2xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] p-4 transition hover:border-emerald-300"
                                >
                                    <p className="font-semibold group-hover:text-emerald-700">{revision.title}</p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-[rgba(26,21,18,0.55)]">
                                        <ProfileAvatar username={revision.author.username} points={revision.author.points} userId={revision.author._id} size="small" />
                                        <UsernameDisplay username={revision.author.username} userId={revision.author._id} className="font-medium" />
                                        <span className="ml-auto">{relativeTime(revision.createdAt)}</span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm text-[rgba(26,21,18,0.65)]">{revision.content}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Répondre / citer, ou question fermée */}
            <div className="border-t border-[rgba(26,21,18,0.06)] bg-[var(--wk-paper)] px-5 py-4 sm:px-7">
                {!closed ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={onAnswerClick} className="wk-btn-ink !py-2.5 text-sm">
                            <PenLine className="h-4 w-4" /> Répondre à cette question
                        </button>
                        {onQuote && (
                            <button
                                type="button"
                                onClick={() => {
                                    const body = [
                                        question.description?.whatIDid && `**Ce qu'il/elle a fait :**\n${question.description.whatIDid}`,
                                        question.description?.whatINeed && `**Ce qu'il/elle cherche :**\n${question.description.whatINeed}`,
                                    ]
                                        .filter(Boolean)
                                        .join("\n\n");
                                    onQuote(body, String(question.user?._id ?? ""), question.user?.username ?? "auteur");
                                }}
                                className="wk-btn-ghost !py-2.5 text-sm"
                            >
                                <Quote className="h-4 w-4" /> Citer la question
                            </button>
                        )}
                    </div>
                ) : (
                    <p className={`flex items-center gap-2 text-sm font-semibold ${question.status === "Résolue" ? "text-emerald-700" : "text-[#2f86b3]"}`}>
                        <CheckCircle2 className="h-4 w-4" />
                        {question.status === "Résolue"
                            ? "Question résolue par l'auteur — on ne peut plus y répondre."
                            : "Question validée par l'équipe — on ne peut plus y répondre."}
                    </p>
                )}
            </div>
        </article>
    );
};

export default QuestionDetail;
