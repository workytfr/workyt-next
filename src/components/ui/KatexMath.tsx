"use client";

import React, { useMemo } from "react";
import katex from "katex";

/**
 * Remplace `react-katex` : ce paquet CommonJS embarquait la build UMD de KaTeX,
 * en plus de la build ESM déjà chargée par rehype-katex (~76 Ko gz en double).
 * Le CSS `katex/dist/katex.min.css` reste à importer par l'appelant.
 */
function render(math: string, displayMode: boolean): string {
    return katex.renderToString(math, { displayMode, throwOnError: false });
}

export function InlineMath({ math }: { math: string }) {
    const html = useMemo(() => render(math, false), [math]);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function BlockMath({ math }: { math: string }) {
    const html = useMemo(() => render(math, true), [math]);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
