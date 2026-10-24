"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import {
    COMMENT_KIND_OPTIONS,
    COMMENT_MAX_CHARS,
    COMMENT_MIN_CHARS,
    type CommentDTO,
    type CommentKindValue,
} from "@/lib/comments";

/** Zone de texte qui s'agrandit avec son contenu (jusqu'à ~12 lignes). */
export function AutoTextarea({
    value,
    onChange,
    onSubmitShortcut,
    textareaRef,
    className = "",
    ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
    value: string;
    onChange: (value: string) => void;
    /** Ctrl / ⌘ + Entrée */
    onSubmitShortcut?: () => void;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const ref = textareaRef ?? innerRef;

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
    }, [value, ref]);

    return (
        <textarea
            ref={ref}
            value={value}
            rows={2}
            onChange={(e) => onChange(e.target.value.slice(0, COMMENT_MAX_CHARS + 50))}
            onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    onSubmitShortcut?.();
                }
            }}
            className={`block w-full resize-none rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white px-4 py-3 text-[14.5px] leading-relaxed text-[var(--wk-ink)] placeholder:text-[rgba(26,21,18,0.4)] focus:border-[var(--wk-accent)] focus:outline-none focus:ring-4 focus:ring-[rgba(255,106,26,0.12)] ${className}`}
            {...rest}
        />
    );
}

/** Compteur, erreurs de longueur, et état d'envoi d'un texte de commentaire */
export function useCommentDraft(initial = "") {
    const [content, setContent] = useState(initial);
    const trimmed = content.trim();
    const tooLong = content.length > COMMENT_MAX_CHARS;
    const tooShort = trimmed.length > 0 && trimmed.length < COMMENT_MIN_CHARS;
    const valid = trimmed.length >= COMMENT_MIN_CHARS && !tooLong;
    return { content, setContent, trimmed, tooLong, tooShort, valid };
}

export function DraftStatus({ length, tooLong, tooShort, error }: { length: number; tooLong: boolean; tooShort: boolean; error?: string | null }) {
    return (
        <div className="flex min-w-0 items-center gap-2 text-xs">
            {error ? (
                <span className="inline-flex items-center gap-1 text-red-600">
                    <AlertTriangle size={12} /> {error}
                </span>
            ) : tooLong ? (
                <span className="text-red-600">Dépasse la limite de {COMMENT_MAX_CHARS} caractères.</span>
            ) : tooShort ? (
                <span className="text-amber-700">Au moins {COMMENT_MIN_CHARS} caractères.</span>
            ) : (
                <span className="hidden text-[rgba(26,21,18,0.45)] sm:inline">
                    Ctrl + Entrée pour envoyer · **gras**, *italique*, liens et $formules$
                </span>
            )}
            {length > COMMENT_MAX_CHARS * 0.8 && (
                <span className={`tabular-nums ${tooLong ? "text-red-600" : "text-[rgba(26,21,18,0.45)]"}`}>
                    {length}/{COMMENT_MAX_CHARS}
                </span>
            )}
        </div>
    );
}

interface CommentFormProps {
    revisionId: string;
    /** Réponse à un commentaire (un seul niveau) */
    parentId?: string;
    /** Nature du commentaire (commentaire principal seulement) */
    kind?: CommentKindValue;
    onKindChange?: (kind: CommentKindValue) => void;
    initialContent?: string;
    autoFocus?: boolean;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
    onPosted?: (comment: CommentDTO) => void;
    onCancel?: () => void;
    /** Temps réel : signaler la frappe (avec le nb de mots). */
    onTypingStart?: (wordCount: number) => void;
    /** Temps réel : signaler l'arrêt de la frappe. */
    onTypingStop?: () => void;
}

export default function CommentForm({
    revisionId,
    parentId,
    kind = "avis",
    onKindChange,
    initialContent = "",
    autoFocus,
    textareaRef,
    onPosted,
    onCancel,
    onTypingStart,
    onTypingStop,
}: CommentFormProps) {
    const { data: session } = useSession();
    const draft = useCommentDraft(initialContent);
    const { content, setContent, trimmed, tooLong, tooShort, valid } = draft;
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const ref = textareaRef ?? innerRef;

    useEffect(() => {
        if (!autoFocus) return;
        const el = ref.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
    }, [autoFocus, ref]);

    // Temps réel : émettre la frappe + le nombre de mots (auto-stop après 2,5 s)
    useEffect(() => {
        if (!onTypingStart || content.trim().length === 0) return;
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        onTypingStart(wordCount);
        const t = setTimeout(() => onTypingStop?.(), 2500);
        return () => clearTimeout(t);
    }, [content, onTypingStart, onTypingStop]);

    // Stopper la frappe au démontage
    useEffect(() => {
        return () => {
            onTypingStop?.();
        };
    }, [onTypingStop]);

    const canSubmit = valid && !loading;
    const isReply = !!parentId;
    const kindOption = COMMENT_KIND_OPTIONS.find((k) => k.value === kind) ?? COMMENT_KIND_OPTIONS[0];

    const submit = async () => {
        if (!canSubmit) return;
        setError(null);
        setLoading(true);

        try {
            const token = (session as any)?.accessToken || "";
            const response = await fetch("/api/comment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ revisionId, content: trimmed, parentId, kind: isReply ? undefined : kind }),
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 429) {
                throw new Error("Doucement ! Attends quelques secondes avant de reposter.");
            }
            if (!response.ok) {
                throw new Error(data.error || data.message || "Erreur lors de l'ajout du commentaire.");
            }

            onPosted?.(data.comment as CommentDTO);
            setContent("");
            onKindChange?.("avis");
            onTypingStop?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                void submit();
            }}
            className="space-y-2.5"
        >
            {onKindChange && (
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Type de commentaire">
                    {COMMENT_KIND_OPTIONS.map((k) => {
                        const active = k.value === kind;
                        return (
                            <button
                                key={k.value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => onKindChange(k.value)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                                    active
                                        ? "border-[var(--wk-ink)] bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                                        : "border-[rgba(26,21,18,0.12)] bg-white text-[rgba(26,21,18,0.7)] hover:border-[rgba(26,21,18,0.3)]"
                                }`}
                            >
                                <span aria-hidden>{k.emoji}</span> {k.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <AutoTextarea
                textareaRef={ref}
                value={content}
                onChange={setContent}
                onSubmitShortcut={() => void submit()}
                placeholder={isReply ? "Écris ta réponse…" : kindOption.hint}
                aria-label={isReply ? "Ta réponse" : "Ton commentaire"}
                className={isReply ? "!py-2.5" : ""}
            />

            <div className="flex items-center justify-between gap-3">
                <DraftStatus length={content.length} tooLong={tooLong} tooShort={tooShort} error={error} />
                <div className="flex shrink-0 items-center gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-full px-3 py-1.5 text-sm text-[rgba(26,21,18,0.6)] hover:bg-[rgba(26,21,18,0.05)]"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="wk-btn-ink !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        {isReply ? "Répondre" : "Publier"}
                    </button>
                </div>
            </div>
        </form>
    );
}
