"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BookOpen, Dumbbell, ImagePlus, Loader2, Quote, X } from "lucide-react";
import { useBackdropDismiss } from "@/hooks/useBackdropDismiss";
import type { PassageAnchor } from "./passageAnchor";

/** Prix d'une question posée depuis un cours (voir /api/forum/questions/contextual) */
export const QUESTION_COST = 3;
const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;
const MAX_IMAGES = 3;

export interface CreatedQuestion {
    _id: string;
    title: string;
    slug?: string;
    anchor?: PassageAnchor;
    description: { whatINeed: string };
    createdAt: string;
    status: string;
}

interface AskQuestionModalProps {
    open: boolean;
    onClose: () => void;
    contextType: "lesson" | "exercise";
    contextId: string;
    contextTitle: string;
    /** Passage sélectionné dans la leçon */
    anchor?: PassageAnchor | null;
    onCreated?: (question: CreatedQuestion) => void;
}

/**
 * Poser une question sur une leçon, un passage de leçon ou un exercice.
 * Un seul champ ; la question est publiée sur le forum et coûte 3 points,
 * reversés à la réponse validée.
 */
export default function AskQuestionModal({ open, onClose, contextType, contextId, contextTitle, anchor, onCreated }: AskQuestionModalProps) {
    const { data: session, update } = useSession();
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const backdrop = useBackdropDismiss(onClose, loading);

    const userPoints: number = (session?.user as any)?.points ?? 0;
    const enoughPoints = userPoints >= QUESTION_COST;
    const length = text.trim().length;

    // Ouverture : focus et défilement de la page bloqué.
    // La fenêtre est montée à la demande : son état part toujours de zéro.
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => textareaRef.current?.focus(), 80);
        document.body.style.overflow = "hidden";
        return () => {
            clearTimeout(t);
            document.body.style.overflow = "";
        };
    }, [open]);

    // Échap pour fermer (sauf pendant l'envoi)
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, loading, onClose]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (length < MIN_LENGTH) {
            setError(`Détaille un peu plus ta question (${MIN_LENGTH} caractères minimum).`);
            return;
        }
        setError("");
        setLoading(true);
        try {
            const form = new FormData();
            form.append("question", text.trim());
            form.append("contextType", contextType);
            form.append("contextId", contextId);
            if (anchor) form.append("anchor", JSON.stringify(anchor));
            files.forEach((f) => form.append("files", f));

            const res = await fetch("/api/forum/questions/contextual", {
                method: "POST",
                headers: { Authorization: `Bearer ${(session as any)?.accessToken || ""}` },
                body: form,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "La question n'a pas pu être publiée.");
                return;
            }
            // Solde de points à jour dans la session
            update?.().catch(() => {});
            onCreated?.(data);
            onClose();
        } catch {
            setError("Erreur réseau. Réessaie dans un instant.");
        } finally {
            setLoading(false);
        }
    };

    // Rendue seulement après une action de l'élève, donc toujours côté client
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(26,21,18,0.45)] p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
                    {...backdrop}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ask-question-title"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] text-[var(--wk-ink)] shadow-[0_24px_60px_rgba(26,21,18,0.25)] sm:max-w-xl sm:rounded-[28px]"
                    >
                        <form onSubmit={submit} className="p-5 sm:p-7">
                            {/* En-tête */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-[var(--wk-accent)]">Poser une question</p>
                                    <h2 id="ask-question-title" className="font-serif-display mt-1 text-3xl leading-tight">
                                        Qu&apos;est-ce qui te bloque&nbsp;?
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    aria-label="Fermer"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(26,21,18,0.1)] bg-white transition hover:bg-[var(--wk-paper-2)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <span className="wk-chip mt-4 max-w-full">
                                {contextType === "lesson" ? <BookOpen className="h-3.5 w-3.5 shrink-0 text-[var(--wk-accent)]" /> : <Dumbbell className="h-3.5 w-3.5 shrink-0 text-[var(--wk-accent)]" />}
                                <span className="truncate">{contextType === "lesson" ? "Leçon" : "Exercice"} · {contextTitle}</span>
                            </span>

                            {/* Passage cité */}
                            {anchor && (
                                <figure className="mt-4 rounded-2xl border-l-4 border-[var(--wk-accent)] bg-white px-4 py-3">
                                    <figcaption className="font-mono-ui mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                                        <Quote className="h-3 w-3" /> Le passage
                                    </figcaption>
                                    <blockquote className="line-clamp-4 text-sm italic leading-relaxed text-[rgba(26,21,18,0.8)]">
                                        « {anchor.exact} »
                                    </blockquote>
                                </figure>
                            )}

                            {/* Question */}
                            <label htmlFor="ask-question-text" className="sr-only">Ta question</label>
                            <textarea
                                id="ask-question-text"
                                ref={textareaRef}
                                value={text}
                                onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                                rows={5}
                                placeholder={anchor ? "Qu'est-ce que tu ne comprends pas dans ce passage ?" : "Explique ce que tu ne comprends pas, et ce que tu as déjà essayé."}
                                className="mt-4 w-full resize-none rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white px-4 py-3 text-[15px] leading-relaxed outline-none transition placeholder:text-[rgba(26,21,18,0.4)] focus:border-[var(--wk-accent)] focus:ring-4 focus:ring-[rgba(255,106,26,0.15)]"
                            />
                            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-[rgba(26,21,18,0.5)]">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={files.length >= MAX_IMAGES}
                                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold transition hover:bg-[var(--wk-paper-2)] hover:text-[var(--wk-ink)] disabled:opacity-40"
                                >
                                    <ImagePlus className="h-3.5 w-3.5" /> Ajouter une photo
                                </button>
                                <span className="tabular-nums">{length}/{MAX_LENGTH}</span>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const picked = Array.from(e.target.files || []);
                                    setFiles((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
                                    e.target.value = "";
                                }}
                            />
                            {files.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {files.map((f, i) => (
                                        <span key={i} className="wk-chip max-w-[220px]">
                                            <span className="truncate">{f.name}</span>
                                            <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label={`Retirer ${f.name}`}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {error && (
                                <p className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                                </p>
                            )}

                            {/* Coût + envoi */}
                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-dashed border-[rgba(26,21,18,0.14)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs leading-snug text-[rgba(26,21,18,0.6)]">
                                    <span className="font-semibold text-[var(--wk-ink)]">{QUESTION_COST} points</span> · tu en as {userPoints}.
                                    <br />
                                    {enoughPoints
                                        ? "Ils iront à la personne dont la réponse sera validée."
                                        : "Réponds à des questions du forum pour en gagner."}
                                </p>
                                <button
                                    type="submit"
                                    disabled={loading || !enoughPoints || length < MIN_LENGTH}
                                    className="wk-btn-orange !justify-center !py-3 text-sm disabled:pointer-events-none disabled:opacity-50"
                                >
                                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Publication…</> : "Publier ma question"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
