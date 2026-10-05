"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";

/** Ferme la session workyt.fr puis renvoie vers l'application */
export default function LogoutScreen({ target }: { target: string }) {
    useEffect(() => {
        void signOut({ redirect: false }).then(() => window.location.assign(target));
    }, [target]);
    return (
        <main className="flex min-h-[60vh] items-center justify-center bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <p className="flex items-center gap-2 text-sm text-[rgba(26,21,18,0.6)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Déconnexion de Workyt…
            </p>
        </main>
    );
}
