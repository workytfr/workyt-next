"use client";

import { useState } from "react";
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Baseline,
    Bold,
    ChevronDown,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Image as ImageIcon,
    Italic,
    List,
    ListOrdered,
    Loader2,
    Redo2,
    Shapes,
    Strikethrough,
    Table as TableIcon,
    Underline,
    Undo2,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { BLOCK_TYPES } from "./editor/blockTypes";
import { UploadButton } from "@/utils/uploadthing";
import { LinkTool, Sep, TableTools, ToolButton, useMenu } from "./editor/toolbar";

/**
 * Barre d'outils de l'éditeur de leçons.
 *
 * Avant : 24 boutons-icônes à la file, sans nom ni infobulle, six blocs
 * pédagogiques indistincts, quatre « A » pastel illisibles sur blanc, un
 * bouton d'envoi bleu « Choose File » et aucun moyen d'ajouter une ligne à un
 * tableau. Ici : des groupes séparés, un nom et un raccourci sur chaque
 * bouton, et les outils de tableau qui n'apparaissent que dans un tableau.
 */

// Couleurs de texte : assez foncées pour se lire sur blanc (≥ 4.5:1).
// Les anciens pastels (#77dd77…) restent affichés tels quels dans les leçons
// déjà écrites ; on ne les propose simplement plus.
const TEXT_COLORS = [
    { name: "Orange", color: "#c24a0a" },
    { name: "Rouge", color: "#c2272d" },
    { name: "Vert", color: "#2f7d32" },
    { name: "Bleu", color: "#2f6fb3" },
];

export default function MenuBarEditor({ editor, hideImage = false }: { editor: Editor | null; hideImage?: boolean }) {
    const { open: colorOpen, setOpen: setColorOpen, ref: colorRef } = useMenu();
    const { open: blockOpen, setOpen: setBlockOpen, ref: blockRef } = useMenu();
    const [uploadError, setUploadError] = useState<string | null>(null);

    if (!editor) return null;

    const chain = () => editor.chain().focus();
    const currentColor: string | undefined = editor.getAttributes("textStyle").color;
    const inTable = editor.isActive("table");

    return (
        <div className="wk-toolbar" role="toolbar" aria-label="Mise en forme">
            <div className="wk-tb-row">
                {/* Historique */}
                <ToolButton label="Annuler" shortcut="Ctrl Z" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>
                    <Undo2 />
                </ToolButton>
                <ToolButton label="Rétablir" shortcut="Ctrl Y" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>
                    <Redo2 />
                </ToolButton>

                <Sep />

                {/* Titres */}
                <ToolButton label="Titre 1" active={editor.isActive("heading", { level: 1 })} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
                    <Heading1 />
                </ToolButton>
                <ToolButton label="Titre 2" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
                    <Heading2 />
                </ToolButton>
                <ToolButton label="Titre 3" active={editor.isActive("heading", { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
                    <Heading3 />
                </ToolButton>

                <Sep />

                {/* Texte */}
                <ToolButton label="Gras" shortcut="Ctrl B" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>
                    <Bold />
                </ToolButton>
                <ToolButton label="Italique" shortcut="Ctrl I" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}>
                    <Italic />
                </ToolButton>
                <ToolButton label="Souligné" shortcut="Ctrl U" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()}>
                    <Underline />
                </ToolButton>
                <ToolButton label="Barré" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}>
                    <Strikethrough />
                </ToolButton>
                <ToolButton label="Surligner" active={editor.isActive("highlight")} onClick={() => chain().toggleHighlight().run()}>
                    <Highlighter />
                </ToolButton>

                {/* Couleur du texte */}
                <div ref={colorRef} className="relative">
                    <ToolButton label="Couleur du texte" active={colorOpen} onClick={() => setColorOpen(!colorOpen)}>
                        <span className="flex flex-col items-center gap-px">
                            <Baseline className="!size-[15px]" />
                            <span className="h-[3px] w-4 rounded-full" style={{ background: currentColor ?? "#1a1512" }} />
                        </span>
                    </ToolButton>
                    {colorOpen && (
                        <div className="wk-tb-menu flex items-center gap-1 !p-1.5" role="menu" aria-label="Couleur du texte">
                            <button
                                type="button"
                                role="menuitem"
                                title="Couleur par défaut"
                                aria-label="Couleur par défaut"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    chain().unsetColor().run();
                                    setColorOpen(false);
                                }}
                                className="wk-tb-swatch"
                                data-active={!currentColor}
                            >
                                <span style={{ background: "#1a1512" }} />
                            </button>
                            {TEXT_COLORS.map(({ name, color }) => (
                                <button
                                    key={color}
                                    type="button"
                                    role="menuitem"
                                    title={name}
                                    aria-label={name}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        chain().setColor(color).run();
                                        setColorOpen(false);
                                    }}
                                    className="wk-tb-swatch"
                                    data-active={currentColor === color}
                                >
                                    <span style={{ background: color }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <LinkTool editor={editor} />

                <Sep />

                {/* Alignement */}
                <ToolButton label="Aligner à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => chain().setTextAlign("left").run()}>
                    <AlignLeft />
                </ToolButton>
                <ToolButton label="Centrer" active={editor.isActive({ textAlign: "center" })} onClick={() => chain().setTextAlign("center").run()}>
                    <AlignCenter />
                </ToolButton>
                <ToolButton label="Aligner à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => chain().setTextAlign("right").run()}>
                    <AlignRight />
                </ToolButton>

                <Sep />

                {/* Listes */}
                <ToolButton label="Liste à puces" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}>
                    <List />
                </ToolButton>
                <ToolButton label="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}>
                    <ListOrdered />
                </ToolButton>

                <Sep />

                {/* Insertion */}
                <ToolButton label="Bloc de code" active={editor.isActive("codeBlock")} onClick={() => chain().toggleCodeBlock().run()}>
                    <Code />
                </ToolButton>
                <ToolButton
                    label="Insérer un tableau"
                    active={inTable}
                    // Un tableau dans un tableau ne se rattrape pas à la souris
                    disabled={inTable}
                    onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                >
                    <TableIcon />
                </ToolButton>

                {!hideImage && (
                    <UploadButton
                        endpoint="imageUploader"
                        onUploadBegin={() => setUploadError(null)}
                        onClientUploadComplete={(res) => {
                            if (res && res.length > 0) {
                                chain().setImage({ src: res[0].url, alt: "" }).run();
                            }
                        }}
                        onUploadError={(error: Error) => {
                            console.error("Erreur lors de l'upload:", error.message);
                            setUploadError("L'image n'a pas pu être envoyée (4 Mo maximum).");
                        }}
                        appearance={{
                            container: "wk-tb-upload",
                            button: "wk-tb-btn wk-tb-upload-btn",
                            allowedContent: "hidden",
                        }}
                        content={{
                            button: ({ isUploading }) =>
                                isUploading ? (
                                    <Loader2 className="animate-spin" aria-label="Envoi de l'image…" />
                                ) : (
                                    <span title="Insérer une image (4 Mo max)" className="flex items-center">
                                        <ImageIcon aria-label="Insérer une image" />
                                    </span>
                                ),
                        }}
                    />
                )}

                <Sep />

                {/* Blocs pédagogiques : nommés, comme dans le menu « / » */}
                <div ref={blockRef} className="relative">
                    <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={blockOpen}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setBlockOpen(!blockOpen)}
                        className="wk-tb-btn wk-tb-btn--text"
                        aria-pressed={editor.isActive("customBlock") || blockOpen}
                    >
                        <Shapes />
                        Bloc
                        <ChevronDown className="!size-3.5 opacity-60" />
                    </button>
                    {blockOpen && (
                        <div className="wk-tb-menu w-72" role="menu">
                            {BLOCK_TYPES.map((block) => (
                                <button
                                    key={block.type}
                                    type="button"
                                    role="menuitem"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        chain().setCustomBlock?.(block.type).run();
                                        setBlockOpen(false);
                                    }}
                                    className="wk-tb-menu-item"
                                >
                                    <span className="wk-tb-menu-icon">
                                        <block.icon />
                                    </span>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="text-sm font-semibold text-[#1a1512]">{block.label}</span>
                                        <span className="truncate text-xs text-[rgba(26,21,18,0.55)]">{block.hint}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Outils de tableau : seulement quand le curseur est dans un tableau */}
            {inTable && <TableTools editor={editor} />}

            {uploadError && (
                <p role="alert" className="px-2 pb-1.5 text-xs font-medium text-[#c2272d]">
                    {uploadError}
                </p>
            )}
        </div>
    );
}
