/**
 * Cache mémoire des listes (catalogue des cours, fiches, forum) pour la durée
 * de la visite : en revenant sur une liste déjà vue, ses résultats s'affichent
 * tout de suite au lieu du squelette de chargement, puis la requête habituelle
 * les remplace par la version à jour. Rien n'est servi sans être revalidé.
 *
 * Vit dans la mémoire de l'onglet : vidé à chaque rechargement de page.
 */

const MAX_ENTRIES = 40;
const cache = new Map<string, unknown>();

/** Dernière réponse connue pour cette URL, ou undefined. */
export function peekList<T>(url: string): T | undefined {
    return cache.get(url) as T | undefined;
}

export function rememberList(url: string, data: unknown): void {
    cache.delete(url);
    cache.set(url, data);
    // Les plus anciennes entrées partent en premier (ordre d'insertion de Map)
    while (cache.size > MAX_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest === undefined) break;
        cache.delete(oldest);
    }
}
