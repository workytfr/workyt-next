"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getForumSocket } from "@/lib/realtime/socketClient";

export interface TypingUser {
    userId: string;
    username: string;
    /** Nombre de mots du message en cours de rédaction (temps réel). */
    wordCount?: number;
}

/**
 * Temps réel générique d'un fil de discussion (« thread »), réutilisable pour
 * le forum (`question:<id>`) comme pour les commentaires de fiches (`fiche:<id>`).
 *
 * - rejoint la room ;
 * - déclenche `onItemChanged` quand un item (réponse / commentaire) est ajouté ;
 * - expose la frappe (`typingUsers` + émetteurs) et la présence (`presentMembers`).
 */
export function useThreadRealtime(
    room: string | undefined,
    onItemChanged: () => void
) {
    const { data: session } = useSession();
    const token = (session as unknown as { accessToken?: string })?.accessToken;
    const sessionUser = (session?.user ?? {}) as { id?: string; username?: string; name?: string };
    const currentUserId = sessionUser.id;
    const currentUsername = sessionUser.username || sessionUser.name || "";

    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [presentMembers, setPresentMembers] = useState<TypingUser[]>([]);

    const onItemChangedRef = useRef(onItemChanged);
    onItemChangedRef.current = onItemChanged;

    useEffect(() => {
        if (!room) return;
        const socket = getForumSocket(token);

        const join = () => socket.emit("thread:join", { room, username: currentUsername });
        if (socket.connected) join();
        socket.on("connect", join);

        const handleItem = (p: { room?: string }) => {
            if (p?.room === room) onItemChangedRef.current();
        };
        const handleTyping = (p: { room?: string; users?: TypingUser[] }) => {
            if (p?.room === room) setTypingUsers(p.users ?? []);
        };
        const handlePresence = (p: { room?: string; users?: TypingUser[] }) => {
            if (p?.room === room) setPresentMembers(p.users ?? []);
        };

        socket.on("thread:item-new", handleItem);
        socket.on("thread:typing:update", handleTyping);
        socket.on("thread:presence:update", handlePresence);

        return () => {
            socket.emit("thread:leave", { room });
            socket.off("connect", join);
            socket.off("thread:item-new", handleItem);
            socket.off("thread:typing:update", handleTyping);
            socket.off("thread:presence:update", handlePresence);
            setTypingUsers([]);
            setPresentMembers([]);
        };
    }, [room, token, currentUsername]);

    const startTyping = useCallback(
        (wordCount?: number) => {
            if (!room) return;
            getForumSocket(token).emit("thread:typing:start", {
                room,
                username: currentUsername,
                wordCount: typeof wordCount === "number" ? wordCount : 0,
            });
        },
        [room, token, currentUsername]
    );

    const stopTyping = useCallback(() => {
        if (!room) return;
        getForumSocket(token).emit("thread:typing:stop", { room });
    }, [room, token]);

    const othersTyping = typingUsers.filter((u) => u.userId !== currentUserId);

    return { typingUsers: othersTyping, startTyping, stopTyping, presentMembers };
}
