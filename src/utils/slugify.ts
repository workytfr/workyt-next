/**
 * Génère un slug SEO-friendly à partir d'un texte.
 * Gère les caractères accentués français et les caractères spéciaux.
 *
 * Exemple : "Comment résoudre une équation du 2nd degré ?" → "comment-resoudre-une-equation-du-2nd-degre"
 */
export function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD')                   // Décompose les accents (é → e + ́)
        .replace(/[\u0300-\u036f]/g, '')    // Supprime les diacritiques
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')      // Supprime les caractères spéciaux
        .replace(/\s+/g, '-')              // Remplace les espaces par des tirets
        .replace(/-+/g, '-')              // Supprime les tirets multiples
        .replace(/^-+|-+$/g, '')          // Supprime les tirets en début/fin
        .slice(0, 80);                     // Limite la longueur du slug
}

/**
 * Génère une URL composite ID-slug pour le SEO.
 * Format: "64a1b2c3d4e5f6a7b8c9d0e1-comment-resoudre-equation"
 *
 * Le ID MongoDB (24 chars hex) est toujours au début, suivi du slug.
 */
export function buildIdSlug(id: string, title: string): string {
    const slug = slugify(title);
    return slug ? `${id}-${slug}` : id;
}

/**
 * Extrait l'ID MongoDB d'un paramètre composite id-slug.
 * Supporte les deux formats :
 *   - ID seul : "64a1b2c3d4e5f6a7b8c9d0e1"
 *   - ID-slug : "64a1b2c3d4e5f6a7b8c9d0e1-comment-resoudre"
 * Retourne null si aucun ObjectID valide n'est trouvé (slug pur).
 */
export function extractIdFromSlug(idSlug: string): string | null {
    // MongoDB ObjectID = 24 caractères hexadécimaux
    const match = idSlug.match(/^([a-f0-9]{24})/);
    return match ? match[1] : null;
}

/**
 * Vérifie si un string contient un ObjectID MongoDB valide.
 */
export function isValidObjectId(str: string): boolean {
    return /^[a-f0-9]{24}$/.test(str);
}
