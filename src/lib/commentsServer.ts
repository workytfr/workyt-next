import { canStillEdit, type CommentDTO, type CommentKindValue } from "@/lib/comments";

export interface CommentViewerContext {
    viewerId: string | null;
    /** Le visiteur est l'auteur de la fiche */
    isFicheAuthor: boolean;
    /** Le visiteur a la permission de modération des fiches */
    canModerate: boolean;
}

/** Document commentaire « lean », auteur peuplé (username, _id) ou simple id. */
type RawComment = {
    _id: unknown;
    content: string;
    author?: unknown;
    createdAt?: Date | string;
    editedAt?: Date | string | null;
    kind?: string;
    likes?: number;
    likedBy?: unknown[];
    pinned?: boolean;
    parent?: unknown;
};

/** Forme envoyée au navigateur : droits du visiteur calculés côté serveur. */
export function serializeComment(c: RawComment, ctx: CommentViewerContext): CommentDTO {
    const author = c.author as { _id?: unknown; username?: string } | null | undefined;
    const authorId = author?._id ? String(author._id) : author ? String(author) : null;
    const createdAt = c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString();
    const isAuthor = !!ctx.viewerId && authorId === ctx.viewerId;
    return {
        id: String(c._id),
        content: c.content,
        username: author?.username || "Utilisateur inconnu",
        userId: authorId,
        createdAt,
        editedAt: c.editedAt ? new Date(c.editedAt).toISOString() : null,
        kind: (c.kind as CommentKindValue) || "avis",
        likes: c.likes ?? 0,
        liked: !!ctx.viewerId && (c.likedBy ?? []).some((id) => String(id) === ctx.viewerId),
        pinned: !!c.pinned,
        parentId: c.parent ? String(c.parent) : null,
        canEdit: isAuthor && canStillEdit(createdAt),
        canDelete: isAuthor || ctx.isFicheAuthor || ctx.canModerate,
    };
}
