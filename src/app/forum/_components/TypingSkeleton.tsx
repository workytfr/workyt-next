"use client";

import ProfileAvatar from "@/components/ui/profile";
import type { TypingUser } from "@/hooks/useForumRealtime";

/**
 * Squelette d'une réponse en cours de rédaction (temps réel).
 * Affiche l'auteur, un compteur de mots live, et des lignes "fantômes"
 * dont le nombre croît avec la longueur du texte en cours.
 */
export default function TypingSkeleton({ user }: { user: TypingUser }) {
    const words = user.wordCount ?? 0;
    // 1 ligne fantôme par ~12 mots, borné entre 1 et 5
    const lines = Math.min(5, Math.max(1, Math.ceil(words / 12)));
    const widths = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-1/2"];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
                <ProfileAvatar
                    username={user.username}
                    userId={user.userId}
                    size="medium"
                    showPoints={false}
                />
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="truncate">
                            {user.username || "Un membre"} est en train d&apos;écrire
                        </span>
                        <span className="inline-flex items-end gap-0.5 pb-0.5 shrink-0">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 tabular-nums">
                        {words} mot{words > 1 ? "s" : ""}
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-3 bg-gray-200 rounded animate-pulse ${widths[i % widths.length]}`}
                    />
                ))}
            </div>
        </div>
    );
}
