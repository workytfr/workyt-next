/**
 * Helpers pour traiter les placeholders de mentions `@[user:id]` dans du markdown.
 *
 * Stratégie :
 *   - Stockage : `@[user:abcdef...]` (figé sur l'ID, pas sur le pseudo)
 *   - Affichage : résolu dynamiquement au rendu (pseudo + avatar actuels)
 */

export const MENTION_PLACEHOLDER_RE = /@\[user:([a-f0-9]{24})\]/g;

/**
 * Extrait tous les userIds mentionnés dans un (ou plusieurs) markdown.
 * Dédupliqué automatiquement.
 */
export function extractMentionIds(...sources: Array<string | null | undefined>): string[] {
    const ids = new Set<string>();
    for (const src of sources) {
        if (!src) continue;
        let m: RegExpExecArray | null;
        const re = new RegExp(MENTION_PLACEHOLDER_RE.source, "g");
        while ((m = re.exec(src)) !== null) {
            ids.add(m[1]);
        }
    }
    return Array.from(ids);
}

/**
 * Pré-traite le markdown en remplaçant `@[user:id]` par `[@username](/compte/id?m=1)`
 * selon une Map<id, username>.
 *   - `?m=1` permet au renderer de distinguer un lien-mention d'un lien normal
 *   - Si l'ID n'a pas de pseudo connu (user supprimé), on rend `@?`
 */
export function preprocessMentions(
    md: string | null | undefined,
    users: Map<string, { username: string }>,
): string {
    if (!md) return md ?? "";
    return md.replace(MENTION_PLACEHOLDER_RE, (_match, id: string) => {
        const u = users.get(id);
        if (!u) return "_@?_";
        return `[@${u.username}](/compte/${id}?m=1)`;
    });
}
