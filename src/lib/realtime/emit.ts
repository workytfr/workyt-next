/**
 * Helpers d'émission temps réel utilisables depuis les routes API Next.
 *
 * L'instance Socket.IO est créée dans `server.mjs` (serveur custom) et déposée
 * sur `globalThis.__forumIO`. Comme les routes API tournent dans le MÊME process
 * Node, elles y accèdent ici. Si l'app est démarrée sans le serveur custom
 * (ex. `next start`), `__forumIO` est absent → ces helpers sont de simples no-op,
 * ce qui garantit qu'aucune route ne casse.
 */

type MinimalIO = {
    to: (room: string) => { emit: (event: string, payload: unknown) => void };
};

function getIO(): MinimalIO | null {
    return (globalThis as unknown as { __forumIO?: MinimalIO }).__forumIO ?? null;
}

/**
 * Notifie les clients d'un fil (« thread ») qu'un item a été ajouté (réponse de
 * forum, commentaire de fiche…). Les clients rechargent la liste (shape garanti).
 * `room` est opaque : `question:<id>`, `fiche:<id>`, etc.
 */
export function emitThreadItemNew(room: string, meta?: Record<string, unknown>): void {
    try {
        getIO()?.to(room).emit("thread:item-new", { room, ...meta });
    } catch {
        // ne jamais faire échouer la requête à cause du temps réel
    }
}

/**
 * Raccourci forum : notifie les clients présents sur une question d'une nouvelle réponse.
 */
export function emitAnswerChanged(questionId: string, meta?: Record<string, unknown>): void {
    emitThreadItemNew(`question:${questionId}`, meta);
}

/** Émet un événement global forum (compteurs live sur la liste). */
export function emitForumEvent(event: "question:new" | "answer:new", payload: Record<string, unknown>): void {
    try {
        getIO()?.to("forum:global").emit(event, payload);
    } catch {
        /* no-op */
    }
}
