"use client";

import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Texte d'un message du suivi : Markdown léger (gras, italique, listes, code)
 * et formules LaTeX (`$…$` en ligne, `$$…$$` en bloc). Le message reste du
 * texte en base : le filtre anti-coordonnées continue de le lire tel quel.
 *
 * Pas de liens, d'images ni de titres : un message n'est pas une page. Ils
 * sont ramenés à leur texte. Le HTML brut n'est jamais interprété.
 */
const DISALLOWED = ["a", "img", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "table", "input"];

// Titre d'un bloc : une seule ligne, sans paragraphe
const INLINE_COMPONENTS: Components = { p: ({ children }) => <>{children}</> };

/**
 * `$$…$$` seul sur sa ligne s'affiche en formule centrée : remark-math ne le
 * fait que si les `$$` sont sur leurs propres lignes, ce que personne ne tape.
 */
function normalizeDisplayMath(text: string) {
    return text.replace(/^[ \t]*\$\$([^\n$]+?)\$\$[ \t]*$/gm, (_, tex: string) => `\n$$\n${tex.trim()}\n$$\n`);
}

export default function MessageText({ text, inline = false }: { text: string; inline?: boolean }) {
    const markdown = (
        <ReactMarkdown
            remarkPlugins={[remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
            disallowedElements={inline ? [...DISALLOWED, "ul", "ol", "li", "blockquote", "pre"] : DISALLOWED}
            unwrapDisallowed
            skipHtml
            components={inline ? INLINE_COMPONENTS : undefined}
        >
            {inline ? text : normalizeDisplayMath(text)}
        </ReactMarkdown>
    );

    if (inline) return markdown;

    return (
        <div className="wk-msg-text [&_.katex-display]:my-1.5 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:opacity-80 [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:text-[0.92em] [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_pre]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
            {markdown}
        </div>
    );
}
