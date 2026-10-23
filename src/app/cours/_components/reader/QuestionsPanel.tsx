"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, CheckCircle2, HelpCircle, Loader2, MessageCircle, Quote, X } from "lucide-react";
import MentionMarkdown from "@/app/forum/_components/MentionMarkdown";
import TimeAgo from "@/components/ui/TimeAgo";
import { buildIdSlug } from "@/utils/slugify";
import type { LessonQuestion } from "./useLessonQuestions";

interface QuestionsPanelProps {
    open: boolean;
    onClose: () => void;
    lessonId: string;
    questions: LessonQuestion[];
    total: number;
    limit: number;
    activeId: string | null;
    onSelect: (id: string | null) => void;
    /** Questions dont le passage n'existe plus dans la leçon */
    orphans: Set<string>;
    onAskLesson: () => void;
}

const statusChip = (status: string) =>
    status === "Résolue" || status === "Validée"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-[var(--wk-paper-2)] text-[rgba(26,21,18,0.65)]";

const statusLabel = (status: string) => (status === "Non validée" ? "En attente" : status);

/**
 * Panneau latéral des questions d'une leçon : la liste (plafonnée), puis le fil
 * d'une question avec ses réponses. La discussion complète vit sur le forum.
 */
export default function QuestionsPanel({ open, onClose, lessonId, questions, total, limit, activeId, onSelect, orphans, onAskLesson }: QuestionsPanelProps) {
    const active = questions.find((q) => q._id === activeId) || null;

    return (
        <AnimatePresence>
            {open && (
                <motion.aside
                    key="questions-panel"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
                    aria-label="Questions sur cette leçon"
                    className="fixed inset-x-0 bottom-0 top-[30dvh] z-[150] flex flex-col rounded-t-[28px] border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] shadow-[0_-12px_40px_rgba(26,21,18,0.18)] sm:inset-x-auto sm:right-3 sm:top-[84px] sm:bottom-3 sm:w-[400px] sm:rounded-[28px] print:hidden"
                >
                    <header className="flex items-center gap-3 border-b border-[rgba(26,21,18,0.08)] px-5 py-4">
                        {active ? (
                            <button
                                type="button"
                                onClick={() => onSelect(null)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(26,21,18,0.1)] bg-white hover:bg-[var(--wk-paper-2)]"
                                aria-label="Retour à la liste"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--wk-ink)] text-[var(--wk-accent-2)]">
                                <MessageCircle className="h-4 w-4" />
                            </span>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                                {active ? "Discussion" : `${total} question${total > 1 ? "s" : ""}`}
                            </p>
                            <p className="font-serif-display truncate text-xl leading-tight">
                                {active ? active.title : "Sur cette leçon"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(26,21,18,0.1)] bg-white hover:bg-[var(--wk-paper-2)]"
                            aria-label="Fermer les questions"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-4 py-4 notion-scrollbar">
                        {active ? (
                            <Thread key={active._id} question={active} orphan={orphans.has(active._id)} />
                        ) : questions.length === 0 ? (
                            <div className="px-3 py-10 text-center">
                                <HelpCircle className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                                <p className="mt-3 font-semibold">Aucune question pour l&apos;instant</p>
                                <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                                    Sélectionne un passage de la leçon pour poser la première.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-2.5">
                                {questions.map((q) => (
                                    <li key={q._id}>
                                        <button
                                            type="button"
                                            onClick={() => onSelect(q._id)}
                                            className="w-full rounded-2xl border border-[rgba(26,21,18,0.08)] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.2)]"
                                        >
                                            {q.anchor?.exact && (
                                                <p className="mb-2 line-clamp-2 border-l-2 border-[var(--wk-accent)] pl-2.5 text-xs italic text-[rgba(26,21,18,0.6)]">
                                                    « {q.anchor.exact} »
                                                    {orphans.has(q._id) && <span className="ml-1 not-italic text-amber-700">(passage modifié)</span>}
                                                </p>
                                            )}
                                            <p className="line-clamp-3 text-sm font-semibold leading-snug">{q.description?.whatINeed || q.title}</p>
                                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgba(26,21,18,0.55)]">
                                                <span>{q.user?.username ?? "Anonyme"}</span>
                                                <TimeAgo date={q.createdAt} />
                                                <span>{q.answerCount} réponse{q.answerCount > 1 ? "s" : ""}</span>
                                                <span className={`ml-auto rounded-full px-2 py-0.5 font-semibold ${statusChip(q.status)}`}>{statusLabel(q.status)}</span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {!active && (
                        <footer className="space-y-2 border-t border-[rgba(26,21,18,0.08)] px-5 py-4">
                            {total > limit && (
                                <Link
                                    href={`/forum?contextType=lesson&contextId=${lessonId}`}
                                    className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--wk-accent)] hover:underline"
                                >
                                    Voir les {total} questions sur le forum <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                            )}
                            <button type="button" onClick={onAskLesson} className="wk-btn-ink w-full !justify-center !py-2.5 text-sm">
                                <HelpCircle className="h-4 w-4" /> Question sur toute la leçon
                            </button>
                        </footer>
                    )}
                </motion.aside>
            )}
        </AnimatePresence>
    );
}

interface Answer {
    _id: string;
    content: string;
    status?: string;
    createdAt: string;
    user?: { _id: string; username: string };
}

/** Fil d'une question : citation, question, puis les réponses du forum */
function Thread({ question, orphan }: { question: LessonQuestion; orphan: boolean }) {
    const [answers, setAnswers] = useState<Answer[] | null>(null);
    const [failed, setFailed] = useState(false);
    const forumHref = `/forum/${buildIdSlug(question._id, question.slug || question.title)}`;

    useEffect(() => {
        let alive = true;
        fetch(`/api/forum/questions/${question._id}?limit=20`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data) => alive && setAnswers(data.answers || []))
            .catch(() => alive && setFailed(true));
        return () => {
            alive = false;
        };
    }, [question._id]);

    const knownUsers = [question.user, ...(answers ?? []).map((a) => a.user)].filter(Boolean) as { _id: string; username: string }[];

    return (
        <div className="space-y-4">
            {question.anchor?.exact && (
                <figure className="rounded-2xl border-l-4 border-[var(--wk-accent)] bg-white px-4 py-3">
                    <figcaption className="font-mono-ui mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                        <Quote className="h-3 w-3" /> Le passage {orphan && <span className="normal-case tracking-normal text-amber-700">· modifié depuis</span>}
                    </figcaption>
                    <blockquote className="text-sm italic leading-relaxed text-[rgba(26,21,18,0.8)]">« {question.anchor.exact} »</blockquote>
                </figure>
            )}

            <div className="rounded-2xl bg-white p-4">
                <p className="mb-2 text-xs text-[rgba(26,21,18,0.55)]">
                    <span className="font-semibold text-[var(--wk-ink)]">{question.user?.username ?? "Anonyme"}</span> · <TimeAgo date={question.createdAt} />
                </p>
                <MentionMarkdown content={question.description?.whatINeed} knownUsers={knownUsers} className="prose prose-sm max-w-none" />
            </div>

            <div>
                <p className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                    {answers ? `${answers.length} réponse${answers.length > 1 ? "s" : ""}` : "Réponses"}
                </p>
                {failed ? (
                    <p className="text-sm text-[rgba(26,21,18,0.6)]">Impossible de charger les réponses.</p>
                ) : !answers ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[rgba(26,21,18,0.4)]" />
                ) : answers.length === 0 ? (
                    <p className="text-sm text-[rgba(26,21,18,0.6)]">Pas encore de réponse. La communauté est prévenue !</p>
                ) : (
                    <ul className="space-y-2.5">
                        {answers.map((a) => {
                            const best = a.status === "Meilleure Réponse" || a.status === "Validée";
                            return (
                                <li key={a._id} className={`rounded-2xl border p-4 ${best ? "border-emerald-300 bg-emerald-50/60" : "border-[rgba(26,21,18,0.08)] bg-white"}`}>
                                    <p className="mb-2 flex items-center gap-1.5 text-xs text-[rgba(26,21,18,0.55)]">
                                        {best && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                                        <span className="font-semibold text-[var(--wk-ink)]">{a.user?.username ?? "Anonyme"}</span> · <TimeAgo date={a.createdAt} />
                                    </p>
                                    <MentionMarkdown content={a.content} knownUsers={knownUsers} className="prose prose-sm max-w-none" />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <Link href={forumHref} className="wk-btn-orange w-full !justify-center !py-2.5 text-sm">
                Répondre sur le forum <ArrowUpRight className="h-4 w-4" />
            </Link>
        </div>
    );
}
