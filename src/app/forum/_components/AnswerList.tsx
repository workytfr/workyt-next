"use client";

import React from "react";
import ProfileAvatar from "@/components/ui/profile";
import TimeAgo from "@/components/ui/TimeAgo";
import { FaThumbsUp, FaReply } from "react-icons/fa";

interface AnswerListProps {
    answers: any[];
}

const AnswerList: React.FC<AnswerListProps> = ({ answers }) => {
    return (
        <div className="mt-6">
            <h3 className="text-xl font-semibold">Réponses ({answers.length})</h3>
            {answers.length === 0 ? (
                <p className="text-gray-500 text-sm mt-2">Aucune réponse pour l&apos;instant. Soyez le premier à
                    répondre !</p>) : (
                answers.map((answer) => (
                    <div key={answer._id} className="mt-4 p-4 bg-gray-50 rounded-md shadow">
                        <div className="flex items-center gap-4">
                            <ProfileAvatar username={answer.user.username} points={answer.user.points} size="small" />
                            <div className="text-sm text-gray-600">
                                <span className="font-semibold">{answer.user.username}</span>
                                <TimeAgo date={answer.createdAt} />
                            </div>
                        </div>
                        <p className="mt-2 text-gray-800">{answer.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                                <FaThumbsUp /> {answer.likes} J&apos;aime
                            </span>
                            <span className="flex items-center gap-1 cursor-pointer hover:text-green-600">
                                <FaReply /> Répondre
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default AnswerList;
