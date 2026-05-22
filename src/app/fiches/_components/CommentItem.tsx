"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import TimeAgo from "@/components/ui/TimeAgo";
import { MoreVertical, Trash2, Loader2, Crown } from "lucide-react";

interface CommentItemProps {
    id: string;
    username: string;
    content: string;
    userId: string;
    createdAt?: string;
    isFicheAuthor?: boolean;
    ficheAuthorId?: string;
    onDeleted?: (id: string) => void;
}

export default function CommentItem({
    id,
    username,
    content,
    userId,
    createdAt,
    isFicheAuthor,
    ficheAuthorId,
    onDeleted,
}: CommentItemProps) {
    const { data: session } = useSession();
    const currentUserId = (session?.user as any)?.id;
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirm, setConfirm] = useState(false);

    const canDelete =
        currentUserId && (currentUserId === userId || currentUserId === ficheAuthorId);

    const handleDelete = async () => {
        const token = (session as any)?.accessToken;
        if (!token) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/comment/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                onDeleted?.(id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
            setMenuOpen(false);
            setConfirm(false);
        }
    };

    return (
        <div className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0">
            <Link href={`/compte/${userId}`} className="shrink-0">
                <ProfileAvatar username={username} showPoints={false} userId={userId} />
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/compte/${userId}`}>
                        <UsernameDisplay
                            username={username}
                            userId={userId}
                            className="font-semibold text-sm hover:underline cursor-pointer"
                        />
                    </Link>

                    {isFicheAuthor && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                            <Crown size={10} /> Auteur
                        </span>
                    )}

                    {createdAt && (
                        <span className="text-xs text-gray-500">
                            · <TimeAgo date={createdAt} />
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
                    {content}
                </p>
            </div>

            {canDelete && (
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                        aria-label="Options du commentaire"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {menuOpen && (
                        <div
                            className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
                            onMouseLeave={() => {
                                if (!confirm) setMenuOpen(false);
                            }}
                        >
                            {!confirm ? (
                                <button
                                    type="button"
                                    onClick={() => setConfirm(true)}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Supprimer
                                </button>
                            ) : (
                                <div className="px-3 py-2">
                                    <p className="text-xs text-gray-600 mb-2">Supprimer ce commentaire ?</p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="flex-1 inline-flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs px-2 py-1.5 rounded"
                                        >
                                            {deleting && <Loader2 size={12} className="animate-spin" />}
                                            Oui
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setConfirm(false);
                                                setMenuOpen(false);
                                            }}
                                            disabled={deleting}
                                            className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                                        >
                                            Non
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
