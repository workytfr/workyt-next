"use client";

import React from "react";
import { FaClock } from "react-icons/fa";

interface TimeAgoProps {
    date: string;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ date }) => {
    const timeAgo = (dateString: string) => {
        const dateObj = new Date(dateString);
        const now = new Date();
        const diffInMillis = now.getTime() - dateObj.getTime();
        const diffInMinutes = Math.floor(diffInMillis / 60000);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInWeeks = Math.floor(diffInDays / 7);
        const diffInMonths = (now.getFullYear() - dateObj.getFullYear()) * 12 +
            now.getMonth() - dateObj.getMonth();
        const diffInYears = Math.floor(diffInMonths / 12);

        if (diffInMinutes < 1) return "À l'instant";
        if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;
        if (diffInHours < 24) return `il y a ${diffInHours} h`;
        if (diffInDays < 7) return `il y a ${diffInDays} j`;
        if (diffInWeeks < 4) return `il y a ${diffInWeeks} sem`;
        if (diffInMonths < 12) return `il y a ${diffInMonths} mois`;
        return `il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
    };

    return (
        <span className="flex items-center gap-1 text-gray-500">
            <FaClock className="text-gray-400" /> {timeAgo(date)}
        </span>
    );
};

export default TimeAgo;