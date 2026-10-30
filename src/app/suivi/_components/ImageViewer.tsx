"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Visionneuse d'une photo du suivi, en plein écran : ajustée à l'écran au
 * départ, zoom par clic, molette (Ctrl) ou boutons, et défilement libre une
 * fois zoomée pour lire un énoncé ou une copie dans le détail.
 */
export default function ImageViewer({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
    const [zoom, setZoom] = useState(1); // 1 = ajustée à l'écran
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(5, z * 1.25));
            if (e.key === "-") setZoom((z) => Math.max(1, z / 1.25));
        };
        window.addEventListener("keydown", onKey);
        // Pas de défilement de la page derrière la visionneuse
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return; // molette seule : on défile
            e.preventDefault();
            setZoom((z) => Math.min(5, Math.max(1, z * Math.exp(-e.deltaY * 0.01))));
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    const zoomed = zoom > 1.01;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#111]" role="dialog" aria-modal="true" aria-label={`Photo : ${name}`}>
            <div className="flex items-center justify-between gap-3 px-4 py-2 text-white">
                <span className="min-w-0 truncate text-sm">{name}</span>
                <div className="flex shrink-0 items-center gap-1">
                    <ViewerButton label="Dézoomer" onClick={() => setZoom((z) => Math.max(1, z / 1.25))} icon={ZoomOut} />
                    <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)} %</span>
                    <ViewerButton label="Zoomer" onClick={() => setZoom((z) => Math.min(5, z * 1.25))} icon={ZoomIn} />
                    <a
                        href={src.includes("?") ? `${src}&download=1` : `${src}?download=1`}
                        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"
                        aria-label="Télécharger"
                        title="Télécharger"
                    >
                        <Download className="h-4 w-4" />
                    </a>
                    <ViewerButton label="Fermer (Échap)" onClick={onClose} icon={X} />
                </div>
            </div>
            <div
                ref={boxRef}
                className={`min-h-0 flex-1 overflow-auto ${zoomed ? "cursor-zoom-out" : "flex cursor-zoom-in items-center justify-center"}`}
                onClick={(e) => {
                    if (e.target === e.currentTarget && !zoomed) onClose();
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={name}
                    onClick={() => setZoom((z) => (z > 1.01 ? 1 : 2.5))}
                    className={zoomed ? "mx-auto block max-w-none" : "max-h-full max-w-full object-contain"}
                    style={zoomed ? { width: `${zoom * 100}%` } : undefined}
                    draggable={false}
                />
            </div>
            <p className="py-1.5 text-center text-[11px] text-white/60">Clic : zoomer · Ctrl + molette : ajuster le zoom · Échap : fermer</p>
        </div>
    );
}

function ViewerButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: React.ElementType }) {
    return (
        <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15">
            <Icon className="h-4 w-4" />
        </button>
    );
}
