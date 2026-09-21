"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronRight, MessageCircle, PenLine, RefreshCw, AlertTriangle, ArrowUpRight, HeartHandshake } from "lucide-react";
import AnswerForm from "@/app/forum/_components/AnswerForm";
import QuestionDetail from "@/app/forum/_components/QuestionView";
import AnswerList from "@/app/forum/_components/AnswerList";
import { QuestionSkeleton, AnswerSkeleton } from "@/app/forum/_components/QuestionSkeleton";
import ForumPresenceBar from "@/app/forum/_components/ForumPresenceBar";
import TypingSkeleton from "@/app/forum/_components/TypingSkeleton";
import SuiviSuggestion from "@/app/forum/_components/SuiviSuggestion";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import { useForumRealtime } from "@/hooks/useForumRealtime";
import { subjectToSlug, levelToSlug } from "@/utils/subjectSlug";
import { FORUM_CONTAINER, StatusChip, SubjectLabel, relativeTime } from "./forumUi";
import "katex/dist/katex.min.css";

interface QuestionDetailPageProps {
    id?: string;
    initialQuestion?: any;
    initialAnswers?: any[];
}

export default function QuestionDetailPage({
    id: propId,
    initialQuestion,
    initialAnswers,
}: QuestionDetailPageProps) {
    const { data: session } = useSession();
    const params = useParams();
    // Utilisez l'ID passé en prop s'il existe, sinon récupérez-le depuis l'URL
    const rawId = propId || params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const [question, setQuestion] = useState<any>(initialQuestion ?? null);
    const [answers, setAnswers] = useState<any[]>(initialAnswers ?? []);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(!initialQuestion);
    const [error, setError] = useState<string | null>(null);
    const [quoteTrigger, setQuoteTrigger] = useState<{ quotedMarkdown: string; key: number } | null>(null);

    const formatQuote = (text: string, userId: string, fallbackName: string): string => {
        const prefixed = text
            .split("\n")
            .map((l) => `> ${l}`)
            .join("\n");
        // Placeholder dynamique : sera résolu au rendu (pseudo + avatar actuels)
        const ref = userId ? `@[user:${userId}]` : `@${fallbackName}`;
        return `> ${ref} a écrit :\n>\n${prefixed}\n\n`;
    };

    const handleQuote = useCallback((text: string, userId: string, username: string) => {
        setQuoteTrigger({
            quotedMarkdown: formatQuote(text, userId, username),
            key: Date.now(),
        });
    }, []);

    const scrollToAnswerForm = useCallback(() => {
        const el = document.getElementById("answer-form");
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            // Auto-click pour déplier le formulaire si replié
            setTimeout(() => {
                const btn = el.querySelector<HTMLElement>("button");
                if (btn && btn.getAttribute("type") === "button") btn.click();
            }, 350);
        }
    }, []);

    const fetchQuestion = useCallback(async () => {
        if (!id) return;
        // Premier passage : si on a déjà la donnée pré-chargée côté serveur,
        // on lance le fetch en arrière-plan sans afficher le skeleton.
        const hasInitial = !!initialQuestion;
        if (!hasInitial) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await fetch(`/api/forum/questions/${id}?page=1&limit=10`);
            const data = await response.json();

            if (!data.success) {
                throw new Error("Échec de récupération des données.");
            }

            setQuestion(data.question);
            setAnswers(data.answers);
            setRevisions(data.revisions);
        } catch (error) {
            console.error("Erreur de récupération de la question", error);
            if (!hasInitial) {
                setError("Une erreur s'est produite lors du chargement des données.");
            }
        } finally {
            setLoading(false);
        }
    }, [id, initialQuestion]);

    useEffect(() => {
        fetchQuestion();
    }, [fetchQuestion]);

    // Temps réel : réponses en direct + indicateur de frappe + présence
    const { typingUsers, startTyping, stopTyping, presentMembers } = useForumRealtime(id, fetchQuestion);


    const open = question?.status === "Non validée" || !question?.status;
    const isAuthor = !!session?.user && !!question?.user && (session.user as { id?: string }).id === String(question.user._id);

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            {/* ─── En-tête ─── */}
            <header className="border-b border-[rgba(26,21,18,0.08)]">
                <div className={`${FORUM_CONTAINER} pb-8 pt-8 md:pb-10 md:pt-10`}>
                    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-[rgba(26,21,18,0.55)]">
                        <Link href="/" className="hover:text-[var(--wk-accent)]">Accueil</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href="/forum" className="hover:text-[var(--wk-accent)]">Forum</Link>
                        {question?.subject && (
                            <>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <Link href={`/forum/matiere/${subjectToSlug(question.subject)}`} className="hover:text-[var(--wk-accent)]">
                                    {question.subject}
                                </Link>
                            </>
                        )}
                        {question?.classLevel && (
                            <>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <Link href={`/forum/niveau/${levelToSlug(question.classLevel)}`} className="hover:text-[var(--wk-accent)]">
                                    {question.classLevel}
                                </Link>
                            </>
                        )}
                    </nav>

                    {question ? (
                        <>
                            <div className="mt-6 flex flex-wrap items-center gap-2.5">
                                <SubjectLabel subject={question.subject} />
                                <span className="rounded-full bg-[var(--wk-paper-2)] px-2.5 py-0.5 text-xs font-semibold text-[rgba(26,21,18,0.7)]">
                                    {question.classLevel}
                                </span>
                                <StatusChip status={question.status} />
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                    <Image src="/badge/points.png" alt="" width={13} height={13} className="object-contain" />
                                    {question.points} pts misés
                                </span>
                            </div>
                            <h1 className="font-serif-display mt-4 max-w-5xl text-[clamp(1.9rem,4vw,3.25rem)] leading-[1.02]">{question.title}</h1>
                            <div className="mt-5 flex items-center gap-3">
                                <ProfileAvatar username={question.user.username} points={question.user.points} size="small" userId={question.user._id} />
                                <div className="leading-tight">
                                    <Link href={`/compte/${question.user._id}`} className="hover:underline">
                                        <UsernameDisplay username={question.user.username} userId={question.user._id} className="text-sm font-semibold" />
                                    </Link>
                                    <span className="block text-xs text-[rgba(26,21,18,0.5)]">a demandé {relativeTime(question.createdAt)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="mt-6 h-12 w-2/3 animate-pulse rounded-2xl bg-white/70" />
                    )}
                </div>
            </header>

            <div className={`${FORUM_CONTAINER} py-8 md:py-10`}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
                    {/* ─── Colonne principale ─── */}
                    <main className="min-w-0 space-y-6">
                        {loading ? (
                            <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6">
                                <QuestionSkeleton />
                            </div>
                        ) : error ? (
                            <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
                                <div className="flex items-center gap-3 text-red-700">
                                    <AlertTriangle className="h-6 w-6" />
                                    <div>
                                        <h2 className="font-semibold">Erreur</h2>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={fetchQuestion} className="wk-btn-ink mt-4 !py-2 text-sm">
                                    <RefreshCw className="h-4 w-4" /> Réessayer
                                </button>
                            </div>
                        ) : (
                            question && (
                                <QuestionDetail
                                    question={question}
                                    revisions={revisions}
                                    onAnswerClick={scrollToAnswerForm}
                                    onQuote={handleQuote}
                                />
                            )
                        )}

                        {/* Passerelle vers le suivi personnalisé (visible de l'auteur seulement) */}
                        {!loading && question && session && <SuiviSuggestion questionId={id as string} />}

                        {/* Formulaire de réponse inline (carte qui se déplie au clic) */}
                        {!loading && question && (
                            <div id="answer-form" className="scroll-mt-24">
                                <AnswerForm
                                    questionId={id as string}
                                    questionStatus={question.status}
                                    quoteTrigger={quoteTrigger}
                                    onTypingStart={startTyping}
                                    onTypingStop={stopTyping}
                                    onSubmitted={(answer) => {
                                        if (answer) setAnswers((prev) => [answer, ...prev]);
                                        else fetchQuestion();
                                    }}
                                />
                            </div>
                        )}

                        {/* Indicateur temps réel : réponses en cours de rédaction (squelette + compteur de mots) */}
                        {!loading && question && typingUsers.length > 0 && (
                            <div className="space-y-3">
                                {typingUsers.slice(0, 3).map((u) => (
                                    <TypingSkeleton key={u.userId} user={u} />
                                ))}
                                {typingUsers.length > 3 && (
                                    <p className="pl-1 text-sm text-[rgba(26,21,18,0.45)]">
                                        + {typingUsers.length - 3} autre
                                        {typingUsers.length - 3 > 1 ? "s" : ""} en train d&apos;écrire…
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Réponses */}
                        {loading ? (
                            <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6">
                                <AnswerSkeleton />
                            </div>
                        ) : (
                            <AnswerList answers={answers} question={question} onQuote={handleQuote} />
                        )}
                    </main>

                    {/* ─── Panneau latéral ─── */}
                    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                        {question && (
                            <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">
                                        {answers.length} réponse{answers.length > 1 ? "s" : ""}
                                    </span>
                                    <StatusChip status={question.status} />
                                </div>
                                {open ? (
                                    <>
                                        <p className="mt-2 text-sm text-[rgba(26,21,18,0.6)]">
                                            {answers.length === 0
                                                ? "Personne n'a encore répondu. Ta réponse peut tout débloquer."
                                                : "Tu peux encore proposer ta réponse."}
                                        </p>
                                        <button type="button" onClick={scrollToAnswerForm} className="wk-btn-orange mt-4 w-full justify-center !py-2.5 text-sm">
                                            <PenLine className="h-4 w-4" /> Répondre
                                        </button>
                                        <p className="mt-2 text-center text-[11px] text-[rgba(26,21,18,0.5)]">
                                            Réponse validée = {question.points} pts pour toi
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-2 text-sm text-[rgba(26,21,18,0.6)]">
                                        {question.status === "Résolue" ? "L'auteur a choisi la meilleure réponse." : "Une réponse a été validée par l'équipe."}
                                    </p>
                                )}
                                {presentMembers.length > 0 && (
                                    <div className="mt-4 border-t border-[rgba(26,21,18,0.06)] pt-4">
                                        <ForumPresenceBar members={presentMembers} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* L'autre porte d'entrée : pour l'auteur, la bannière SuiviSuggestion suffit */}
                        {!isAuthor && (
                            <Link
                                href={`/suivi${question?.subject ? `?subject=${encodeURIComponent(question.subject)}&level=${encodeURIComponent(question.classLevel || "")}` : ""}#demande`}
                                className="group block rounded-3xl bg-[var(--wk-ink)] p-5 text-[var(--wk-paper)] transition hover:-translate-y-0.5"
                            >
                                <HeartHandshake className="h-6 w-6 text-[var(--wk-accent-2)]" />
                                <p className="font-serif-display mt-3 text-2xl leading-tight">Besoin d&apos;un coup de main régulier ?</p>
                                <p className="mt-1.5 text-sm text-white/65">
                                    Un bénévole de l&apos;association t&apos;accompagne pendant quelques semaines. Gratuit.
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--wk-accent-2)]">
                                    Demander un suivi <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        )}

                        {question?.subject && (
                            <div className="rounded-3xl bg-[var(--wk-paper-2)] p-5 text-sm">
                                <p className="font-semibold">Continuer en {question.subject}</p>
                                <div className="mt-3 flex flex-col gap-2">
                                    <Link href={`/forum/matiere/${subjectToSlug(question.subject)}`} className="inline-flex items-center gap-2 font-medium text-[rgba(26,21,18,0.75)] hover:text-[var(--wk-accent)]">
                                        <MessageCircle className="h-4 w-4" /> Toutes les questions de {question.subject}
                                    </Link>
                                    <Link href={`/forum/creer?subject=${encodeURIComponent(question.subject)}&classLevel=${encodeURIComponent(question.classLevel || "")}`} className="inline-flex items-center gap-2 font-medium text-[rgba(26,21,18,0.75)] hover:text-[var(--wk-accent)]">
                                        <PenLine className="h-4 w-4" /> Poser ma propre question
                                    </Link>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
