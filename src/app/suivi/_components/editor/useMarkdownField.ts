"use client";

import React, { useRef } from "react";

export type FormatKind = "bold" | "italic" | "list" | "math";

/**
 * Mise en forme d'une zone de texte en Markdown léger (voir MessageText) :
 * entoure la sélection de marques, ou les pose et place le curseur entre les
 * deux — comme si on les tapait soi-même.
 */
export function useMarkdownField(
    value: string,
    setValue: (v: string) => void,
    max: number,
    /** La zone de texte, si le composant a déjà sa propre ref */
    externalRef?: React.RefObject<HTMLTextAreaElement | null>
) {
    const ownRef = useRef<HTMLTextAreaElement>(null);
    const ref = externalRef ?? ownRef;

    const apply = (next: string, selStart: number, selEnd: number) => {
        if (next.length > max) return;
        setValue(next);
        const ta = ref.current;
        requestAnimationFrame(() => {
            if (!ta) return;
            ta.focus();
            ta.setSelectionRange(selStart, selEnd);
        });
    };

    const selection = () => {
        const ta = ref.current;
        return ta ? { start: ta.selectionStart, end: ta.selectionEnd } : { start: value.length, end: value.length };
    };

    const format = (kind: FormatKind) => {
        const { start, end } = selection();
        if (kind === "list") {
            const lineStart = value.lastIndexOf("\n", start - 1) + 1;
            apply(`${value.slice(0, lineStart)}- ${value.slice(lineStart)}`, start + 2, end + 2);
            return;
        }
        const mark = kind === "bold" ? "**" : kind === "italic" ? "*" : "$";
        apply(
            `${value.slice(0, start)}${mark}${value.slice(start, end)}${mark}${value.slice(end)}`,
            start + mark.length,
            end + mark.length
        );
    };

    /** Remplace la sélection par `snippet`, curseur placé après */
    const insert = (snippet: string) => {
        const { start, end } = selection();
        const at = start + snippet.length;
        apply(`${value.slice(0, start)}${snippet}${value.slice(end)}`, at, at);
    };

    return { ref, format, insert };
}

export type MarkdownField = ReturnType<typeof useMarkdownField>;

/** Le texte contient-il de la mise en forme qui mérite un aperçu ? */
export function hasFormatting(text: string) {
    return /\$[^$]+\$|\*[^*\s][^*]*\*|(^|\n)\s*(-|\d+\.)\s/.test(text);
}
