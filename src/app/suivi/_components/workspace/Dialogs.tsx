"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OUTCOME_LABELS } from "@/lib/mentorship/config";
import { api, ApiError, type MentorshipDetail } from "../../_lib/client";
import { Spinner } from "../ui";

type Kind = "close" | "release" | "pause" | "resume" | "cancel" | null;

const FEEDBACK = [
    { key: "helpful", label: "Oui, ça m'a aidé" },
    { key: "neutral", label: "Un peu" },
    { key: "not_helpful", label: "Pas vraiment" },
] as const;

/**
 * Les actions qui changent le cycle de vie d'un suivi, chacune derrière une
 * confirmation : un suivi est une relation, on ne l'arrête pas d'un clic.
 */
export default function ActionDialog({
    kind,
    detail,
    onClose,
    onDone,
}: {
    kind: Kind;
    detail: MentorshipDetail;
    onClose: () => void;
    onDone: () => void;
}) {
    const staff = detail.viewer === "mentor" || detail.viewer === "moderator";
    const [outcome, setOutcome] = useState("");
    const [summary, setSummary] = useState("");
    const [note, setNote] = useState("");
    const [feedback, setFeedback] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async (json: Record<string, unknown>) => {
        setBusy(true);
        setError(null);
        try {
            await api(`/api/suivi/${detail.id}`, { method: "PATCH", json });
            onDone();
            onClose();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Action impossible.");
        } finally {
            setBusy(false);
        }
    };

    const field = "w-full rounded-2xl border border-[rgba(26,21,18,0.12)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--wk-accent)]";

    const content: Record<Exclude<Kind, null>, { title: string; desc: string; body?: React.ReactNode; cta: string; action: () => void; disabled?: boolean; danger?: boolean }> = {
        close: staff
            ? {
                  title: "Terminer le suivi",
                  desc: "Un bilan clair aide l'élève à mesurer le chemin parcouru. Il le retrouvera dans son espace.",
                  body: (
                      <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {Object.entries(OUTCOME_LABELS).map(([k, label]) => (
                                  <label
                                      key={k}
                                      className={`cursor-pointer rounded-2xl border px-3 py-2.5 text-sm transition ${
                                          outcome === k ? "border-[var(--wk-accent)] bg-[rgba(255,106,26,0.06)]" : "border-[rgba(26,21,18,0.12)]"
                                      }`}
                                  >
                                      <input type="radio" name="outcome" className="sr-only" checked={outcome === k} onChange={() => setOutcome(k)} />
                                      {label}
                                  </label>
                              ))}
                          </div>
                          <textarea
                              value={summary}
                              onChange={(e) => setSummary(e.target.value.slice(0, 1000))}
                              rows={4}
                              placeholder="Ex. Tu résous maintenant les équations seul, bravo ! Pour la suite, garde le réflexe de vérifier en remplaçant x."
                              className={field}
                          />
                      </div>
                  ),
                  cta: "Terminer le suivi",
                  action: () => run({ action: "close", outcome, summary }),
                  disabled: !outcome || summary.trim().length < 10,
              }
            : {
                  title: "Arrêter le suivi",
                  desc: "Tu peux arrêter quand tu veux, sans te justifier. Tu pourras refaire une demande plus tard.",
                  body: (
                      <div>
                          <p className="mb-2 text-sm font-semibold">Ce suivi t&apos;a-t-il aidé ? (facultatif)</p>
                          <div className="flex flex-wrap gap-2">
                              {FEEDBACK.map((f) => (
                                  <button
                                      key={f.key}
                                      type="button"
                                      onClick={() => setFeedback(f.key)}
                                      aria-pressed={feedback === f.key}
                                      className={`rounded-full border px-3.5 py-1.5 text-sm ${
                                          feedback === f.key ? "border-[var(--wk-ink)] bg-[var(--wk-ink)] text-white" : "border-[rgba(26,21,18,0.14)]"
                                      }`}
                                  >
                                      {f.label}
                                  </button>
                              ))}
                          </div>
                      </div>
                  ),
                  cta: "Arrêter le suivi",
                  action: () => run({ action: "close", feedback: feedback || undefined }),
                  danger: true,
              },
        release: {
            title: "Passer la main",
            desc: "Le suivi repart dans la file avec tout son historique : un autre bénévole le reprendra. Aucun souci, ça arrive.",
            body: (
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    rows={4}
                    placeholder="Un mot pour le bénévole suivant : où en est l'élève, ce qui marche avec lui…"
                    className={field}
                />
            ),
            cta: "Remettre dans la file",
            action: () => run({ action: "release", note }),
            disabled: detail.viewer === "mentor" && note.trim().length < 10,
        },
        pause: {
            title: "Mettre le suivi en pause",
            desc: "Pendant la pause, aucune relance automatique. Pratique pendant les vacances ou tes examens. L'élève est prévenu.",
            cta: "Mettre en pause",
            action: () => run({ action: "pause" }),
        },
        resume: {
            title: "Reprendre le suivi",
            desc: "L'élève sera prévenu que vous reprenez.",
            cta: "Reprendre",
            action: () => run({ action: "resume" }),
        },
        cancel: {
            title: "Annuler ta demande",
            desc: "Ta demande sera retirée de la file d'attente. Tu pourras en refaire une quand tu veux.",
            cta: "Annuler la demande",
            action: () => run({ action: "cancel" }),
            danger: true,
        },
    };

    const c = kind ? content[kind] : null;

    return (
        <Dialog open={!!kind} onOpenChange={(o) => !o && onClose()}>
            {c && (
                <DialogContent className="max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif-display text-2xl font-normal">{c.title}</DialogTitle>
                        <DialogDescription>{c.desc}</DialogDescription>
                    </DialogHeader>
                    {c.body}
                    {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-[rgba(26,21,18,0.6)] hover:bg-[var(--wk-paper-2)]">
                            Retour
                        </button>
                        <button
                            type="button"
                            onClick={c.action}
                            disabled={busy || c.disabled}
                            className={`${c.danger ? "wk-btn-ink !bg-red-600" : "wk-btn-ink"} !px-5 !py-2 text-sm disabled:opacity-40`}
                        >
                            {busy && <Spinner className="h-4 w-4" />}
                            {c.cta}
                        </button>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}

export type { Kind as ActionKind };
