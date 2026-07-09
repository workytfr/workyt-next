"use client";

import ProfileAvatar from "@/components/ui/profile";
import type { TypingUser } from "@/hooks/useForumRealtime";

/**
 * Barre de présence temps réel : affiche jusqu'à 5 avatars des membres
 * actuellement sur la question, puis une pastille "+N" pour le reste.
 */
export default function ForumPresenceBar({ members }: { members: TypingUser[] }) {
    if (!members || members.length === 0) return null;

    const MAX_VISIBLE = 5;
    const shown = members.slice(0, MAX_VISIBLE);
    const extra = members.length - shown.length;

    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-3">
                {shown.map((m) => (
                    <div
                        key={m.userId}
                        className="ring-2 ring-white rounded-full"
                        title={m.username || "Membre"}
                    >
                        <ProfileAvatar
                            username={m.username}
                            userId={m.userId}
                            size="medium"
                            showPoints={false}
                        />
                    </div>
                ))}
                {extra > 0 && (
                    <div className="w-10 h-10 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 text-sm font-semibold flex items-center justify-center">
                        +{extra}
                    </div>
                )}
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">
                {members.length === 1 ? "1 membre présent" : `${members.length} membres présents`}
            </span>
        </div>
    );
}
