"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldCheck, Trash2, Eye, EyeOff, Lock } from "lucide-react";

interface Props {
    /** Prévenir le parent pour qu'il rafraîchisse l'aperçu du profil */
    onChange?: () => void;
}

interface PhotoState {
    url: string;
    isActive: boolean;
}

/**
 * Photo de profil envoyée par le membre — réservée aux bénévoles.
 * Quand elle est active, elle prime sur l'image achetée en boutique et sur
 * l'avatar généré : c'est la photo affichée partout sur le site.
 */
export default function CustomPhotoCard({ onChange }: Props) {
    const [allowed, setAllowed] = useState(false);
    const [photo, setPhoto] = useState<PhotoState>({ url: "", isActive: false });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("/api/users/me/photo")
            .then((r) => r.json())
            .then((d) => {
                if (d?.success) {
                    setAllowed(!!d.allowed);
                    setPhoto(d.customPhoto || { url: "", isActive: false });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const pick = () => fileRef.current?.click();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
            setError("Formats acceptés : JPG, PNG ou WebP.");
            return;
        }
        setError(null);
        setBusy(true);
        try {
            // L'image transite par le serveur : pas de CORS à configurer sur R2
            const form = new FormData();
            form.append("file", file);
            const up = await fetch("/api/users/me/photo/upload", { method: "POST", body: form });
            const uploaded = await up.json().catch(() => ({}));
            if (!up.ok) throw new Error(uploaded.error || "Envoi impossible");

            const res = await fetch("/api/users/me/photo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: uploaded.url, key: uploaded.key }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
            setPhoto({ url: data.customPhoto.url, isActive: true });
            onChange?.();
        } catch (err: any) {
            setError(err?.message ?? "Envoi impossible");
        } finally {
            setBusy(false);
        }
    };

    const toggle = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/users/me/photo", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !photo.isActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Action impossible");
            setPhoto((p) => ({ ...p, isActive: data.customPhoto.isActive }));
            onChange?.();
        } catch (err: any) {
            setError(err?.message ?? "Action impossible");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/users/me/photo", { method: "DELETE" });
            if (!res.ok) throw new Error("Suppression impossible");
            setPhoto({ url: "", isActive: false });
            onChange?.();
        } catch (err: any) {
            setError(err?.message ?? "Suppression impossible");
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div className="h-40 animate-pulse rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white" />;
    }

    return (
        <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 sm:p-6 md:p-7">
            <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[var(--wk-accent)]" />
                <h2 className="font-serif-display text-2xl leading-none">Ma photo de profil</h2>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[rgba(255,106,26,0.1)] px-3 py-1 text-xs font-semibold text-[#c24a0a]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Bénévoles
                </span>
            </div>
            <p className="mt-2 text-[rgba(26,21,18,0.62)]">
                Ta vraie photo, affichée partout sur le site. Elle passe <b className="text-[var(--wk-ink)]">avant</b> les
                images de la boutique et l&apos;avatar généré.
            </p>

            {!allowed ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[var(--wk-paper)] p-4">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[rgba(26,21,18,0.45)]" />
                    <p className="text-sm text-[rgba(26,21,18,0.7)]">
                        Cette personnalisation est réservée aux bénévoles de l&apos;association (Helpeurs, rédacteurs,
                        correcteurs et modérateurs). Envie de nous rejoindre ? Parle-en à l&apos;équipe sur Discord.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper-2)]">
                            {photo.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photo.url} alt="Ta photo de profil" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center">
                                    <Camera className="h-8 w-8 text-[rgba(26,21,18,0.25)]" />
                                </span>
                            )}
                            {photo.url && !photo.isActive && (
                                <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[11px] font-semibold text-[rgba(26,21,18,0.7)]">
                                    Désactivée
                                </span>
                            )}
                        </div>

                        <div className="flex flex-1 flex-col gap-3">
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={pick} disabled={busy} className="wk-btn-orange !px-4 !py-2 text-sm disabled:opacity-50">
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                    {photo.url ? "Changer la photo" : "Envoyer une photo"}
                                </button>
                                {photo.url && (
                                    <>
                                        <button type="button" onClick={toggle} disabled={busy} className="wk-btn-ghost !px-4 !py-2 text-sm disabled:opacity-50">
                                            {photo.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            {photo.isActive ? "Désactiver" : "Activer"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={remove}
                                            disabled={busy}
                                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" /> Supprimer
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-[rgba(26,21,18,0.55)]">
                                JPG, PNG ou WebP, 3 Mo maximum. L&apos;image est recadrée en rond. Elle est visible par
                                tout le monde : pas de photo d&apos;une autre personne, pas d&apos;image choquante. Un
                                modérateur peut la retirer si elle est signalée.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
                    )}

                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFile} />
                </>
            )}
        </div>
    );
}
