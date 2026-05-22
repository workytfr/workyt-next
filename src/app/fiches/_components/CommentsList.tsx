"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { Button } from "@/components/ui/button";
import { MessageSquare, MessageSquarePlus, Loader2 } from "lucide-react";

interface Comment {
    id: string;
    username: string;
    content: string;
    userId: string;
    createdAt?: string;
}

interface CommentsListProps {
    revisionId: string;
    ficheAuthorId?: string;
    currentUser?: { username: string; id: string } | null;
}

export default function CommentsList({ revisionId, ficheAuthorId, currentUser }: CommentsListProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [initialLoaded, setInitialLoaded] = useState(false);

    const fetchComments = useCallback(
        async (targetPage: number) => {
            if (loading) return;
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/comment?revisionId=${revisionId}&page=${targetPage}&limit=5`,
                );
                if (!response.ok) throw new Error("Erreur lors de la récupération.");
                const data = await response.json();
                setComments((prev) => {
                    const newOnes = data.comments.filter(
                        (c: Comment) => !prev.some((p) => p.id === c.id),
                    );
                    return targetPage === 1 ? data.comments : [...prev, ...newOnes];
                });
                setHasMore(data.pagination.currentPage < data.pagination.totalPages);
                setTotal(data.pagination.totalComments ?? 0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
                setInitialLoaded(true);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [revisionId],
    );

    useEffect(() => {
        fetchComments(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handlePosted = (newComment: Comment) => {
        setComments((prev) => [newComment, ...prev]);
        setTotal((t) => t + 1);
    };

    const handleDeleted = (id: string) => {
        setComments((prev) => prev.filter((c) => c.id !== id));
        setTotal((t) => Math.max(0, t - 1));
    };

    return (
        <div className="space-y-4">
            {/* Header avec compteur */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-100">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-700 inline-flex items-center gap-2">
                    <MessageSquare size={16} className="text-orange-600" />
                    Commentaires
                    {total > 0 && (
                        <span className="text-gray-400 font-normal normal-case tracking-normal">
                            ({total})
                        </span>
                    )}
                </h3>
            </div>

            {/* Formulaire (si connecté) */}
            {currentUser && (
                <CommentForm
                    revisionId={revisionId}
                    currentUser={currentUser}
                    onPosted={handlePosted}
                />
            )}

            {/* Liste des commentaires */}
            {!initialLoaded ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-gray-400" />
                </div>
            ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 text-orange-600 mb-3">
                        <MessageSquarePlus size={22} />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">Pas encore de commentaire</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Sois le premier à partager ton avis sur cette fiche.
                    </p>
                </div>
            ) : (
                <div>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            id={comment.id}
                            username={comment.username}
                            content={comment.content}
                            userId={comment.userId}
                            createdAt={comment.createdAt}
                            isFicheAuthor={!!ficheAuthorId && comment.userId === ficheAuthorId}
                            ficheAuthorId={ficheAuthorId}
                            onDeleted={handleDeleted}
                        />
                    ))}

                    {hasMore && (
                        <div className="flex justify-center pt-3">
                            <Button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={loading}
                                className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin mr-2" />
                                        Chargement…
                                    </>
                                ) : (
                                    "Voir plus de commentaires"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
