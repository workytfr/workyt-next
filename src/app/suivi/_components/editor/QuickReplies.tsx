"use client";

import React, { useState } from "react";
import { MessageSquareText, Plus, Trash2, Settings2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MAX_QUICK_REPLIES, MAX_QUICK_REPLY_LENGTH } from "@/lib/mentorship/config";
import { api, ApiError } from "../../_lib/client";
import { previewText } from "@/lib/mentorship/plainText";
import { toolbarButton } from "./FormatToolbar";

/** Proposées tant que le bénévole n'a enregistré aucune réponse type */
const SUGGESTIONS = [
    "Bonjour ! Comment s'est passée ta semaine ?",
    "Tu peux m'envoyer une photo de ton brouillon ? Je regarde où ça coince.",
    "Essaie d'abord seul, puis dis-moi à quelle étape tu bloques.",
    "Bravo, c'est exactement ça ! Tu veux essayer un exercice un peu plus difficile ?",
];

// Une seule lecture par page : la liste est commune à tous les suivis du bénévole
let cache: string[] | null = null;

/**
 * Réponses types du bénévole : ses phrases fréquentes, insérées en un clic
 * dans la saisie (il peut encore les modifier avant d'envoyer).
 */
export default function QuickReplies({ current, onInsert }: { current: string; onInsert: (text: string) => void }) {
    const [replies, setReplies] = useState<string[] | null>(cache);
    const [manage, setManage] = useState(false);
    const [draft, setDraft] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        if (replies) return;
        try {
            cache = await api<string[]>("/api/suivi/mentor/quick-replies");
            setReplies(cache);
        } catch {
            setReplies([]);
        }
    };

    const save = async (next: string[]) => {
        setBusy(true);
        setError(null);
        try {
            cache = await api<string[]>("/api/suivi/mentor/quick-replies", { method: "PUT", json: { replies: next } });
            setReplies(cache);
            return true;
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Enregistrement impossible.");
            return false;
        } finally {
            setBusy(false);
        }
    };

    const list = replies || [];
    const clean = current.trim();
    const canSaveCurrent = !!clean && clean.length <= MAX_QUICK_REPLY_LENGTH && !list.includes(clean) && list.length < MAX_QUICK_REPLIES;

    return (
        <>
            <DropdownMenu onOpenChange={(open) => open && load()}>
                <DropdownMenuTrigger asChild>
                    <button type="button" className={toolbarButton} title="Réponses types : tes phrases fréquentes, en un clic">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold">Réponses</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-80 rounded-2xl">
                    {replies === null ? (
                        <DropdownMenuLabel className="text-xs font-normal text-[rgba(26,21,18,0.5)]">Chargement…</DropdownMenuLabel>
                    ) : (
                        <>
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.16em] text-[rgba(26,21,18,0.5)]">
                                {list.length ? "Mes réponses types" : "Suggestions"}
                            </DropdownMenuLabel>
                            {(list.length ? list : SUGGESTIONS).map((r) => (
                                <DropdownMenuItem key={r} onClick={() => onInsert(r)} className="text-sm leading-snug">
                                    {previewText(r, 90)}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={!canSaveCurrent || busy} onClick={() => save([...list, clean])}>
                                <Plus className="mr-2 h-4 w-4" /> Enregistrer le message en cours
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setManage(true)}>
                                <Settings2 className="mr-2 h-4 w-4" /> Gérer mes réponses types
                            </DropdownMenuItem>
                            {error && <p className="px-2 py-1 text-xs text-red-600">{error}</p>}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={manage} onOpenChange={setManage}>
                <DialogContent className="max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Mes réponses types</DialogTitle>
                        <DialogDescription>
                            Communes à tous tes suivis. Tu peux y mettre des formules ($x^2$) et du **gras**. {MAX_QUICK_REPLIES} au maximum.
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="max-h-72 space-y-2 overflow-y-auto">
                        {list.length === 0 && <li className="text-sm text-[rgba(26,21,18,0.55)]">Aucune pour l&apos;instant.</li>}
                        {list.map((r) => (
                            <li key={r} className="flex items-start gap-2 rounded-2xl bg-[var(--wk-paper)] px-3 py-2 text-sm">
                                <span className="min-w-0 flex-1 whitespace-pre-line break-words">{r}</span>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => save(list.filter((x) => x !== r))}
                                    className="shrink-0 rounded-full p-1 text-[rgba(26,21,18,0.45)] hover:bg-white hover:text-red-600"
                                    aria-label="Supprimer cette réponse type"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const v = draft.trim();
                            if (!v || list.includes(v)) return;
                            if (await save([...list, v])) setDraft("");
                        }}
                        className="space-y-2"
                    >
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value.slice(0, MAX_QUICK_REPLY_LENGTH))}
                            rows={3}
                            placeholder="Nouvelle réponse type…"
                            className="w-full resize-none rounded-2xl border border-[rgba(26,21,18,0.12)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--wk-accent)]"
                        />
                        {error && <p className="text-xs text-red-600">{error}</p>}
                        <div className="flex justify-end">
                            <button type="submit" disabled={busy || !draft.trim() || list.length >= MAX_QUICK_REPLIES} className="wk-btn-ink !px-4 !py-2 text-sm disabled:opacity-40">
                                Ajouter
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
