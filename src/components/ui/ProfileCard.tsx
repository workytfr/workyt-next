"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { calculateUserRank } from "@/lib/rankSystem";
import ProfileAvatar from "./profile";
import CustomUsername from "./CustomUsername";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import useSWR from "swr";

// Fonction pour formater le nombre de points
function formatPoints(points: number): string {
    if (points < 1000) return points.toString();
    if (points < 1000000) return Math.floor(points / 1000) + "K";
    if (points < 1000000000) return Math.floor(points / 1000000) + "M";
    return points.toString();
}

interface ProfileCardProps {
    username: string;
    points: number;
    userId: string;
    image?: string;
    className?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const ProfileCard: React.FC<ProfileCardProps> = ({
    username,
    points: initialPoints,
    userId,
    image,
    className = ""
}) => {
    const [gems, setGems] = useState<number>(0);
    const [currentPoints, setCurrentPoints] = useState<number>(initialPoints);
    
    // Récupérer les gems
    const { data: gemData } = useSWR(
        userId ? '/api/gems/balance' : null,
        fetcher,
        {
            refreshInterval: 60000,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Récupérer les points à jour depuis la base de données
    const { data: pointsData } = useSWR(
        userId ? '/api/user/me/points' : null,
        fetcher,
        {
            refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
            revalidateOnFocus: true, // Rafraîchir quand la fenêtre reprend le focus
            revalidateOnReconnect: true,
        }
    );

    useEffect(() => {
        if (gemData?.success && gemData?.data?.user?.id === userId) {
            setGems(gemData.data.gems.balance || 0);
        }
    }, [gemData, userId]);

    useEffect(() => {
        if (pointsData?.success && pointsData?.data?.points !== undefined) {
            setCurrentPoints(pointsData.data.points);
        }
    }, [pointsData]);

    const userRank = calculateUserRank(currentPoints);
    const level = userRank.level;
    const formattedPoints = formatPoints(currentPoints);

    return (
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-100/60 ${className}`}>
            {/* Avatar */}
            <div className="flex-shrink-0">
                <ProfileAvatar
                    username={username}
                    points={currentPoints}
                    userId={userId}
                    image={image}
                    showPoints={false}
                    size="small"
                />
            </div>

            {/* Informations utilisateur */}
            <div className="flex-1 min-w-0">
                {/* Nom d'utilisateur */}
                <div className="mb-0">
                    <CustomUsername 
                        username={username} 
                        userId={userId}
                        className="text-sm font-semibold text-orange-900 leading-tight"
                    />
                </div>

                {/* Statistiques */}
                <div className="flex items-center gap-1 text-xs text-orange-800">
                    <span className="font-medium">Nv {level}</span>
                    <span className="text-orange-500">•</span>
                    <div className="flex items-center gap-0.5">
                        <Image 
                            src="/badge/points.png" 
                            alt="Points" 
                            width={12} 
                            height={12} 
                            className="object-contain"
                        />
                        <span className="font-medium">{formattedPoints}</span>
                    </div>
                    <span className="text-orange-500">•</span>
                    <div className="flex items-center gap-0.5">
                        <Image 
                            src="/badge/diamond.png" 
                            alt="Diamants" 
                            width={12} 
                            height={12} 
                            className="object-contain"
                        />
                        <span className="font-medium">{gems}</span>
                    </div>
                </div>
            </div>

            {/* Chevron */}
            <ChevronDownIcon className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
        </div>
    );
};

export default ProfileCard;

