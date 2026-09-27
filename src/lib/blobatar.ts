import { renderAvatarSvg, renderAvatarUri, type AvatarLook } from "@/lib/avatarLook";

/**
 * Avatar génératif par défaut (quand aucune photo de profil n'est active),
 * avec les accessoires achetés en boutique.
 * Partagé entre le site (data URI) et l'API /api/avatar/[id] (SVG) :
 * même id → même blobatar partout.
 */
export function generatedAvatarUri(id: string, look?: AvatarLook): string {
    return renderAvatarUri(id, look);
}

export function generatedAvatarSvg(id: string, size?: number, look?: AvatarLook): string {
    return renderAvatarSvg(id, look, size);
}
