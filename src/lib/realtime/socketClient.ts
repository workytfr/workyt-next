"use client";

import { io, type Socket } from "socket.io-client";

/**
 * Singleton Socket.IO côté client : une seule connexion partagée pour toute
 * l'app (évite d'ouvrir un socket par composant).
 *
 * Transports : WebSocket uniquement (pas de repli long-polling). On évite ainsi
 * la phase de handshake HTTP + upgrade, et les requêtes de polling qui chargent
 * inutilement le serveur. Prérequis : le vhost nginx DOIT transmettre les
 * en-têtes `Upgrade`/`Connection` sur /socket.io. Aucune URL → même origine.
 */
let socket: Socket | null = null;

export function getForumSocket(token?: string): Socket {
    if (socket) {
        // Met à jour le token si la session a changé (reconnexion authentifiée)
        const currentAuth = socket.auth as { token?: string } | undefined;
        if (token && currentAuth?.token !== token) {
            socket.auth = { token };
        }
        return socket;
    }

    socket = io({
        path: "/socket.io",
        autoConnect: true,
        auth: token ? { token } : {},
        transports: ["websocket"],
        upgrade: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    return socket;
}
