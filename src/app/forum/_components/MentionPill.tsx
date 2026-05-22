"use client";

import React from "react";
import Link from "next/link";
import ProfileAvatar from "@/components/ui/profile";

interface MentionPillProps {
    userId: string;
    username: string;
}

/**
 * Pastille de mention : avatar + @pseudo cliquable.
 * Affichée inline dans le contenu rendu.
 */
export default function MentionPill({ userId, username }: MentionPillProps) {
    return (
        <Link
            href={`/compte/${userId}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium no-underline align-baseline transition-colors mention-pill"
        >
            <span className="inline-flex items-center -my-1 [&_*]:!w-4 [&_*]:!h-4">
                <ProfileAvatar username={username} userId={userId} showPoints={false} />
            </span>
            <span>@{username}</span>
        </Link>
    );
}
