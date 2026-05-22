"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import katex from "katex";

let mathliveLoaded = false;
let mathliveLoading: Promise<void> | null = null;

async function ensureMathlive(): Promise<void> {
    if (typeof window === "undefined") return;
    if (mathliveLoaded) return;
    // Si déjà enregistré (par un HMR précédent), on saute l'import qui throw
    if (typeof customElements !== "undefined" && customElements.get("math-field")) {
        mathliveLoaded = true;
        return;
    }
    if (mathliveLoading) return mathliveLoading;
    mathliveLoading = (async () => {
        try {
            await import("mathlive");
        } catch (e) {
            // Erreur "already defined" possible en HMR : on l'ignore silencieusement
            if (!(e instanceof Error) || !/already.*defined|registered/i.test(e.message)) {
                console.warn("MathLive import warning:", e);
            }
        } finally {
            mathliveLoaded = true;
            mathliveLoading = null;
        }
    })();
    return mathliveLoading;
}

function MathView({ node, updateAttributes, selected }: NodeViewProps) {
    const inline = node.attrs.inline as boolean;
    const latex = (node.attrs.latex as string) || "";
    const [editing, setEditing] = useState(false);
    const [ready, setReady] = useState(mathliveLoaded);
    const fieldRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!editing) return;
        let cancelled = false;
        ensureMathlive().then(() => {
            if (!cancelled) setReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, [editing]);

    useEffect(() => {
        if (!editing || !ready || !fieldRef.current) return;
        const el = fieldRef.current as HTMLElement & { value?: string };
        el.value = latex;
        const onInput = () => updateAttributes({ latex: el.value ?? "" });
        const onBlur = () => setEditing(false);
        el.addEventListener("input", onInput);
        el.addEventListener("blur", onBlur);
        (el as HTMLElement).focus();
        return () => {
            el.removeEventListener("input", onInput);
            el.removeEventListener("blur", onBlur);
        };
    }, [editing, ready, latex, updateAttributes]);

    const html = (() => {
        try {
            return katex.renderToString(latex || "\\square", {
                displayMode: !inline,
                throwOnError: false,
                output: "html",
            });
        } catch {
            return latex;
        }
    })();

    const baseClass = inline
        ? "inline-block align-middle mx-0.5 px-1 py-0.5 rounded cursor-pointer"
        : "block my-2 px-3 py-2 rounded cursor-pointer text-center";
    const stateClass = selected ? "ring-2 ring-blue-400 bg-blue-50" : "hover:bg-gray-100";

    return (
        <NodeViewWrapper
            as={inline ? "span" : "div"}
            className={`tiptap-math ${baseClass} ${stateClass}`}
            data-inline={inline ? "true" : "false"}
        >
            {editing ? (
                ready ? (
                    <math-field
                        ref={fieldRef as any}
                        style={{ display: inline ? "inline-block" : "block", minWidth: 60 }}
                    />
                ) : (
                    <span className="text-xs text-gray-400">Chargement…</span>
                )
            ) : (
                <span
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditing(true);
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            )}
        </NodeViewWrapper>
    );
}

export const MathInline = Node.create({
    name: "mathInline",
    inline: true,
    group: "inline",
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            latex: { default: "" },
            inline: { default: true, rendered: false },
        };
    },

    parseHTML() {
        return [
            {
                tag: "span[data-math-inline]",
                getAttrs: (el) => ({
                    latex: (el as HTMLElement).getAttribute("data-latex") || "",
                    inline: true,
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-math-inline": "true",
                "data-latex": HTMLAttributes.latex ?? "",
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathView);
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: any, node: any) {
                    state.write(`$${(node.attrs.latex || "").replace(/\$/g, "\\$")}$`);
                },
                parse: {},
            },
        };
    },
});

export const MathBlock = Node.create({
    name: "mathBlock",
    group: "block",
    atom: true,
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            latex: { default: "" },
            inline: { default: false, rendered: false },
        };
    },

    parseHTML() {
        return [
            {
                tag: "div[data-math-block]",
                getAttrs: (el) => ({
                    latex: (el as HTMLElement).getAttribute("data-latex") || "",
                    inline: false,
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-math-block": "true",
                "data-latex": HTMLAttributes.latex ?? "",
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathView);
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: any, node: any) {
                    state.write(`\n$$\n${node.attrs.latex || ""}\n$$\n`);
                    state.closeBlock(node);
                },
                parse: {},
            },
        };
    },
});

const INLINE_RE = /(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;
const BLOCK_RE = /\$\$\s*([\s\S]+?)\s*\$\$/g;

export function preprocessMarkdownMath(md: string): string {
    if (!md) return md;
    const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let out = md.replace(BLOCK_RE, (_m, latex) => `\n\n<div data-math-block="true" data-latex="${escapeAttr(latex.trim())}"></div>\n\n`);
    out = out.replace(INLINE_RE, (_m, latex) => `<span data-math-inline="true" data-latex="${escapeAttr(latex)}"></span>`);
    return out;
}
