"use client";

import ProfileAvatar from "@/components/ui/profile";
import type { TypingUser } from "@/hooks/useThreadRealtime";

/**
 * Squelette d'un message en cours de rédaction (temps réel).
 * Un petit rectangle « fantôme » par mot tapé, qui s'enchaînent et passent à la
 * ligne — plafonné à 2 lignes (le surplus est masqué).
 */
const MAX_CHIPS = 24; // borne de perf ; l'affichage est de toute façon limité à 2 lignes
// Largeurs (px) variées pour un rendu « mots » naturel
const CHIP_WIDTHS = [30, 46, 20, 52, 36, 24, 42, 28, 48, 22, 38, 32];

export default function TypingSkeleton({ user }: { user: TypingUser }) {
    const words = Math.max(0, user.wordCount ?? 0);
    const count = Math.min(MAX_CHIPS, Math.max(1, words));

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
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="truncate">
                            <span className="font-semibold">{user.username || "Un membre"}</span>
                            {" "}est en train d&apos;écrire
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

            {/* Un rectangle par mot, max 2 lignes (le reste est masqué) */}
            <div className="flex flex-wrap gap-1.5 max-h-[26px] overflow-hidden">
                {Array.from({ length: count }).map((_, i) => (
                    <span
                        key={i}
                        className="h-2.5 rounded bg-gray-200 animate-pulse"
                        style={{ width: `${CHIP_WIDTHS[i % CHIP_WIDTHS.length]}px` }}
                    />
                ))}
            </div>
        </div>
    );
}
