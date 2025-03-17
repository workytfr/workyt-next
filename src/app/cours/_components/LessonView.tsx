"use client";

import React from "react";
import { FaBook } from "react-icons/fa";

// Unified & Rehype
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

// KaTeX
import katex from "katex";
import "katex/dist/katex.min.css";

interface LessonViewProps {
    title: string;
    content: string; // HTML généré par TipTap
}

/**
 * Plugin Rehype qui applique des styles aux titres (h1, h2, h3)
 * et aux blocs <div class="definition"> etc.
 * Au lieu d'un émoji, on insère un <img src="/badge/definition.svg" ...>
 */
function fancyStylePlugin() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === "element") {
                const tag = node.tagName;

                // -- 1) Styliser les titres (h1, h2, h3) --
                if (["h1", "h2", "h3"].includes(tag)) {
                    if (tag === "h1") {
                        node.properties = {
                            ...node.properties,
                            className: [
                                "text-4xl",
                                "font-bold",
                                "text-orange-700",
                                "border-b-4",
                                "border-orange-500",
                                "pb-3",
                                "mt-8",
                            ],
                        };
                    } else if (tag === "h2") {
                        node.properties = {
                            ...node.properties,
                            className: [
                                "text-2xl",
                                "font-semibold",
                                "text-orange-700",
                                "mt-6",
                                "mb-2",
                            ],
                        };
                    } else if (tag === "h3") {
                        node.properties = {
                            ...node.properties,
                            className: [
                                "text-xl",
                                "font-semibold",
                                "text-orange-500",
                                "mt-4",
                                "border-l-4",
                                "border-orange-400",
                                "pl-3",
                            ],
                        };
                    }
                }

                // -- 2) Styliser les blocs <div class="definition"> etc. --
                if (tag === "div" && node.properties?.className) {
                    const classes: string[] = Array.isArray(node.properties.className)
                        ? node.properties.className
                        : String(node.properties.className).split(" ");

                    const blockStyle =
                        "my-4 p-4 rounded-xl shadow-md border-l-4 flex items-start gap-3 transition-all duration-200 hover:scale-105 animate-fade-in";

                    let colorClass = "";
                    let iconSrc = ""; // Chemin du fichier SVG dans public/badge

                    if (classes.includes("definition")) {
                        colorClass = "bg-blue-50 border-blue-500 text-blue-900";
                        iconSrc = "/badge/definition.svg";
                    } else if (classes.includes("propriete")) {
                        colorClass = "bg-green-50 border-green-500 text-green-900";
                        iconSrc = "/badge/propriete.svg";
                    } else if (classes.includes("exemple")) {
                        colorClass = "bg-yellow-50 border-yellow-500 text-yellow-900";
                        iconSrc = "/badge/exemple.svg";
                    } else if (classes.includes("theoreme")) {
                        colorClass = "bg-purple-50 border-purple-500 text-purple-900";
                        iconSrc = "/badge/theoreme.svg";
                    } else if (classes.includes("remarque")) {
                        colorClass = "bg-gray-50 border-gray-500 text-gray-900";
                        iconSrc = "/badge/remarque.svg";
                    } else if (classes.includes("warning") || classes.includes("attention")) {
                        colorClass = "bg-red-50 border-red-500 text-red-900 font-bold";
                        iconSrc = "/badge/attention.svg";
                    }

                    // Fusion des classes
                    node.properties.className = [
                        ...classes,
                        ...blockStyle.split(" "),
                        ...colorClass.split(" "),
                    ];

                    // Si on a un iconSrc, on insère un <img> au début
                    if (iconSrc) {
                        node.children.unshift({
                            type: "element",
                            tagName: "img",
                            properties: {
                                src: iconSrc,
                                alt: "icon",
                                className: ["mr-2", "w-6", "h-6"],
                            },
                            children: [],
                        });
                    }
                }
            }
        });
    };
}

/**
 * Transforme les formules LaTeX ($...$ et $$...$$) en HTML KaTeX
 */
function transformLatex(html: string): string {
    // Remplacer les blocs $$...$$
    let out = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
        try {
            return katex.renderToString(math, { displayMode: true });
        } catch (error) {
            return match; // en cas d'erreur, on laisse tel quel
        }
    });

    // Remplacer les inline $...$
    out = out.replace(/\$([^$]+?)\$/g, (match, math) => {
        try {
            return katex.renderToString(math, { displayMode: false });
        } catch (error) {
            return match;
        }
    });

    return out;
}

export default function LessonView({ title, content }: LessonViewProps) {
    // 1. On parse & applique fancyStylePlugin
    const fancyHtml = unified()
        .use(rehypeParse, { fragment: true })
        .use(fancyStylePlugin) // applique le style sur h1, div.definition, etc.
        .use(rehypeStringify)
        .processSync(content)
        .toString();

    // 2. On transforme le LaTeX (optionnel)
    const finalHtml = transformLatex(fancyHtml);

    return (
        <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
            {/* Titre principal */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-3 rounded-xl w-fit shadow-md">
                <FaBook className="text-2xl" />
                <h1 className="text-2xl font-extrabold tracking-wide">{title}</h1>
            </div>

            {/* 3. On insère le HTML final via dangerouslySetInnerHTML */}
            <div className="mt-5" dangerouslySetInnerHTML={{ __html: finalHtml }} />
        </div>
    );
}
