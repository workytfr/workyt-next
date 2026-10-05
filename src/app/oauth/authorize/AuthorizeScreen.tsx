"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { Check, Loader2, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";

type Props =
    | { mode: "error"; message: string; query: string }
    | { mode: "login"; clientName: string; query: string }
    | { mode: "consent"; clientName: string; clientHost: string; username: string; scopes: string[]; token: string; query: string };

/**
 * Écran « Se connecter avec Workyt » : connexion (e-mail ou Discord), puis
 * autorisation de l'application. Le mot de passe reste sur workyt.fr :
 * l'application ne le voit jamais.
 */
export default function AuthorizeScreen(props: Props) {
    return (
        <main className="flex min-h-[80vh] items-center justify-center bg-[var(--wk-paper)] px-4 py-16 text-[var(--wk-ink)]">
            <div className="w-full max-w-md">
                <div className="mb-6 flex items-center justify-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--wk-accent)] font-serif-display text-2xl text-white shadow-[0_3px_0_#c24a0a]">w</span>
                    {props.mode !== "error" && (
                        <>
                            <span className="h-px w-8 bg-[rgba(26,21,18,0.2)]" />
                            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white font-serif-display text-lg">B</span>
                        </>
                    )}
                </div>
                <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-7 shadow-[0_16px_40px_rgba(26,21,18,0.07)]">
                    {props.mode === "error" && <ErrorView message={props.message} />}
                    {props.mode === "login" && <LoginView clientName={props.clientName} query={props.query} />}
                    {props.mode === "consent" && <ConsentView {...props} />}
                </div>
                <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[rgba(26,21,18,0.5)]">
                    <LockKeyhole className="h-3.5 w-3.5" /> Ton mot de passe reste sur workyt.fr.
                </p>
            </div>
        </main>
    );
}

function ErrorView({ message }: { message: string }) {
    return (
        <div className="text-center">
            <TriangleAlert className="mx-auto h-8 w-8 text-[var(--wk-accent)]" />
            <h1 className="mt-3 font-serif-display text-2xl">Connexion impossible</h1>
            <p className="mt-2 text-sm text-[rgba(26,21,18,0.65)]">{message}</p>
            <Link href="/" className="wk-btn-ink mt-6 inline-flex !py-2 text-sm">
                Retour à Workyt
            </Link>
        </div>
    );
}

function LoginView({ clientName, query }: { clientName: string; query: string }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const here = `/oauth/authorize?${query}`;
    const login = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await signIn("credentials", { email, password, redirect: false });
        if (r?.ok) window.location.assign(here);
        else {
            setBusy(false);
            setError("E-mail ou mot de passe incorrect.");
        }
    };
    const field = "mt-1 w-full rounded-xl border border-[rgba(26,21,18,0.15)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--wk-accent)]";
    return (
        <>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wk-accent)]">Se connecter avec Workyt</p>
            <h1 className="mt-2 font-serif-display text-[28px] leading-tight">Connecte-toi pour continuer vers {clientName}</h1>
            <form onSubmit={login} className="mt-6 space-y-3">
                <label className="block text-xs font-semibold text-[rgba(26,21,18,0.6)]">
                    E-mail
                    <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                </label>
                <label className="block text-xs font-semibold text-[rgba(26,21,18,0.6)]">
                    Mot de passe
                    <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                </label>
                {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={busy} className="wk-btn-orange w-full justify-center !py-2.5 text-sm disabled:opacity-60">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Se connecter
                </button>
            </form>
            <div className="my-4 flex items-center gap-3 text-xs text-[rgba(26,21,18,0.4)]">
                <span className="h-px flex-1 bg-[rgba(26,21,18,0.1)]" /> ou <span className="h-px flex-1 bg-[rgba(26,21,18,0.1)]" />
            </div>
            <button type="button" onClick={() => signIn("discord", { callbackUrl: here })} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4]">
                Continuer avec Discord
            </button>
            <p className="mt-5 text-center text-xs text-[rgba(26,21,18,0.55)]">
                Pas encore de compte ?{" "}
                <Link href="/" className="font-semibold text-[#c24a0a] underline underline-offset-4">
                    Crée-le sur workyt.fr
                </Link>
            </p>
        </>
    );
}

function ConsentView({ clientName, clientHost, username, scopes, token, query }: Extract<Props, { mode: "consent" }>) {
    const [busy, setBusy] = useState<"allow" | "deny" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const decide = async (allow: boolean) => {
        setBusy(allow ? "allow" : "deny");
        setError(null);
        const r = await fetch("/oauth/decision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, token, allow }) });
        const j = await r.json().catch(() => ({}));
        if (j.redirect) window.location.assign(j.redirect);
        else {
            setBusy(null);
            setError(j.error || "Une erreur est survenue.");
        }
    };
    return (
        <>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wk-accent)]">Autorisation</p>
            <h1 className="mt-2 font-serif-display text-[28px] leading-tight">
                {clientName} veut se connecter avec ton compte Workyt
            </h1>
            <p className="mt-2 text-sm text-[rgba(26,21,18,0.6)]">
                Connecté en tant que <b className="text-[var(--wk-ink)]">{username}</b>.{" "}
                <button type="button" onClick={() => signOut({ callbackUrl: `/oauth/authorize?${query}` })} className="font-semibold text-[#c24a0a] underline underline-offset-4">
                    Ce n&apos;est pas toi ?
                </button>
            </p>
            <div className="mt-5 rounded-2xl bg-[var(--wk-paper)] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4 text-[var(--wk-accent)]" /> {clientHost} pourra :
                </p>
                <ul className="mt-3 space-y-2">
                    {scopes.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-[rgba(26,21,18,0.75)]">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {s}
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-[rgba(26,21,18,0.5)]">Jamais ton mot de passe. Tu ne verras cette page qu&apos;une fois.</p>
            </div>
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex gap-2">
                <button type="button" disabled={!!busy} onClick={() => decide(false)} className="wk-btn-ghost flex-1 justify-center !py-2.5 text-sm">
                    {busy === "deny" && <Loader2 className="h-4 w-4 animate-spin" />} Refuser
                </button>
                <button type="button" disabled={!!busy} onClick={() => decide(true)} className="wk-btn-orange flex-1 justify-center !py-2.5 text-sm">
                    {busy === "allow" && <Loader2 className="h-4 w-4 animate-spin" />} Autoriser
                </button>
            </div>
        </>
    );
}
