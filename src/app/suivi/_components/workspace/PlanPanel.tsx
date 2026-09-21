"use client";

import React, { useState } from "react";
import { Check, Plus, Trash2, Target } from "lucide-react";
import { MAX_GOALS, POINTS } from "@/lib/mentorship/config";
import { api, ApiError, formatDate, type MentorshipDetail } from "../../_lib/client";
import { Spinner } from "../ui";

/**
 * Le plan d'objectifs. Le bénévole pose et valide les objectifs ; l'élève les
 * voit avancer. C'est le bénévole qui coche : un objectif atteint rapporte des
 * points à l'élève, il ne doit pas pouvoir se l'attribuer seul.
 */
export default function PlanPanel({ detail, onChange }: { detail: MentorshipDetail; onChange: () => void }) {
    const goals = detail.goals || [];
    const staff = detail.viewer === "mentor" || detail.viewer === "moderator";
    const editable = staff && (detail.status === "active" || detail.status === "paused");
    const done = goals.filter((g) => g.done).length;

    const [title, setTitle] = useState("");
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const call = async (key: string, fn: () => Promise<unknown>) => {
        setBusy(key);
        setError(null);
        try {
            await fn();
            onChange();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Action impossible.");
        } finally {
            setBusy(null);
        }
    };

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = title.trim();
        if (clean.length < 3) return;
        call("add", async () => {
            await api(`/api/suivi/${detail.id}/goals`, { method: "POST", json: { title: clean } });
            setTitle("");
        });
    };

    return (
        <div className="space-y-5">
            <div>
                <div className="flex items-baseline justify-between">
                    <h3 className="font-serif-display text-2xl">Le plan</h3>
                    <span className="text-xs font-semibold text-[rgba(26,21,18,0.55)]">
                        {done}/{goals.length} objectif{goals.length > 1 ? "s" : ""}
                    </span>
                </div>
                <div className="wk-xp-bar mt-3">
                    <div className="wk-xp-fill" style={{ width: goals.length ? `${(done / goals.length) * 100}%` : "0%" }} />
                </div>
            </div>

            {goals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[rgba(26,21,18,0.15)] p-5 text-center text-sm text-[rgba(26,21,18,0.55)]">
                    <Target className="mx-auto mb-2 h-5 w-5" />
                    {staff
                        ? "Pose 3 à 5 objectifs concrets avec l'élève : ils rendent le progrès visible."
                        : "Ton bénévole va poser avec toi quelques objectifs concrets."}
                </div>
            ) : (
                <ul className="space-y-2">
                    {goals.map((g) => (
                        <li
                            key={g.id}
                            className={`group flex items-start gap-3 rounded-2xl border p-3 transition ${
                                g.done ? "border-emerald-200 bg-emerald-50/60" : "border-[rgba(26,21,18,0.08)] bg-white"
                            }`}
                        >
                            <button
                                type="button"
                                disabled={!editable || busy === g.id}
                                onClick={() =>
                                    call(g.id, () =>
                                        api(`/api/suivi/${detail.id}/goals`, { method: "PATCH", json: { goalId: g.id, done: !g.done } })
                                    )
                                }
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                    g.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-[rgba(26,21,18,0.25)] bg-white"
                                } ${editable ? "cursor-pointer hover:border-emerald-600" : "cursor-default"}`}
                                aria-label={g.done ? "Marquer comme non atteint" : "Marquer comme atteint"}
                                aria-pressed={g.done}
                            >
                                {busy === g.id ? <Spinner className="h-3 w-3" /> : g.done ? <Check className="h-3.5 w-3.5" /> : null}
                            </button>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium leading-snug ${g.done ? "text-emerald-900" : ""}`}>{g.title}</p>
                                {g.done && g.doneAt && (
                                    <p className="mt-0.5 text-[11px] text-emerald-700/70">Atteint le {formatDate(g.doneAt)}</p>
                                )}
                            </div>
                            {editable && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        call(`rm-${g.id}`, () =>
                                            api(`/api/suivi/${detail.id}/goals`, { method: "PATCH", json: { goalId: g.id, remove: true } })
                                        )
                                    }
                                    className="opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                                    aria-label="Retirer l'objectif"
                                >
                                    <Trash2 className="h-4 w-4 text-[rgba(26,21,18,0.35)] hover:text-red-600" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {editable && goals.length < MAX_GOALS && (
                <form onSubmit={add} className="flex gap-2">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 140))}
                        placeholder="Ex. Résoudre seul une équation à 2 étapes"
                        className="min-w-0 flex-1 rounded-full border border-[rgba(26,21,18,0.12)] px-4 py-2 text-sm outline-none focus:border-[var(--wk-accent)]"
                        aria-label="Nouvel objectif"
                    />
                    <button type="submit" disabled={title.trim().length < 3 || busy === "add"} className="wk-btn-ink !px-3.5 !py-2 disabled:opacity-40" aria-label="Ajouter l'objectif">
                        {busy === "add" ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                </form>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}

            {!staff && goals.length > 0 && (
                <p className="text-xs text-[rgba(26,21,18,0.5)]">
                    Chaque objectif atteint te rapporte {POINTS.goalReached} points.
                </p>
            )}
        </div>
    );
}
