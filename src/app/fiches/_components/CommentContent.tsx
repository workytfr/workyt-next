"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Mise en forme légère d'un commentaire : **gras**, *italique*, listes, liens
 * et formules ($x^2$). Le HTML tapé par l'élève est ignoré (pas de rehype-raw)
 * et les images / titres sont désactivés : un commentaire reste un commentaire.
 */
const DISALLOWED = ["img", "h1", "h2", "h3", "h4", "h5", "h6", "table", "hr", "input"];

export default function CommentContent({ content }: { content: string }) {
    return (
        <div className="text-[14.5px] leading-relaxed text-[rgba(26,21,18,0.82)] break-words [&_a]:font-medium [&_a]:text-[var(--wk-accent)] [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[rgba(26,21,18,0.15)] [&_blockquote]:pl-3 [&_blockquote]:text-[rgba(26,21,18,0.6)] [&_code]:rounded [&_code]:bg-[var(--wk-paper-2)] [&_code]:px-1 [&_code]:text-[13px] [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeKatex]}
                skipHtml
                disallowedElements={DISALLOWED}
                unwrapDisallowed
                components={{
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="nofollow ugc noopener noreferrer">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
