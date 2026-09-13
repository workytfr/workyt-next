"use client";

import React, { useCallback, useRef } from "react";

/** Coordonnées normalisées en % de la largeur / hauteur de l'image. */
export interface PercentPoint {
    x: number;
    y: number;
}

interface ImageCanvasProps {
    src: string;
    alt?: string;
    /** Clic simple — pour poser un marqueur. */
    onPoint?: (point: PercentPoint) => void;
    /** Tracé par glissement — pour délimiter une zone. */
    onDragStart?: (point: PercentPoint) => void;
    onDragMove?: (point: PercentPoint) => void;
    onDragEnd?: () => void;
    /** Calques dessinés par-dessus l'image (marqueur, rectangle...). */
    children?: React.ReactNode;
    className?: string;
}

/**
 * Support commun aux questions posées sur une image.
 *
 * Convertit les événements pointeur en coordonnées **en pourcentage**, jamais
 * en pixels : la réponse de l'élève reste alors valable quelle que soit la
 * taille d'affichage, du mobile au grand écran, et peut être comparée à une
 * cible enregistrée une seule fois par l'auteur.
 *
 * `touch-action: none` est indispensable : sans lui, un tracé au doigt sur
 * mobile fait défiler la page au lieu de dessiner.
 */
export default function ImageCanvas({
    src,
    alt = "",
    onPoint,
    onDragStart,
    onDragMove,
    onDragEnd,
    children,
    className = "",
}: ImageCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);

    const toPercent = useCallback((event: React.PointerEvent): PercentPoint | null => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return null;

        const clamp = (value: number) => Math.min(100, Math.max(0, value));
        return {
            x: clamp(((event.clientX - rect.left) / rect.width) * 100),
            y: clamp(((event.clientY - rect.top) / rect.height) * 100),
        };
    }, []);

    const handlePointerDown = (event: React.PointerEvent) => {
        const point = toPercent(event);
        if (!point) return;

        if (onDragStart) {
            draggingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            onDragStart(point);
            return;
        }

        onPoint?.(point);
    };

    const handlePointerMove = (event: React.PointerEvent) => {
        if (!draggingRef.current || !onDragMove) return;
        const point = toPercent(event);
        if (point) onDragMove(point);
    };

    const handlePointerUp = (event: React.PointerEvent) => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onDragEnd?.();
    };

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: "none" }}
            className={`relative select-none overflow-hidden rounded-xl border-2 border-[#e3e2e0] bg-[#fafaf9] cursor-crosshair ${className}`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} draggable={false} className="block w-full h-auto" />
            {children}
        </div>
    );
}
