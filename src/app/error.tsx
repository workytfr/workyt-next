"use client"; // Les error boundaries sont des composants client

import { useEffect } from "react";
import Link from "next/link";
import Foxy from "@/components/foxy/Foxy";

/**
 * Morceau de JS introuvable : l'onglet a été ouvert avant un déploiement et
 * réclame des fichiers que le nouveau build n'a plus (fréquent sur téléphone,
 * où l'onglet reste des jours en arrière-plan). Seul un rechargement complet
 * répare : `retry()` redemanderait le même fichier disparu.
 */
function isStaleBuildError(error: Error) {
    const text = `${error?.name ?? ""} ${error?.message ?? ""}`;
    return /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(text);
}

const RELOAD_KEY = "wk-stale-build-reload";

/** Erreur inattendue dans une page : Foxy s'excuse et propose de réessayer. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    useEffect(() => {
        console.error(error);
        if (!isStaleBuildError(error)) return;
        // Un seul rechargement par minute : si le fichier manque vraiment, on
        // affiche la page d'erreur au lieu de boucler.
        try {
            const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
            if (Date.now() - last < 60_000) return;
            sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        } catch {
            // Stockage bloqué (navigation privée) : on recharge quand même une fois.
        }
        window.location.reload();
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
            <Foxy pose="oups" size={170} eager />
            <h1 className="font-serif-display mt-4 text-3xl text-[var(--wk-ink)] sm:text-4xl">Oups, quelque chose a coincé</h1>
            <p className="mt-3 max-w-md text-[rgba(26,21,18,0.6)]">
                La page n&apos;a pas pu s&apos;afficher. Réessaie : ça passe souvent du premier coup.
            </p>
            {error.digest && (
                <p className="font-mono-ui mt-2 text-[11px] text-[rgba(26,21,18,0.4)]">Code : {error.digest}</p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => retry()} className="wk-btn-orange !py-2.5 text-sm">
                    Réessayer
                </button>
                <Link
                    href="/"
                    className="rounded-full border border-[rgba(26,21,18,0.14)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--wk-ink)] transition-colors hover:border-[var(--wk-accent)] hover:text-[var(--wk-accent)]"
                >
                    Accueil
                </Link>
            </div>
        </div>
    );
}
