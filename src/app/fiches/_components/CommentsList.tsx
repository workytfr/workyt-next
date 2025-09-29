"use client";

import React, { useEffect, useState } from "react";
import CommentItem from "./CommentItem";
import { Button } from "@/components/ui/button";

interface Comment {
    id: string;
    username: string;
    content: string;
    userId: string;
}

interface CommentsListProps {
    revisionId: string;
}

const CommentsList: React.FC<CommentsListProps> = ({ revisionId }) => {
    const [comments, setComments] = useState<Comment[]>([]); // Liste des commentaires
    const [page, setPage] = useState(1); // Numéro de page
    const [hasMore, setHasMore] = useState(true); // Indique s'il reste des pages à charger
    const [loading, setLoading] = useState(false); // Indique si une requête est en cours

    const fetchComments = async () => {
        if (loading) return; // Empêche une requête en double
        setLoading(true);

        try {
            const response = await fetch(`/api/comment?revisionId=${revisionId}&page=${page}&limit=5`);
            if (!response.ok) throw new Error("Erreur lors de la récupération des commentaires.");
            const data = await response.json();

            // Ajout des nouveaux commentaires en évitant les doublons
            setComments((prev) => {
                const newComments = data.comments.filter(
                    (newComment: Comment) => !prev.some((comment) => comment.id === newComment.id)
                );
                return [...prev, ...newComments];
            });

            setHasMore(data.pagination.currentPage < data.pagination.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [page]);

    return (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-300 space-y-4">
            <div>
                {comments.map((comment) => (
                    <CommentItem key={comment.id} username={comment.username} content={comment.content} userId={comment.userId} />
                ))}
            </div>
            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={loading} // Désactiver le bouton si une requête est en cours
                    >
                        {loading ? "Chargement..." : "Charger plus"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CommentsList;
