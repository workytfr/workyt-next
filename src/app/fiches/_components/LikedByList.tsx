import React, { useState, useEffect } from "react";
import { HeartIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { useSession } from "next-auth/react";
import ProfileAvatar from "@/components/ui/profile";

interface LikedByProps {
    revisionId: string; // ID de la fiche
    likedBy: { userId: { _id: string; username: string }; likedAt: string }[]; // Format corrigé pour likedBy
    initialLikes: number;
}

const LikedByList: React.FC<LikedByProps> = ({ revisionId, likedBy, initialLikes }) => {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken || ""; // Récupération du token JWT
    const [likes, setLikes] = useState(initialLikes);
    const [hasLiked, setHasLiked] = useState(false);
    const [loading, setLoading] = useState(false);

    const maxVisible = 5;
    const visibleUsers = likedBy.slice(0, maxVisible);
    const remainingUsers = likedBy.length > maxVisible ? likedBy.slice(maxVisible) : [];

    // Vérification du statut du like
    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!token) return;
            try {
                const response = await fetch(`/api/likes?revisionId=${revisionId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (data.success) {
                    setHasLiked(data.hasLiked);
                } else {
                    console.error("Erreur lors de la vérification du like :", data.message);
                }
            } catch (error) {
                console.error("Erreur lors de la vérification du statut du like :", error);
            }
        };

        fetchLikeStatus();
    }, [revisionId, token]);

    // Gestion du like/dislike
    const handleLike = async () => {
        if (loading || !token) return;

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
                setLikes(data.likes); // Met à jour le nombre de likes
                setHasLiked(!hasLiked); // Inverse l'état local
            } else {
                console.error("Erreur lors du traitement du like :", data.message);
            }
        } catch (error) {
            console.error("Erreur lors de l'appel API :", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {/* Liste des utilisateurs visibles */}
            {visibleUsers.map((like) => (
                <ProfileAvatar
                    key={like.userId._id}
                    username={like.userId.username}
                    showPoints={false} // On désactive les points pour ce contexte
                />
            ))}

            {/* Tooltip pour les utilisateurs restants */}
            {remainingUsers.length > 0 && (
                <Tooltip>
                    <TooltipTrigger>
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full text-sm font-medium text-gray-600">
                            +{remainingUsers.length}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-sm">
                            {remainingUsers.map((like) => like.userId.username).join(", ")}
                        </p>
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Bouton de like */}
            <button
                onClick={handleLike}
                disabled={loading}
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    hasLiked ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                } shadow hover:bg-red-400 transition duration-300`}
                aria-label={hasLiked ? "Retirer le like" : "Ajouter un like"}
            >
                <HeartIcon className="w-4 h-4" />
            </button>

            {/* Badge pour les likes */}
            <div className="flex items-center">
                <span className="text-lg font-bold">{likes}</span>
            </div>
        </div>
    );
};

export default LikedByList;
