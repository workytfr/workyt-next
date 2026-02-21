/**
 * Échappe les caractères spéciaux regex pour une utilisation sûre dans $regex MongoDB.
 * Prévient les attaques ReDoS et les injections via les métacaractères regex.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
