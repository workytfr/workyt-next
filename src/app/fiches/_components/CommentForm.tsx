"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { useSession } from "next-auth/react";
import { Send, Loader2, AlertTriangle } from "lucide-react";

const MAX_CHARS = 500;
const MIN_CHARS = 3;

interface CommentFormProps {
    revisionId: string;
    currentUser: { username: string; id: string };
    onPosted?: (comment: {
        id: string;
        content: string;
        username: string;
        userId: string;
        createdAt: string;
    }) => void;
    /** Temps réel : signaler la frappe (avec le nb de mots). */
    onTypingStart?: (wordCount: number) => void;
    /** Temps réel : signaler l'arrêt de la frappe. */
    onTypingStop?: () => void;
}

export default function CommentForm({ revisionId, currentUser, onPosted, onTypingStart, onTypingStop }: CommentFormProps) {
    const { data: session } = useSession();
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Temps réel : émettre la frappe + le nombre de mots (auto-stop après 2,5 s)
    useEffect(() => {
        if (!onTypingStart || content.trim().length === 0) return;
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        onTypingStart(wordCount);
        const t = setTimeout(() => onTypingStop?.(), 2500);
        return () => clearTimeout(t);
    }, [content, onTypingStart, onTypingStop]);

    // Stopper la frappe au démontage
    useEffect(() => {
        return () => {
            onTypingStop?.();
        };
    }, [onTypingStop]);

    const trimmed = content.trim();
    const charCount = content.length;
    const tooShort = trimmed.length > 0 && trimmed.length < MIN_CHARS;
    const tooLong = charCount > MAX_CHARS;
    const canSubmit = trimmed.length >= MIN_CHARS && !tooLong && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setLoading(true);

        try {
            const token = (session as any)?.accessToken || "";
            const response = await fetch("/api/comment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ revisionId, content: trimmed }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.message || "Erreur lors de l'ajout du commentaire.");
            }

            // Ajout optimiste dans la liste, plus de router.refresh
            const newComment = data.data;
            onPosted?.({
                id: String(newComment._id || newComment.id),
                content: trimmed,
                username: currentUser.username,
                userId: currentUser.id,
                createdAt: newComment.createdAt || new Date().toISOString(),
            });
            setContent("");
            onTypingStop?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
                placeholder="Partage ton avis, pose une question, ajoute une précision…"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS + 50))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />

            <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                    {error && (
                        <span className="inline-flex items-center gap-1 text-red-600">
                            <AlertTriangle size={12} /> {error}
                        </span>
                    )}
                    {tooLong && (
                        <span className="text-red-600">Dépasse la limite de {MAX_CHARS} caractères.</span>
                    )}
                    {tooShort && !tooLong && (
                        <span className="text-amber-600">Au moins {MIN_CHARS} caractères.</span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className={`${tooLong ? "text-red-600" : "text-gray-500"}`}>
                        {charCount}/{MAX_CHARS}
                    </span>
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className={`inline-flex items-center gap-1.5 ${
                            canSubmit ? "bg-black hover:bg-gray-800" : "bg-gray-300 cursor-not-allowed"
                        } text-white`}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Poster
                    </Button>
                </div>
            </div>
        </form>
    );
}
