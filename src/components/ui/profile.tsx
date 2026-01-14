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
        type: 'solid' | 'gradient' | 'rainbow' | 'neon' | 'automne' | 'galaxy' | 'fire' | 'ice' | 'lightning' | 'cosmic' | 'diamond' | 'legendary' | 'glitch' | 'stardust' | 'nitro' | 'typewriter' | 'custom';
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
    role?: string; // Rôle de l'utilisateur pour afficher l'icône
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
    customization: propCustomization,
    role
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, propCustomization]);

    const loadCustomization = async () => {
        if (!userId) return;
        
        try {
            setLoading(true);
            const response = await fetch(`/api/users/${userId}/customization`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
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
            case 'automne':
                return { 
                    background: 'linear-gradient(45deg, #FF6B35, #F7931E, #FFD700, #FF4500, #8B4513)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'automne 4s ease-in-out infinite'
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
            case 'glitch':
                return { 
                    color: '#FF0080',
                    animation: 'glitch 2s ease-in-out infinite'
                };
            case 'stardust':
                return { 
                    color: '#E6E6FA',
                    animation: 'stardust 4s ease-in-out infinite'
                };
            case 'nitro':
                return { 
                    background: 'linear-gradient(90deg, #5865F2, #7289DA, #99AAB5, #5865F2)',
                    backgroundSize: '400% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'nitro 3s ease-in-out infinite'
                };
            case 'typewriter':
                return { 
                    color: '#22C55E',
                    animation: 'typewriter 2s ease-in-out infinite'
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

                {/* Avatar principal (en arrière-plan) */}
                <div
                    className="rounded-full w-full h-full flex items-center justify-center text-white font-bold overflow-hidden relative z-0"
                    style={{
                        backgroundColor: profileImage ? 'transparent' : bgColor,
                        backgroundImage: `url('/noise.webp')`,
                        backgroundSize: "cover",
                        backgroundBlendMode: "overlay",
                        // Réduire légèrement la taille pour laisser voir le contour
                        transform: 'scale(0.85)',
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

                {/* Contour personnalisé (en premier plan) */}
                {profileBorder && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                        src={profileBorder}
                        alt="Contour de profil"
                        className="absolute inset-0 w-full h-full z-10"
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
                    0% { 
                        text-shadow: 0 0 5px #00FF00, 0 0 10px #00FF00, 0 0 15px #00FF00;
                        filter: brightness(1) saturate(1);
                    }
                    50% { 
                        text-shadow: 0 0 10px #00FF00, 0 0 20px #00FF00, 0 0 30px #00FF00;
                        filter: brightness(1.5) saturate(1.5);
                    }
                    100% { 
                        text-shadow: 0 0 5px #00FF00, 0 0 10px #00FF00, 0 0 15px #00FF00;
                        filter: brightness(1) saturate(1);
                    }
                }
                
                @keyframes automne {
                    0% { 
                        filter: hue-rotate(0deg) brightness(1) saturate(1);
                        transform: scale(1);
                    }
                    25% { 
                        filter: hue-rotate(15deg) brightness(1.2) saturate(1.3);
                        transform: scale(1.02);
                    }
                    50% { 
                        filter: hue-rotate(-10deg) brightness(1.1) saturate(1.2);
                        transform: scale(1.01);
                    }
                    75% { 
                        filter: hue-rotate(20deg) brightness(1.3) saturate(1.4);
                        transform: scale(1.03);
                    }
                    100% { 
                        filter: hue-rotate(0deg) brightness(1) saturate(1);
                        transform: scale(1);
                    }
                }
                
                @keyframes galaxy {
                    0% { filter: hue-rotate(0deg) saturate(1); }
                    50% { filter: hue-rotate(180deg) saturate(1.5); }
                    100% { filter: hue-rotate(360deg) saturate(1); }
                }
                
                @keyframes fire {
                    0%, 100% { 
                        background: linear-gradient(45deg, #FF0000, #FF4500, #FFD700, #FF4500, #FF0000);
                        background-size: 200% 100%;
                        background-position: 0% 50%;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        text-shadow: 0 0 10px #FF4500;
                        font-weight: bold;
                    }
                    25% { 
                        background-position: 25% 50%;
                        text-shadow: 0 0 15px #FF4500;
                    }
                    50% { 
                        background-position: 50% 50%;
                        text-shadow: 0 0 20px #FF4500;
                    }
                    75% { 
                        background-position: 75% 50%;
                        text-shadow: 0 0 15px #FF4500;
                    }
                }
                
                @keyframes ice {
                    0%, 100% { 
                        color: #0369A1;
                        text-shadow: 
                            0 0 8px #0EA5E9,
                            0 0 12px #0284C7;
                        font-weight: bold;
                        letter-spacing: 1px;
                    }
                    50% { 
                        color: #0EA5E9;
                        text-shadow: 
                            0 0 12px #38BDF8,
                            0 0 18px #0284C7;
                    }
                }
                
                @keyframes lightning {
                    0%, 90%, 100% { 
                        color: #F59E0B;
                        -webkit-text-stroke: 1px #FFD700;
                        text-shadow: 0 0 5px #FFFF00;
                        font-weight: bold;
                    }
                    5% { 
                        color: transparent;
                        -webkit-text-stroke: 2px #FFFF00;
                        text-shadow: 
                            0 0 10px #FFFF00,
                            0 0 20px #FFFFFF;
                    }
                    10% { 
                        color: #FFFFFF;
                        -webkit-text-stroke: 1px #FFFF00;
                        text-shadow: 
                            0 0 15px #FFFF00,
                            0 0 25px #FFD700;
                    }
                    15% { 
                        color: #F59E0B;
                        -webkit-text-stroke: 1px #FFD700;
                        text-shadow: 0 0 5px #FFFF00;
                    }
                }
                
                @keyframes cosmic {
                    0% { 
                        filter: hue-rotate(0deg) saturate(1);
                        text-shadow: 0 0 0 rgba(124, 58, 237, 0);
                    }
                    25% { 
                        filter: hue-rotate(90deg) saturate(1.2);
                        text-shadow: 0 0 10px rgba(124, 58, 237, 0.3);
                    }
                    50% { 
                        filter: hue-rotate(180deg) saturate(1.4);
                        text-shadow: 0 0 20px rgba(124, 58, 237, 0.6);
                    }
                    75% { 
                        filter: hue-rotate(270deg) saturate(1.2);
                        text-shadow: 0 0 15px rgba(124, 58, 237, 0.4);
                    }
                    100% { 
                        filter: hue-rotate(360deg) saturate(1);
                        text-shadow: 0 0 0 rgba(124, 58, 237, 0);
                    }
                }
                
                @keyframes diamond {
                    0% { 
                        filter: brightness(1) saturate(1) hue-rotate(0deg);
                        transform: scale(1) rotate(0deg);
                        text-shadow: 0 0 0 rgba(16, 185, 129, 0);
                    }
                    25% { 
                        filter: brightness(1.3) saturate(1.2) hue-rotate(30deg);
                        transform: scale(1.02) rotate(90deg);
                        text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
                    }
                    50% { 
                        filter: brightness(1.5) saturate(1.4) hue-rotate(60deg);
                        transform: scale(1.04) rotate(180deg);
                        text-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
                    }
                    75% { 
                        filter: brightness(1.2) saturate(1.1) hue-rotate(30deg);
                        transform: scale(1.01) rotate(270deg);
                        text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
                    }
                    100% { 
                        filter: brightness(1) saturate(1) hue-rotate(0deg);
                        transform: scale(1) rotate(360deg);
                        text-shadow: 0 0 0 rgba(16, 185, 129, 0);
                    }
                }
                
                @keyframes legendary {
                    0%, 100% { 
                        background: linear-gradient(45deg, #FFD700, #FFA500, #FF8C00, #FFD700);
                        background-size: 300% 100%;
                        background-position: 0% 50%;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        text-shadow: 0 0 10px #FFD700;
                        font-weight: bold;
                        font-family: 'serif';
                        letter-spacing: 2px;
                    }
                    25% { 
                        background-position: 25% 50%;
                        text-shadow: 0 0 15px #FFD700;
                        transform: scale(1.02);
                    }
                    50% { 
                        background-position: 50% 50%;
                        text-shadow: 0 0 20px #FFD700;
                        transform: scale(1.05);
                    }
                    75% { 
                        background-position: 75% 50%;
                        text-shadow: 0 0 15px #FFD700;
                        transform: scale(1.02);
                    }
                }
                
                @keyframes glitch {
                    0%, 100% { 
                        transform: translateX(0);
                        color: #FF0080;
                        text-shadow: 
                            2px 0 #00FFFF,
                            -2px 0 #FF0080;
                    }
                    10% { 
                        transform: translateX(-2px);
                        color: #00FFFF;
                        text-shadow: 
                            -2px 0 #FF0080,
                            2px 0 #00FFFF;
                    }
                    20% { 
                        transform: translateX(2px);
                        color: #FF0080;
                        text-shadow: 
                            3px 0 #00FFFF,
                            -3px 0 #FF0080;
                    }
                    30% { 
                        transform: translateX(-1px);
                        color: #00FFFF;
                    }
                    40% { 
                        transform: translateX(1px);
                        color: #FF0080;
                    }
                    50% { 
                        transform: translateX(-2px);
                        color: #FFFFFF;
                        text-shadow: 
                            1px 0 #FF0080,
                            -1px 0 #00FFFF;
                    }
                    60% { 
                        transform: translateX(2px);
                        color: #00FFFF;
                    }
                    70% { 
                        transform: translateX(-1px);
                        color: #FF0080;
                    }
                    80% { 
                        transform: translateX(1px);
                        color: #00FFFF;
                    }
                    90% { 
                        transform: translateX(0px);
                        color: #FF0080;
                    }
                }
                
                @keyframes stardust {
                    0%, 100% { 
                        color: #E6E6FA;
                        text-shadow: 
                            0 0 10px #DDA0DD,
                            0 0 20px #DA70D6,
                            -8px -8px 0 transparent,
                            8px -8px 0 transparent,
                            -8px 8px 0 transparent,
                            8px 8px 0 transparent;
                    }
                    16% { 
                        text-shadow: 
                            0 0 12px #DDA0DD,
                            0 0 25px #DA70D6,
                            -8px -8px 0 #E6E6FA,
                            8px -8px 0 transparent,
                            -8px 8px 0 transparent,
                            8px 8px 0 transparent;
                    }
                    33% { 
                        text-shadow: 
                            0 0 15px #DDA0DD,
                            0 0 30px #DA70D6,
                            -8px -8px 0 #E6E6FA,
                            8px -8px 0 #DDA0DD,
                            -8px 8px 0 transparent,
                            8px 8px 0 transparent;
                    }
                    50% { 
                        text-shadow: 
                            0 0 18px #DDA0DD,
                            0 0 35px #DA70D6,
                            -8px -8px 0 #E6E6FA,
                            8px -8px 0 #DDA0DD,
                            -8px 8px 0 #DA70D6,
                            8px 8px 0 transparent;
                    }
                    66% { 
                        text-shadow: 
                            0 0 15px #DDA0DD,
                            0 0 30px #DA70D6,
                            -8px -8px 0 #E6E6FA,
                            8px -8px 0 #DDA0DD,
                            -8px 8px 0 #DA70D6,
                            8px 8px 0 #E6E6FA;
                    }
                    83% { 
                        text-shadow: 
                            0 0 12px #DDA0DD,
                            0 0 25px #DA70D6,
                            -8px -8px 0 transparent,
                            8px -8px 0 #DDA0DD,
                            -8px 8px 0 #DA70D6,
                            8px 8px 0 #E6E6FA;
                    }
                }
                
                @keyframes nitro {
                    0%, 100% { 
                        background-position: 0% 50%;
                        text-shadow: 0 0 15px #5865F2;
                        font-weight: bold;
                        letter-spacing: 1px;
                    }
                    25% { 
                        background-position: 25% 50%;
                        text-shadow: 0 0 20px #7289DA;
                        transform: scale(1.02);
                    }
                    50% { 
                        background-position: 50% 50%;
                        text-shadow: 0 0 25px #99AAB5;
                        transform: scale(1.05);
                    }
                    75% { 
                        background-position: 75% 50%;
                        text-shadow: 0 0 20px #7289DA;
                        transform: scale(1.02);
                    }
                }
                
                @keyframes typewriter {
                    0% { 
                        color: #22C55E;
                        text-shadow: 0 0 5px #22C55E;
                    }
                    25% { 
                        color: #10B981;
                        text-shadow: 0 0 8px #10B981;
                    }
                    50% { 
                        color: #059669;
                        text-shadow: 0 0 10px #059669;
                    }
                    75% { 
                        color: #10B981;
                        text-shadow: 0 0 8px #10B981;
                    }
                    100% { 
                        color: #22C55E;
                        text-shadow: 0 0 5px #22C55E;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProfileAvatar;
