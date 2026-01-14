"use client";

import React, { useState, useEffect } from "react";
import { getRoleIconPath } from "@/lib/roleIcon";
import Image from "next/image";

// Interface pour les personnalisations
interface ProfileCustomization {
    usernameColor: {
        type: 'solid' | 'gradient' | 'rainbow' | 'neon' | 'automne' | 'galaxy' | 'fire' | 'ice' | 'lightning' | 'cosmic' | 'diamond' | 'legendary' | 'glitch' | 'stardust' | 'nitro' | 'typewriter' | 'custom';
        value: string;
        isActive: boolean;
    };
}

interface UsernameDisplayProps {
    username: string;
    userId?: string;
    className?: string;
    customization?: ProfileCustomization;
    role?: string; // Rôle de l'utilisateur pour afficher l'icône
}

const UsernameDisplay: React.FC<UsernameDisplayProps> = ({
    username,
    userId,
    className = "",
    customization: propCustomization,
    role
}) => {
    const [customization, setCustomization] = useState<ProfileCustomization | null>(null);

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
            const response = await fetch(`/api/users/${userId}/customization`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCustomization(data.data.customization);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la personnalisation:', error);
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

    const roleIconPath = getRoleIconPath(role);

    return (
        <>
            <span className="inline-flex items-center gap-1.5">
                <span 
                    className={className}
                    style={getUsernameColorStyle()}
                >
                    {username}
                </span>
                {roleIconPath && (
                    <Image
                        src={roleIconPath}
                        alt={`Rôle ${role}`}
                        width={16}
                        height={16}
                        className="rounded-full flex-shrink-0"
                    />
                )}
            </span>

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
                    }
                    25% { 
                        background-position: 25% 50%;
                    }
                    50% { 
                        background-position: 50% 50%;
                    }
                    75% { 
                        background-position: 75% 50%;
                    }
                }
                
                @keyframes ice {
                    0%, 100% { 
                        color: #0369A1;
                    }
                    50% { 
                        color: #0EA5E9;
                    }
                }
                
                @keyframes lightning {
                    0%, 90%, 100% { 
                        color: #F59E0B;
                    }
                    5% { 
                        color: transparent;
                    }
                    10% { 
                        color: #FFFFFF;
                    }
                    15% { 
                        color: #F59E0B;
                    }
                }
                
                @keyframes cosmic {
                    0% { 
                        filter: hue-rotate(0deg) saturate(1);
                    }
                    25% { 
                        filter: hue-rotate(90deg) saturate(1.2);
                    }
                    50% { 
                        filter: hue-rotate(180deg) saturate(1.4);
                    }
                    75% { 
                        filter: hue-rotate(270deg) saturate(1.2);
                    }
                    100% { 
                        filter: hue-rotate(360deg) saturate(1);
                    }
                }
                
                @keyframes diamond {
                    0% { 
                        filter: brightness(1) saturate(1) hue-rotate(0deg);
                    }
                    25% { 
                        filter: brightness(1.3) saturate(1.2) hue-rotate(30deg);
                    }
                    50% { 
                        filter: brightness(1.5) saturate(1.4) hue-rotate(60deg);
                    }
                    75% { 
                        filter: brightness(1.2) saturate(1.1) hue-rotate(30deg);
                    }
                    100% { 
                        filter: brightness(1) saturate(1) hue-rotate(0deg);
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
                    }
                    25% { 
                        background-position: 25% 50%;
                    }
                    50% { 
                        background-position: 50% 50%;
                    }
                    75% { 
                        background-position: 75% 50%;
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
                            0 0 20px #DA70D6;
                    }
                    16% { 
                        text-shadow: 
                            0 0 12px #DDA0DD,
                            0 0 25px #DA70D6;
                    }
                    33% { 
                        text-shadow: 
                            0 0 15px #DDA0DD,
                            0 0 30px #DA70D6;
                    }
                    50% { 
                        text-shadow: 
                            0 0 18px #DDA0DD,
                            0 0 35px #DA70D6;
                    }
                    66% { 
                        text-shadow: 
                            0 0 15px #DDA0DD,
                            0 0 30px #DA70D6;
                    }
                    83% { 
                        text-shadow: 
                            0 0 12px #DDA0DD,
                            0 0 25px #DA70D6;
                    }
                }
                
                @keyframes nitro {
                    0%, 100% { 
                        background-position: 0% 50%;
                    }
                    25% { 
                        background-position: 25% 50%;
                    }
                    50% { 
                        background-position: 50% 50%;
                    }
                    75% { 
                        background-position: 75% 50%;
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
        </>
    );
};

export default UsernameDisplay;

