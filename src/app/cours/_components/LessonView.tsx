"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { FaBook, FaClock, FaVolumeUp, FaPause, FaPlay } from "react-icons/fa";
import LessonTableOfContents, { addHeadingIds, extractHeadings } from "./LessonTableOfContents";
import LessonQASection from "./LessonQASection";
import { estimateReadingTime } from "./utils/readingTime";

// Unified & Rehype
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

// KaTeX
import katex from "katex";
import "katex/dist/katex.min.css";

// Blocs de code partagés (leçons / exercices / quiz)
import { highlightCodeBlocks } from "@/lib/codeHighlight";
import { useCodeBlockCopy } from "@/components/ui/CodeBlock";
import "@/components/ui/code-block.css";
import "./styles/lesson-blocks.css";

interface LessonViewProps {
    title: string;
    content: string;
    audioUrl?: string;
    lessonId?: string;
    courseId?: string;
    sectionId?: string;
}

// Configuration des blocs pédagogiques — le style est dans styles/lesson-blocks.css
const blockTypeConfig = {
    definition: { title: "Définition" },
    propriete: { title: "Propriété" },
    theoreme: { title: "Théorème" },
    remarque: { title: "Remarque" },
    attention: { title: "Attention" },
    exemple: { title: "Exemple" },
};

// Icônes (trait `currentColor` : la couleur vient de la variante CSS du bloc)
function getIconSVG(type: string) {
    const svg = (paths: string) =>
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
    switch (type) {
        case "definition":
            return svg(`<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`);
        case "propriete":
            return svg(`<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="16" x2="12" y2="16"/>`);
        case "theoreme":
            return svg(`<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`);
        case "remarque":
            return svg(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`);
        case "attention":
            return svg(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`);
        case "exemple":
            return svg(`<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>`);
        default:
            return svg(`<circle cx="12" cy="12" r="10"/>`);
    }
}

function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * En-tête d'un bloc : type en capitales, et le titre personnalisé en dessous
 * seulement s'il apporte quelque chose (« Définition » sous « DÉFINITION » : non).
 */
function blockHeadHtml(type: string, label: string, title: string) {
    const custom = title.trim() && title.trim().toLowerCase() !== label.toLowerCase();
    return `<div class="wk-block__head"><span class="wk-block__icon">${getIconSVG(type)}</span><span class="wk-block__heading"><span class="wk-block__label">${escapeHtml(label)}</span>${
        custom ? `<span class="wk-block__title">${escapeHtml(title.trim())}</span>` : ""
    }</span></div>`;
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
                        const extractText = (child: any): string => {
                            if (child.type === 'text') return child.value || '';
                            if (child.type === 'element' && child.children) {
                                return child.children.map(extractText).join('');
                            }
                            return '';
                        };

                        // Format 1 : <p><strong>Titre</strong></p> (TipTap-compatible)
                        if (firstChild.type === 'element' && firstChild.tagName === 'p' &&
                            firstChild.children?.length === 1 &&
                            firstChild.children[0]?.type === 'element' &&
                            firstChild.children[0]?.tagName === 'strong') {
                            title = extractText(firstChild.children[0]) || config.title;
                            remainingChildren = remainingChildren.slice(1);
                        }
                        // Format 2 : <strong>Titre</strong> (ancien format)
                        else if (firstChild.type === 'element' && firstChild.tagName === 'strong') {
                            title = extractText(firstChild) || config.title;
                            remainingChildren = remainingChildren.slice(1);
                        }
                    }

                    // Même balisage que le chemin HTML ci-dessous (voir styles/lesson-blocks.css)
                    node.children = [
                        { type: 'raw', value: blockHeadHtml(blockType, config.title, title) },
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['wk-block__body'] },
                            children: remainingChildren
                        }
                    ];

                    node.properties = {
                        ...node.properties,
                        className: ['wk-block', `wk-block--${blockType}`],
                        style: undefined
                    };
                }
            }
        });
    };
}

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Extraire le lessonId depuis l'audioUrl (format: audio-tts/{lessonId}.mp3)
    const lessonId = audioUrl.replace("audio-tts/", "").replace(".mp3", "");
    const directUrl = `/api/tts/audio/${lessonId}`;

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!signedUrl) {
            setLoading(true);
            try {
                audio.src = directUrl;
                audio.load();
                await new Promise<void>((resolve, reject) => {
                    audio.addEventListener("canplaythrough", () => resolve(), { once: true });
                    audio.addEventListener("error", () => reject(new Error("Impossible de charger l'audio")), { once: true });
                });
                setSignedUrl(directUrl);
                await audio.play();
                setIsPlaying(true);
            } catch (err) {
                console.error("Erreur chargement audio :", err);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            await audio.play();
            setIsPlaying(true);
        }
    };

    // Arrêter et réinitialiser l'audio quand on change de leçon
    const prevAudioUrl = useRef(audioUrl);
    useEffect(() => {
        if (prevAudioUrl.current === audioUrl) return;
        prevAudioUrl.current = audioUrl;
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        setIsPlaying(false);
        setSignedUrl(null);
        setProgress(0);
        setDuration(0);
    }, [audioUrl]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
        };
        const onLoaded = () => setDuration(audio.duration);
        const onEnded = () => { setIsPlaying(false); setProgress(0); };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("ended", onEnded);
            // Arrêter l'audio au démontage du composant
            audio.pause();
        };
    }, [signedUrl]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * audio.duration;
    };

    return (
        <div className="flex items-center gap-3 bg-orange-50 rounded-lg px-4 py-2.5 border border-orange-200">
            <button
                onClick={togglePlay}
                disabled={loading}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                    <FaPause className="w-3 h-3" />
                ) : (
                    <FaPlay className="w-3 h-3 ml-0.5" />
                )}
            </button>

            <FaVolumeUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span className="text-xs font-medium text-orange-800 whitespace-nowrap">Écouter la leçon</span>

            {signedUrl && (
                <>
                    <div
                        className="flex-1 h-1.5 bg-orange-200 rounded-full cursor-pointer min-w-[60px]"
                        onClick={handleSeek}
                    >
                        <div
                            className="h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {duration > 0 && (
                        <span className="text-xs text-orange-600 tabular-nums whitespace-nowrap">
                            {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </span>
                    )}
                </>
            )}

            <audio ref={audioRef} preload="none" />
        </div>
    );
}

export default function LessonView({ title, content, audioUrl, lessonId, courseId, sectionId }: LessonViewProps) {
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
                    // Format 1 : <p><strong>Titre</strong></p> (nouveau format TipTap-compatible)
                    const pStrongMatch = blockContent.match(/^<p>\s*<strong>([^<]*)<\/strong>\s*<\/p>/);
                    // Format 2 : <strong>Titre</strong> (ancien format)
                    const strongMatch = blockContent.match(/^<strong>([^<]*)<\/strong>/);
                    if (pStrongMatch && pStrongMatch[1]) {
                        blockTitle = pStrongMatch[1];
                        blockContent = blockContent.replace(/^<p>\s*<strong>([^<]*)<\/strong>\s*<\/p>\s*/, '');
                    } else if (strongMatch && strongMatch[1]) {
                        blockTitle = strongMatch[1];
                        blockContent = blockContent.replace(/^<strong>([^<]*)<\/strong>\s*/, '');
                    }

                    // Le titre vient du HTML (déjà échappé) : on le décode avant que
                    // blockHeadHtml ne l'échappe, sinon « & » s'afficherait « &amp; ».
                    const plainTitle = blockTitle
                        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
                    const transformedHtml = `<div class="wk-block wk-block--${blockType}">${blockHeadHtml(blockType, config.title, plainTitle)}<div class="wk-block__body">${blockContent}</div></div>`;

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

        // Coloration syntaxique des <pre><code> : on transforme l'arbre avant
        // sérialisation, donc le code arrive colorisé dès le rendu serveur.
        highlightCodeBlocks(tree as any);

        processedHtml = unified()
            .use(rehypeStringify, { allowDangerousHtml: true })
            .stringify(tree);

    } catch (error) {
        console.warn('Erreur lors du traitement HTML:', error);
        processedHtml = content;
    }

    const sanitizeForKatex = (formula: string): string =>
        formula
            .replace(/ /g, ' ')
            .replace(/[‘’]/g, "'")
            .replace(/[“”]/g, '"');

    const transformLatex = (html: string): string => {
        return html.replace(/\$\$(.*?)\$\$|\$(.*?)\$/gs, (match, displayMode, inlineMode) => {
            const formula = sanitizeForKatex(displayMode || inlineMode);
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

    // Les blocs de code sont du HTML injecté : leur bouton « Copier » est
    // branché par délégation sur le conteneur.
    const contentRef = useRef<HTMLDivElement>(null);
    useCodeBlockCopy(contentRef);

    return (
        <article className="max-w-none">
            {/* En-tête de la leçon */}
            <header className="mb-8 pb-6 border-b border-[#e8dfd0]">
                <div className="flex items-center gap-2 text-xs text-[#8f857b] uppercase tracking-wide font-medium mb-3">
                    <FaBook className="w-4 h-4" />
                    <span>Leçon</span>
                    <span className="mx-1">•</span>
                    <FaClock className="w-3 h-3" />
                    <span>~{readingTime} min de lecture</span>
                </div>

                <h1 className="font-serif-display text-3xl md:text-[2.6rem] text-[#1a1512] leading-[1.05]">
                    {title}
                </h1>

                {audioUrl && (
                    <div className="mt-4">
                        <AudioPlayer audioUrl={audioUrl} />
                    </div>
                )}
            </header>

            {/* Contenu principal */}
            <div
                ref={contentRef}
                className="prose prose-lg max-w-none notion-lesson-content"
                style={{ lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ __html: htmlWithIds }}
            />

            {/* Sommaire (bouton flottant) */}
            {tocItems.length > 0 && (
                <LessonTableOfContents items={tocItems} />
            )}

            {/* Section Q&A */}
            {lessonId && courseId && sectionId && (
                <LessonQASection
                    lessonId={lessonId}
                    lessonTitle={title}
                    courseId={courseId}
                    sectionId={sectionId}
                />
            )}
        </article>
    );
}
