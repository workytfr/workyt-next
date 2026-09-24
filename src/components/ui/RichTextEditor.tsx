'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Maximize2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Mathematics from '@tiptap/extension-mathematics';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import { all, createLowlight } from 'lowlight';
import 'katex/dist/katex.min.css';
// Styles de la leçon publiée : l'éditeur plein écran écrit « dans » la leçon
import '@/app/cours/_components/styles/notion-theme.css';

import { CustomBlock } from './CustomBlock';
import { SlashCommand } from './editor/SlashCommand';
import MenuBar from './MenuBarEditor';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    fullHeight?: boolean;
    hideImage?: boolean;
    /** Affiché au-dessus du texte, dans la colonne de la page (ex : titre de la leçon) */
    header?: ReactNode;
}

const lowlightInstance = createLowlight(all);

const WIDTH_KEY = 'wk-editor-wide';

export default function RichTextEditor({ content, onChange, fullHeight = false, hideImage = false, header }: RichTextEditorProps) {
    // Largeur de la page d'écriture, retenue d'une leçon à l'autre
    const [wide, setWideState] = useState(() => {
        try {
            return localStorage.getItem(WIDTH_KEY) !== 'false';
        } catch {
            return true;
        }
    });
    const setWide = (value: boolean) => {
        setWideState(value);
        try {
            localStorage.setItem(WIDTH_KEY, String(value));
        } catch {
            /* navigation privée : le choix ne sera pas retenu */
        }
    };

    // Le hook useEditor doit être appelé directement dans le composant, sans condition.
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { HTMLAttributes: { class: 'list-disc ml-3' } },
                orderedList: { HTMLAttributes: { class: 'list-decimal ml-3' } },
            }),
            Heading.configure({
                levels: [1, 2, 3, 4, 5, 6],
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Highlight,
            Mathematics,
            TextStyle,
            Color.configure({ types: ['textStyle'] }),
            Image.configure({
                allowBase64: true,
                inline: true,
                HTMLAttributes: { class: 'rounded-md shadow-md mx-auto max-w-full' },
            }),
            CodeBlockLowlight.configure({
                lowlight: lowlightInstance,
                defaultLanguage: 'plaintext',
                languageClassPrefix: 'language-',
                HTMLAttributes: { class: 'rounded-md bg-gray-100 p-2' },
            }),
            Table.configure({
                HTMLAttributes: { class: 'table-auto border border-gray-300' },
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CustomBlock.configure({}),
            SlashCommand,
            Placeholder.configure({
                includeChildren: true,
                placeholder: ({ editor, node, pos }) => {
                    if (node.type.name === 'heading') return 'Titre';
                    const parent = editor.state.doc.resolve(pos).parent;
                    if (parent.type.name === 'customBlock') return 'Écris le contenu du bloc…';
                    return 'Écris ici, ou tape « / » pour insérer un bloc';
                },
            }),
        ],
        content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                // Mêmes classes que LessonView : ce qu'on écrit ressemble à la leçon publiée
                class: fullHeight
                    ? 'ProseMirror wk-editor-page prose prose-lg max-w-none notion-lesson-content outline-none'
                    : 'ProseMirror wk-editor-compact prose prose-sm max-w-none min-h-[156px] border rounded-md bg-white py-2 px-3',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Mettre à jour le contenu de l'éditeur quand il change depuis l'extérieur
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    return (
        <>
            <style jsx global>{`
                /* Texte d'aide de la ligne vide où se trouve le curseur
                   (extension Placeholder, showOnlyCurrent par défaut) */
                .ProseMirror .is-empty::before {
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                    color: rgba(26, 21, 18, 0.35);
                }

                /* Bloc pédagogique en cours de rédaction : même carte que la
                   leçon publiée (lesson-blocks.css), avec un repère au focus */
                .ProseMirror .wk-block--editing {
                    transition: box-shadow 0.15s ease;
                }
                .ProseMirror .wk-block--editing:focus-within {
                    box-shadow: 0 0 0 3px rgba(255, 106, 26, 0.14);
                }
                .ProseMirror .wk-block__head {
                    user-select: none;
                }
                /* Anciens blocs : leur 1re ligne en gras est le titre du bloc */
                .ProseMirror .wk-block__body > p:first-child > strong:only-child {
                    font-family: var(--font-funnel-display), system-ui, sans-serif;
                    font-weight: 400;
                    font-size: 1.25rem;
                }

                /* Tableaux visibles dans l'éditeur */
                .ProseMirror table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1rem 0;
                    overflow: hidden;
                    border-radius: 4px;
                }
                .ProseMirror th,
                .ProseMirror td {
                    border: 1px solid rgba(26, 21, 18, 0.14);
                    padding: 0.5rem 0.75rem;
                    text-align: left;
                    vertical-align: top;
                    min-width: 80px;
                }
                .ProseMirror th {
                    background-color: #f5efe3;
                    font-weight: 600;
                }
                /* Cellule sélectionnée dans l'éditeur */
                .ProseMirror .selectedCell {
                    background-color: #fff4ec;
                }
                /* Poignée de redimensionnement des colonnes */
                .ProseMirror .column-resize-handle {
                    position: absolute;
                    right: -2px;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background-color: #ff6a1a;
                    cursor: col-resize;
                    z-index: 20;
                }

                /* Menu « / » */
                .wk-slash-host {
                    position: fixed;
                    z-index: 60;
                }
                .wk-slash-menu {
                    width: 280px;
                    max-height: 340px;
                    overflow-y: auto;
                    padding: 6px;
                    background: #ffffff;
                    border: 1px solid rgba(26, 21, 18, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 12px 24px -6px rgba(26, 21, 18, 0.16);
                    font-family: var(--font-montserrat), system-ui, sans-serif;
                }
                .wk-slash-menu--empty {
                    padding: 10px 12px;
                    font-size: 0.8125rem;
                    color: rgba(26, 21, 18, 0.5);
                }
                .wk-slash-menu__group {
                    padding: 8px 10px 4px;
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: rgba(26, 21, 18, 0.45);
                }
                .wk-slash-menu__item {
                    display: flex;
                    width: 100%;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 8px;
                    border-radius: 10px;
                    text-align: left;
                }
                .wk-slash-menu__item[aria-selected='true'] {
                    background: #f5efe3;
                }
                .wk-slash-menu__icon {
                    display: inline-flex;
                    flex-shrink: 0;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: #fdfaf4;
                    border: 1px solid rgba(26, 21, 18, 0.08);
                    color: #1a1512;
                }
                .wk-slash-menu__icon svg {
                    width: 16px;
                    height: 16px;
                }
                .wk-slash-menu__text {
                    display: flex;
                    min-width: 0;
                    flex-direction: column;
                }
                .wk-slash-menu__title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #1a1512;
                }
                .wk-slash-menu__hint {
                    font-size: 0.75rem;
                    color: rgba(26, 21, 18, 0.55);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>

            {fullHeight ? (
                <div className="flex flex-col h-full min-h-0">
                    <div className="sticky top-0 z-10 bg-[#fdfaf4] border-b border-[#e6e0d6] shrink-0 flex items-start gap-2 pr-2">
                        <div className="flex-1 min-w-0">
                            <MenuBar editor={editor} hideImage={hideImage} />
                        </div>
                        {/* Pleine largeur pour écrire ; largeur élève pour vérifier les retours à la ligne */}
                        <div className="mt-1 hidden md:flex shrink-0 rounded-full border border-[#e6e0d6] bg-white p-0.5 text-xs" role="group" aria-label="Largeur de la page">
                            {([
                                { value: true, label: 'Pleine largeur', icon: <Maximize2 className="size-3.5" /> },
                                { value: false, label: 'Largeur élève', icon: <BookOpen className="size-3.5" /> },
                            ] as const).map((opt) => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => setWide(opt.value)}
                                    aria-pressed={wide === opt.value}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                                        wide === opt.value ? 'bg-[#1a1512] text-[#fdfaf4]' : 'text-[#6b625c] hover:text-[#1a1512]'
                                    }`}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Une « page » blanche sur le papier */}
                    <div
                        className="flex-1 min-h-0 overflow-y-auto bg-[#fdfaf4] cursor-text"
                        onClick={(e) => {
                            // Clic dans la marge : on place le curseur à la fin du texte
                            if (e.target === e.currentTarget) editor?.chain().focus('end').run();
                        }}
                    >
                        <div
                            className={`mx-auto my-3 w-full rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(26,21,18,0.04)] transition-[max-width] duration-200 sm:px-10 sm:py-8 ${
                                // 768px = largeur de la leçon sur le site (max-w-3xl) + marges intérieures
                                wide ? 'max-w-none sm:mx-3 sm:w-auto' : 'max-w-[848px]'
                            }`}
                        >
                            {header}
                            <EditorContent editor={editor} className="min-h-[50vh]" />
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <MenuBar editor={editor} hideImage={hideImage} />
                    <EditorContent editor={editor} />
                </div>
            )}
        </>
    );
}
