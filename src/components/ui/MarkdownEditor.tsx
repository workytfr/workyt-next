"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import {
    Bold,
    Code,
    Heading2,
    Heading3,
    Italic,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Sigma,
    SquareCode,
    SquareSigma,
    Strikethrough,
    Table as TableIcon,
    Undo2,
} from "lucide-react";
import { MathInline, MathBlock, preprocessMarkdownMath } from "@/app/fiches/_components/MathNode";
import { LinkTool, Sep, TableTools, ToolButton } from "./editor/toolbar";
import "katex/dist/katex.min.css";

/**
 * Éditeur Markdown au style Workyt — remplace @uiw/react-md-editor (deux
 * colonnes « code / aperçu », barre grise, thème à forcer en clair).
 *
 * On écrit directement le rendu ; la valeur lue et rendue reste du Markdown
 * (+ LaTeX entre $…$), le format déjà enregistré pour les descriptions de
 * cours et les exercices : rien à migrer.
 *
 * La barre ne propose que ce que la page publique sait afficher
 * (react-markdown + GFM + KaTeX) : pas de souligné ni de couleur, qui
 * sortiraient en HTML brut.
 */

interface MarkdownEditorProps {
    value: string;
    onChange: (markdown: string) => void;
    placeholder?: string;
    /** Hauteur minimale de la zone de texte, en pixels */
    minHeight?: number;
    /** Nom lu par les lecteurs d'écran (le champ n'a pas de <label> natif) */
    ariaLabel?: string;
}

type MarkdownStorage = { markdown?: { getMarkdown?: () => string } };

export default function MarkdownEditor({
    value,
    onChange,
    placeholder = "Écris ici…",
    minHeight = 160,
    ariaLabel,
}: MarkdownEditorProps) {
    // Dernière valeur sortie de l'éditeur : permet de distinguer « le parent
    // me renvoie ce que je viens d'écrire » de « le parent a chargé autre chose ».
    const lastEmitted = useRef(value ?? "");
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                // Le souligné s'enregistrerait en <u>, que la page publique n'affiche pas
                underline: false,
                link: {
                    openOnClick: false,
                    autolink: true,
                    HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
                },
            }),
            // Pas de bouton dédié, mais les images et cases à cocher déjà
            // présentes dans un texte doivent survivre à une modification.
            // inline : l'image reste dans son paragraphe, comme en Markdown
            Image.configure({ inline: true }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            MathInline,
            MathBlock,
            Placeholder.configure({ placeholder }),
            Markdown.configure({
                html: true,
                tightLists: true,
                bulletListMarker: "-",
                linkify: true,
                breaks: false,
                transformPastedText: true,
                transformCopiedText: true,
            }),
        ],
        content: preprocessMarkdownMath(value || ""),
        onUpdate: ({ editor }) => {
            const md = (editor.storage as MarkdownStorage).markdown?.getMarkdown?.() ?? "";
            lastEmitted.current = md;
            onChangeRef.current(md);
        },
        editorProps: {
            attributes: {
                class: "wk-md-content prose prose-sm max-w-none px-4 py-3 outline-none",
                role: "textbox",
                "aria-multiline": "true",
                ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
            },
        },
    });

    // Valeur changée de l'extérieur (chargement d'un cours, remise à zéro du
    // formulaire) : on recharge, sans émettre de modification. Un texte
    // simplement ouvert n'est donc jamais réécrit.
    useEffect(() => {
        if (!editor) return;
        const incoming = value ?? "";
        if (incoming === lastEmitted.current) return;
        lastEmitted.current = incoming;
        // Hors du rendu React : les formules sont des vues React, que Tiptap
        // monte avec flushSync (interdit pendant un effet).
        queueMicrotask(() => {
            if (!editor.isDestroyed) editor.commands.setContent(preprocessMarkdownMath(incoming), { emitUpdate: false });
        });
    }, [value, editor]);

    if (!editor) {
        return <div className="wk-editor-field" style={{ minHeight: minHeight + 43 }} aria-hidden="true" />;
    }

    const chain = () => editor.chain().focus();
    const inTable = editor.isActive("table");

    return (
        <div className="wk-editor-field wk-md-editor">
            <div className="wk-toolbar" role="toolbar" aria-label="Mise en forme">
                <div className="wk-tb-row">
                    <ToolButton label="Annuler" shortcut="Ctrl Z" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>
                        <Undo2 />
                    </ToolButton>
                    <ToolButton label="Rétablir" shortcut="Ctrl Y" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>
                        <Redo2 />
                    </ToolButton>

                    <Sep />

                    <ToolButton label="Titre" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
                        <Heading2 />
                    </ToolButton>
                    <ToolButton label="Sous-titre" active={editor.isActive("heading", { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
                        <Heading3 />
                    </ToolButton>

                    <Sep />

                    <ToolButton label="Gras" shortcut="Ctrl B" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>
                        <Bold />
                    </ToolButton>
                    <ToolButton label="Italique" shortcut="Ctrl I" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}>
                        <Italic />
                    </ToolButton>
                    <ToolButton label="Barré" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}>
                        <Strikethrough />
                    </ToolButton>
                    <LinkTool editor={editor} />

                    <Sep />

                    <ToolButton label="Liste à puces" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}>
                        <List />
                    </ToolButton>
                    <ToolButton label="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}>
                        <ListOrdered />
                    </ToolButton>
                    <ToolButton label="Citation" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}>
                        <Quote />
                    </ToolButton>

                    <Sep />

                    <ToolButton label="Formule dans le texte" onClick={() => chain().insertContent({ type: "mathInline", attrs: { latex: "" } }).run()}>
                        <Sigma />
                    </ToolButton>
                    <ToolButton label="Formule centrée" onClick={() => chain().insertContent({ type: "mathBlock", attrs: { latex: "" } }).run()}>
                        <SquareSigma />
                    </ToolButton>
                    <ToolButton label="Code" active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}>
                        <Code />
                    </ToolButton>
                    <ToolButton label="Bloc de code" active={editor.isActive("codeBlock")} onClick={() => chain().toggleCodeBlock().run()}>
                        <SquareCode />
                    </ToolButton>
                    <ToolButton
                        label="Insérer un tableau"
                        active={inTable}
                        disabled={inTable}
                        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    >
                        <TableIcon />
                    </ToolButton>
                </div>

                {inTable && <TableTools editor={editor} />}
            </div>

            <EditorContent editor={editor} style={{ "--wk-md-min-height": `${minHeight}px` } as CSSProperties} />
        </div>
    );
}
