/**
 * Pièces jointes du forum : extension en liste blanche et taille maximale.
 * Le type annoncé par le navigateur (file.type) n'est pas fiable : sans ce
 * contrôle, n'importe quel fichier (HTML, SVG scripté…) était stocké.
 */
const FORUM_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "heic", "heif"]);
const FORUM_MAX_BYTES = 20 * 1024 * 1024;

export function forumUploadError(files: File[]): string | null {
    for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!FORUM_EXTENSIONS.has(ext)) return "Formats acceptés : PDF ou image (PNG, JPG, WEBP, GIF, HEIC).";
        if (file.size > FORUM_MAX_BYTES) return "Fichier trop lourd (20 Mo max).";
    }
    return null;
}
