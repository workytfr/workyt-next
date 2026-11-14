/**
 * Recherche tolérante pour la palette de recherche (/api/search).
 *
 * - Accents et majuscules ignorés : « revolution » trouve « Révolution ».
 * - Plusieurs mots : chacun doit apparaître, dans n'importe quel ordre
 *   (« francaise revolution » trouve « La Révolution française »).
 * - Pluriels : « fonctions » trouve aussi « fonction ».
 * - Classement : les titres qui correspondent le mieux passent devant, au lieu
 *   d'un simple tri par date.
 *
 * Les motifs produits ne contiennent que des classes de caractères simples
 * (aucune répétition imbriquée) : pas de risque de regex catastrophique.
 */

const ACCENTS: Record<string, string> = {
    a: "aàâäáã",
    c: "cç",
    e: "eéèêë",
    i: "iîïí",
    n: "nñ",
    o: "oôöóõ",
    u: "uùûüú",
    y: "yÿ",
};

/** Mots vides ignorés quand la recherche contient d'autres mots. */
const STOPWORDS = new Set([
    "le", "la", "les", "l", "un", "une", "des", "de", "du", "d", "et", "en", "au", "aux",
    "a", "sur", "pour", "dans", "par", "est", "ce", "ces", "que", "qui", "quoi", "comment",
]);

const MAX_TOKENS = 6;

/** Minuscules sans accents : « Élève » → « eleve ». */
export function normalizeText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
}

/** Mots utiles de la recherche, normalisés. */
export function tokenize(query: string): string[] {
    const words = normalizeText(query)
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
    const useful = words.filter((w) => !STOPWORDS.has(w) && w.length > 1);
    // Recherche faite uniquement de mots vides (« de la ») : on les garde
    return [...new Set(useful.length ? useful : words)].slice(0, MAX_TOKENS);
}

/** Radical : sans le « s » ou « x » final des mots assez longs. */
function stem(token: string): string {
    return token.length >= 4 && /[sx]$/.test(token) ? token.slice(0, -1) : token;
}

/** Motif insensible aux accents pour un mot déjà normalisé (a-z, 0-9). */
function tokenPattern(token: string): string {
    return [...stem(token)].map((ch) => (ACCENTS[ch] ? `[${ACCENTS[ch]}]` : ch)).join("");
}

export function tokenRegex(token: string): RegExp {
    return new RegExp(tokenPattern(token), "i");
}

/**
 * Filtre MongoDB : chaque mot (mode "all") ou au moins un mot (mode "any")
 * doit apparaître dans l'un des champs donnés.
 */
export function buildTextFilter(tokens: string[], fields: string[], mode: "all" | "any" = "all"): Record<string, unknown> {
    const perToken = tokens.map((t) => {
        const re = tokenRegex(t);
        return fields.length === 1 ? { [fields[0]]: re } : { $or: fields.map((f) => ({ [f]: re })) };
    });
    if (perToken.length === 0) return {};
    if (perToken.length === 1) return perToken[0];
    return mode === "all" ? { $and: perToken } : { $or: perToken };
}

/**
 * Note de pertinence d'un titre. Plus elle est haute, mieux le titre
 * correspond : expression exacte, début de titre, début de mot, nombre de
 * mots trouvés.
 */
export function scoreTitle(title: string, query: string, tokens: string[]): number {
    const t = normalizeText(title);
    const q = normalizeText(query).trim();
    let score = 0;
    if (q && t.includes(q)) score += 50;
    if (q && t.startsWith(q)) score += 30;
    for (const token of tokens) {
        const s = stem(token);
        const at = t.indexOf(s);
        if (at === -1) continue;
        score += 10;
        // Début de mot : « fonction » dans « Les fonctions », pas dans « dysfonction »
        if (at === 0 || !/[a-z0-9]/.test(t[at - 1])) score += 8;
    }
    // À pertinence égale, les titres courts sont plus ciblés
    return score - Math.min(t.length, 200) / 200;
}

/** Trie par pertinence, puis par date (récent d'abord). */
export function rankByTitle<T extends { title: string; date?: unknown }>(rows: T[], query: string, tokens: string[]): T[] {
    const time = (d: unknown) => (d ? new Date(d as string).getTime() || 0 : 0);
    return rows
        .map((row) => ({ row, score: scoreTitle(row.title, query, tokens) }))
        .sort((a, b) => b.score - a.score || time(b.row.date) - time(a.row.date))
        .map((x) => x.row);
}
