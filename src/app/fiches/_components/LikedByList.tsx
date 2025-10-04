import React, { useState, useEffect } from "react";
import Link from "next/link";
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
                setHasLiked(true); // Une fois liké, on ne peut plus unliker
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
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
            {/* Liste des utilisateurs visibles avec design amélioré */}
            <div className="flex items-center -space-x-2">
                {visibleUsers.map((like, index) => (
                    <div 
                        key={like.userId._id}
                        className="relative group"
                        style={{ zIndex: visibleUsers.length - index }}
                    >
                        <Link href={`/compte/${like.userId._id}`}>
                            <div className="border-2 border-white shadow-md hover:scale-110 transition-transform duration-200 rounded-full cursor-pointer">
                                <ProfileAvatar
                                    username={like.userId.username}
                                    showPoints={false}
                                    userId={like.userId._id}
                                />
                            </div>
                        </Link>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                ))}

                {/* Tooltip pour les utilisateurs restants avec design amélioré */}
                {remainingUsers.length > 0 && (
                    <Tooltip>
                        <TooltipTrigger>
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-sm font-bold text-white shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white">
                                +{remainingUsers.length}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-xl">
                            <p className="text-sm font-medium">
                                {remainingUsers.map((like) => like.userId.username).join(", ")}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* Séparateur visuel */}
            <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
            <div className="block sm:hidden w-full h-px bg-gray-300"></div>

            {/* Bouton de like avec design amélioré */}
            <button
                onClick={handleLike}
                disabled={loading || hasLiked}
                className={`group relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    hasLiked 
                        ? "bg-gradient-to-br from-red-500 to-pink-600 text-white cursor-not-allowed shadow-lg" 
                        : loading
                        ? "bg-gray-300 text-gray-500 cursor-wait"
                        : "bg-white text-gray-600 hover:bg-gradient-to-br hover:from-red-500 hover:to-pink-600 hover:text-white border-gray-300 hover:border-red-500 shadow-md hover:shadow-lg"
                }`}
                aria-label={hasLiked ? "Déjà liké" : loading ? "Chargement..." : "Ajouter un like"}
            >
                {/* Animation de pulsation pour le like */}
                {hasLiked && (
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                )}
                
                {/* Animation de chargement */}
                {loading && (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                )}
                
                {/* Icône avec animation */}
                {!loading && (
                    <HeartIcon className={`w-5 h-5 transition-all duration-200 ${
                        hasLiked ? "animate-pulse" : "group-hover:scale-110"
                    }`} />
                )}
                
                {/* Effet de particules au survol */}
                {!hasLiked && !loading && (
                    <div className="absolute inset-0 rounded-full bg-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                )}
            </button>

            {/* Badge pour les likes avec design amélioré */}
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-md">
                    <span className="text-sm font-bold text-white">❤️</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-gray-800">{likes}</span>
                    <span className="text-xs text-gray-500 font-medium">
                        {likes === 1 ? 'like' : 'likes'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LikedByList;
