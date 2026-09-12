/**
 * Coloration syntaxique partagée (leçons, exercices, quiz).
 *
 * Une seule instance lowlight et un seul jeu de classes CSS pour les trois
 * points de rendu du site :
 *  - les leçons, dont le contenu est du HTML injecté → transformateur hast
 *    `highlightCodeBlocks` appliqué dans le pipeline unified de LessonView ;
 *  - les exercices et la description de cours, rendus par react-markdown →
 *    composant React `<CodeBlock>` ;
 *  - les quiz, qui affichent du code dans l'énoncé et la correction.
 *
 * lowlight est déjà une dépendance (utilisée par l'éditeur TipTap), donc le
 * balisage produit ici est exactement celui que l'éditeur écrit : les classes
 * `hljs-*` sont communes, le thème CSS (`code-block.css`) sert les deux.
 */

import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

/** Noeud hast minimal tel que produit par lowlight. */
export type HighlightNode =
    | { type: "text"; value: string }
    | {
          type: "element";
          tagName: string;
          properties?: { className?: string[] | string };
          children: HighlightNode[];
      };

/**
 * Alias usuels → identifiant lowlight.
 * Les élèves écrivent « py », « js », « c++ »… autant les accepter.
 */
const LANGUAGE_ALIASES: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    node: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    py3: "python",
    python3: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    console: "bash",
    terminal: "bash",
    "c++": "cpp",
    cxx: "cpp",
    "c#": "csharp",
    cs: "csharp",
    html: "xml",
    htm: "xml",
    svg: "xml",
    yml: "yaml",
    md: "markdown",
    postgres: "sql",
    postgresql: "sql",
    mysql: "sql",
    text: "plaintext",
    txt: "plaintext",
    pseudo: "plaintext",
    pseudocode: "plaintext",
};

/** Libellé affiché dans la barre du bloc. */
const LANGUAGE_LABELS: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    c: "C",
    cpp: "C++",
    csharp: "C#",
    php: "PHP",
    ruby: "Ruby",
    go: "Go",
    rust: "Rust",
    swift: "Swift",
    kotlin: "Kotlin",
    scala: "Scala",
    bash: "Terminal",
    powershell: "PowerShell",
    sql: "SQL",
    json: "JSON",
    yaml: "YAML",
    xml: "HTML",
    css: "CSS",
    scss: "SCSS",
    less: "Less",
    markdown: "Markdown",
    r: "R",
    matlab: "MATLAB",
    perl: "Perl",
    lua: "Lua",
    dart: "Dart",
    plaintext: "Texte",
};

/**
 * Ramène une valeur brute (attribut `language-xxx`, saisie libre de l'auteur)
 * à un identifiant lowlight utilisable, ou `null` si le langage est inconnu.
 */
export function normalizeLanguage(raw?: string | null): string | null {
    if (!raw) return null;

    const cleaned = String(raw)
        .trim()
        .toLowerCase()
        .replace(/^language-/, "")
        .replace(/^lang-/, "");

    if (!cleaned) return null;

    const resolved = LANGUAGE_ALIASES[cleaned] ?? cleaned;
    return lowlight.registered(resolved) ? resolved : null;
}

/** Libellé lisible pour la barre du bloc (« Python », « Terminal »…). */
export function getLanguageLabel(language: string | null): string {
    if (!language) return "Code";
    return LANGUAGE_LABELS[language] ?? language.toUpperCase();
}

/**
 * Colorise du code et renvoie les noeuds hast correspondants.
 * Sans langage reconnu, le code est renvoyé tel quel (un seul noeud texte) :
 * mieux vaut du code non colorisé qu'une détection automatique fantaisiste.
 */
export function highlightToHast(code: string, language: string | null): HighlightNode[] {
    if (!language) {
        return [{ type: "text", value: code }];
    }

    try {
        const tree = lowlight.highlight(language, code);
        return (tree.children ?? []) as HighlightNode[];
    } catch {
        return [{ type: "text", value: code }];
    }
}

// ---------------------------------------------------------------------------
// Transformateur hast pour le contenu HTML des leçons
// ---------------------------------------------------------------------------

type HastElement = {
    type: string;
    tagName?: string;
    value?: string;
    properties?: Record<string, any>;
    children?: HastElement[];
};

/** Concatène le texte d'un sous-arbre hast. */
function extractText(node: HastElement): string {
    if (node.type === "text") return node.value ?? "";
    if (!node.children) return "";
    return node.children.map(extractText).join("");
}

/** Lit la classe `language-xxx` posée par TipTap sur le `<code>`. */
function readLanguage(node: HastElement): string | null {
    const raw = node.properties?.className;
    const classes = Array.isArray(raw) ? raw : String(raw ?? "").split(/\s+/);

    for (const cls of classes) {
        const language = normalizeLanguage(String(cls));
        if (language) return language;
    }
    return null;
}

/**
 * Remplace chaque `<pre><code>` du contenu d'une leçon par le bloc Workyt :
 * barre de titre (langage + bouton copier) et code colorisé.
 *
 * Le bouton est du HTML statique — l'écouteur est branché par délégation côté
 * client (voir `useCodeBlockCopy`), puisque ce contenu est injecté via
 * `dangerouslySetInnerHTML` et ne peut pas porter de composant React.
 */
export function highlightCodeBlocks(tree: HastElement): void {
    const walk = (node: HastElement): void => {
        if (!node.children) return;

        node.children.forEach((child, index) => {
            const isCodeBlock =
                child.type === "element" &&
                child.tagName === "pre" &&
                child.children?.some((c) => c.type === "element" && c.tagName === "code");

            if (!isCodeBlock) {
                walk(child);
                return;
            }

            const codeNode = child.children!.find(
                (c) => c.type === "element" && c.tagName === "code"
            )!;

            const language = readLanguage(codeNode);
            const code = extractText(codeNode).replace(/\n$/, "");

            codeNode.properties = {
                ...codeNode.properties,
                className: ["hljs", language ? `language-${language}` : "language-plaintext"],
            };
            codeNode.children = highlightToHast(code, language) as unknown as HastElement[];
            child.properties = { ...child.properties, className: ["wk-code__pre"] };

            node.children![index] = {
                type: "element",
                tagName: "div",
                properties: { className: ["wk-code"], "data-language": language ?? "plaintext" },
                children: [
                    {
                        type: "element",
                        tagName: "div",
                        properties: { className: ["wk-code__bar"] },
                        children: [
                            {
                                type: "element",
                                tagName: "span",
                                properties: { className: ["wk-code__lang"] },
                                children: [{ type: "text", value: getLanguageLabel(language) }],
                            },
                            {
                                type: "element",
                                tagName: "button",
                                properties: {
                                    type: "button",
                                    className: ["wk-code__copy"],
                                    "data-code-copy": "",
                                    "aria-label": "Copier le code",
                                },
                                children: [{ type: "text", value: "Copier" }],
                            },
                        ],
                    },
                    child,
                ],
            };
        });
    };

    walk(tree);
}
