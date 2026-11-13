"use client"; // Les error boundaries sont des composants client

import { useEffect } from "react";
import Link from "next/link";
import Foxy from "@/components/foxy/Foxy";

/** Erreur inattendue dans une page : Foxy s'excuse et propose de réessayer. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    useEffect(() => {
        console.error(error);
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
