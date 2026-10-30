"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Download, Loader2 } from "lucide-react";
import Whiteboard, { type WhiteboardHandle } from "@/components/whiteboard/Whiteboard";
import { isBoardDoc, type BoardDoc } from "@/components/whiteboard/types";

const STORAGE_KEY = "workyt:tableau-blanc";
const noopSubscribe = () => () => {};

function readStored(): BoardDoc | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return isBoardDoc(parsed) ? parsed : null;
    } catch {
        // stockage indisponible : on démarre vide
        return null;
    }
}

/**
 * Tableau blanc en accès libre : le dessin est gardé dans le navigateur
 * (localStorage) pour ne rien perdre en rechargeant la page, et se télécharge
 * en PNG.
 */
export default function BoardKit() {
    const boardRef = useRef<WhiteboardHandle>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Le tableau ne s'affiche que côté navigateur : son contenu vient du localStorage
    const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
    const initial = useMemo(() => (isClient ? readStored() : undefined), [isClient]);
    const [exporting, setExporting] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    const save = (doc: BoardDoc) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
            } catch {
                setNotice("Tableau trop lourd pour être gardé dans le navigateur : pense à le télécharger.");
            }
        }, 400);
    };

    const download = async () => {
        setExporting(true);
        setNotice(null);
        try {
            const png = await boardRef.current?.exportPng();
            if (!png) {
                setNotice("Le tableau est vide.");
                return;
            }
            const url = URL.createObjectURL(png);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tableau-workyt-${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex h-[calc(100dvh-88px)] min-h-[520px] flex-col sm:h-[calc(100dvh-96px)]">
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(26,21,18,0.08)] bg-white px-4 py-2">
                <h1 className="font-serif-display text-xl">
                    Tableau blanc<span className="text-[var(--wk-accent)]">.</span>
                </h1>
                <div className="flex items-center gap-3">
                    {notice && <span className="text-xs text-[rgba(26,21,18,0.6)]">{notice}</span>}
                    <span className="hidden text-xs text-[rgba(26,21,18,0.5)] md:inline">Gardé automatiquement sur cet appareil</span>
                    <button
                        type="button"
                        onClick={download}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--wk-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Télécharger (PNG)
                    </button>
                </div>
            </div>
            <div className="min-h-0 flex-1">
                {initial !== undefined && <Whiteboard ref={boardRef} initialDoc={initial} onChange={save} />}
            </div>
        </div>
    );
}
