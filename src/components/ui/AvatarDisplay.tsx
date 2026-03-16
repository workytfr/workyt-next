"use client";

import React, { useState, useEffect } from "react";
import { AvatarInterference } from "eigen-avatar-generator/react/interference";
import { AvatarPlasma } from "eigen-avatar-generator/react/plasma";
import { AvatarSmile } from "eigen-avatar-generator/react/smile";
import { AvatarPixels } from "eigen-avatar-generator/react/pixels";

// Color sets pour les avatars générés
const COLOR_SETS: string[][] = [
    ["#6366F1", "#8B5CF6", "#A855F7"],
    ["#EC4899", "#F472B6", "#F9A8D4"],
    ["#0EA5E9", "#38BDF8", "#7DD3FC"],
    ["#10B981", "#34D399", "#6EE7B7"],
    ["#F59E0B", "#FBBF24", "#FCD34D"],
];

const PIXELS_GRADIENT = ["#6366F1", "#EC4899", "#10B981", "#F59E0B"];

// Fonction de hash pour générer un identifiant unique
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

interface AvatarDisplayProps {
    name: string;
    userId?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
    fallbackImage?: string;
}

const sizeMap = {
    xs: { class: "w-6 h-6", pixels: 24 },
    sm: { class: "w-8 h-8", pixels: 32 },
    md: { class: "w-10 h-10", pixels: 40 },
    lg: { class: "w-12 h-12", pixels: 48 },
    xl: { class: "w-16 h-16", pixels: 64 },
};

// Composant Eigen Avatar Generator
function EigenAvatarGenerated({
    id,
    size,
    className,
}: {
    id: string;
    size: number;
    className: string;
}) {
    const themeIndex = hashString(id) % 4;
    const commonProps = {
        id,
        size,
        className: `rounded-full object-cover w-full h-full ${className}`,
    };

    const colorSetProps = { foreground: COLOR_SETS };
    const pixelsProps = { foreground: PIXELS_GRADIENT, interpolate: true };

    switch (themeIndex) {
        case 0:
            return <AvatarInterference {...commonProps} {...colorSetProps} />;
        case 1:
            return <AvatarPlasma {...commonProps} {...colorSetProps} />;
        case 2:
            return <AvatarSmile {...commonProps} {...colorSetProps} />;
        case 3:
        default:
            return <AvatarPixels {...commonProps} {...pixelsProps} />;
    }
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
    name,
    userId,
    size = "md",
    className = "",
    fallbackImage,
}) => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profileBorder, setProfileBorder] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const sizeConfig = sizeMap[size];
    const identifier = userId || name;

    useEffect(() => {
        // Si on a un userId, on essaie de récupérer la personnalisation
        if (userId) {
            loadUserCustomization();
        }
    }, [userId]);

    const loadUserCustomization = async () => {
        if (!userId) return;
        
        try {
            setLoading(true);
            const response = await fetch(`/api/users/${userId}/customization`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.customization) {
                    const custom = data.data.customization;
                    
                    if (custom.profileImage?.isActive && custom.profileImage?.filename) {
                        setProfileImage(`/profile/${custom.profileImage.filename}`);
                    }
                    
                    if (custom.profileBorder?.isActive && custom.profileBorder?.filename) {
                        setProfileBorder(`/profile/contour/${custom.profileBorder.filename}`);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la personnalisation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Déterminer l'image à afficher
    const displayImage = profileImage || fallbackImage;

    return (
        <div className={`relative ${sizeConfig.class} ${className}`}>
            {/* Avatar principal */}
            <div className="rounded-full w-full h-full flex items-center justify-center overflow-hidden bg-gray-100">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={`${name}'s avatar`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <EigenAvatarGenerated
                        id={identifier}
                        size={sizeConfig.pixels}
                        className=""
                    />
                )}
            </div>

            {/* Contour personnalisé */}
            {profileBorder && (
                <img 
                    src={profileBorder}
                    alt="Contour"
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                />
            )}
        </div>
    );
};

export default AvatarDisplay;
