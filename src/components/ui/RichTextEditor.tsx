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
                    padding: 0.8rem 1rem;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    background-color: #fafafa;
                    transition: transform 0.2s ease;
                }
                .ProseMirror .custom-block:hover {
                    transform: scale(1.01);
                }
                .ProseMirror .custom-block > strong {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }

                /* Couleurs par type de bloc */
                .ProseMirror .custom-block.definition {
                    border-left: 6px solid #0d6efd; /* bleu */
                }
                .ProseMirror .custom-block.propriete {
                    border-left: 6px solid #20c997; /* vert */
                }
                .ProseMirror .custom-block.exemple {
                    border-left: 6px solid #ffc107; /* jaune */
                }
                .ProseMirror .custom-block.theoreme {
                    border-left: 6px solid #6f42c1; /* violet */
                }
                .ProseMirror .custom-block.remarque {
                    border-left: 6px solid #5bc0de; /* cyan */
                }
                .ProseMirror .custom-block.attention {
                    border-left: 6px solid #dc3545; /* rouge */
                }
            `}</style>

            <div>
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
            </div>
        </>
    );
}
