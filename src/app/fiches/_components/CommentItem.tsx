"use client";

import React from "react";
import Link from "next/link";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";

interface CommentProps {
    username: string;
    content: string;
    userId: string;
}

const CommentItem: React.FC<CommentProps> = ({ username, content, userId}) => {
    return (
        <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
            {/* Avatar avec ProfileAvatar */}
            <ProfileAvatar username={username} showPoints={false} userId={userId} />

            {/* Commentaire */}
            <div>
                <Link href={`/compte/${userId}`}>
                    <UsernameDisplay 
                        username={username}
                        userId={userId}
                        className="font-semibold hover:underline cursor-pointer block"
                    />
                </Link>
                <p className="text-gray-600">{content}</p>
            </div>
        </div>
    );
};

export default CommentItem;
