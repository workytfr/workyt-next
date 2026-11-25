"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import type { Editor } from "@tiptap/react";
import "./editor-toolbar.css";

/**
 * Briques de barre d'outils partagées par les deux éditeurs Workyt :
 * l'éditeur de leçons (MenuBarEditor, HTML) et l'éditeur Markdown
 * (MarkdownEditor : descriptions de cours, exercices, fiches rapides).
 */

interface ToolButtonProps {
    label: string;
    shortcut?: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
    className?: string;
}

export function ToolButton({ label, shortcut, active, disabled, onClick, children, className = "" }: ToolButtonProps) {
    return (
        <button
            type="button" // sans ça, le bouton soumet le <form> qui contient l'éditeur
            title={shortcut ? `${label} (${shortcut})` : label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            // Le clic ne doit pas retirer le curseur du texte
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`wk-tb-btn ${className}`}
        >
            {children}
        </button>
    );
}

export const Sep = () => <span className="wk-tb-sep" aria-hidden="true" />;

/** Petit menu ancré sous un bouton de la barre ; se ferme au clic dehors et à Échap */
export function useMenu() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return { open, setOpen, ref };
}

/** Bouton « Lien » et son petit champ d'adresse */
export function LinkTool({ editor }: { editor: Editor }) {
    const { open, setOpen, ref } = useMenu();
    const [url, setUrl] = useState("");
    const chain = () => editor.chain().focus();

    const toggle = () => {
        setUrl(editor.getAttributes("link").href ?? "");
        setOpen(!open);
    };

    const apply = () => {
        const value = url.trim();
        if (!value) {
            chain().extendMarkRange("link").unsetLink().run();
        } else {
            // « workyt.fr » saisi sans protocole : on complète plutôt que de créer un lien relatif cassé
            const href = /^(https?:\/\/|mailto:|\/|#)/i.test(value) ? value : `https://${value}`;
            chain().extendMarkRange("link").setLink({ href }).run();
        }
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <ToolButton label="Lien" active={editor.isActive("link") || open} onClick={toggle}>
                <LinkIcon />
            </ToolButton>
            {open && (
                <div className="wk-tb-menu w-72 !p-2">
                    <label className="mb-1 block text-xs font-semibold text-[#6b625c]">
                        Adresse du lien
                        <span className="mt-1 flex gap-1.5">
                            <input
                                type="url"
                                autoFocus
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault(); // ne pas soumettre le formulaire autour de l'éditeur
                                        apply();
                                    }
                                }}
                                placeholder="https://…"
                                className="h-8 min-w-0 flex-1 rounded-lg border border-[#e6e0d6] bg-white px-2 text-sm font-normal text-[#1a1512] outline-none focus:border-[#ff6a1a]"
                            />
                            <button type="button" onClick={apply} className="h-8 shrink-0 rounded-lg bg-[#1a1512] px-3 text-xs font-semibold text-[#fdfaf4]">
                                OK
                            </button>
                        </span>
                    </label>
                    {editor.isActive("link") && (
                        <button
                            type="button"
                            onClick={() => {
                                chain().extendMarkRange("link").unsetLink().run();
                                setOpen(false);
                            }}
                            className="mt-1.5 text-xs font-medium text-[#c2272d] hover:underline"
                        >
                            Retirer le lien
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/** Rangée d'outils de tableau : à n'afficher que quand le curseur est dans un tableau */
export function TableTools({ editor }: { editor: Editor }) {
    const chain = () => editor.chain().focus();
    const keep = (e: React.MouseEvent) => e.preventDefault();

    return (
        <div className="wk-tb-row wk-tb-row--context">
            <span className="wk-tb-context-label">Tableau</span>
            <button type="button" onMouseDown={keep} onClick={() => chain().addRowAfter().run()} className="wk-tb-btn wk-tb-btn--text">
                + Ligne
            </button>
            <button type="button" onMouseDown={keep} onClick={() => chain().addColumnAfter().run()} className="wk-tb-btn wk-tb-btn--text">
                + Colonne
            </button>
            <Sep />
            <button type="button" onMouseDown={keep} onClick={() => chain().deleteRow().run()} className="wk-tb-btn wk-tb-btn--text">
                Supprimer la ligne
            </button>
            <button type="button" onMouseDown={keep} onClick={() => chain().deleteColumn().run()} className="wk-tb-btn wk-tb-btn--text">
                Supprimer la colonne
            </button>
            <Sep />
            <button type="button" onMouseDown={keep} onClick={() => chain().deleteTable().run()} className="wk-tb-btn wk-tb-btn--text wk-tb-btn--danger">
                <Trash2 />
                Supprimer le tableau
            </button>
        </div>
    );
}
