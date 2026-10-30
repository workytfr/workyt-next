"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import Whiteboard, { type WhiteboardHandle } from "@/components/whiteboard/Whiteboard";
import type { BoardDoc } from "@/components/whiteboard/types";
import { checkForContactDetails } from "@/lib/mentorship/contactFilter";

// Même règle que les messages : pas de coordonnées, même écrites au tableau
const validateText = (text: string) => {
    const c = checkForContactDetails(text);
    return c.blocked ? `Pas de coordonnées au tableau (${c.reasons.join(", ")}) : les échanges restent sur Workyt.` : null;
};

/**
 * Tableau blanc du suivi, en plein écran : on dessine (schéma, courbe,
 * formule, photo annotée…) puis « Joindre au message » en fait une image
 * jointe à la conversation. Le dessin est gardé tant que le message n'est pas
 * envoyé, pour pouvoir le reprendre.
 */
export default function BoardComposerModal({
    initialDoc,
    onClose,
    onAttach,
}: {
    initialDoc: BoardDoc | null;
    onClose: (doc: BoardDoc | null) => void;
    onAttach: (file: File, doc: BoardDoc) => void;
}) {
    const boardRef = useRef<WhiteboardHandle>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const close = () => {
        if (!busy) onClose(boardRef.current?.isEmpty() ? null : (boardRef.current?.getDoc() ?? null));
    };

    useEffect(() => {
        // Pas de défilement de la page derrière le tableau
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const attach = async () => {
        const board = boardRef.current;
        if (!board) return;
        setBusy(true);
        setError(null);
        try {
            const png = await board.exportPng();
            if (!png) {
                setError("Dessine quelque chose avant de joindre le tableau.");
                return;
            }
            const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
            onAttach(new File([png], `tableau-${stamp}.png`, { type: "image/png" }), board.getDoc());
        } catch {
            setError("Le tableau n'a pas pu être converti en image.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Tableau blanc">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(26,21,18,0.08)] px-4 py-2">
                <div className="min-w-0">
                    <p className="font-semibold">
                        Tableau blanc<span className="text-[var(--wk-accent)]">.</span>
                    </p>
                    <p className="truncate text-xs text-[rgba(26,21,18,0.55)]">Dessine, puis joins le tableau à ton message : il part comme une image.</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {error && <span className="hidden text-sm text-red-600 sm:inline">{error}</span>}
                    <button
                        type="button"
                        onClick={attach}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--wk-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_#c24a0a] disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                        Joindre au message
                    </button>
                    <button type="button" onClick={close} disabled={busy} aria-label="Fermer" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--wk-paper-2)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
            {error && <p className="bg-red-50 px-4 py-1.5 text-xs text-red-700 sm:hidden">{error}</p>}
            <div className="min-h-0 flex-1">
                <Whiteboard ref={boardRef} initialDoc={initialDoc} validateText={validateText} />
            </div>
        </div>
    );
}
