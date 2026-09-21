"use client";

import React, { useEffect, useRef, useState } from "react";
import { Lock, History, Quote } from "lucide-react";
import { api, formatDate, type MentorshipDetail } from "../../_lib/client";

const REASON_LABELS: Record<string, string> = {
    released: "a passé la main",
    timeout: "relais automatique (pas de réponse)",
    reassigned: "réattribué par la modération",
    closed: "suivi terminé",
};

/**
 * Le bloc-notes du bénévole : jamais visible de l'élève, transmis au bénévole
 * suivant en cas de relais. Enregistrement automatique.
 */
export default function NotesPanel({ detail }: { detail: MentorshipDetail }) {
    const [notes, setNotes] = useState(detail.mentorNotes || "");
    const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pending = useRef<string | null>(null);
    const editable = detail.status !== "closed" && detail.status !== "cancelled";
    const id = detail.id;

    // Changer d'onglet démonte le panneau : on envoie aussitôt la saisie en attente
    // plutôt que de la perdre.
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
        if (pending.current !== null) {
            void api(`/api/suivi/${id}`, { method: "PATCH", json: { action: "notes", notes: pending.current } }).catch(() => {});
        }
    }, [id]);

    const edit = (value: string) => {
        setNotes(value);
        setState("saving");
        pending.current = value;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            try {
                await api(`/api/suivi/${id}`, { method: "PATCH", json: { action: "notes", notes: value } });
                if (pending.current === value) pending.current = null;
                setState("saved");
            } catch {
                setState("error");
            }
        }, 900);
    };

    const history = detail.mentorHistory || [];

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-baseline justify-between">
                    <h3 className="font-serif-display text-2xl">Mes notes</h3>
                    <span className="text-[11px] text-[rgba(26,21,18,0.5)]">
                        {state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré" : state === "error" ? "Échec de l'enregistrement" : ""}
                    </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[rgba(26,21,18,0.55)]">
                    <Lock className="h-3 w-3" /> Invisibles pour l&apos;élève. Transmises au bénévole suivant en cas de relais.
                </p>
                <textarea
                    value={notes}
                    onChange={(e) => edit(e.target.value.slice(0, 5000))}
                    disabled={!editable}
                    rows={10}
                    placeholder={"Ce qui marche avec lui, ses points faibles, ce qu'on a prévu pour la prochaine fois…"}
                    className="wk-seyes mt-3 w-full resize-y rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white py-1 pl-[76px] pr-4 text-sm leading-[28px] outline-none focus:border-[var(--wk-accent)]"
                />
            </div>

            {detail.handoffNote && (
                <section className="rounded-2xl bg-[var(--wk-paper-2)] p-4">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold">
                        <Quote className="h-3.5 w-3.5 text-[var(--wk-accent)]" /> Mot du bénévole précédent
                    </h4>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[rgba(26,21,18,0.75)]">{detail.handoffNote}</p>
                </section>
            )}

            {history.length > 1 && (
                <section>
                    <h4 className="font-mono-ui mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                        <History className="h-3 w-3" /> Bénévoles successifs
                    </h4>
                    <ol className="space-y-2 border-l border-[rgba(26,21,18,0.12)] pl-4">
                        {history.map((h, i) => (
                            <li key={i} className="text-sm">
                                <span className="font-semibold">{h.mentor.username}</span>
                                <span className="text-[rgba(26,21,18,0.55)]">
                                    {" "}· du {formatDate(h.from, { day: "numeric", month: "short" })}
                                    {h.to ? ` au ${formatDate(h.to, { day: "numeric", month: "short" })}` : " à aujourd'hui"}
                                </span>
                                {h.reason && <span className="block text-xs text-[rgba(26,21,18,0.5)]">{REASON_LABELS[h.reason] || h.reason}</span>}
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </div>
    );
}
