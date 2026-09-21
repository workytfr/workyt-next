/**
 * Helpers d'émission temps réel utilisables depuis les routes API Next.
 *
 * Le serveur Socket.IO tourne dans un microservice séparé (`socket-server.mjs`),
 * car le build Next de l'hébergeur est en `output: "standalone"` (plus de serveur
 * custom dans le même process). Ces helpers émettent via le pont HTTP interne
 * `POST {REALTIME_SERVICE_URL}/internal/emit`, protégé par REALTIME_INTERNAL_SECRET.
 *
 * Si la variable d'environnement est absente ou le service injoignable, les
 * helpers sont de simples no-op : aucune route ne casse à cause du temps réel.
 */

function getServiceUrl(): string | null {
    return process.env.REALTIME_SERVICE_URL || null;
}

function getInternalSecret(): string {
    return process.env.REALTIME_INTERNAL_SECRET || "";
}

function postInternalEmit(room: string, event: string, payload: Record<string, unknown>): void {
    const base = getServiceUrl();
    if (!base) return;
    try {
        void fetch(`${base}/internal/emit`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-internal-secret": getInternalSecret(),
            },
            body: JSON.stringify({ room, event, payload }),
            // Ne bloque jamais la requête à cause du temps réel
            signal: AbortSignal.timeout(3000),
        }).catch(() => {
            /* service temps réel indisponible → no-op */
        });
    } catch {
        /* no-op */
    }
}

/**
 * Notifie les clients d'un fil (« thread ») qu'un item a été ajouté (réponse de
 * forum, commentaire de fiche…). Les clients rechargent la liste (shape garanti).
 * `room` est opaque : `question:<id>`, `fiche:<id>`, etc.
 */
export function emitThreadItemNew(room: string, meta?: Record<string, unknown>): void {
    postInternalEmit(room, "thread:item-new", { room, ...meta });
}

/**
 * Raccourci forum : notifie les clients présents sur une question d'une nouvelle réponse.
 */
export function emitAnswerChanged(questionId: string, meta?: Record<string, unknown>): void {
    emitThreadItemNew(`question:${questionId}`, meta);
}

/**
 * Suivi personnalisé : signale « du nouveau » (message, objectif, ressource…)
 * dans la salle d'un suivi. La salle porte la clé secrète du suivi, jamais son
 * id, et l'événement ne transporte AUCUN contenu : les clients rechargent via
 * l'API, qui vérifie l'accès. Rien de privé ne transite par le socket.
 */
export function emitMentorshipChanged(roomKey: string): void {
    emitThreadItemNew(`mentorship:${roomKey}`);
}

/** Émet un événement global forum (compteurs live sur la liste). */
export function emitForumEvent(event: "question:new" | "answer:new", payload: Record<string, unknown>): void {
    postInternalEmit("forum:global", event, payload);
}
