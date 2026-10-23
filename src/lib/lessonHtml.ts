/**
 * Rendu HTML d'une leçon : blocs pédagogiques, nettoyage, coloration du code,
 * formules KaTeX et ancres des titres.
 *
 * Exécuté côté serveur (page leçon, version imprimable, API de prévisualisation) :
 * le navigateur reçoit du HTML prêt à afficher, sans embarquer unified ni KaTeX.
 */
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import katex from "katex";
import { highlightCodeBlocks } from "@/lib/codeHighlight";
import { sanitizeHastTree } from "@/lib/sanitizeHtml";

export interface TocItem {
    id: string;
    text: string;
    level: number;
}

export interface RenderedLesson {
    html: string;
    toc: TocItem[];
    readingTime: number;
}

// Blocs pédagogiques — le style est dans app/cours/_components/styles/lesson-blocks.css
const blockTypeConfig = {
    definition: { title: "Définition" },
    propriete: { title: "Propriété" },
    theoreme: { title: "Théorème" },
    remarque: { title: "Remarque" },
    attention: { title: "Attention" },
    exemple: { title: "Exemple" },
};

type BlockType = keyof typeof blockTypeConfig;

// Icônes (trait `currentColor` : la couleur vient de la variante CSS du bloc)
function getIconSVG(type: string) {
    const svg = (paths: string) =>
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
    switch (type) {
        case "definition":
            return svg(`<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`);
        case "propriete":
            return svg(`<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="16" x2="12" y2="16"/>`);
        case "theoreme":
            return svg(`<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`);
        case "remarque":
            return svg(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`);
        case "attention":
            return svg(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`);
        case "exemple":
            return svg(`<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>`);
        default:
            return svg(`<circle cx="12" cy="12" r="10"/>`);
    }
}

function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * En-tête d'un bloc : type en capitales, et le titre personnalisé en dessous
 * seulement s'il apporte quelque chose (« Définition » sous « DÉFINITION » : non).
 */
function blockHeadHtml(type: string, label: string, title: string) {
    const custom = title.trim() && title.trim().toLowerCase() !== label.toLowerCase();
    return `<div class="wk-block__head"><span class="wk-block__icon">${getIconSVG(type)}</span><span class="wk-block__heading"><span class="wk-block__label">${escapeHtml(label)}</span>${
        custom ? `<span class="wk-block__title">${escapeHtml(title.trim())}</span>` : ""
    }</span></div>`;
}

function enhancedStylePlugin() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === "element" && node.properties) {
                if (node.properties.style) {
                    if (typeof node.properties.style === "object" && !Array.isArray(node.properties.style)) {
                        const styleObj = node.properties.style;
                        const styleString = Object.entries(styleObj)
                            .map(([key, value]) => {
                                const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                                return `${kebabKey}: ${value}`;
                            })
                            .join("; ");
                        node.properties.style = styleString;
                    }
                }
            }

            if (node.type === "element" && node.tagName === "div") {
                let blockType: string | null = null;

                if (node.properties?.className) {
                    const className = Array.isArray(node.properties.className)
                        ? node.properties.className.join(" ")
                        : String(node.properties.className);

                    if (className.includes("custom-block")) {
                        const patterns = [
                            /custom-block\s+(\w+)/,
                            /\b(\w+)\s+custom-block/,
                            /custom-block-(\w+)/,
                        ];
                        for (const pattern of patterns) {
                            const match = className.match(pattern);
                            if (match && match[1]) {
                                blockType = match[1];
                                break;
                            }
                        }
                    }
                }

                if (!blockType && node.properties?.blocktype) {
                    blockType = String(node.properties.blocktype);
                }

                if (!blockType && node.properties?.["data-custom-block"] !== undefined) {
                    blockType = "remarque";
                }

                if (blockType && blockTypeConfig[blockType as BlockType]) {
                    const config = blockTypeConfig[blockType as BlockType];
                    let title = config.title;
                    let remainingChildren = node.children || [];

                    if (remainingChildren.length > 0) {
                        const firstChild = remainingChildren[0];
                        const extractText = (child: any): string => {
                            if (child.type === "text") return child.value || "";
                            if (child.type === "element" && child.children) {
                                return child.children.map(extractText).join("");
                            }
                            return "";
                        };

                        // Format 1 : <p><strong>Titre</strong></p> (TipTap-compatible)
                        if (firstChild.type === "element" && firstChild.tagName === "p" &&
                            firstChild.children?.length === 1 &&
                            firstChild.children[0]?.type === "element" &&
                            firstChild.children[0]?.tagName === "strong") {
                            title = extractText(firstChild.children[0]) || config.title;
                            remainingChildren = remainingChildren.slice(1);
                        }
                        // Format 2 : <strong>Titre</strong> (ancien format)
                        else if (firstChild.type === "element" && firstChild.tagName === "strong") {
                            title = extractText(firstChild) || config.title;
                            remainingChildren = remainingChildren.slice(1);
                        }
                    }

                    // Même balisage que le chemin HTML ci-dessous (voir styles/lesson-blocks.css)
                    node.children = [
                        { type: "raw", value: blockHeadHtml(blockType, config.title, title) },
                        {
                            type: "element",
                            tagName: "div",
                            properties: { className: ["wk-block__body"] },
                            children: remainingChildren,
                        },
                    ];

                    node.properties = {
                        ...node.properties,
                        className: ["wk-block", `wk-block--${blockType}`],
                        style: undefined,
                    };
                }
            }
        });
    };
}

function transformCustomBlocks(html: string): string {
    const pattern = /<div\s+([^>]*(?:data-custom-block|blocktype|class="[^"]*custom-block[^"]*")[^>]*)>([\s\S]*?)<\/div>/gi;
    let result = html;
    const matches: Array<{ start: number; end: number; attrs: string; content: string }> = [];
    let match;

    while ((match = pattern.exec(html)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            attrs: match[1],
            content: match[2],
        });
    }

    for (let i = matches.length - 1; i >= 0; i--) {
        const { start, end, attrs, content } = matches[i];
        let blockType: string | null = null;

        const blocktypeMatch = attrs.match(/blocktype="([^"]*)"/i);
        if (blocktypeMatch && blocktypeMatch[1]) {
            blockType = blocktypeMatch[1];
        }

        if (!blockType) {
            const classMatch = attrs.match(/class="([^"]*)"/i);
            if (classMatch && classMatch[1]) {
                const typeMatch = classMatch[1].match(/custom-block\s+(\w+)/);
                if (typeMatch && typeMatch[1]) blockType = typeMatch[1];
            }
        }

        if (blockType && blockTypeConfig[blockType as BlockType]) {
            const config = blockTypeConfig[blockType as BlockType];
            let blockTitle = config.title;
            let blockContent = content.trim();
            // Format 1 : <p><strong>Titre</strong></p> (nouveau format TipTap-compatible)
            const pStrongMatch = blockContent.match(/^<p>\s*<strong>([^<]*)<\/strong>\s*<\/p>/);
            // Format 2 : <strong>Titre</strong> (ancien format)
            const strongMatch = blockContent.match(/^<strong>([^<]*)<\/strong>/);
            if (pStrongMatch && pStrongMatch[1]) {
                blockTitle = pStrongMatch[1];
                blockContent = blockContent.replace(/^<p>\s*<strong>([^<]*)<\/strong>\s*<\/p>\s*/, "");
            } else if (strongMatch && strongMatch[1]) {
                blockTitle = strongMatch[1];
                blockContent = blockContent.replace(/^<strong>([^<]*)<\/strong>\s*/, "");
            }

            // Le titre vient du HTML (déjà échappé) : on le décode avant que
            // blockHeadHtml ne l'échappe, sinon « & » s'afficherait « &amp; ».
            const plainTitle = blockTitle
                .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
            const transformedHtml = `<div class="wk-block wk-block--${blockType}">${blockHeadHtml(blockType, config.title, plainTitle)}<div class="wk-block__body">${blockContent}</div></div>`;

            result = result.substring(0, start) + transformedHtml + result.substring(end);
        }
    }

    return result;
}

const sanitizeForKatex = (formula: string): string =>
    formula
        .replace(/ /g, " ")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"');

function transformLatex(html: string): string {
    return html.replace(/\$\$(.*?)\$\$|\$(.*?)\$/gs, (match, displayMode, inlineMode) => {
        const formula = sanitizeForKatex(displayMode || inlineMode);
        try {
            return katex.renderToString(formula, { displayMode: !!displayMode, throwOnError: false });
        } catch {
            return match;
        }
    });
}

function slugifyHeading(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

/** Ajoute un id aux h2/h3 (ancres du sommaire de la leçon) */
function addHeadingIds(html: string, idPrefix = ""): string {
    const slugCounts = new Map<string, number>();

    return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (match, level, attrs, content) => {
        if (attrs.includes('id="')) return match;

        const text = content.replace(/<[^>]*>/g, "").trim();
        let slug = slugifyHeading(text);

        const count = slugCounts.get(slug) || 0;
        slugCounts.set(slug, count + 1);
        if (count > 0) slug += `-${count}`;

        return `<h${level}${attrs} id="${idPrefix}${slug}">${content}</h${level}>`;
    });
}

function extractHeadings(html: string): TocItem[] {
    const items: TocItem[] = [];
    const regex = /<h([23])\s[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const text = match[3].replace(/<[^>]*>/g, "").trim();
        if (text && match[2]) {
            items.push({ id: match[2], text, level: parseInt(match[1]) });
        }
    }

    return items;
}

/** Temps de lecture en minutes (~200 mots/minute) */
function estimateReadingTime(htmlContent: string): number {
    if (!htmlContent) return 1;
    const text = htmlContent.replace(/<[^>]*>/g, "");
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Transforme le contenu saisi dans l'éditeur en HTML affichable.
 * `idPrefix` évite les collisions d'ancres quand plusieurs leçons sont sur la
 * même page (version imprimable).
 */
export function renderLessonHtml(content: string, idPrefix = ""): RenderedLesson {
    let processedHtml: string;

    try {
        const tree = unified()
            .use(rehypeParse, { fragment: true, space: "html" })
            .use(enhancedStylePlugin)
            .parse(transformCustomBlocks(content || ""));

        // Retire scripts, gestionnaires on* et URL javascript: du HTML saisi.
        sanitizeHastTree(tree);

        // Coloration syntaxique des <pre><code>
        highlightCodeBlocks(tree as any);

        processedHtml = unified()
            .use(rehypeStringify, { allowDangerousHtml: true })
            .stringify(tree);
    } catch (error) {
        console.warn("Erreur lors du traitement HTML:", error);
        // Jamais le HTML brut : il n'a pas été nettoyé.
        processedHtml = "";
    }

    const html = addHeadingIds(transformLatex(processedHtml), idPrefix);

    return {
        html,
        toc: extractHeadings(html),
        readingTime: estimateReadingTime(content),
    };
}

export interface KeyBlock {
    type: string;
    /** Titre personnalisé du bloc (vide s'il reprend le type, ex. « Définition ») */
    title: string;
    html: string;
}

/** Blocs à retenir : ceux qu'un manuel reprend dans « Je retiens l'essentiel » */
const KEY_BLOCK_TYPES = ["definition", "propriete", "theoreme", "attention"];

/**
 * Extrait d'une leçon rendue (renderLessonHtml) ses blocs définition,
 * propriété, théorème et « attention », pour la synthèse de fin de chapitre.
 */
export function extractKeyBlocks(html: string): KeyBlock[] {
    const tree = unified().use(rehypeParse, { fragment: true }).parse(html);
    const blocks: KeyBlock[] = [];
    const text = (node: any): string =>
        node.type === "text" ? node.value : (node.children || []).map(text).join("");

    visit(tree, "element", (node: any) => {
        const classes: string[] = Array.isArray(node.properties?.className) ? node.properties.className.map(String) : [];
        if (!classes.includes("wk-block")) return;
        const type = classes.find((c) => c.startsWith("wk-block--"))?.slice("wk-block--".length) ?? "";
        if (!KEY_BLOCK_TYPES.includes(type)) return "skip";

        let title = "";
        visit(node, "element", (child: any) => {
            const cls: string[] = Array.isArray(child.properties?.className) ? child.properties.className.map(String) : [];
            if (cls.includes("wk-block__title")) title = text(child).trim();
        });
        blocks.push({
            type,
            title,
            html: unified().use(rehypeStringify, { allowDangerousHtml: true }).stringify(node as any),
        });
        return "skip";
    });

    return blocks;
}
