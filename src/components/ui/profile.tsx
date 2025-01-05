"use client";

import React from "react";

function hashStringToColor(string: string): string {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360; // Limiter la teinte entre 0 et 360
    return `hsl(${hue}, 50%, 70%)`; // Couleur pastel
}

const ProfileAvatar: React.FC<{ username: string; image?: string }> = ({
                                                                           username,
                                                                           image,
                                                                       }) => {
    const firstLetter = username.charAt(0).toUpperCase();
    const bgColor = hashStringToColor(username);

    return (
        <div
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden"
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
    );
};

export default ProfileAvatar;
