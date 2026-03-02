'use client';

import { useEffect, useState } from 'react';
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
import { all, createLowlight } from 'lowlight';
import 'katex/dist/katex.min.css';

import { CustomBlock } from './CustomBlock'; // <-- Votre extension
import MenuBar from './MenuBarEditor';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const lowlightInstance = createLowlight(all);

// Vérifie si on doit rendre LaTeX
function defaultShouldRender(state: any, pos: number, node: any) {
    const $pos = state.doc.resolve(pos);
    return node.type.name === 'text' && $pos.parent.type.name !== 'codeBlock';
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
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
        ],
        content,
        immediatelyRender: false,
        editorProps: {
            attributes: { class: 'ProseMirror min-h-[156px] border rounded-md bg-slate-50 py-2 px-3' },
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
                /* Styles pour voir le rendu directement dans l'éditeur (ProseMirror) */
                .ProseMirror {
                    /* titres plus beaux */
                }
                .ProseMirror h1 {
                    font-size: 1.8rem;
                    color: #f97316; /* orange tailwind */
                    margin-bottom: 0.5rem;
                    border-bottom: 2px solid #f97316;
                }
                .ProseMirror h2 {
                    font-size: 1.5rem;
                    color: #ef4444; /* rouge tailwind */
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                }
                .ProseMirror h3 {
                    font-size: 1.3rem;
                    color: #3b82f6; /* bleu tailwind */
                    margin-top: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                /* Rendu direct des blocs custom dans l'éditeur */
                .ProseMirror .custom-block {
                    position: relative;
                    margin: 1rem 0;
                    padding: 0.8rem 1rem 0.8rem 1rem;
                    padding-top: 2rem;
                    border-radius: 8px;
                    border-left: 4px solid #ddd;
                    transition: box-shadow 0.2s ease;
                }
                .ProseMirror .custom-block:hover {
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                }
                /* Label du type de bloc */
                .ProseMirror .custom-block::before {
                    position: absolute;
                    top: 6px;
                    left: 12px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                }
                /* Styles pour le contenu à l'intérieur des blocs custom */
                .ProseMirror .custom-block p {
                    margin: 0.4rem 0;
                    line-height: 1.6;
                }
                .ProseMirror .custom-block p:first-child {
                    margin-top: 0;
                }
                .ProseMirror .custom-block p:last-child {
                    margin-bottom: 0;
                }
                .ProseMirror .custom-block strong {
                    font-weight: 600;
                    color: inherit;
                }
                .ProseMirror .custom-block br {
                    display: block;
                    margin: 0.3rem 0;
                    content: "";
                }
                /* Placeholder pour blocs vides */
                .ProseMirror .custom-block p.is-empty::before {
                    content: "Écrivez le contenu du bloc ici...";
                    color: #9ca3af;
                    font-style: italic;
                    pointer-events: none;
                    float: left;
                    height: 0;
                }

                /* Couleurs par type — identiques au rendu LessonView */
                .ProseMirror .custom-block.definition {
                    border-left-color: #f97316;
                    background-color: #fff7ed;
                }
                .ProseMirror .custom-block.definition::before {
                    content: "Définition";
                    color: #f97316;
                }
                .ProseMirror .custom-block.propriete {
                    border-left-color: #3b82f6;
                    background-color: #eff6ff;
                }
                .ProseMirror .custom-block.propriete::before {
                    content: "Propriété";
                    color: #3b82f6;
                }
                .ProseMirror .custom-block.exemple {
                    border-left-color: #8b5cf6;
                    background-color: #f5f3ff;
                }
                .ProseMirror .custom-block.exemple::before {
                    content: "Exemple";
                    color: #8b5cf6;
                }
                .ProseMirror .custom-block.theoreme {
                    border-left-color: #10b981;
                    background-color: #ecfdf5;
                }
                .ProseMirror .custom-block.theoreme::before {
                    content: "Théorème";
                    color: #10b981;
                }
                .ProseMirror .custom-block.remarque {
                    border-left-color: #6b7280;
                    background-color: #f9fafb;
                }
                .ProseMirror .custom-block.remarque::before {
                    content: "Remarque";
                    color: #6b7280;
                }
                .ProseMirror .custom-block.attention {
                    border-left-color: #ef4444;
                    background-color: #fef2f2;
                }
                .ProseMirror .custom-block.attention::before {
                    content: "Attention";
                    color: #ef4444;
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
                    border: 1px solid #d1d5db;
                    padding: 0.5rem 0.75rem;
                    text-align: left;
                    vertical-align: top;
                    min-width: 80px;
                }
                .ProseMirror th {
                    background-color: #f3f4f6;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: #374151;
                }
                .ProseMirror td {
                    font-size: 0.875rem;
                }
                .ProseMirror tr:hover td {
                    background-color: #f9fafb;
                }
                /* Cellule sélectionnée dans l'éditeur */
                .ProseMirror .selectedCell {
                    background-color: #dbeafe;
                }
                /* Poignée de redimensionnement des colonnes */
                .ProseMirror .column-resize-handle {
                    position: absolute;
                    right: -2px;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background-color: #3b82f6;
                    cursor: col-resize;
                    z-index: 20;
                }
            `}</style>

            <div>
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
            </div>
        </>
    );
}
