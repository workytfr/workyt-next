"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

const CONFIRM_WORD = "SUPPRIMER";

/** Ouvre la fenêtre de connexion du site (écoutée par la Navbar) : on reste sur cette page */
const openAuth = () => window.dispatchEvent(new Event("workyt:open-auth"));

/**
 * Encart d'action de la page « Supprimer mon compte » :
 * - déconnecté : invitation à se connecter, puis retour ici ;
 * - connecté : saisie de SUPPRIMER, appel de DELETE /api/user/me, déconnexion ;
 * - terminé : confirmation (la session est déjà fermée).
 */
export default function DeleteAccountPanel() {
    const { data: session, status } = useSession();
    const [typed, setTyped] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const card = "rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 sm:p-7 shadow-[0_16px_40px_rgba(26,21,18,0.07)]";

    if (done) {
        return (
            <div className={card} role="status">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <h2 className="mt-3 text-xl font-bold text-gray-900">Ton compte a été supprimé</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Tes données personnelles ont été effacées et tu as été déconnecté.
                    Merci d&apos;avoir fait partie de Workyt.
                </p>
            </div>
        );
    }

    // Visiteur non connecté, ou session pas encore chargée (et rendu serveur) :
    // la démarche publique s'affiche toujours, jamais un écran vide
    if (status === "loading" || !session?.user) {
        return (
            <div className={card}>
                <h2 className="text-xl font-bold text-gray-900">Connecte-toi pour continuer</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Pour vérifier que le compte est bien le tien, connecte-toi d&apos;abord.
                    Tu reviendras ensuite sur cette page pour confirmer la suppression.
                </p>
                <button type="button" onClick={openAuth} disabled={status === "loading"} className="wk-btn-ink mt-5 !py-2.5 text-sm disabled:opacity-60">
                    Se connecter pour supprimer mon compte
                </button>
            </div>
        );
    }

    const confirmed = typed.trim() === CONFIRM_WORD;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmed || busy) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/user/me", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirm: CONFIRM_WORD }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
                setError(data?.error || "La suppression n'a pas pu aboutir. Réessaie dans un instant.");
                setBusy(false);
                return;
            }
            // Le compte n'existe plus : on ferme la session sans quitter la page
            await signOut({ redirect: false });
            setDone(true);
        } catch {
            setError("Connexion impossible. Vérifie ta connexion internet et réessaie.");
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className={`${card} border-red-200`}>
            <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Supprimer le compte {session.user.username ? `« ${session.user.username} »` : ""}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Cette action est immédiate et irréversible. Tes points, gemmes,
                        badges, amis et ta progression seront perdus.
                    </p>
                </div>
            </div>

            <label className="mt-5 block text-sm font-semibold text-gray-700">
                Pour confirmer, tape <span className="font-mono text-red-700">{CONFIRM_WORD}</span>
                <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    disabled={busy}
                    className="mt-1 w-full rounded-xl border border-[rgba(26,21,18,0.15)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red-500"
                />
            </label>

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

            <button
                type="submit"
                disabled={!confirmed || busy}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Supprimer définitivement mon compte
            </button>
        </form>
    );
}
