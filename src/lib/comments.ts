/**
 * Règles et format partagés des commentaires de fiches (client + serveur).
 * Pas d'import mongoose ici : ce fichier est aussi chargé côté navigateur.
 */

export const COMMENT_MIN_CHARS = 3;
export const COMMENT_MAX_CHARS = 500;
/** Durée pendant laquelle l'auteur peut encore corriger son commentaire */
export const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;

export type CommentKindValue = "avis" | "question" | "erreur" | "merci";

export const COMMENT_KIND_OPTIONS: { value: CommentKindValue; label: string; emoji: string; hint: string }[] = [
    { value: "avis", label: "Avis", emoji: "💬", hint: "Partage ton avis sur la fiche…" },
    { value: "question", label: "Question", emoji: "❓", hint: "Pose ta question sur un point de la fiche…" },
    { value: "erreur", label: "Erreur dans la fiche", emoji: "🛠️", hint: "Indique où se trouve l'erreur et la correction…" },
    { value: "merci", label: "Merci", emoji: "🙏", hint: "Dis à l'auteur ce qui t'a aidé…" },
];

export interface CommentDTO {
    id: string;
    content: string;
    username: string;
    userId: string | null;
    createdAt: string;
    editedAt?: string | null;
    kind: CommentKindValue;
    likes: number;
    liked: boolean;
    pinned: boolean;
    parentId: string | null;
    /** Le visiteur peut-il modifier / supprimer ce commentaire ? */
    canEdit: boolean;
    canDelete: boolean;
    replies?: CommentDTO[];
}

export function canStillEdit(createdAt: string | Date, now = Date.now()): boolean {
    return now - new Date(createdAt).getTime() < COMMENT_EDIT_WINDOW_MS;
}
