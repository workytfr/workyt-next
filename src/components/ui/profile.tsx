"use client";

import React from "react";
import { Badge } from "./Badge"; // Import du Badge

// Fonction pour générer une couleur unique
function hashStringToColor(string: string): string {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 50%, 70%)`; // Couleur pastel
}

// Fonction pour formater le nombre de points
function formatPoints(points: number): string {
    if (points < 1000) return points.toString();
    if (points < 1000000) return Math.floor(points / 1000) + "k";
    if (points < 1000000000) return Math.floor(points / 1000000) + "M";
    return points.toString();
}

interface ProfileAvatarProps {
    username: string;
    image?: string;
    points?: number; // Points sont optionnels
    showPoints?: boolean; // Prop pour afficher ou masquer les points
    size?: "small" | "medium" | "large"; // Taille du composant
}

const sizeClasses = {
    small: "w-12 h-12 text-sm", // Même largeur et hauteur
    medium: "w-10 h-10 text-base",
    large: "w-20 h-20 text-lg",
};

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
                                                         username,
                                                         image,
                                                         points = 0,
                                                         showPoints = true, // Par défaut, les points sont affichés
                                                         size = "medium", // Taille par défaut
                                                     }) => {
    const firstLetter = username.charAt(0).toUpperCase();
    const bgColor = hashStringToColor(username);

    return (
        <div className={`relative ${sizeClasses[size]} rounded-full`}>
            {/* Badge pour les points */}
            {showPoints && points > 0 && (
                <Badge
                    variant="default"
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full flex items-center justify-center w-5 h-5"
                >
                    {formatPoints(points)}
                </Badge>
            )}

            {/* Avatar rond */}
            <div
                className="rounded-full w-full h-full flex items-center justify-center text-white font-bold overflow-hidden"
                style={{
                    backgroundColor: bgColor,
                    backgroundImage: `url('/noise.webp')`,
                    backgroundSize: "cover",
                    backgroundBlendMode: "overlay",
                }}
            >
                {image ? (
                    <img
                        src={image}
                        alt={`${username}'s profile`}
                        className="w-full h-full object-cover rounded-full"
                    />
                ) : (
                    <span>{firstLetter}</span>
                )}
            </div>
        </div>
    );
};

export default ProfileAvatar;
