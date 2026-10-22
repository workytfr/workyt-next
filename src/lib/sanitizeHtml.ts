import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP } from "unist-util-visit";

/**
 * Nettoyage du HTML des leçons (éditeur riche, import IA) avant affichage.
 *
 * Une liste blanche stricte casserait la mise en forme (styles en ligne, blocs
 * personnalisés data-custom-block / blocktype…). On retire donc tout ce qui
 * peut exécuter du code : balises actives, gestionnaires on*, URL javascript:.
 * Sans ça, un rédacteur (ou un PDF piégé passé dans l'import IA) pouvait
 * exécuter du script chez les correcteurs, les admins puis tous les élèves.
 */

const DROP_TAGS = new Set([
    "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet",
    "form", "input", "button", "select", "textarea", "link", "meta", "base", "noscript", "template",
]);

const URL_PROPS = ["href", "src", "xLinkHref", "action", "formAction", "poster", "background", "cite", "data"];
// data:image autorisé (images collées dans l'éditeur), sauf SVG (scriptable)
const UNSAFE_URL = /^\s*(javascript|vbscript|data:(?!image\/(png|jpe?g|gif|webp);))/i;

type HastNode = {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
};

export function sanitizeHastTree(tree: unknown): void {
    visit(tree as HastNode, "element", (node: HastNode, index, parent: HastNode | undefined) => {
        if (node.tagName && DROP_TAGS.has(node.tagName.toLowerCase())) {
            if (parent?.children && typeof index === "number") {
                parent.children.splice(index, 1);
                return [SKIP, index];
            }
        }
        const props = node.properties;
        if (!props) return;
        for (const key of Object.keys(props)) {
            if (/^on/i.test(key) || key.toLowerCase() === "srcdoc") {
                delete props[key];
            }
        }
        for (const key of URL_PROPS) {
            const value = props[key];
            if (typeof value === "string" && UNSAFE_URL.test(value)) delete props[key];
        }
    });
}

/** Variante chaîne → chaîne, pour les aperçus qui injectent le HTML tel quel. */
export function sanitizeHtml(html: string): string {
    const tree = unified().use(rehypeParse, { fragment: true }).parse(html || "");
    sanitizeHastTree(tree);
    return unified().use(rehypeStringify).stringify(tree);
}
