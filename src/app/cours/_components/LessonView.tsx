"use client";

import React, { useMemo } from "react";
import { FaBook, FaLightbulb, FaBookOpen, FaCalculator, FaExclamationCircle, FaInfoCircle, FaClock } from "react-icons/fa";
import LessonTableOfContents, { addHeadingIds, extractHeadings } from "./LessonTableOfContents";
import { estimateReadingTime } from "./utils/readingTime";

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
    content: string;
}

// Configuration des blocs
const blockTypeConfig = {
    "definition": {
        icon: FaBookOpen,
        title: "Définition",
        color: "#f97316",
        bgColor: "#fff7ed"
    },
    "propriete": {
        icon: FaCalculator,
        title: "Propriété",
        color: "#3b82f6",
        bgColor: "#eff6ff"
    },
    "theoreme": {
        icon: FaLightbulb,
        title: "Théorème",
        color: "#10b981",
        bgColor: "#ecfdf5"
    },
    "remarque": {
        icon: FaInfoCircle,
        title: "Remarque",
        color: "#6b7280",
        bgColor: "#f9fafb"
    },
    "attention": {
        icon: FaExclamationCircle,
        title: "Attention",
        color: "#ef4444",
        bgColor: "#fef2f2"
    },
    "exemple": {
        icon: FaBook,
        title: "Exemple",
        color: "#8b5cf6",
        bgColor: "#f5f3ff"
    }
};

// SVG icons
function getIconSVG(type: string) {
    switch (type) {
        case "definition":
            return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f97316" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
        case "propriete":
            return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M5 12h14M12 5v14"/></svg>`;
        case "theoreme":
            return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
        case "remarque":
            return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        case "attention":
            return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        case "exemple":
            return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        default:
            return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
    }
}

function enhancedStylePlugin() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === "element" && node.properties) {
                if (node.properties.style) {
                    if (typeof node.properties.style === 'object' && !Array.isArray(node.properties.style)) {
                        const styleObj = node.properties.style;
                        const styleString = Object.entries(styleObj)
                            .map(([key, value]) => {
                                const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                                return `${kebabKey}: ${value}`;
                            })
                            .join('; ');
                        node.properties.style = styleString;
                    }
                }
            }

            if (node.type === "element" && node.tagName === "div") {
                let blockType: string | null = null;

                if (node.properties?.className) {
                    let className: string;
                    if (Array.isArray(node.properties.className)) {
                        className = node.properties.className.join(' ');
                    } else {
                        className = String(node.properties.className);
                    }

                    if (className.includes('custom-block')) {
                        const patterns = [
                            /custom-block\s+(\w+)/,
                            /\b(\w+)\s+custom-block/,
                            /custom-block-(\w+)/,
                        ];
                        for (const pattern of patterns) {
                            const match = className.match(pattern);
                            if (match && match[1]) {
                                blockType = match[1];
                                break;
                            }
                        }
                    }
                }

                if (!blockType && node.properties?.blocktype) {
                    blockType = String(node.properties.blocktype);
                }

                if (!blockType && node.properties?.['data-custom-block'] !== undefined) {
                    blockType = 'remarque';
                }

                if (blockType && blockTypeConfig[blockType as keyof typeof blockTypeConfig]) {
                    const config = blockTypeConfig[blockType as keyof typeof blockTypeConfig];
                    let title = config.title;
                    let remainingChildren = node.children || [];

                    if (remainingChildren.length > 0) {
                        const firstChild = remainingChildren[0];
                        if (firstChild.type === 'element' && firstChild.tagName === 'strong') {
                            const extractText = (child: any): string => {
                                if (child.type === 'text') return child.value || '';
                                if (child.type === 'element' && child.children) {
                                    return child.children.map(extractText).join('');
                                }
                                return '';
                            };
                            title = extractText(firstChild) || config.title;
                            remainingChildren = remainingChildren.slice(1);
                        }
                    }

                    const iconSvg = getIconSVG(blockType);

                    node.children = [
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { 
                                className: ['flex items-center gap-2 mb-2 font-semibold text-sm'],
                                style: `color: ${config.color}`
                            },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    properties: { className: ['flex-shrink-0'] },
                                    children: [{ type: 'raw', value: iconSvg }]
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
                            properties: { className: ['text-[#37352f]'] },
                            children: remainingChildren
                        }
                    ];

                    node.properties = {
                        ...node.properties,
                        className: ['my-6 p-4 rounded-lg border-l-4'],
                        style: `background-color: ${config.bgColor}; border-color: ${config.color}`
                    };
                }
            }
        });
    };
}

export default function LessonView({ title, content }: LessonViewProps) {
    let processedHtml: string;

    try {
        let preprocessedContent = content;

        const transformCustomBlocks = (html: string): string => {
            const pattern = /<div\s+([^>]*(?:data-custom-block|blocktype|class="[^"]*custom-block[^"]*")[^>]*)>([\s\S]*?)<\/div>/gi;
            let result = html;
            const matches: Array<{ start: number; end: number; attrs: string; content: string }> = [];
            let match;

            while ((match = pattern.exec(html)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    attrs: match[1],
                    content: match[2]
                });
            }

            for (let i = matches.length - 1; i >= 0; i--) {
                const { start, end, attrs, content } = matches[i];
                let blockType: string | null = null;

                const blocktypeMatch = attrs.match(/blocktype="([^"]*)"/i);
                if (blocktypeMatch && blocktypeMatch[1]) {
                    blockType = blocktypeMatch[1];
                }

                if (!blockType) {
                    const classMatch = attrs.match(/class="([^"]*)"/i);
                    if (classMatch && classMatch[1]) {
                        const typeMatch = classMatch[1].match(/custom-block\s+(\w+)/);
                        if (typeMatch && typeMatch[1]) blockType = typeMatch[1];
                    }
                }

                if (blockType && blockTypeConfig[blockType as keyof typeof blockTypeConfig]) {
                    const config = blockTypeConfig[blockType as keyof typeof blockTypeConfig];
                    let blockTitle = config.title;
                    let blockContent = content.trim();
                    const strongMatch = blockContent.match(/^<strong>([^<]*)<\/strong>/);
                    if (strongMatch && strongMatch[1]) {
                        blockTitle = strongMatch[1];
                        blockContent = blockContent.replace(/^<strong>([^<]*)<\/strong>\s*/, '');
                    }

                    const iconSvg = getIconSVG(blockType);
                    const transformedHtml = `<div class="my-6 p-4 rounded-lg border-l-4" style="background-color: ${config.bgColor}; border-color: ${config.color}">
                        <div class="flex items-center gap-2 mb-2 font-semibold text-sm" style="color: ${config.color}">
                            <span class="flex-shrink-0">${iconSvg}</span>
                            <span>${blockTitle}</span>
                        </div>
                        <div class="text-[#37352f]">${blockContent}</div>
                    </div>`;

                    result = result.substring(0, start) + transformedHtml + result.substring(end);
                }
            }

            return result;
        };

        preprocessedContent = transformCustomBlocks(preprocessedContent);

        const tree = unified()
            .use(rehypeParse, { fragment: true, space: 'html' })
            .use(enhancedStylePlugin)
            .parse(preprocessedContent);

        processedHtml = unified()
            .use(rehypeStringify, { allowDangerousHtml: true })
            .stringify(tree);

    } catch (error) {
        console.warn('Erreur lors du traitement HTML:', error);
        processedHtml = content;
    }

    const transformLatex = (html: string): string => {
        return html.replace(/\$\$(.*?)\$\$|\$(.*?)\$/gs, (match, displayMode, inlineMode) => {
            const formula = displayMode || inlineMode;
            const isDisplayMode = !!displayMode;
            try {
                return katex.renderToString(formula, {
                    displayMode: isDisplayMode,
                    throwOnError: false
                });
            } catch {
                return match;
            }
        });
    };

    const htmlWithIds = addHeadingIds(transformLatex(processedHtml));
    const tocItems = useMemo(() => extractHeadings(htmlWithIds), [htmlWithIds]);
    const readingTime = useMemo(() => estimateReadingTime(content), [content]);

    return (
        <article className="max-w-none">
            {/* En-tête de la leçon */}
            <header className="mb-8 pb-6 border-b border-[#e3e2e0]">
                <div className="flex items-center gap-2 text-xs text-[#9ca3af] uppercase tracking-wide font-medium mb-3">
                    <FaBook className="w-4 h-4" />
                    <span>Leçon</span>
                    <span className="mx-1">•</span>
                    <FaClock className="w-3 h-3" />
                    <span>~{readingTime} min de lecture</span>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-[#37352f] tracking-tight leading-tight">
                    {title}
                </h1>
            </header>

            {/* Contenu + TOC */}
            <div className="flex gap-8 items-start">
                {/* Contenu principal */}
                <div
                    className="flex-1 min-w-0 prose prose-lg max-w-none notion-lesson-content"
                    style={{ lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={{ __html: htmlWithIds }}
                />
                
                {/* Sommaire */}
                {tocItems.length > 0 && (
                    <LessonTableOfContents items={tocItems} />
                )}
            </div>
        </article>
    );
}
