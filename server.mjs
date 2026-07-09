// ---------------------------------------------------------------------------
// Serveur Next.js custom + Socket.IO (temps réel du forum)
//
// Pourquoi un serveur custom ?
//   Next (App Router) n'héberge pas Socket.IO nativement. On enveloppe donc le
//   handler Next dans un serveur HTTP Node et on y attache Socket.IO, sur le
//   MÊME port (3000) → ça passe par le proxy nginx existant (location /), sans
//   config root. Tant que nginx ne transmet pas l'en-tête `Upgrade`, Socket.IO
//   fonctionne en repli long-polling ; il basculera en WebSocket dès que le
//   vhost autorisera l'upgrade.
//
// Démarrage :
//   - dev  : node server.mjs            (NODE_ENV != production)
//   - prod : NODE_ENV=production node server.mjs   (après `next build`)
// ---------------------------------------------------------------------------
import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

// `webpack: true` force le bundler webpack (comme `next dev --webpack`).
// Sans ça, un serveur custom active Turbopack par défaut (TURBOPACK='auto'),
// qui entre en conflit avec les fichiers .d.cts d'uploadthing.
const app = next({ dev, hostname, port, webpack: true });
const handle = app.getRequestHandler();

// Suivi léger pour le monitoring (lu par /api/admin/realtime-metrics)
const stats = {
    connections: 0,
    totalConnections: 0,
    eventLoopLagMs: 0,
};
globalThis.__forumRealtimeStats = stats;

// Moteur générique de « thread » (fil de discussion), partagé par le forum
// (`question:<id>`) et les commentaires de fiches (`fiche:<id>`). La room est
// une chaîne opaque ; le serveur ne présume pas de son type.

// Rooms de frappe : room -> Map<userId, { username, wordCount, ts }>
const typingByRoom = new Map();

function broadcastTyping(io, room) {
    const map = typingByRoom.get(room);
    const users = map
        ? [...map.entries()].map(([userId, v]) => ({ userId, username: v.username, wordCount: v.wordCount ?? 0 }))
        : [];
    io.to(room).emit("thread:typing:update", { room, users });
}

// Rooms de présence : room -> Map<userId, { username, sockets:Set<socketId> }>
// (dédup par userId → un membre ouvert dans plusieurs onglets = compté une fois)
const presenceByRoom = new Map();

function broadcastPresence(io, room) {
    const map = presenceByRoom.get(room);
    const users = map
        ? [...map.entries()].map(([userId, v]) => ({ userId, username: v.username }))
        : [];
    io.to(room).emit("thread:presence:update", { room, users, count: users.length });
}

function addPresence(io, room, socket, username) {
    const userId = socket.data.userId;
    if (!userId || !room) return; // seuls les membres connectés apparaissent
    if (!presenceByRoom.has(room)) presenceByRoom.set(room, new Map());
    const map = presenceByRoom.get(room);
    const entry = map.get(userId) || { username: username || "", sockets: new Set() };
    if (username) entry.username = username;
    entry.sockets.add(socket.id);
    map.set(userId, entry);
    broadcastPresence(io, room);
}

function removePresence(io, room, socket) {
    const userId = socket.data.userId;
    if (!userId) return;
    const map = presenceByRoom.get(room);
    const entry = map?.get(userId);
    if (!entry) return;
    entry.sockets.delete(socket.id);
    if (entry.sockets.size === 0) map.delete(userId);
    broadcastPresence(io, room);
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => handle(req, res));

    const io = new SocketIOServer(httpServer, {
        path: "/socket.io",
        // même origine (servi par ce serveur) → pas de CORS spécifique nécessaire
        serveClient: false,
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    // Expose l'instance aux routes API Next (même process) via globalThis.
    globalThis.__forumIO = io;

    // Auth optionnelle : on vérifie le JWT (même secret qu'authMiddleware).
    // Un socket sans token valide reste connecté (lecture temps réel), mais
    // ne pourra pas émettre d'événements identifiés (typing).
    io.use((socket, nextFn) => {
        try {
            const token = socket.handshake.auth?.token;
            if (token && process.env.JWT_SECRET) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded && decoded.id) {
                    socket.data.userId = String(decoded.id);
                }
            }
        } catch {
            // token invalide/expiré → socket anonyme (pas d'erreur bloquante)
        }
        nextFn();
    });

    io.on("connection", (socket) => {
        stats.connections += 1;
        stats.totalConnections += 1;

        // Tous les clients reçoivent les événements globaux du forum (compteurs live sur la liste)
        socket.join("forum:global");

        socket.on("thread:join", ({ room, username } = {}) => {
            if (!room) return;
            socket.join(room);
            addPresence(io, room, socket, username);
        });

        socket.on("thread:leave", ({ room } = {}) => {
            if (!room) return;
            socket.leave(room);
            removePresence(io, room, socket);
        });

        socket.on("thread:typing:start", ({ room, username, wordCount } = {}) => {
            const userId = socket.data.userId;
            if (!userId || !room) return; // frappe = réservé aux authentifiés
            if (!typingByRoom.has(room)) typingByRoom.set(room, new Map());
            typingByRoom.get(room).set(userId, {
                username: username || "",
                wordCount: typeof wordCount === "number" ? wordCount : 0,
                ts: Date.now(),
            });
            broadcastTyping(io, room);
        });

        socket.on("thread:typing:stop", ({ room } = {}) => {
            const userId = socket.data.userId;
            if (!userId || !room) return;
            const map = typingByRoom.get(room);
            if (map && map.delete(userId)) broadcastTyping(io, room);
        });

        socket.on("disconnect", () => {
            stats.connections = Math.max(0, stats.connections - 1);
            const userId = socket.data.userId;
            if (!userId) return;
            // Nettoyer l'état de frappe de ce user dans toutes les rooms
            for (const [room, map] of typingByRoom.entries()) {
                if (map.delete(userId)) broadcastTyping(io, room);
            }
            // Nettoyer la présence : retirer ce socket ; si c'était son dernier onglet, retirer le membre
            for (const [room, map] of presenceByRoom.entries()) {
                const entry = map.get(userId);
                if (entry && entry.sockets.has(socket.id)) {
                    entry.sockets.delete(socket.id);
                    if (entry.sockets.size === 0) map.delete(userId);
                    broadcastPresence(io, room);
                }
            }
        });
    });

    // Mesure simple du event-loop lag (indicateur de saturation CPU)
    let last = Date.now();
    setInterval(() => {
        const now = Date.now();
        stats.eventLoopLagMs = Math.max(0, now - last - 1000);
        last = now;
    }, 1000).unref();

    httpServer.listen(port, hostname, () => {
        console.log(
            `> Serveur prêt sur http://${hostname}:${port} (dev=${dev}) — Socket.IO actif sur /socket.io`
        );
    });
});
