"use client";

import React, { useState, useEffect } from "react";
import { generatedAvatarUri } from "@/lib/blobatar";
import { sanitizeLook, type AvatarLook } from "@/lib/avatarLook";
import { fetchCustomization } from "@/lib/customizationClient";

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

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
    name,
    userId,
    size = "md",
    className = "",
    fallbackImage,
}) => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profileBorder, setProfileBorder] = useState<string | null>(null);
    const [look, setLook] = useState<AvatarLook>({});
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
            // Regroupé avec les autres avatars de la page (voir customizationClient)
            const data = await fetchCustomization(userId);
            const custom = data?.customization;
            if (custom) {
                setLook(sanitizeLook(custom.avatarLook));
                // Même priorité que ProfileAvatar : la photo du membre passe avant tout
                if (custom.customPhoto?.isActive && custom.customPhoto?.url) {
                    setProfileImage(custom.customPhoto.url);
                } else if (custom.profileImage?.isActive && custom.profileImage?.filename) {
                    setProfileImage(`/profile/${custom.profileImage.filename}`);
                }

                if (custom.profileBorder?.isActive && custom.profileBorder?.filename) {
                    setProfileBorder(`/profile/contour/${custom.profileBorder.filename}`);
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
            <div className={`rounded-full w-full h-full flex items-center justify-center overflow-hidden ${displayImage ? "bg-gray-100" : ""}`}>
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={`${name}'s avatar`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={generatedAvatarUri(identifier, look)}
                        alt={`${name}'s avatar`}
                        className="w-full h-full object-cover"
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
