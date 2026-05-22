/**
 * Parse les mentions @pseudo dans du markdown et les remplace par des liens
 * `[@pseudo](/compte/id)` selon une whitelist de participants validés.
 *
 * - Évite les conversions à l'intérieur des blocs de code / code inline.
 * - Retourne aussi la liste des userIds mentionnés (pour notifier).
 */

export interface Participant {
    _id: string;
    username: string;
}

interface ParseResult {
    content: string;
    mentionedUserIds: string[];
}

const MENTION_REGEX = /(^|[\s.,;:!?(])@([a-zA-Z0-9_\-]{2,30})/g;

export function parseMentions(markdown: string, participants: Participant[]): ParseResult {
    if (!markdown) return { content: markdown, mentionedUserIds: [] };

    // Map username (lowercased) → id pour lookup O(1)
    const byName = new Map<string, string>();
    for (const p of participants) {
        if (p?.username && p?._id) {
            byName.set(p.username.toLowerCase(), String(p._id));
        }
    }
    if (byName.size === 0) return { content: markdown, mentionedUserIds: [] };

    const mentioned = new Set<string>();

    // Découpe par code blocks (```) pour ne pas toucher au code
    const segments = markdown.split(/(```[\s\S]*?```)/g);
    const processed = segments.map((seg) => {
        if (seg.startsWith("```")) return seg;
        // Même chose pour le code inline (`...`)
        const subSegments = seg.split(/(`[^`]*`)/g);
        return subSegments
            .map((sub) => {
                if (sub.startsWith("`")) return sub;
                return sub.replace(MENTION_REGEX, (match, prefix: string, name: string) => {
                    const id = byName.get(name.toLowerCase());
                    if (!id) return match; // pseudo inconnu → on laisse tel quel
                    mentioned.add(id);
                    // Stocke un placeholder par ID, résolu dynamiquement au rendu
                    return `${prefix}@[user:${id}]`;
                });
            })
            .join("");
    });

    return {
        content: processed.join(""),
        mentionedUserIds: Array.from(mentioned),
    };
}
