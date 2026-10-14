/**
 * Rôles d'un utilisateur : un rôle principal (`role`, affiché partout) et des
 * rôles secondaires (`roles`) qui ajoutent leurs droits.
 *
 * Utilisable côté client comme côté serveur : aucun accès à la base ici.
 * Les permissions fines restent dans `@/lib/roles` (hasPermission).
 */

/** Ce qu'on peut passer pour désigner « les rôles de quelqu'un » */
export type RoleSubject =
    | string
    | readonly string[]
    | { role?: string | null; roles?: readonly string[] | null }
    | null
    | undefined;

/** Tous les rôles d'un utilisateur, rôle principal en premier, sans doublon */
export function getUserRoles(subject: RoleSubject): string[] {
    if (!subject) return [];
    if (typeof subject === 'string') return [subject];
    if (Array.isArray(subject)) return [...new Set(subject.filter(Boolean))];
    const { role, roles } = subject as { role?: string | null; roles?: readonly string[] | null };
    return [...new Set([role, ...(roles ?? [])].filter((r): r is string => !!r))];
}

/** Vrai si l'utilisateur possède au moins un des rôles donnés */
export function hasRole(subject: RoleSubject, ...names: string[]): boolean {
    const roles = getUserRoles(subject);
    return names.some((n) => roles.includes(n));
}

/**
 * Filtre Mongo « possède au moins un de ces rôles » (principal ou secondaire).
 * À combiner avec `$and` si la requête a déjà son propre `$or`.
 */
export function roleFilter(names: string | readonly string[]) {
    const list = typeof names === 'string' ? [names] : [...names];
    return { $or: [{ role: { $in: list } }, { roles: { $in: list } }] };
}
