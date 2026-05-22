/**
 * Configuration partagée pour le rendu Markdown sur Workyt.
 *
 * - `rehypeRaw` : parse les balises HTML dans le markdown (ex. `<u>X</u>`)
 * - `rehypeSanitize` (schéma étendu) : autorise les balises de mise en forme
 *   sûres (u, mark, ins, del, sub, sup, kbd, details/summary) tout en bloquant
 *   les balises dangereuses (script, iframe, on* handlers, etc.).
 * - L'ordre est important : sanitize doit s'exécuter AVANT rehypeKatex, sinon
 *   KaTeX serait stripé par le sanitize.
 */

import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Schéma de sanitization étendu : on garde la liste GitHub par défaut + tags
// de mise en forme courants (Tiptap les produit).
const schema: typeof defaultSchema = {
    ...defaultSchema,
    tagNames: [
        ...(defaultSchema.tagNames ?? []),
        "u",
        "mark",
        "ins",
        "del",
        "sub",
        "sup",
        "kbd",
        "abbr",
        "details",
        "summary",
    ],
    attributes: {
        ...(defaultSchema.attributes ?? {}),
        "*": [
            ...((defaultSchema.attributes ?? {})["*"] ?? []),
            "className",
            "title",
            "id",
        ],
        a: [
            ...((defaultSchema.attributes ?? {}).a ?? []),
            "target",
            "rel",
        ],
        img: [
            ...((defaultSchema.attributes ?? {}).img ?? []),
            "alt",
            "src",
            "title",
            "loading",
        ],
    },
};

/** Plugins remark à appliquer en premier (transformation markdown → AST). */
export const sharedRemarkPlugins = [remarkMath, remarkGfm];

/** Plugins rehype dans l'ordre correct : raw → sanitize → katex. */
export const sharedRehypePlugins = [
    rehypeRaw,
    [rehypeSanitize, schema] as any,
    rehypeKatex,
];
