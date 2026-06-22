"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { useSession } from "next-auth/react";
import ProfileAvatar from "@/components/ui/profile";

interface LikedByProps {
    revisionId: string;
    likedBy: { userId: { _id: string; username: string }; likedAt: string }[];
    initialLikes: number;
}

const LikedByList: React.FC<LikedByProps> = ({ revisionId, likedBy, initialLikes }) => {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken || "";
    const [likes, setLikes] = useState(initialLikes);
    const [hasLiked, setHasLiked] = useState(false);

    // Resynchronise le compteur si la fiche est rafraîchie (cache statique → valeur réelle),
    // sans écraser un like qu'on vient d'ajouter optimistiquement.
    useEffect(() => {
        setLikes((prev) => (initialLikes > prev ? initialLikes : prev));
    }, [initialLikes]);
    const [loading, setLoading] = useState(false);
    const [animate, setAnimate] = useState(false);

    const maxVisible = 5;
    const safeLikedBy = (likedBy || []).filter(
        (like): like is { userId: { _id: string; username: string }; likedAt: string } =>
            !!like && !!like.userId && typeof like.userId === "object" && !!like.userId._id && !!like.userId.username,
    );
    const visibleUsers = safeLikedBy.slice(0, maxVisible);
    const remainingUsers = safeLikedBy.length > maxVisible ? safeLikedBy.slice(maxVisible) : [];

    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!token) return;
            try {
                const response = await fetch(`/api/likes?revisionId=${revisionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (data.success) setHasLiked(data.hasLiked);
            } catch (error) {
                console.error("Erreur statut like :", error);
            }
        };
        fetchLikeStatus();
    }, [revisionId, token]);

    const handleLike = async () => {
        if (loading || hasLiked || !token) return;
        setLoading(true);
        try {
            const response = await fetch("/api/likes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ revisionId }),
            });
            const data = await response.json();
            if (data.success) {
                setLikes(data.likes);
                setHasLiked(true);
                setAnimate(true);
                setTimeout(() => setAnimate(false), 600);
            }
        } catch (error) {
            console.error("Erreur like :", error);
        } finally {
            setLoading(false);
        }
    };

    const buttonLabel = hasLiked
        ? "Tu as déjà aimé cette fiche"
        : loading
        ? "Envoi en cours…"
        : "Aimer cette fiche";

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Bouton like */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={handleLike}
                        disabled={loading || hasLiked || !token}
                        aria-label={buttonLabel}
                        className={`relative group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-200 ${
                            hasLiked
                                ? "bg-orange-50 border-orange-200 text-orange-700 cursor-not-allowed"
                                : loading
                                ? "bg-gray-100 border-gray-200 text-gray-500 cursor-wait"
                                : !token
                                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600 hover:shadow-sm active:scale-95"
                        }`}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Heart
                                size={16}
                                className={`${hasLiked ? "fill-orange-600 text-orange-600" : "text-current"} ${
                                    animate ? "animate-[heartPop_0.6s_ease-out]" : ""
                                }`}
                                strokeWidth={2}
                            />
                        )}
                        <span className="text-sm font-semibold tabular-nums">{likes}</span>
                        <span className="hidden sm:inline text-xs text-gray-500 font-normal">
                            {likes === 1 ? "like" : "likes"}
                        </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded">
                    {buttonLabel}
                </TooltipContent>
            </Tooltip>

            {/* Avatars des likers (séparés du bouton) */}
            {visibleUsers.length > 0 && (
                <div className="flex items-center -space-x-2">
                    {visibleUsers.map((like, index) => (
                        <Tooltip key={like.userId._id}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/compte/${like.userId._id}`}
                                    className="relative inline-block ring-2 ring-white rounded-full hover:z-10 hover:scale-110 transition-transform"
                                    style={{ zIndex: visibleUsers.length - index }}
                                >
                                    <ProfileAvatar
                                        username={like.userId.username}
                                        showPoints={false}
                                        userId={like.userId._id}
                                    />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded">
                                {like.userId.username}
                            </TooltipContent>
                        </Tooltip>
                    ))}

                    {remainingUsers.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="relative z-0 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold ring-2 ring-white hover:bg-gray-200 cursor-default">
                                    +{remainingUsers.length}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded max-w-xs">
                                {remainingUsers
                                    .slice(0, 20)
                                    .map((like) => like.userId.username)
                                    .join(", ")}
                                {remainingUsers.length > 20 && ` + ${remainingUsers.length - 20}`}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            )}

            <style jsx global>{`
                @keyframes heartPop {
                    0% { transform: scale(1); }
                    30% { transform: scale(1.35); }
                    60% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default LikedByList;
