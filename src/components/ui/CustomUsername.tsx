"use client";

import React, { useState, useEffect } from 'react';

interface CustomUsernameProps {
    username: string;
    userId: string;
    className?: string;
}

interface ProfileCustomization {
    usernameColor: {
        type: 'solid' | 'gradient' | 'rainbow' | 'neon' | 'holographic' | 'galaxy' | 'fire' | 'ice' | 'lightning' | 'cosmic' | 'diamond' | 'legendary' | 'custom';
        value: string;
        isActive: boolean;
    };
}

const CustomUsername: React.FC<CustomUsernameProps> = ({ username, userId, className = '' }) => {
    const [customization, setCustomization] = useState<ProfileCustomization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadCustomization();
        }
    }, [userId]);

    const loadCustomization = async () => {
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
        if (!customization?.usernameColor.isActive) {
            return { color: '#374151' }; // Couleur par défaut
        }
        
        switch (customization.usernameColor.type) {
            case 'solid':
                return { color: customization.usernameColor.value };
            case 'gradient':
                return { 
                    background: `linear-gradient(45deg, ${customization.usernameColor.value}, #FF6B6B)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                };
            case 'rainbow':
                return { 
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
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
                    backgroundClip: 'text',
                    animation: 'holographic 4s linear infinite'
                };
            case 'galaxy':
                return { 
                    background: 'linear-gradient(45deg, #4C1D95, #7C3AED, #A855F7, #C084FC)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'galaxy 6s ease-in-out infinite'
                };
            case 'fire':
                return { 
                    background: 'linear-gradient(45deg, #DC2626, #EF4444, #F87171, #FCA5A5)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'fire 2s ease-in-out infinite'
                };
            case 'ice':
                return { 
                    background: 'linear-gradient(45deg, #0EA5E9, #38BDF8, #7DD3FC, #BAE6FD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'ice 3s ease-in-out infinite'
                };
            case 'lightning':
                return { 
                    background: 'linear-gradient(45deg, #F59E0B, #FBBF24, #FCD34D, #FDE68A)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'lightning 1s ease-in-out infinite'
                };
            case 'cosmic':
                return { 
                    background: 'linear-gradient(45deg, #7C3AED, #A855F7, #C084FC, #DDD6FE)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'cosmic 5s ease-in-out infinite'
                };
            case 'diamond':
                return { 
                    background: 'linear-gradient(45deg, #10B981, #34D399, #6EE7B7, #A7F3D0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'diamond 4s ease-in-out infinite'
                };
            case 'legendary':
                return { 
                    background: 'linear-gradient(45deg, #F97316, #FB923C, #FDBA74, #FED7AA)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'legendary 3s ease-in-out infinite'
                };
            case 'custom':
                return { color: customization.usernameColor.value };
            default:
                return { color: '#374151' };
        }
    };

    if (loading) {
        return <span className={className}>{username}</span>;
    }

    return (
        <>
            <span 
                className={`font-semibold ${className}`}
                style={getUsernameColorStyle()}
            >
                {username}
            </span>
            
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
        </>
    );
};

export default CustomUsername;
