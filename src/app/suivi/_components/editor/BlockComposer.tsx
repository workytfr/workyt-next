"use client";

import React, { useState } from "react";
import { AlertTriangle, Send, X } from "lucide-react";
import { MAX_BLOCK_TITLE_LENGTH, MAX_MESSAGE_LENGTH, type SuiviBlockType } from "@/lib/mentorship/config";
import { api, ApiError } from "../../_lib/client";
import { Spinner } from "../ui";
import { BlockCard, SUIVI_BLOCKS, SUIVI_BLOCK_BY_TYPE } from "../blocks";
import FormatToolbar from "./FormatToolbar";
import MathPanel from "./MathPanel";
import { useMarkdownField } from "./useMarkdownField";

/**
 * Rédaction d'un bloc pédagogique (définition, méthode, indice…) par le
 * bénévole, avec l'aperçu exact de ce que l'élève recevra.
 */
export default function BlockComposer({
    mentorshipId,
    onCancel,
    onSent,
}: {
    mentorshipId: string;
    onCancel: () => void;
    onSent: () => void;
}) {
    const [type, setType] = useState<SuiviBlockType>("definition");
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [mathOpen, setMathOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const field = useMarkdownField(text, setText, MAX_MESSAGE_LENGTH);
    const def = SUIVI_BLOCK_BY_TYPE[type];

    const choose = (t: SuiviBlockType) => {
        setType(t);
        // Une méthode, ce sont des étapes : on amorce la liste numérotée
        if (t === "methode" && !text.trim()) setText("1. ");
        if (t !== "methode" && text === "1. ") setText("");
    };

    const send = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        setError(null);
        try {
            await api(`/api/suivi/${mentorshipId}/messages`, {
                method: "POST",
                json: { kind: "block", blockType: type, blockTitle: title.trim(), text: text.trim() },
            });
            setTitle("");
            setText("");
            onSent();
            onCancel();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Envoi impossible.");
            // Un bloc bloqué est conservé côté serveur : on l'affiche au rechargement
            if (err instanceof ApiError && err.status === 422) onSent();
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-h-[70vh] overflow-y-auto border-t border-[rgba(26,21,18,0.08)] bg-white px-3 pb-3 pt-3 sm:px-4">
            <div className="mb-2.5 flex items-center justify-between">
                <span className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Envoyer un bloc</span>
                <button type="button" onClick={onCancel} className="rounded-full p-1 text-[rgba(26,21,18,0.5)] hover:bg-[var(--wk-paper-2)]" aria-label="Revenir au message">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Type de bloc">
                {SUIVI_BLOCKS.map((b) => {
                    const Icon = b.icon;
                    const active = b.type === type;
                    return (
                        <button
                            key={b.type}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => choose(b.type)}
                            title={b.hint}
                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                active
                                    ? "border-[var(--wk-ink)] bg-[var(--wk-ink)] text-white"
                                    : "border-[rgba(26,21,18,0.12)] bg-white text-[rgba(26,21,18,0.7)] hover:border-[rgba(26,21,18,0.3)]"
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {b.label}
                        </button>
                    );
                })}
            </div>
            <p className="mt-1 px-1 text-[11px] text-[rgba(26,21,18,0.5)]">{def.hint}</p>

            {error && (
                <p role="alert" className="mt-2 flex gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </p>
            )}

            <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_BLOCK_TITLE_LENGTH))}
                placeholder={def.titlePlaceholder}
                className="mt-2.5 w-full rounded-2xl border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] px-4 py-2 text-sm font-semibold outline-none transition focus:border-[var(--wk-accent)] focus:bg-white"
                aria-label="Titre du bloc (facultatif)"
            />

            {mathOpen && (
                <div className="mt-2">
                    <MathPanel
                        onClose={() => setMathOpen(false)}
                        onInsert={(latex) => {
                            field.insert(`$${latex}$`);
                            setMathOpen(false);
                        }}
                    />
                </div>
            )}

            <textarea
                ref={field.ref}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onKeyDown={(e) => {
                    // Ctrl/Cmd+Entrée envoie ; Entrée seule va à la ligne (un bloc fait souvent plusieurs lignes)
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        send();
                    }
                }}
                rows={4}
                placeholder={def.bodyPlaceholder}
                className="mt-2 max-h-60 min-h-[96px] w-full resize-y rounded-2xl border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] px-4 py-2.5 text-sm leading-relaxed outline-none transition focus:border-[var(--wk-accent)] focus:bg-white"
                aria-label="Contenu du bloc"
            />

            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <FormatToolbar field={field} mathOpen={mathOpen} onToggleMath={() => setMathOpen((v) => !v)} />
                <span className="text-[11px] text-[rgba(26,21,18,0.45)]">Ctrl+Entrée pour envoyer</span>
            </div>

            {text.trim() && (
                <div className="mt-3">
                    <span className="font-mono-ui mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.45)]">Ce que l&apos;élève verra</span>
                    <BlockCard type={type} title={title.trim()} text={text} showHintNote className="!bg-[var(--wk-paper)]" />
                </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="wk-chip !py-2">
                    Annuler
                </button>
                <button type="button" onClick={send} disabled={sending || !text.trim()} className="wk-btn-orange !px-4 !py-2 text-sm disabled:opacity-40">
                    {sending ? <Spinner className="h-4 w-4 !border-white/40 !border-t-white" /> : <Send className="h-4 w-4" />}
                    Envoyer le bloc
                </button>
            </div>
        </div>
    );
}
