"use client";

import React from "react";
import {
    FaBook,
    FaLightbulb,
    FaBookOpen,
    FaCalculator,
    FaExclamationCircle,
    FaInfoCircle
} from "react-icons/fa";

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
    content: string; // HTML généré
}

const injectCustomCss = () => {
    if (typeof document !== "undefined" && !document.getElementById("lesson-custom-css")) {
        const style = document.createElement("style");
        style.id = "lesson-custom-css";
        style.innerHTML = `
            .lesson-container {
                font-family: 'Inter', sans-serif;
                line-height: 1.6;
                background: linear-gradient(to bottom right, #f8fafc, #f1f5f9);
            }
            .lesson-header {
                background: linear-gradient(to right, #3b82f6, #2563eb);
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .math-section {
                background-color: #f0f9ff;
                border-left: 4px solid #3b82f6;
                padding: 1rem;
                margin: 1rem 0;
                border-radius: 0.5rem;
            }
            .math-content {
                font-size: 1.1rem;
                color: #1e3a8a;
            }
            .index-highlight {
                color: #dc2626;
                font-weight: 600;
            }
            .section-title {
                color: #1e40af;
                font-weight: 700;
                border-bottom: 2px solid #60a5fa;
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }
            
            /* Blocs génériques */
            .lesson-block {
                position: relative;
                padding: 1.5rem 1rem 1.5rem 2.5rem;
                margin: 1.5rem 0;
                border-radius: 0.75rem;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .lesson-block-title {
                font-weight: 700;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .lesson-block-content {
                color: #333;
                font-weight: 500;
            }
            .lesson-block-description {
                font-size: 0.875rem;
                color: #666;
                margin-bottom: 0.5rem;
                font-style: italic;
            }
            
            /* Définition */
            .definition-box {
                background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
                border-left: 6px solid #FF9800;
                color: #333;
            }
            .definition-box .lesson-block-title {
                color: #F57C00;
            }
            
            /* Propriété */
            .property-box {
                background: linear-gradient(135deg, #E6F3FF, #D6E6FF);
                border-left: 6px solid #2196F3;
                color: #1565c0;
            }
            .property-box .lesson-block-title {
                color: #1976D2;
            }
            
            /* Théorème */
            .theorem-box {
                background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
                border-left: 6px solid #4CAF50;
                color: #2E7D32;
            }
            .theorem-box .lesson-block-title {
                color: #2E7D32;
            }
            
            /* Remarque */
            .remark-box {
                background: linear-gradient(135deg, #F3E5F5, #E1BEE7);
                border-left: 6px solid #9C27B0;
                color: #6A1B9A;
            }
            .remark-box .lesson-block-title {
                color: #7B1FA2;
            }
            
            /* Attention */
            .warning-box {
                background: linear-gradient(135deg, #FFEBEE, #FFCDD2);
                border-left: 6px solid #F44336;
                color: #B71C1C;
            }
            .warning-box .lesson-block-title {
                color: #D32F2F;
            }
        `;
        document.head.appendChild(style);
    }
};

// Mapping des blocs avec leurs icônes et descriptions
const blockTypeConfig = {
    "definition": {
        icon: FaBookOpen,
        title: "Définition",
        description: "Une explication précise et concise d'un concept fondamental qui établit une base claire pour la compréhension."
    },
    "propriete": {
        icon: FaCalculator,
        title: "Propriété",
        description: "Une caractéristique ou un attribut spécifique qui décrit le comportement ou les relations d'un concept mathématique."
    },
    "theoreme": {
        icon: FaLightbulb,
        title: "Théorème",
        description: "Un énoncé mathématique démontrable qui établit une relation ou une vérité importante dans un domaine spécifique."
    },
    "remarque": {
        icon: FaInfoCircle,
        title: "Remarque",
        description: "Une observation ou un commentaire additionnel qui apporte des éclaircissements ou des nuances supplémentaires."
    },
    "attention": {
        icon: FaExclamationCircle,
        title: "Attention",
        description: "Un avertissement important ou un point critique à considérer avec une attention particulière."
    }
};

function enhancedStylePlugin() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === "element" && node.tagName === "div" && node.properties?.blocktype) {
                const blockType = node.properties.blocktype;
                const config = blockTypeConfig[blockType as keyof typeof blockTypeConfig] || blockTypeConfig.remarque;

                // Modify the structure to include a title, description, and icon
                if (node.children && node.children.length > 0) {
                    const firstChild = node.children[0];
                    let title = config.title;
                    let remainingChildren = node.children;

                    // If first child is a strong element, use its content as the title
                    if (firstChild.type === 'element' && firstChild.tagName === 'strong') {
                        title = firstChild.children[0]?.value || config.title;
                        remainingChildren = node.children.slice(1);
                    }

                    // Create a new structure with icon, title, description, and content
                    node.children = [
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['lesson-block-title'] },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    children: [{ type: 'text', value: title }]
                                }
                            ]
                        },
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['lesson-block-description'] },
                            children: [
                                {
                                    type: 'text',
                                    value: config.description
                                }
                            ]
                        },
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['lesson-block-content'] },
                            children: remainingChildren
                        }
                    ];
                }

                // Add appropriate classes based on block type
                const blockClasses = [
                    `lesson-block`,
                    `${blockType}-box`,
                    "whitespace-normal"
                ];

                node.properties = {
                    ...node.properties,
                    className: blockClasses
                };
            }
        });
    };
}

// Rest of the code remains the same as in the previous version...

export default function LessonView({ title, content }: LessonViewProps) {
    // Injecter le CSS personnalisé au montage du composant
    React.useEffect(() => {
        injectCustomCss();
    }, []);

    // Transformation du contenu
    const processedHtml = unified()
        .use(rehypeParse, { fragment: true })
        .use(enhancedStylePlugin)
        .use(rehypeStringify)
        .processSync(content)
        .toString();

    // Transformation LaTeX
    const transformLatex = (html: string): string => {
        // Recherche les expressions LaTeX délimitées par $$ ou $
        return html.replace(/\$\$(.*?)\$\$|\$(.*?)\$/g, (match, displayMode, inlineMode) => {
            const formula = displayMode || inlineMode;
            const isDisplayMode = !!displayMode;

            try {
                return katex.renderToString(formula, {
                    displayMode: isDisplayMode,
                    throwOnError: false
                });
            } catch (error) {
                console.error("Erreur LaTeX:", error);
                return match; // En cas d'erreur, retourne l'expression originale
            }
        });
    };

    const finalHtml = transformLatex(processedHtml);

    return (
        <div className="lesson-container p-8 min-h-screen">
            {/* Titre principal */}
            <div className="lesson-header flex items-center gap-4 text-white px-6 py-4 rounded-xl mb-8 w-fit">
                <FaBook className="text-3xl" />
                <h1 className="text-3xl font-bold tracking-wide">{title}</h1>
            </div>

            {/* Contenu principal */}
            <div
                className="lesson-content prose prose-lg prose-blue max-w-none"
                dangerouslySetInnerHTML={{ __html: finalHtml }}
            />
        </div>
    );
}