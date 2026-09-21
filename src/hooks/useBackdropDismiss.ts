import { useRef } from "react";
import type React from "react";

/**
 * Fermeture d'une modale au clic sur son fond, sans les faux positifs.
 *
 * Un simple `onClick` avec `e.target === e.currentTarget` ferme la modale
 * quand on sélectionne du texte à la souris et qu'on relâche le bouton au-dessus
 * du fond : le navigateur envoie alors le `click` à l'ancêtre commun, c'est-à-dire
 * le fond. On ne ferme donc que si l'appui ET le relâchement ont eu lieu sur le fond.
 *
 * Usage : `<div className="fixed inset-0 …" {...useBackdropDismiss(onClose, busy)}>`
 */
export function useBackdropDismiss(onClose: () => void, disabled = false) {
    const pressedOnBackdrop = useRef(false);

    return {
        onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
            pressedOnBackdrop.current = e.target === e.currentTarget;
        },
        onClick: (e: React.MouseEvent<HTMLElement>) => {
            const startedHere = pressedOnBackdrop.current;
            pressedOnBackdrop.current = false;
            if (!disabled && startedHere && e.target === e.currentTarget) onClose();
        },
    };
}
