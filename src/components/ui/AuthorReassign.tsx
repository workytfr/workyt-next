"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, UserCog, Check, X } from "lucide-react";

export type ReassignContentType =
    | "course"
    | "lesson"
    | "exercise"
    | "quiz"
    | "evaluation";

interface UserResult {
    _id: string;
    name: string;
    username: string;
    email?: string;
}

interface AuthorReassignProps {
    type: ReassignContentType;
    id: string;
    accessToken?: string;
    /** Libellé actuel de l'auteur (affiché à titre indicatif). */
    currentAuthorName?: string;
    /** Appelé après une réassignation réussie. */
    onChanged?: (author: { _id: string; name: string; username: string }) => void;
    className?: string;
}

/**
 * Contrôle admin : réassigner l'auteur d'un contenu (cours, leçon, exercice,
 * quiz, évaluation). À n'afficher que pour les administrateurs.
 */
export default function AuthorReassign({
    type,
    id,
    accessToken,
    currentAuthorName,
    onChanged,
    className = "",
}: AuthorReassignProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fermer au clic extérieur
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Recherche débouncée
    useEffect(() => {
        if (!open) return;
        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/users?search=${encodeURIComponent(q)}&limit=8`
                );
                const data = await res.json();
                setResults(data.users || []);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query, open]);

    const assign = async (u: UserResult) => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await fetch("/api/admin/content-author", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({ type, id, authorId: u._id }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Échec de la réassignation.");
            }
            setSuccess(`Auteur réassigné à ${u.name || u.username}.`);
            onChanged?.({ _id: u._id, name: u.name, username: u.username });
            setTimeout(() => {
                setOpen(false);
                setSuccess(null);
                setQuery("");
                setResults([]);
            }, 900);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative inline-block ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#e3e2e0] text-[#37352f] hover:border-[#f97316] hover:text-[#f97316] transition-colors"
                title="Réassigner l'auteur (admin)"
            >
                <UserCog className="w-3.5 h-3.5" />
                Changer l&apos;auteur
            </button>

            {open && (
                <div className="absolute z-50 mt-2 w-72 right-0 bg-white border border-[#e3e2e0] rounded-xl shadow-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#37352f]">
                            Réassigner l&apos;auteur
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="p-1 text-[#9ca3af] hover:text-[#37352f]"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {currentAuthorName && (
                        <p className="text-[11px] text-[#9ca3af] mb-2">
                            Actuel : {currentAuthorName}
                        </p>
                    )}

                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
                        <input
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Nom, pseudo ou email…"
                            className="w-full pl-8 pr-2 py-1.5 text-sm border border-[#e3e2e0] rounded-lg focus:outline-none focus:border-[#f97316]"
                        />
                    </div>

                    {error && (
                        <p className="text-[11px] text-red-600 mb-2">{error}</p>
                    )}
                    {success && (
                        <p className="text-[11px] text-green-700 mb-2 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {success}
                        </p>
                    )}

                    <div className="max-h-56 overflow-y-auto space-y-1">
                        {searching || saving ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-[#f97316]" />
                            </div>
                        ) : query.trim().length < 2 ? (
                            <p className="text-[11px] text-[#9ca3af] py-2 text-center">
                                Tapez au moins 2 caractères.
                            </p>
                        ) : results.length === 0 ? (
                            <p className="text-[11px] text-[#9ca3af] py-2 text-center">
                                Aucun utilisateur trouvé.
                            </p>
                        ) : (
                            results.map((u) => (
                                <button
                                    key={u._id}
                                    type="button"
                                    onClick={() => assign(u)}
                                    disabled={saving}
                                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#f7f6f3] transition-colors"
                                >
                                    <p className="text-sm font-medium text-[#37352f] truncate">
                                        {u.name || u.username}
                                    </p>
                                    <p className="text-[11px] text-[#9ca3af] truncate">
                                        @{u.username}
                                        {u.email ? ` · ${u.email}` : ""}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
