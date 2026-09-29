"use client";

/**
 * Charge MathLive (l'élément <math-field>) à la demande, une seule fois.
 * Partagé par l'éditeur de fiches et le clavier de formules du suivi.
 */

let mathliveLoaded = false;
let mathliveLoading: Promise<void> | null = null;

export function isMathliveLoaded() {
    return mathliveLoaded;
}

export async function ensureMathlive(): Promise<void> {
    if (typeof window === "undefined") return;
    if (mathliveLoaded) return;
    // Si déjà enregistré (par un HMR précédent), on saute l'import qui throw
    if (typeof customElements !== "undefined" && customElements.get("math-field")) {
        mathliveLoaded = true;
        return;
    }
    if (mathliveLoading) return mathliveLoading;
    mathliveLoading = (async () => {
        try {
            await import("mathlive");
        } catch (e) {
            // Erreur "already defined" possible en HMR : on l'ignore silencieusement
            if (!(e instanceof Error) || !/already.*defined|registered/i.test(e.message)) {
                console.warn("MathLive import warning:", e);
            }
        } finally {
            mathliveLoaded = true;
            mathliveLoading = null;
        }
    })();
    return mathliveLoading;
}
