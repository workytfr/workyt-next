"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import Whiteboard, { type WhiteboardHandle } from "@/components/whiteboard/Whiteboard";
import { isBoardDoc, type BoardDoc } from "@/components/whiteboard/types";
import { uploadToR2 } from "./uploadToR2";
import { useBackdropDismiss } from "@/hooks/useBackdropDismiss";

interface DrawModalProps {
    open: boolean;
    initialSnapshotUrl?: string | null;
    onClose: () => void;
    onSave: (pngUrl: string, snapshotUrl: string) => void;
    insertLabel?: string;
}

/**
 * Tableau blanc Workyt dans une fenêtre : on dessine, puis on insère l'image
 * (PNG) dans la fiche. Le tableau lui-même est enregistré à côté (JSON) pour
 * pouvoir être rouvert.
 */
export default function DrawModal({ open, initialSnapshotUrl, onClose, onSave, insertLabel = "Insérer le dessin" }: DrawModalProps) {
    const boardRef = useRef<WhiteboardHandle>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Tableau à rouvrir, chargé depuis son URL
    const [loaded, setLoaded] = useState<{ url: string; doc: BoardDoc | null } | null>(null);
    const ready = !initialSnapshotUrl || loaded?.url === initialSnapshotUrl;
    const initialDoc = initialSnapshotUrl && loaded?.url === initialSnapshotUrl ? loaded.doc : null;

    useEffect(() => {
        if (!open || !initialSnapshotUrl || loaded?.url === initialSnapshotUrl) return;
        let cancelled = false;
        fetch(initialSnapshotUrl)
            .then((r) => r.json())
            // Les anciens dessins (tldraw) ne se rouvrent pas : on repart d'un tableau vide
            .then((snap) => !cancelled && setLoaded({ url: initialSnapshotUrl, doc: isBoardDoc(snap) ? snap : null }))
            .catch(() => !cancelled && setLoaded({ url: initialSnapshotUrl, doc: null }));
        return () => {
            cancelled = true;
        };
    }, [open, initialSnapshotUrl, loaded]);

    const close = () => {
        if (busy) return;
        if (boardRef.current && !boardRef.current.isEmpty() && !window.confirm("Fermer sans insérer le dessin ? Il sera perdu.")) return;
        setError(null);
        onClose();
    };

    const handleSave = async () => {
        const board = boardRef.current;
        if (!board) return;
        setBusy(true);
        setError(null);
        try {
            const png = await board.exportPng();
            if (!png) {
                setError("Dessine quelque chose avant d'enregistrer.");
                return;
            }
            const snapBlob = new Blob([JSON.stringify(board.getDoc())], { type: "application/json" });
            const stamp = Date.now();
            const [{ publicUrl: pngUrl }, { publicUrl: snapUrl }] = await Promise.all([
                uploadToR2(png, "draw", `draw-${stamp}.png`),
                uploadToR2(snapBlob, "draw", `draw-${stamp}.json`),
            ]);
            onSave(pngUrl, snapUrl);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Erreur d'enregistrement");
        } finally {
            setBusy(false);
        }
    };

    const backdrop = useBackdropDismiss(close, busy);

    if (!open) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 top-[88px] z-40 flex items-stretch justify-center bg-black/40 p-2 sm:top-[96px] sm:p-4" {...backdrop}>
            <div className="flex w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b bg-white px-4 py-2">
                    <h2 className="font-semibold">
                        Tableau blanc<span className="text-[var(--wk-accent,#ff6a1a)]">.</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        {error && <span className="text-sm text-red-600">{error}</span>}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={busy || !ready}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1a1512] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {busy && <Loader2 size={14} className="animate-spin" />}
                            {busy ? "Envoi…" : insertLabel}
                        </button>
                        <button type="button" onClick={close} disabled={busy} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100" aria-label="Fermer">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="min-h-0 flex-1">
                    {ready ? (
                        <Whiteboard ref={boardRef} initialDoc={initialDoc} />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement du dessin…
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
