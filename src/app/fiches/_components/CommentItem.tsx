"use client";

import React from "react";
import ProfileAvatar from "@/components/ui/profile";

interface CommentProps {
    username: string;
    content: string;
}

const CommentItem: React.FC<CommentProps> = ({ username, content}) => {
    return (
        <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
            {/* Avatar avec ProfileAvatar */}
            <ProfileAvatar username={username} showPoints={false} />

            {/* Commentaire */}
            <div>
                <h3 className="font-semibold text-gray-800">{username}</h3>
                <p className="text-gray-600">{content}</p>
            </div>
        </div>
    );
};

export default CommentItem;
