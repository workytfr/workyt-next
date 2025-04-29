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
 * CSS pour le fond avec effet grain
 * Injecté une seule fois dans le document
 */
const injectGrainyCss = () => {
    if (typeof document !== "undefined" && !document.getElementById("grainy-css")) {
        const style = document.createElement("style");
        style.id = "grainy-css";
        style.innerHTML = `
            .grain {
                position: relative;
            }
            .grain::before {
                content: "";
                position: absolute;
                inset: 0;
                background-image: url(/noise.webp)
                opacity: 0.15;
                mix-blend-mode: overlay;
                pointer-events: none;
                z-index: 1;
            }
        `;
        document.head.appendChild(style);
    }
};

/**
 * Plugin Rehype qui applique des styles aux titres (h1, h2, h3)
 * et aux blocs <div class="definition"> etc.
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
                                "border-orange-400",
                                "pb-3",
                                "mt-8",
                                "relative",
                                "z-10",
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
                                "relative",
                                "z-10",
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
                                "relative",
                                "z-10",
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
                        "my-4 p-4 rounded-xl shadow-md border-l-4 flex items-start gap-3 transition-all duration-300 hover:scale-102 animate-fade-in backdrop-blur-sm grain";

                    let colorClass = "";
                    let iconSrc = ""; // Chemin du fichier SVG dans public/badge

                    if (classes.includes("definition")) {
                        colorClass = "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 text-blue-900";
                        iconSrc = "/badge/definition.svg";
                    } else if (classes.includes("propriete")) {
                        colorClass = "bg-gradient-to-br from-green-50 to-green-100 border-green-500 text-green-900";
                        iconSrc = "/badge/propriete.svg";
                    } else if (classes.includes("exemple")) {
                        colorClass = "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-500 text-yellow-900";
                        iconSrc = "/badge/exemple.svg";
                    } else if (classes.includes("theoreme")) {
                        colorClass = "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-500 text-purple-900";
                        iconSrc = "/badge/theoreme.svg";
                    } else if (classes.includes("remarque")) {
                        colorClass = "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-500 text-gray-900";
                        iconSrc = "/badge/remarque.svg";
                    } else if (classes.includes("warning") || classes.includes("attention")) {
                        colorClass = "bg-gradient-to-br from-red-50 to-red-100 border-red-500 text-red-900 font-bold";
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
                                className: ["mr-2", "w-6", "h-6", "relative", "z-10"],
                            },
                            children: [],
                        });
                    }
                }

                // -- 3) S'assurer que le texte normal est visible et plus grand --
                if (tag === "p") {
                    node.properties = {
                        ...node.properties,
                        className: [
                            ...(node.properties?.className || []),
                            "text-gray-800",
                            "text-lg",      // TAILLE DU TEXTE ACCRUE
                            "relative",
                            "z-10",
                            "my-3",
                        ],
                    };
                }

                // Styliser les listes
                if (["ul", "ol"].includes(tag)) {
                    node.properties = {
                        ...node.properties,
                        className: [
                            ...(node.properties?.className || []),
                            "text-gray-800",
                            "text-lg",     // TAILLE DU TEXTE ACCRUE
                            "my-3",
                            "pl-5",
                            "relative",
                            "z-10",
                        ],
                    };
                }

                if (tag === "li") {
                    node.properties = {
                        ...node.properties,
                        className: [
                            ...(node.properties?.className || []),
                            "my-1",
                            "text-gray-800",
                            "text-lg",     // TAILLE DU TEXTE ACCRUE
                            "relative",
                            "z-10",
                        ],
                    };
                }

                // Styliser les liens
                if (tag === "a") {
                    node.properties = {
                        ...node.properties,
                        className: [
                            ...(node.properties?.className || []),
                            "text-orange-600",
                            "hover:text-orange-700",
                            "underline",
                            "relative",
                            "z-10",
                            "text-lg",     // TAILLE DU TEXTE ACCRUE
                        ],
                    };
                }

                // Styliser les balises code inline
                if (tag === "code") {
                    node.properties = {
                        ...node.properties,
                        className: [
                            ...(node.properties?.className || []),
                            "bg-gray-100",
                            "text-orange-700",
                            "px-1",
                            "py-0.5",
                            "rounded",
                            "font-mono",
                            "text-sm",
                            "relative",
                            "z-10",
                        ],
                    };
                }

                // Styliser les blocs pre (code blocks)
                if (tag === "pre") {
                    node.properties = {
                        ...node.properties,
                        className: [
                            ...(node.properties?.className || []),
                            "bg-gray-800",
                            "text-gray-100",
                            "p-4",
                            "rounded-lg",
                            "overflow-x-auto",
                            "my-4",
                            "font-mono",
                            "text-sm",
                            "relative",
                            "z-10",
                        ],
                    };
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
            return match;
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
    // Injecter le CSS du grain au montage du composant
    React.useEffect(() => {
        injectGrainyCss();
    }, []);

    // 1. On parse & applique fancyStylePlugin
    const fancyHtml = unified()
        .use(rehypeParse, { fragment: true })
        .use(fancyStylePlugin)
        .use(rehypeStringify)
        .processSync(content)
        .toString();

    // 2. On transforme le LaTeX (optionnel)
    const finalHtml = transformLatex(fancyHtml);

    return (
        <div className="p-6 bg-gradient-to-br from-white to-orange-50 shadow-xl rounded-xl border border-orange-100 relative w-full max-w-full overflow-hidden grain text-gray-800 text-lg">
            {/* Formes décoratives en arrière-plan */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-orange-200/30 to-red-200/30 blur-2xl" />
            <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-200/30 to-yellow-200/30 blur-3xl" />

            {/* Titre principal */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-3 rounded-xl w-fit shadow-lg relative overflow-hidden grain">
                <FaBook className="text-2xl relative z-10" />
                <h1 className="text-2xl font-extrabold tracking-wide relative z-10">{title}</h1>
            </div>

            {/* Contenu principal avec une petite marge et z-index pour rester au-dessus des formes décoratives */}
            <div className="mt-5 relative z-10 prose prose-orange max-w-none" dangerouslySetInnerHTML={{ __html: finalHtml }} />
        </div>
    );
}
