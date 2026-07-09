"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getForumSocket } from "@/lib/realtime/socketClient";

/**
 * Temps réel de la liste du forum : compte les nouvelles questions postées
 * pendant que l'utilisateur consulte la liste (room "forum:global", à laquelle
 * le serveur inscrit automatiquement chaque socket).
 */
export function useForumListRealtime() {
    const { data: session } = useSession();
    const token = (session as unknown as { accessToken?: string })?.accessToken;
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const socket = getForumSocket(token);
        const handleNewQuestion = () => setNewCount((c) => c + 1);
        socket.on("question:new", handleNewQuestion);
        return () => {
            socket.off("question:new", handleNewQuestion);
        };
    }, [token]);

    return { newCount, reset: () => setNewCount(0) };
}
