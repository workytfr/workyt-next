"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Plus, Search, X, Trash2, RotateCcw, CalendarDays, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { AUTO_DETECTED_KINDS, POINTS } from "@/lib/mentorship/config";
import { api, ApiError, formatDate, type Assignment, type Kind, type MentorshipDetail, type ResourceHit } from "../../_lib/client";
import { KindBadge, KIND_META, Spinner } from "../ui";

/**
 * Les ressources du catalogue Workyt que le bénévole assigne à l'élève.
 * Les quiz, leçons, cours et évaluations se valident tout seuls quand l'élève
 * les termine ; les exercices et fiches, c'est lui qui coche.
 */
export default function ResourcesPanel({ detail, onChange }: { detail: MentorshipDetail; onChange: () => void }) {
    const list = detail.assignments || [];
    const staff = detail.viewer === "mentor" || detail.viewer === "moderator";
    const open = detail.status === "active" || detail.status === "paused";
    const todo = list.filter((a) => !a.doneAt);
    const finished = list.filter((a) => a.doneAt);
    const [picker, setPicker] = useState(false);

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between">
                <h3 className="font-serif-display text-2xl">Ressources</h3>
                <span className="text-xs font-semibold text-[rgba(26,21,18,0.55)]">
                    {finished.length}/{list.length} terminée{finished.length > 1 ? "s" : ""}
                </span>
            </div>

            {staff && open && (
                picker ? (
                    <ResourcePicker detail={detail} onClose={() => setPicker(false)} onAdded={() => { setPicker(false); onChange(); }} />
                ) : (
                    <button type="button" onClick={() => setPicker(true)} className="wk-btn-ink w-full justify-center !py-2.5 text-sm">
                        <Plus className="h-4 w-4" /> Assigner une ressource
                    </button>
                )
            )}

            {list.length === 0 && !picker && (
                <div className="rounded-2xl border border-dashed border-[rgba(26,21,18,0.15)] p-5 text-center text-sm text-[rgba(26,21,18,0.55)]">
                    {staff
                        ? "Choisis dans le catalogue un cours, un quiz ou une fiche adaptés à l'élève."
                        : "Ton bénévole va te proposer des cours, quiz et fiches choisis pour toi."}
                </div>
            )}

            {todo.length > 0 && (
                <section>
                    <h4 className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">À faire</h4>
                    <ul className="space-y-2">
                        {todo.map((a) => (
                            <AssignmentRow key={a.id} a={a} detail={detail} staff={staff} open={open} onChange={onChange} />
                        ))}
                    </ul>
                </section>
            )}
            {finished.length > 0 && (
                <section>
                    <h4 className="font-mono-ui mb-2 text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">Terminées</h4>
                    <ul className="space-y-2">
                        {finished.map((a) => (
                            <AssignmentRow key={a.id} a={a} detail={detail} staff={staff} open={open} onChange={onChange} />
                        ))}
                    </ul>
                </section>
            )}

            {!staff && list.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-[rgba(26,21,18,0.5)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--wk-accent)]" />
                    +{POINTS.assignmentDone} points par ressource terminée.
                </p>
            )}
        </div>
    );
}

function AssignmentRow({
    a,
    detail,
    staff,
    open,
    onChange,
}: {
    a: Assignment;
    detail: MentorshipDetail;
    staff: boolean;
    open: boolean;
    onChange: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const auto = AUTO_DETECTED_KINDS.includes(a.kind);
    const late = !a.doneAt && a.dueAt && new Date(a.dueAt).getTime() < Date.now();

    const patch = async (json: Record<string, unknown>) => {
        setBusy(true);
        setError(null);
        try {
            await api(`/api/suivi/${detail.id}/assignments`, { method: "PATCH", json: { assignmentId: a.id, ...json } });
            onChange();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Action impossible.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <li className={`rounded-2xl border p-3 ${a.doneAt ? "border-emerald-200 bg-emerald-50/50" : "border-[rgba(26,21,18,0.08)] bg-white"}`}>
            <div className="flex items-start gap-3">
                <KindBadge kind={a.kind} />
                <div className="min-w-0 flex-1">
                    <a href={a.url} className="group inline-flex max-w-full items-center gap-1.5 text-sm font-semibold hover:text-[var(--wk-accent)]">
                        <span className="truncate">{a.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
                    </a>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[rgba(26,21,18,0.55)]">
                        <span style={{ color: KIND_META[a.kind].color }} className="font-semibold">{KIND_META[a.kind].label}</span>
                        {a.dueAt && !a.doneAt && (
                            <span className={`inline-flex items-center gap-1 ${late ? "font-semibold text-red-600" : ""}`}>
                                <CalendarDays className="h-3 w-3" /> {late ? "en retard · " : ""}pour le {formatDate(a.dueAt)}
                            </span>
                        )}
                        {a.doneAt && (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                {a.alreadyDone ? "déjà faite avant" : `terminée le ${formatDate(a.doneAt)}`}
                                {a.score !== null && a.maxScore ? ` · ${a.score}/${a.maxScore}` : ""}
                            </span>
                        )}
                    </div>
                    {a.note && <p className="mt-1.5 text-xs leading-relaxed text-[rgba(26,21,18,0.7)]">« {a.note} »</p>}
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
            </div>

            {open && (
                <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
                    {/* Élève : coche lui-même ce qui ne laisse pas de trace sur Workyt */}
                    {!staff && !a.doneAt && !auto && (
                        <button type="button" disabled={busy} onClick={() => patch({ done: true })} className="wk-chip !border-emerald-300 !bg-emerald-600 !text-white hover:!bg-emerald-700">
                            {busy ? <Spinner className="h-3 w-3" /> : <Check className="h-3.5 w-3.5" />} J&apos;ai terminé
                        </button>
                    )}
                    {!staff && !a.doneAt && auto && (
                        <span className="text-[11px] text-[rgba(26,21,18,0.5)]">Se coche tout seul quand tu l&apos;as terminé</span>
                    )}
                    {staff && !a.doneAt && (
                        <button type="button" disabled={busy} onClick={() => patch({ done: true })} className="wk-chip hover:border-emerald-400">
                            <Check className="h-3.5 w-3.5" /> Valider
                        </button>
                    )}
                    {staff && a.doneAt && (
                        <button type="button" disabled={busy} onClick={() => patch({ done: false })} className="wk-chip">
                            <RotateCcw className="h-3.5 w-3.5" /> Rouvrir
                        </button>
                    )}
                    {staff && (
                        <button type="button" disabled={busy} onClick={() => patch({ remove: true })} className="wk-chip hover:border-red-300 hover:text-red-600" aria-label="Retirer la ressource">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}
        </li>
    );
}

/* ─── Sélecteur de ressources du catalogue ─── */

const KINDS: Kind[] = ["course", "lesson", "quiz", "exercise", "fiche", "evaluation"];

function ResourcePicker({ detail, onClose, onAdded }: { detail: MentorshipDetail; onClose: () => void; onAdded: () => void }) {
    const [kind, setKind] = useState<Kind>("quiz");
    const [q, setQ] = useState("");
    const [results, setResults] = useState<ResourceHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [picked, setPicked] = useState<ResourceHit | null>(null);
    const [note, setNote] = useState("");
    const [dueAt, setDueAt] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ kind, q, subject: detail.subject });
                setResults(await api<ResourceHit[]>(`/api/suivi/resources?${params}`));
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [kind, q, detail.subject]);

    const save = async () => {
        if (!picked) return;
        setSaving(true);
        setError(null);
        try {
            await api(`/api/suivi/${detail.id}/assignments`, {
                method: "POST",
                json: { kind: picked.kind, refId: picked.id, note, dueAt: dueAt ? new Date(`${dueAt}T20:00:00`).toISOString() : "" },
            });
            onAdded();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Impossible d'assigner cette ressource.");
            setSaving(false);
        }
    };

    return (
        <div className="rounded-3xl border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Assigner une ressource</span>
                <button type="button" onClick={onClose} aria-label="Fermer">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {!picked ? (
                <>
                    <div className="flex flex-wrap gap-1.5" role="tablist">
                        {KINDS.map((k) => (
                            <button
                                key={k}
                                type="button"
                                role="tab"
                                aria-selected={kind === k}
                                onClick={() => setKind(k)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                    kind === k ? "bg-[var(--wk-ink)] text-white" : "bg-white text-[rgba(26,21,18,0.7)] hover:bg-white/60"
                                }`}
                            >
                                {KIND_META[k].label}
                            </button>
                        ))}
                    </div>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(26,21,18,0.4)]" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={`Chercher un ${KIND_META[kind].label.toLowerCase()}…`}
                            className="w-full rounded-full border border-[rgba(26,21,18,0.12)] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--wk-accent)]"
                            autoFocus
                        />
                    </div>
                    {!q && (
                        <p className="mt-2 text-[11px] text-[rgba(26,21,18,0.5)]">
                            Suggestions en {detail.subject} — tape pour chercher dans tout le catalogue.
                        </p>
                    )}
                    <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                        {loading && (
                            <li className="flex justify-center py-4">
                                <Spinner />
                            </li>
                        )}
                        {!loading && results.length === 0 && (
                            <li className="py-4 text-center text-xs text-[rgba(26,21,18,0.5)]">Aucun résultat.</li>
                        )}
                        {!loading &&
                            results.map((r) => (
                                <li key={`${r.kind}-${r.id}`}>
                                    <button
                                        type="button"
                                        onClick={() => setPicked(r)}
                                        className="flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left transition hover:ring-2 hover:ring-[rgba(255,106,26,0.3)]"
                                    >
                                        <KindBadge kind={r.kind} />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold">{r.title}</span>
                                            {r.subtitle && <span className="block truncate text-[11px] text-[rgba(26,21,18,0.55)]">{r.subtitle}</span>}
                                        </span>
                                    </button>
                                </li>
                            ))}
                    </ul>
                </>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
                        <KindBadge kind={picked.kind} />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{picked.title}</span>
                            {picked.subtitle && <span className="block truncate text-[11px] text-[rgba(26,21,18,0.55)]">{picked.subtitle}</span>}
                        </span>
                        <button type="button" onClick={() => setPicked(null)} className="text-xs font-semibold text-[var(--wk-accent)]">
                            Changer
                        </button>
                    </div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value.slice(0, 300))}
                        rows={2}
                        placeholder="Une consigne ? Ex. Fais les questions 1 à 5, puis dis-moi où tu bloques."
                        className="w-full resize-none rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--wk-accent)]"
                    />
                    <label className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[rgba(26,21,18,0.7)]">Pour le (facultatif)</span>
                        <input
                            type="date"
                            value={dueAt}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setDueAt(e.target.value)}
                            className="rounded-full border border-[rgba(26,21,18,0.12)] bg-white px-3 py-1.5 text-sm"
                        />
                    </label>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <button type="button" onClick={save} disabled={saving} className="wk-btn-orange w-full justify-center !py-2.5 text-sm">
                        {saving && <Spinner className="h-4 w-4 !border-white/40 !border-t-white" />}
                        Envoyer à {detail.student?.username}
                    </button>
                </div>
            )}
        </div>
    );
}
