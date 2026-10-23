"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { MessageCirclePlus } from "lucide-react";
import { captureAnchor, type PassageAnchor } from "./passageAnchor";

/**
 * Bulle « Poser une question sur ce passage » qui suit la sélection de texte
 * dans la leçon. Réservée aux inscrits : un visiteur se voit proposer la
 * connexion.
 */
export default function SelectionBubble({
    rootRef,
    onAsk,
}: {
    rootRef: React.RefObject<HTMLElement | null>;
    onAsk: (anchor: PassageAnchor) => void;
}) {
    const { data: session } = useSession();
    const [state, setState] = useState<{ anchor: PassageAnchor; top: number; left: number } | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const read = () => {
            const root = rootRef.current;
            const selection = window.getSelection();
            if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) {
                setState(null);
                return;
            }
            const range = selection.getRangeAt(0);
            const anchor = captureAnchor(range, root, selection.toString());
            if (!anchor) {
                setState(null);
                return;
            }
            const rect = range.getBoundingClientRect();
            // Au doigt, le menu natif occupe le dessus de la sélection : on se place dessous
            const touch = window.matchMedia("(pointer: coarse)").matches;
            setState({
                anchor,
                top: (touch ? rect.bottom + 12 : rect.top - 52) + window.scrollY,
                left: Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120) + window.scrollX,
            });
        };
        const onChange = () => {
            clearTimeout(timer.current);
            timer.current = setTimeout(read, 180);
        };
        document.addEventListener("selectionchange", onChange);
        return () => {
            clearTimeout(timer.current);
            document.removeEventListener("selectionchange", onChange);
        };
    }, [rootRef]);

    if (!state) return null;

    const ask = () => {
        if (!session?.user) {
            // Ouvre la fenêtre de connexion de la barre de navigation
            window.dispatchEvent(new Event("workyt:open-auth"));
            return;
        }
        onAsk(state.anchor);
        window.getSelection()?.removeAllRanges();
        setState(null);
    };

    return createPortal(
        <button
            type="button"
            // Garde la sélection active au clic
            onMouseDown={(e) => e.preventDefault()}
            onClick={ask}
            style={{ top: state.top, left: state.left }}
            className="absolute z-[120] inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--wk-ink)] px-4 py-2.5 text-sm font-semibold text-[var(--wk-paper)] shadow-[0_10px_30px_rgba(26,21,18,0.3)] transition hover:bg-black print:hidden"
        >
            <MessageCirclePlus className="h-4 w-4 text-[var(--wk-accent-2)]" />
            {session?.user ? "Poser une question sur ce passage" : "Connecte-toi pour poser une question"}
        </button>,
        document.body
    );
}
