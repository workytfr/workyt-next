"use client";

import { useThreadRealtime, type TypingUser } from "@/hooks/useThreadRealtime";

export type { TypingUser };

/**
 * Temps réel d'une page question du forum — fin wrapper au-dessus du moteur
 * générique `useThreadRealtime` (room `question:<id>`).
 */
export function useForumRealtime(
    questionId: string | undefined,
    onAnswerChanged: () => void
) {
    return useThreadRealtime(
        questionId ? `question:${questionId}` : undefined,
        onAnswerChanged
    );
}
