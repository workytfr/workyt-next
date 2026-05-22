"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Highlighter,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Code,
    Code2,
    Minus,
    Link as LinkIcon,
    Undo2,
    Redo2,
    Table as TableIcon,
    ImagePlus,
    Paperclip,
    Loader2,
    Sigma,
    Pencil,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { uploadToR2, type UploadKind } from "./uploadToR2";
import { MathInline, MathBlock, preprocessMarkdownMath } from "./MathNode";
import "katex/dist/katex.min.css";

const DrawModal = dynamic(() => import("./DrawModal"), { ssr: false });

interface FicheEditorProps {
    value: string;
    onChange: (markdown: string) => void;
    placeholder?: string;
}

function ToolbarButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={title}
            aria-pressed={active}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-md text-sm transition-colors touch-manipulation
                ${active ? "bg-black text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"}
                disabled:opacity-40 disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    );
}

function Toolbar({
    editor,
    onPickImage,
    onPickAttachment,
    onInsertMath,
    onOpenDraw,
    uploading,
}: {
    editor: Editor;
    onPickImage: () => void;
    onPickAttachment: () => void;
    onInsertMath: (block: boolean) => void;
    onOpenDraw: () => void;
    uploading: boolean;
}) {
    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("URL du lien", previousUrl ?? "https://");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white/95 backdrop-blur px-2 py-1.5 rounded-t-md">
            <ToolbarButton title="Annuler" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo2 size={18} />
            </ToolbarButton>
            <ToolbarButton title="Rétablir" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo2 size={18} />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton title="Titre 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 size={18} />
            </ToolbarButton>
            <ToolbarButton title="Titre 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 size={18} />
            </ToolbarButton>
            <ToolbarButton title="Titre 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 size={18} />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton title="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold size={18} />
            </ToolbarButton>
            <ToolbarButton title="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic size={18} />
            </ToolbarButton>
            <ToolbarButton title="Souligné" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <UnderlineIcon size={18} />
            </ToolbarButton>
            <ToolbarButton title="Barré" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough size={18} />
            </ToolbarButton>
            <ToolbarButton title="Surligner" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
                <Highlighter size={18} />
            </ToolbarButton>
            <ToolbarButton title="Code inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
                <Code size={18} />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton title="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List size={18} />
            </ToolbarButton>
            <ToolbarButton title="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered size={18} />
            </ToolbarButton>
            <ToolbarButton title="Liste de tâches" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
                <ListChecks size={18} />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton title="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote size={18} />
            </ToolbarButton>
            <ToolbarButton title="Bloc de code" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code2 size={18} />
            </ToolbarButton>
            <ToolbarButton title="Séparateur" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus size={18} />
            </ToolbarButton>
            <ToolbarButton title="Lien" active={editor.isActive("link")} onClick={setLink}>
                <LinkIcon size={18} />
            </ToolbarButton>
            <ToolbarButton title="Tableau" onClick={insertTable}>
                <TableIcon size={18} />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton title="Insérer une image" onClick={onPickImage} disabled={uploading}>
                <ImagePlus size={18} />
            </ToolbarButton>
            <ToolbarButton title="Joindre un fichier" onClick={onPickAttachment} disabled={uploading}>
                <Paperclip size={18} />
            </ToolbarButton>
            <ToolbarButton title="Formule (inline)" onClick={() => onInsertMath(false)}>
                <Sigma size={18} />
            </ToolbarButton>
            <ToolbarButton title="Formule (bloc)" onClick={() => onInsertMath(true)}>
                <span className="font-bold text-base leading-none">Σ²</span>
            </ToolbarButton>
            <ToolbarButton title="Dessiner / tableau blanc" onClick={onOpenDraw}>
                <Pencil size={18} />
            </ToolbarButton>
            {uploading && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 px-2">
                    <Loader2 size={14} className="animate-spin" />
                    Envoi…
                </span>
            )}
        </div>
    );
}

export default function FicheEditor({ value, onChange, placeholder }: FicheEditorProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Highlight,
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
            }),
            Image,
            Placeholder.configure({
                placeholder: placeholder ?? "Écris ici…",
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({ nested: true }),
            MathInline,
            MathBlock,
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
            const md = (editor.storage as any).markdown?.getMarkdown?.() ?? "";
            onChange(md);
        },
        editorProps: {
            attributes: {
                class: "prose max-w-none focus:outline-none px-4 py-3 min-h-[280px]",
            },
            handlePaste: (view, event) => {
                const files = Array.from(event.clipboardData?.files ?? []);
                if (files.length === 0) return false;
                event.preventDefault();
                void handleFiles(files);
                return true;
            },
            handleDrop: (view, event) => {
                const dt = (event as DragEvent).dataTransfer;
                const files = Array.from(dt?.files ?? []);
                if (files.length === 0) return false;
                event.preventDefault();
                void handleFiles(files);
                return true;
            },
        },
    });

    const insertUploaded = (file: File, url: string) => {
        if (!editor) return;
        if (file.type.startsWith("image/")) {
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        } else {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: `📎 ${file.name}`,
                            marks: [{ type: "link", attrs: { href: url, target: "_blank" } }],
                        },
                    ],
                })
                .run();
        }
    };

    const handleFiles = async (files: File[]) => {
        setUploadError(null);
        setUploading(true);
        try {
            for (const file of files) {
                const kind: UploadKind = file.type.startsWith("image/") ? "img" : "attach";
                const { publicUrl } = await uploadToR2(file, kind);
                insertUploaded(file, publicUrl);
            }
        } catch (err: any) {
            setUploadError(err?.message ?? "Erreur d'envoi");
        } finally {
            setUploading(false);
        }
    };

    const triggerImagePick = () => imageInputRef.current?.click();
    const triggerAttachPick = () => attachInputRef.current?.click();

    const onPickedFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length) void handleFiles(files);
    };

    useEffect(() => {
        if (!editor) return;
        const current = (editor.storage as any).markdown?.getMarkdown?.() ?? "";
        if (value !== current && !editor.isFocused) {
            editor.commands.setContent(preprocessMarkdownMath(value || ""));
        }
    }, [value, editor]);

    const [drawOpen, setDrawOpen] = useState(false);

    const insertDrawing = (pngUrl: string, snapshotUrl: string) => {
        if (!editor) return;
        editor.chain().focus().setImage({ src: pngUrl, alt: "dessin" }).run();
        editor.chain().focus().insertContent(`<!--tldraw:${snapshotUrl}-->`).run();
        setDrawOpen(false);
    };

    const insertMath = (block: boolean) => {
        if (!editor) return;
        if (block) {
            editor.chain().focus().insertContent({ type: "mathBlock", attrs: { latex: "" } }).run();
        } else {
            editor.chain().focus().insertContent({ type: "mathInline", attrs: { latex: "" } }).run();
        }
    };

    if (!editor) {
        return <div className="min-h-[320px] border border-gray-200 rounded-md bg-white" />;
    }

    return (
        <div className="border border-gray-200 rounded-md bg-white shadow-sm">
            <Toolbar
                editor={editor}
                onPickImage={triggerImagePick}
                onPickAttachment={triggerAttachPick}
                onInsertMath={insertMath}
                onOpenDraw={() => setDrawOpen(true)}
                uploading={uploading}
            />
            <EditorContent editor={editor} />
            {uploadError && (
                <p className="px-4 py-2 text-sm text-red-600 border-t border-red-100 bg-red-50">
                    {uploadError}
                </p>
            )}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                hidden
                onChange={onPickedFiles}
            />
            <input
                ref={attachInputRef}
                type="file"
                accept="application/pdf,image/*,text/plain"
                multiple
                hidden
                onChange={onPickedFiles}
            />
            <DrawModal
                open={drawOpen}
                onClose={() => setDrawOpen(false)}
                onSave={insertDrawing}
            />
        </div>
    );
}
