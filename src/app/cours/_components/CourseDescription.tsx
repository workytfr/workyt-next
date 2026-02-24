"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

interface CourseDescriptionProps {
    content: string;
    maxLength?: number;
    className?: string;
}

export default function CourseDescription({ content, maxLength, className = "" }: CourseDescriptionProps) {
    // Si pas de maxLength défini, afficher tout le contenu
    if (!maxLength || content.length <= maxLength) {
        return (
            <div className={`prose prose-lg max-w-none text-[#6b6b6b] ${className}`}>
                <ReactMarkdown
                    rehypePlugins={[rehypeKatex]}
                    remarkPlugins={[remarkMath, remarkGfm]}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    }

    // Tronquer proprement sans couper un tag LaTeX
    let truncated = content.substring(0, maxLength);
    
    // Éviter de couper au milieu d'une formule LaTeX
    const lastDollar = truncated.lastIndexOf('$');
    const lastDoubleDollar = truncated.lastIndexOf('$$');
    
    // Compter les $ pour voir si on est au milieu d'une formule
    const dollarCount = (truncated.match(/\$/g) || []).length;
    const doubleDollarCount = (truncated.match(/\$\$/g) || []).length;
    
    // Si nombre impair de $ (hors $$), on est dans une formule inline
    if ((dollarCount - doubleDollarCount * 2) % 2 !== 0) {
        // Chercher le prochain $ dans le contenu original
        const nextDollar = content.indexOf('$', maxLength);
        if (nextDollar !== -1 && nextDollar < maxLength + 50) {
            truncated = content.substring(0, nextDollar + 1);
        } else {
            // Sinon couper avant le dernier $
            truncated = content.substring(0, lastDollar);
        }
    }
    
    // Vérifier si on est au milieu d'un block $$...$$
    if (lastDoubleDollar !== -1) {
        const afterLastDouble = truncated.substring(lastDoubleDollar + 2);
        const nextDoubleDollar = content.indexOf('$$', maxLength);
        
        // Si pas de fermeture dans ce qui reste, couper avant le block
        if (afterLastDouble.indexOf('$$') === -1 && nextDoubleDollar !== -1) {
            truncated = content.substring(0, lastDoubleDollar);
        }
    }

    return (
        <div className={`prose prose-sm max-w-none text-[#6b6b6b] line-clamp-2 ${className}`}>
            <ReactMarkdown
                rehypePlugins={[rehypeKatex]}
                remarkPlugins={[remarkMath, remarkGfm]}
            >
                {truncated + "..."}
            </ReactMarkdown>
        </div>
    );
}
