"use client";

import { useEffect, useRef, useState } from "react";
import { Tldraw, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import { Loader2, X } from "lucide-react";
import { uploadToR2 } from "./uploadToR2";

interface DrawModalProps {
    open: boolean;
    initialSnapshotUrl?: string | null;
    onClose: () => void;
    onSave: (pngUrl: string, snapshotUrl: string) => void;
    insertLabel?: string;
}

export default function DrawModal({ open, initialSnapshotUrl, onClose, onSave, insertLabel = "Insérer le dessin" }: DrawModalProps) {
    const editorRef = useRef<Editor | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadedSnapshot, setLoadedSnapshot] = useState<any>(null);

    useEffect(() => {
        if (!open) {
            setError(null);
            setBusy(false);
            return;
        }
        if (!initialSnapshotUrl) {
            setLoadedSnapshot(null);
            return;
        }
        let cancelled = false;
        fetch(initialSnapshotUrl)
            .then((r) => r.json())
            .then((snap) => {
                if (!cancelled) setLoadedSnapshot(snap);
            })
            .catch(() => {
                if (!cancelled) setLoadedSnapshot(null);
            });
        return () => {
            cancelled = true;
        };
    }, [open, initialSnapshotUrl]);

    const handleSave = async () => {
        const editor = editorRef.current;
        if (!editor) return;
        setBusy(true);
        setError(null);
        try {
            const shapeIds = Array.from(editor.getCurrentPageShapeIds());
            if (shapeIds.length === 0) {
                setError("Dessine quelque chose avant d'enregistrer.");
                setBusy(false);
                return;
            }
            const { blob: pngBlob } = await editor.toImage(shapeIds, {
                format: "png",
                background: true,
                padding: 16,
                scale: 2,
            });
            const snapshot = editor.store.getStoreSnapshot();
            const snapBlob = new Blob([JSON.stringify(snapshot)], { type: "application/json" });

            const [{ publicUrl: pngUrl }, { publicUrl: snapUrl }] = await Promise.all([
                uploadToR2(pngBlob, "draw", `draw-${Date.now()}.png`),
                uploadToR2(snapBlob, "draw", `draw-${Date.now()}.json`),
            ]);
            onSave(pngUrl, snapUrl);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Erreur d'enregistrement");
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-x-0 bottom-0 top-[88px] sm:top-[96px] z-40 bg-black/40 flex items-stretch justify-center p-2 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !busy) onClose();
            }}
        >
            <div className="flex flex-col w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between bg-white px-4 py-2 border-b">
                    <h2 className="font-semibold">Tableau blanc</h2>
                    <div className="flex items-center gap-2">
                        {error && <span className="text-sm text-red-600">{error}</span>}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={busy}
                            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                        >
                            {busy && <Loader2 size={14} className="animate-spin" />}
                            {busy ? "Envoi…" : insertLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100"
                            aria-label="Fermer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 relative tldraw__editor">
                    <Tldraw
                        licenseKey={process.env.NEXT_PUBLIC_TLDRAW_KEY}
                        onMount={(editor) => {
                            editorRef.current = editor;
                            if (loadedSnapshot) {
                                try {
                                    editor.store.loadStoreSnapshot(loadedSnapshot);
                                } catch (e) {
                                    console.warn("Impossible de charger le snapshot tldraw", e);
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
