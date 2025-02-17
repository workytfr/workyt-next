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
        const diff = Math.floor((now.getTime() - dateObj.getTime()) / 60000);

        if (diff < 1) return "À l'instant";
        if (diff < 60) return `il y a ${diff} min`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `il y a ${hours} h`;
        const days = Math.floor(hours / 24);
        return `il y a ${days} j`;
    };

    return (
        <span className="flex items-center gap-1 text-gray-500">
            <FaClock className="text-gray-400" /> {timeAgo(date)}
        </span>
    );
};

export default TimeAgo;