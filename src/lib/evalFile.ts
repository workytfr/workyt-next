/**
 * Construit l'URL d'accès à un fichier d'évaluation (PDF sujet, photos de copie /
 * de correction) stocké sur R2.
 *
 * Les fichiers sont uploadés dans un bucket privé : l'URL brute stockée en base
 * pointe vers l'endpoint S3/R2 et renvoie une erreur "InvalidArgument / Authorization"
 * si on l'ouvre directement. On passe donc par le proxy serveur qui les sert via
 * une lecture authentifiée côté serveur.
 */
export function evalFileUrl(url?: string | null): string {
    if (!url) return "";
    // Déjà une URL relative (proxy) → ne pas re-proxifier.
    if (url.startsWith("/")) return url;
    return `/api/file-proxy?file=${encodeURIComponent(url)}`;
}
