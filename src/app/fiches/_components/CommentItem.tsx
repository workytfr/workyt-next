"use client";

import React from "react";
import Link from "next/link";
import ProfileAvatar from "@/components/ui/profile";

interface CommentProps {
    username: string;
    content: string;
    userId: string;
}

const CommentItem: React.FC<CommentProps> = ({ username, content, userId}) => {
    return (
        <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
            {/* Avatar avec ProfileAvatar */}
            <ProfileAvatar username={username} showPoints={false} />

            {/* Commentaire */}
            <div>
                <Link href={`/compte/${userId}`}>
                    <h3 className="font-semibold text-gray-800 hover:underline cursor-pointer">{username}</h3>
                </Link>
                <p className="text-gray-600">{content}</p>
            </div>
        </div>
    );
};

export default CommentItem;
