"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "./Badge";

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

// Interface pour les personnalisations
interface ProfileCustomization {
    usernameColor: {
        type: 'solid' | 'gradient' | 'rainbow' | 'neon' | 'holographic' | 'galaxy' | 'fire' | 'ice' | 'lightning' | 'cosmic' | 'diamond' | 'legendary' | 'custom';
        value: string;
        isActive: boolean;
    };
    profileImage: {
        filename: string;
        isActive: boolean;
    };
    profileBorder: {
        filename: string;
        isActive: boolean;
    };
}

interface ProfileAvatarProps {
    username: string;
    image?: string;
    points?: number;
    showPoints?: boolean;
    size?: "small" | "medium" | "large";
    userId?: string; // ID de l'utilisateur pour charger les personnalisations
    customization?: ProfileCustomization; // Personnalisations passées en props
}

const sizeClasses = {
    small: "w-12 h-12 text-sm",
    medium: "w-10 h-10 text-base",
    large: "w-20 h-20 text-lg",
};

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
    username,
    image,
    points = 0,
    showPoints = true,
    size = "medium",
    userId,
    customization: propCustomization
}) => {
    const [customization, setCustomization] = useState<ProfileCustomization | null>(null);
    const [loading, setLoading] = useState(false);

    const firstLetter = username.charAt(0).toUpperCase();
    const bgColor = hashStringToColor(username);

    // Charger les personnalisations si userId est fourni et pas de customization en props
    useEffect(() => {
        if (userId && !propCustomization && !customization) {
            loadCustomization();
        } else if (propCustomization) {
            setCustomization(propCustomization);
        }
    }, [userId, propCustomization]);

    const loadCustomization = async () => {
        if (!userId) return;
        
        try {
            setLoading(true);
            const response = await fetch('/api/gems/balance');
            if (response.ok) {
                const data = await response.json();
                        if (data.success && data.data.user.id === userId) {
          setCustomization(data.data.customization);
        }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la personnalisation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Obtenir le style de couleur du nom d'utilisateur
    const getUsernameColorStyle = () => {
        const custom = customization || propCustomization;
        if (!custom?.usernameColor.isActive) return {};
        
        switch (custom.usernameColor.type) {
            case 'solid':
                return { color: custom.usernameColor.value };
            case 'gradient':
                return { 
                    background: `linear-gradient(45deg, ${custom.usernameColor.value}, #FF6B6B)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                };
            case 'rainbow':
                return { 
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'rainbow 3s ease-in-out infinite'
                };
            case 'neon':
                return { 
                    color: '#00FF00',
                    textShadow: '0 0 10px #00FF00, 0 0 20px #00FF00, 0 0 30px #00FF00',
                    animation: 'neon 2s ease-in-out infinite alternate'
                };
            case 'holographic':
                return { 
                    background: 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00, #FF00FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'holographic 4s linear infinite'
                };
            case 'galaxy':
                return { 
                    background: 'linear-gradient(45deg, #4C1D95, #7C3AED, #A855F7, #C084FC)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'galaxy 6s ease-in-out infinite'
                };
            case 'fire':
                return { 
                    background: 'linear-gradient(45deg, #DC2626, #EF4444, #F87171, #FCA5A5)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'fire 2s ease-in-out infinite'
                };
            case 'ice':
                return { 
                    background: 'linear-gradient(45deg, #0EA5E9, #38BDF8, #7DD3FC, #BAE6FD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'ice 3s ease-in-out infinite'
                };
            case 'lightning':
                return { 
                    background: 'linear-gradient(45deg, #F59E0B, #FBBF24, #FCD34D, #FDE68A)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'lightning 1s ease-in-out infinite'
                };
            case 'cosmic':
                return { 
                    background: 'linear-gradient(45deg, #7C3AED, #A855F7, #C084FC, #DDD6FE)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'cosmic 5s ease-in-out infinite'
                };
            case 'diamond':
                return { 
                    background: 'linear-gradient(45deg, #10B981, #34D399, #6EE7B7, #A7F3D0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'diamond 4s ease-in-out infinite'
                };
            case 'legendary':
                return { 
                    background: 'linear-gradient(45deg, #F97316, #FB923C, #FDBA74, #FED7AA)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'legendary 3s ease-in-out infinite'
                };
            case 'custom':
                return { color: custom.usernameColor.value };
            default:
                return {};
        }
    };

    // Déterminer l'image de profil à afficher
    const getProfileImage = () => {
        const custom = customization || propCustomization;
        
        if (custom?.profileImage.isActive && custom.profileImage.filename) {
            return `/profile/${custom.profileImage.filename}`;
        }
        
        return image; // Retourner l'image passée en props si pas de personnalisation
    };

    // Déterminer le contour à afficher
    const getProfileBorder = () => {
        const custom = customization || propCustomization;
        
        if (custom?.profileBorder.isActive && custom.profileBorder.filename) {
            return `/profile/contour/${custom.profileBorder.filename}`;
        }
        
        return null;
    };

    const profileImage = getProfileImage();
    const profileBorder = getProfileBorder();

    return (
        <div className="relative">
            {/* Avatar avec personnalisations */}
            <div className={`relative ${sizeClasses[size]} rounded-full`}>
                {/* Badge pour les points */}
                {showPoints && points > 0 && (
                    <Badge
                        variant="default"
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full flex items-center justify-center w-5 h-5 z-10"
                    >
                        {formatPoints(points)}
                    </Badge>
                )}

                

                {/* Avatar principal */}
                <div
                    className="rounded-full w-full h-full flex items-center justify-center text-white font-bold overflow-hidden relative"
                    style={{
                        backgroundColor: profileImage ? 'transparent' : bgColor,
                        backgroundImage: `url('/noise.webp')`,
                        backgroundSize: "cover",
                        backgroundBlendMode: "overlay",
                    }}
                >
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt={`${username}'s profile`}
                            className="w-full h-full object-cover rounded-full"
                        />
                    ) : (
                        <span>{firstLetter}</span>
                    )}
                </div>

                {/* Contour personnalisé */}
                {profileBorder && (
                    <img 
                        src={profileBorder}
                        alt="Contour de profil"
                        className="absolute inset-0 w-full h-full"
                    />
                )}
            </div>

                        {/* Nom d'utilisateur avec personnalisation (si taille large) */}
            {size === "large" && (
              <div className="mt-2 text-center">
                <div 
                  className="font-bold text-lg"
                  style={getUsernameColorStyle()}
                >
                  {username}
                </div>
              </div>
            )}

            {/* Styles CSS pour toutes les animations */}
            <style jsx>{`
                @keyframes rainbow {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                
                @keyframes neon {
                    0% { text-shadow: 0 0 10px #00FF00, 0 0 20px #00FF00, 0 0 30px #00FF00; }
                    100% { text-shadow: 0 0 20px #00FF00, 0 0 30px #00FF00, 0 0 40px #00FF00; }
                }
                
                @keyframes holographic {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                
                @keyframes galaxy {
                    0% { filter: hue-rotate(0deg) saturate(1); }
                    50% { filter: hue-rotate(180deg) saturate(1.5); }
                    100% { filter: hue-rotate(360deg) saturate(1); }
                }
                
                @keyframes fire {
                    0% { filter: hue-rotate(0deg) saturate(1.2); }
                    50% { filter: hue-rotate(10deg) saturate(1.5); }
                    100% { filter: hue-rotate(0deg) saturate(1.2); }
                }
                
                @keyframes ice {
                    0% { filter: hue-rotate(0deg) saturate(1); }
                    50% { filter: hue-rotate(5deg) saturate(1.3); }
                    100% { filter: hue-rotate(0deg) saturate(1); }
                }
                
                @keyframes lightning {
                    0% { filter: brightness(1) saturate(1); }
                    50% { filter: brightness(1.5) saturate(1.5); }
                    100% { filter: brightness(1) saturate(1); }
                }
                
                @keyframes cosmic {
                    0% { filter: hue-rotate(0deg) saturate(1); }
                    33% { filter: hue-rotate(120deg) saturate(1.3); }
                    66% { filter: hue-rotate(240deg) saturate(1.3); }
                    100% { filter: hue-rotate(360deg) saturate(1); }
                }
                
                @keyframes diamond {
                    0% { filter: brightness(1) saturate(1); }
                    50% { filter: brightness(1.3) saturate(1.2); }
                    100% { filter: brightness(1) saturate(1); }
                }
                
                @keyframes legendary {
                    0% { filter: hue-rotate(0deg) saturate(1); }
                    25% { filter: hue-rotate(90deg) saturate(1.2); }
                    50% { filter: hue-rotate(180deg) saturate(1.4); }
                    75% { filter: hue-rotate(270deg) saturate(1.2); }
                    100% { filter: hue-rotate(360deg) saturate(1); }
                }
            `}</style>
        </div>
    );
};

export default ProfileAvatar;
