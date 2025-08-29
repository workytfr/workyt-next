"use client";

import React from "react";
// SUPPRIMER : import ReactDOM from "react-dom";
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
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap');
            @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(40px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            /* Nouveau fond très doux et granuleux */
            .lesson-bg-animated {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                z-index: 0 !important;
                pointer-events: none;
                background: radial-gradient(circle at 60% 30%, #fff7ed 0%, #fffbe6 100%);
                /* Overlay granuleux subtil en SVG base64 */
                /* Source : https://svgbackgrounds.com/ ou générateur de grain */
                /* Le SVG est très léger et discret */
                opacity: 1;
            }
            .lesson-bg-animated::after {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                opacity: 0.18;
                background-image: url('data:image/svg+xml;utf8,<svg width="100%25" height="100%25" xmlns="http://www.w3.org/2000/svg"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%25" height="100%25" filter="url(%23grain)" opacity="0.35"/></svg>');
                background-repeat: repeat;
                background-size: cover;
            }
            .lesson-container {
                background: none !important;
                position: relative;
                z-index: 2 !important;
                min-height: 100vh;
                color: #222;
                padding-bottom: 4rem !important;
            }
            .lesson-header {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.5rem 1rem;
                margin: 1rem 0.5rem 1.5rem 0.5rem;
                width: fit-content;
                border-radius: 1.5rem;
                background: rgba(255,255,255,0.25);
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
                backdrop-filter: blur(8px) saturate(1.1);
                -webkit-backdrop-filter: blur(8px) saturate(1.1);
                border: 1.5px solid rgba(255,255,255,0.18);
                animation: fadeInUp 1s cubic-bezier(.4,0,.2,1);
            }
            .lesson-header h1 {
                font-family: 'Montserrat', 'Playfair Display', serif;
                font-size: 1.5rem;
                font-weight: 800;
                letter-spacing: 0.04em;
                color: #222;
                background: none;
                -webkit-background-clip: unset;
                background-clip: unset;
                filter: none;
                text-shadow: 0 2px 12px #fffbe6cc, 0 1px 0 #fff;
                animation: none;
                transition: none;
            }
            .lesson-header .text-3xl {
                font-size: 1.5rem;
                filter: drop-shadow(0 2px 8px #fffbe6cc);
                color: #ffb86b;
            }
            .lesson-block {
                position: relative;
                padding: 1rem 0.75rem 1rem 1.5rem;
                margin: 1rem 0.5rem;
                border-radius: 1rem;
                box-shadow: 0 4px 24px 0 rgba(112,145,245,0.06);
                overflow: hidden;
                transition: box-shadow 0.2s, transform 0.2s;
                animation: zoomIn 0.7s cubic-bezier(.4,0,.2,1);
                z-index: 2;
                background: #fffbe6;
                color: #222;
            }
            .lesson-block.sequential-appear {
                opacity: 0;
                transform: translateY(40px);
                animation: fadeInUp 0.7s cubic-bezier(.4,0,.2,1) forwards;
            }
            .lesson-block:hover {
                box-shadow: 0 8px 32px 0 rgba(112,145,245,0.10);
            }
            .lesson-block-title {
                font-weight: 700;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 1.1rem;
                color: #d97706;
            }
            .lesson-block-content {
                color: #222;
                font-weight: 500;
                font-size: 1rem;
            }
            .lesson-block-description {
                font-size: 0.9rem;
                color: #b26a00;
                margin-bottom: 0.5rem;
                font-style: italic;
            }
            /* Blocs spécifiques : fond très pâle, bordure colorée douce */
            .definition-box {
                background: #fffbe6;
                border-left: 6px solid #ffb86b;
                color: #222;
            }
            .propriete-box {
                background: #fffbe6;
                border-left: 6px solid #6ec1e4;
                color: #222;
            }
            .theoreme-box {
                background: #fffbe6;
                border-left: 6px solid #7ed957;
                color: #222;
            }
            .remarque-box {
                background: #fffbe6;
                border-left: 6px dashed #b26a00;
                color: #222;
            }
            .attention-box {
                background: #fffbe6;
                border-left: 6px solid #ff7f50;
                color: #222;
            }
            .exemple-box {
                background: #fffbe6;
                border-left: 6px solid #6ec1e4;
                color: #222;
            }
            .lesson-content, .lesson-content *, .lesson-content :not([class^='lesson-block']) {
                color: #222 !important;
                background: transparent !important;
            }
            .lesson-content a {
                color: #b26a00 !important;
                text-decoration: underline !important;
            }
            .lesson-content img {
                filter: none !important;
                opacity: 1 !important;
                background: none !important;
                box-shadow: 0 2px 12px #ffecd1cc;
                max-width: 100%;
                height: auto;
            }
            .lesson-content h2 {
                font-size: 1.5rem;
                font-weight: 800;
                color: #ffb86b;
                margin-top: 2rem;
                margin-bottom: 1rem;
                position: relative;
                padding-left: 0.75rem;
                letter-spacing: 0.01em;
                text-shadow: 0 2px 12px #ffecd1cc;
            }
            .lesson-content h2::before {
                content: '';
                position: absolute;
                left: 0; top: 0.3rem;
                width: 4px; height: 70%;
                border-radius: 2px;
                background: linear-gradient(180deg, #ffb86b 0%, #fffbe6 100%);
                box-shadow: 0 2px 8px #ffecd1cc;
            }
            .lesson-content h3 {
                font-size: 1.2rem;
                font-weight: 700;
                color: #6ec1e4;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                border-left: 3px solid #6ec1e4;
                padding-left: 0.5rem;
                background: linear-gradient(90deg, #e0f7fa 0%, #fffbe6 100%);
                border-radius: 0 0.5rem 0.5rem 0;
            }
            .lesson-content h4 {
                font-size: 1rem;
                font-weight: 700;
                color: #b26a00;
                margin-top: 1.25rem;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                display: inline-block;
                padding: 0.15em 0.5em;
                background: #fff7ed;
                border-radius: 0.5em;
                border-bottom: 2px solid #ffb86b;
                box-shadow: 0 1px 4px #ffecd144;
            }
            
            /* Responsive breakpoints */
            @media (min-width: 640px) {
                .lesson-header {
                    gap: 1.5rem;
                    padding: 2rem 2rem;
                    margin: 1.5rem 1rem 2rem 1rem;
                    border-radius: 2rem;
                }
                .lesson-header h1 {
                    font-size: 2rem;
                }
                .lesson-header .text-3xl {
                    font-size: 2rem;
                }
                .lesson-block {
                    padding: 1.25rem 1rem 1.25rem 2rem;
                    margin: 1.25rem 1rem;
                    border-radius: 1.1rem;
                }
                .lesson-block-title {
                    gap: 1rem;
                    font-size: 1.25rem;
                }
                .lesson-block-content {
                    font-size: 1.08rem;
                }
                .lesson-block-description {
                    font-size: 0.95rem;
                }
                .lesson-content h2 {
                    font-size: 1.8rem;
                    padding-left: 1rem;
                }
                .lesson-content h2::before {
                    width: 5px;
                }
                .lesson-content h3 {
                    font-size: 1.3rem;
                    padding-left: 0.6rem;
                    border-left: 4px solid #6ec1e4;
                }
                .lesson-content h4 {
                    font-size: 1.05rem;
                    padding: 0.18em 0.6em;
                }
                .definition-box, .propriete-box, .theoreme-box, .remarque-box, .attention-box, .exemple-box {
                    border-left-width: 7px;
                }
            }
            
            @media (min-width: 768px) {
                .lesson-header {
                    gap: 1.5rem;
                    padding: 2.2rem 3.5rem;
                    margin: 2.5rem 2rem 2.5rem 2rem;
                }
                .lesson-header h1 {
                    font-size: 2.5rem;
                }
                .lesson-header .text-3xl {
                    font-size: 2.5rem;
                }
                .lesson-block {
                    padding: 1.5rem 1rem 1.5rem 2.5rem;
                    margin: 1.5rem 2rem;
                }
                .lesson-block-title {
                    font-size: 1.25rem;
                }
                .lesson-block-content {
                    font-size: 1.08rem;
                }
                .lesson-content h2 {
                    font-size: 2.1rem;
                    padding-left: 1.1rem;
                }
                .lesson-content h2::before {
                    width: 6px;
                }
                .lesson-content h3 {
                    font-size: 1.4rem;
                    padding-left: 0.7rem;
                    border-left: 4px solid #6ec1e4;
                }
                .lesson-content h4 {
                    font-size: 1.08rem;
                    padding: 0.18em 0.7em;
                }
                .definition-box, .propriete-box, .theoreme-box, .remarque-box, .attention-box, .exemple-box {
                    border-left-width: 8px;
                }
            }
            
            @media (min-width: 1024px) {
                .lesson-header {
                    padding: 2.2rem 3.5rem;
                    margin: 2.5rem 3rem 2.5rem 3rem;
                }
                .lesson-header h1 {
                    font-size: 2.8rem;
                }
                .lesson-header .text-3xl {
                    font-size: 2.5rem;
                }
                .lesson-block {
                    padding: 1.5rem 1rem 1.5rem 2.5rem;
                    margin: 1.5rem 3rem;
                }
                .lesson-content h2 {
                    font-size: 2.1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// Adapter le mapping d'icônes pour les noms français
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
    },
    "exemple": {
        icon: FaBook,
        title: "Exemple",
        description: "Une illustration concrète pour mieux comprendre le concept."
    }
};

function enhancedStylePlugin() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === "element" && node.tagName === "div" && node.properties?.blocktype) {
                const blockType = node.properties.blocktype;
                const config = blockTypeConfig[blockType as keyof typeof blockTypeConfig] || blockTypeConfig.remarque;
                if (node.children && node.children.length > 0) {
                    const firstChild = node.children[0];
                    let title = config.title;
                    let remainingChildren = node.children;
                    if (firstChild.type === 'element' && firstChild.tagName === 'strong') {
                        title = firstChild.children[0]?.value || config.title;
                        remainingChildren = node.children.slice(1);
                    }
                    // Structure SANS icône (l'icône sera injectée côté React)
                    node.children = [
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['lesson-block-title'] },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    properties: { className: ['block-icon'], 'data-blocktype': blockType },
                                    children: []
                                },
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

// Ajouter la fonction utilitaire pour les SVG d'icônes
function getIconSVG(type: string) {
    switch (type) {
        case "definition":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#ffb86b"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>`;
        case "propriete":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#6ec1e4"><path d="M5 12h14M12 5v14"/></svg>`;
        case "theoreme":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#7ed957"><circle cx="12" cy="12" r="10"/></svg>`;
        case "remarque":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#b26a00"><circle cx="12" cy="12" r="10"/></svg>`;
        case "attention":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#ff7f50"><circle cx="12" cy="12" r="10"/></svg>`;
        case "exemple":
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#6ec1e4"><rect x="4" y="4" width="16" height="16"/></svg>`;
        default:
            return `<svg viewBox="0 0 24 24" width="32" height="32" fill="#b26a00"><circle cx="12" cy="12" r="10"/></svg>`;
    }
}

// Rest of the code remains the same as in the previous version...

export default function LessonView({ title, content }: LessonViewProps) {
    // Injecter le CSS personnalisé au montage du composant
    React.useEffect(() => {
        injectCustomCss();
        // Animation séquentielle sur les blocs
        setTimeout(() => {
            if (typeof document !== 'undefined') {
                const blocks = document.querySelectorAll('.lesson-block');
                blocks.forEach((block, i) => {
                    setTimeout(() => {
                        block.classList.add('sequential-appear');
                    }, i * 180);
                });
            }
        }, 200);
        // Injection dynamique des icônes React dans chaque bloc
        setTimeout(() => {
            if (typeof document !== 'undefined') {
                document.querySelectorAll('.block-icon').forEach((iconSpan) => {
                    const type = iconSpan.getAttribute('data-blocktype');
                    if (iconSpan.childNodes.length === 0) {
                        iconSpan.innerHTML = getIconSVG(type as string);
                    }
                });
            }
        }, 400);
    }, []);

    // Transformation du contenu (ancienne version)
    const processedHtml = unified()
        .use(rehypeParse, { fragment: true })
        .use(enhancedStylePlugin)
        .use(rehypeStringify)
        .processSync(content)
        .toString();

    // Fonction pour transformer le LaTeX en HTML KaTeX
    const transformLatex = (html: string): string => {
        return html.replace(/\$\$(.*?)\$\$|\$(.*?)\$/gs, (match, displayMode, inlineMode) => {
            const formula = displayMode || inlineMode;
            const isDisplayMode = !!displayMode;
            try {
                return katex.renderToString(formula, {
                    displayMode: isDisplayMode,
                    throwOnError: false
                });
            } catch (error) {
                return match;
            }
        });
    };

    const finalHtml = transformLatex(processedHtml);

    return (
        <>
            <div className="lesson-bg-animated" />
            <div className="lesson-container p-4 sm:p-6 md:p-8 min-h-screen animate-fadeInUp">
                {/* Titre principal */}
                <div className="lesson-header">
                    <FaBook className="text-2xl sm:text-3xl" />
                    <h1 className="animated-gradient-text font-montserrat">
                        {title}
                    </h1>
                </div>
                {/* Contenu principal */}
                <div
                    className="lesson-content max-w-none"
                    dangerouslySetInnerHTML={{ __html: finalHtml }}
                />
            </div>
        </>
    );
}