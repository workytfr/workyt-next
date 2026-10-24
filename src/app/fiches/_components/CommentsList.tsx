"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, MessageCircle } from "lucide-react";
import { useThreadRealtime } from "@/hooks/useThreadRealtime";
import ForumPresenceBar from "@/app/forum/_components/ForumPresenceBar";
import { COMMENT_KIND_OPTIONS, type CommentDTO, type CommentKindValue } from "@/lib/comments";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

const PAGE_SIZE = 10;

type Sort = "recent" | "useful";

interface CommentsListProps {
    revisionId: string;
    ficheAuthorId?: string;
    currentUser?: { username: string; id: string } | null;
    /** Nombre total de commentaires (réponses comprises), pour le panneau latéral */
    onCountChange?: (count: number) => void;
}

/** Ouvre la fenêtre de connexion de la navbar */
const openAuth = () => window.dispatchEvent(new Event("workyt:open-auth"));

/** Applique une modification à un commentaire, qu'il soit principal ou une réponse */
function patchTree(list: CommentDTO[], id: string, patch: Partial<CommentDTO>): CommentDTO[] {
    return list.map((c) =>
        c.id === id
            ? { ...c, ...patch }
            : c.replies?.some((r) => r.id === id)
                ? { ...c, replies: c.replies.map((r) => (r.id === id ? { ...r, ...patch } : r)) }
                : c,
    );
}

export default function CommentsList({ revisionId, ficheAuthorId, currentUser, onCountChange }: CommentsListProps) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken as string | undefined;

    const [comments, setComments] = useState<CommentDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [totalTop, setTotalTop] = useState(0);
    const [sort, setSort] = useState<Sort>("recent");
    const [canPin, setCanPin] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [kind, setKind] = useState<CommentKindValue>("avis");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const loadedCount = useRef(0);
    const onCountChangeRef = useRef(onCountChange);
    useLayoutEffect(() => {
        loadedCount.current = comments.length;
        onCountChangeRef.current = onCountChange;
    });

    const fetchPage = useCallback(
        async (offset: number, limit: number) => {
            const res = await fetch(
                `/api/comment?revisionId=${revisionId}&offset=${offset}&limit=${limit}&sort=${sort}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} },
            );
            if (!res.ok) throw new Error("Erreur lors de la récupération.");
            return res.json() as Promise<{
                comments: CommentDTO[];
                viewer?: { canPin: boolean };
                pagination: { totalComments: number; totalTopLevel: number };
            }>;
        },
        [revisionId, sort, token],
    );

    const applyCounts = useCallback((t: number, top: number) => {
        setTotal(t);
        setTotalTop(top);
        onCountChangeRef.current?.(t);
    }, []);

    /** Recharge depuis le début (tri changé, temps réel, épinglage…) en gardant autant d'éléments */
    const reload = useCallback(async () => {
        try {
            const data = await fetchPage(0, Math.min(50, Math.max(PAGE_SIZE, loadedCount.current)));
            setComments(data.comments);
            setCanPin(!!data.viewer?.canPin);
            applyCounts(data.pagination.totalComments, data.pagination.totalTopLevel);
        } catch (err) {
            console.error(err);
        } finally {
            setInitialLoaded(true);
        }
    }, [fetchPage, applyCounts]);

    useEffect(() => {
        let cancelled = false;
        fetchPage(0, PAGE_SIZE)
            .then((data) => {
                if (cancelled) return;
                setComments(data.comments);
                setCanPin(!!data.viewer?.canPin);
                applyCounts(data.pagination.totalComments, data.pagination.totalTopLevel);
                // Lien direct vers un commentaire (notification, modération)
                const hash = window.location.hash;
                if (hash.startsWith("#comment-")) {
                    const id = hash.slice("#comment-".length);
                    setHighlightId(id);
                    requestAnimationFrame(() => document.getElementById(`comment-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
                }
            })
            .catch((err) => console.error(err))
            .finally(() => !cancelled && setInitialLoaded(true));
        return () => {
            cancelled = true;
        };
    }, [fetchPage, applyCounts]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const data = await fetchPage(comments.length, PAGE_SIZE);
            setComments((prev) => [...prev, ...data.comments.filter((c) => !prev.some((p) => p.id === c.id))]);
            applyCounts(data.pagination.totalComments, data.pagination.totalTopLevel);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Temps réel du fil de commentaires (présence + frappe + commentaires en direct)
    const { typingUsers, startTyping, stopTyping, presentMembers } = useThreadRealtime(
        revisionId ? `fiche:${revisionId}` : undefined,
        reload,
    );

    const handleUpdate = (id: string, patch: Partial<CommentDTO>) => setComments((prev) => patchTree(prev, id, patch));

    const handlePosted = (c: CommentDTO) => {
        // Sous le commentaire épinglé, s'il y en a un
        setComments((prev) => {
            const pinned = prev.filter((p) => p.pinned);
            return [...pinned, { ...c, replies: [] }, ...prev.filter((p) => !p.pinned)];
        });
        applyCounts(total + 1, totalTop + 1);
        setHighlightId(c.id);
    };

    const handleReplyPosted = (reply: CommentDTO) => {
        setComments((prev) =>
            prev.map((c) => (c.id === reply.parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c)),
        );
        applyCounts(total + 1, totalTop);
        setHighlightId(reply.id);
    };

    const handleDeleted = (c: CommentDTO) => {
        if (c.parentId) {
            setComments((prev) =>
                prev.map((p) => (p.id === c.parentId ? { ...p, replies: (p.replies ?? []).filter((r) => r.id !== c.id) } : p)),
            );
            applyCounts(Math.max(0, total - 1), totalTop);
        } else {
            setComments((prev) => prev.filter((p) => p.id !== c.id));
            applyCounts(Math.max(0, total - 1 - (c.replies?.length ?? 0)), Math.max(0, totalTop - 1));
        }
    };

    const handlePinChange = (id: string, pinned: boolean) => {
        setComments((prev) => {
            const next = prev.map((c) => ({ ...c, pinned: c.id === id ? pinned : pinned ? false : c.pinned }));
            const target = next.find((c) => c.id === id);
            return pinned && target ? [target, ...next.filter((c) => c.id !== id)] : next;
        });
        if (!pinned) void reload();
    };

    /** Encart vide : choisir un type de commentaire place le curseur dans le champ */
    const startWithKind = (k: CommentKindValue) => {
        if (!currentUser) return openAuth();
        setKind(k);
        textareaRef.current?.focus();
    };

    const hasMore = comments.length < totalTop;

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif-display text-2xl">
                    Discussion
                    {total > 0 && <span className="ml-2 text-base text-[rgba(26,21,18,0.45)]">({total})</span>}
                </h2>
                <div className="flex items-center gap-3">
                    <ForumPresenceBar members={presentMembers} />
                    {totalTop > 1 && (
                        <div className="inline-flex rounded-full bg-[var(--wk-paper-2)] p-0.5 text-xs font-medium" role="tablist" aria-label="Trier les commentaires">
                            {(
                                [
                                    ["recent", "Récents"],
                                    ["useful", "Plus utiles"],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={sort === value}
                                    onClick={() => setSort(value)}
                                    className={`rounded-full px-3 py-1 transition ${
                                        sort === value ? "bg-white text-[var(--wk-ink)] shadow-sm" : "text-[rgba(26,21,18,0.55)] hover:text-[var(--wk-ink)]"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Formulaire (si connecté) */}
            {!currentUser && (
                <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-[var(--wk-paper)] p-5 text-center sm:flex-row sm:text-left">
                    <MessageCircle className="h-5 w-5 shrink-0 text-[rgba(26,21,18,0.45)]" />
                    <p className="flex-1 text-sm text-[rgba(26,21,18,0.65)]">Connecte-toi pour commenter, répondre ou marquer un commentaire comme utile.</p>
                    <button type="button" onClick={openAuth} className="wk-btn-ink !py-2 text-sm">Se connecter</button>
                </div>
            )}
            {currentUser && (
                <div className="mt-5">
                    <CommentForm
                        revisionId={revisionId}
                        kind={kind}
                        onKindChange={setKind}
                        textareaRef={textareaRef}
                        onPosted={handlePosted}
                        onTypingStart={startTyping}
                        onTypingStop={stopTyping}
                    />
                </div>
            )}

            {/* Temps réel : commentaires en cours de rédaction */}
            {typingUsers.length > 0 && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-[rgba(26,21,18,0.55)]">
                    <span className="inline-flex items-end gap-0.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--wk-accent)] [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--wk-accent)] [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--wk-accent)] [animation-delay:300ms]" />
                    </span>
                    {typingUsers.length === 1
                        ? `${typingUsers[0].username || "Un membre"} est en train d'écrire…`
                        : `${typingUsers.length} membres sont en train d'écrire…`}
                </p>
            )}

            {/* Liste */}
            {!initialLoaded ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-[rgba(26,21,18,0.35)]" />
                </div>
            ) : comments.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[rgba(26,21,18,0.14)] bg-[var(--wk-paper)] px-5 py-7 text-center">
                    <p className="font-serif-display text-xl">Lance la discussion</p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-[rgba(26,21,18,0.6)]">
                        Une question sur un passage ? Une erreur repérée ? Un merci pour l&apos;auteur ? Ton commentaire aide aussi les prochains lecteurs.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {COMMENT_KIND_OPTIONS.filter((k) => k.value !== "avis").map((k) => (
                            <button
                                key={k.value}
                                type="button"
                                onClick={() => startWithKind(k.value)}
                                className="wk-chip transition hover:border-[var(--wk-ink)]"
                            >
                                <span aria-hidden>{k.emoji}</span> {k.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mt-2 divide-y divide-[rgba(26,21,18,0.07)]">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            revisionId={revisionId}
                            ficheAuthorId={ficheAuthorId}
                            canPin={canPin}
                            highlightId={highlightId}
                            onUpdate={handleUpdate}
                            onDeleted={handleDeleted}
                            onPinChange={handlePinChange}
                            onReplyPosted={handleReplyPosted}
                        />
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button type="button" onClick={loadMore} disabled={loadingMore} className="wk-btn-ghost !py-2 text-sm">
                        {loadingMore ? (
                            <>
                                <Loader2 size={14} className="animate-spin" /> Chargement…
                            </>
                        ) : (
                            `Voir plus de commentaires (${totalTop - comments.length})`
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
