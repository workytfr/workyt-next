"use client";

import { Plus, Trash2 } from "lucide-react";
import NoteInput from "../_components/NoteInput";
import ResultCard from "../_components/ResultCard";
import { useStoredState } from "../_components/useStoredState";
import { bacStatus, bacSubjects, computeBac, OPTION_COEF_PER_YEAR, type BacVoie } from "@/lib/exams/bac";
import { fmt, parseNote, type WeightedNote } from "@/lib/exams/common";

interface OptionRow {
    id: number;
    label: string;
    note: string;
    years: 1 | 2;
}

const VERDICT = {
    admis: { label: "Admis", tone: "ok" },
    rattrapage: { label: "Oral de rattrapage", tone: "warn" },
    ajourne: { label: "Ajourné", tone: "ko" },
} as const;

export default function BacClient() {
    const [voie, setVoie] = useStoredState<BacVoie>("wk-bac-voie", "generale");
    const [notes, setNotes] = useStoredState<Record<string, string>>("wk-bac-notes", {});
    const [options, setOptions] = useStoredState<OptionRow[]>("wk-bac-options", []);

    const subjects = bacSubjects(voie);
    const items: WeightedNote[] = [
        ...subjects.map((s) => ({ note: parseNote(notes[s.key] ?? ""), coef: s.coef })),
        ...options.map((o) => ({ note: parseNote(o.note), coef: OPTION_COEF_PER_YEAR * o.years })),
    ];
    const r = computeBac(items);
    const partial = r.filledCoef < r.totalCoef;

    const setNote = (key: string, v: string) => setNotes((n) => ({ ...n, [key]: v }));
    const updateOption = (id: number, patch: Partial<OptionRow>) =>
        setOptions((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));

    const group = (g: "epreuves" | "controle") => subjects.filter((s) => s.group === g);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
                <div className="inline-flex rounded-full bg-[var(--wk-paper-2)] p-1" role="radiogroup" aria-label="Voie">
                    {(["generale", "technologique"] as const).map((v) => (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={voie === v}
                            onClick={() => setVoie(v)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                voie === v ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]" : "text-[rgba(26,21,18,0.65)]"
                            }`}
                        >
                            Bac {v === "generale" ? "général" : "technologique"}
                        </button>
                    ))}
                </div>

                <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
                    <h2 className="font-serif-display text-2xl">Épreuves finales</h2>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">60 % de la note · 60 coefficients</p>
                    <div className="mt-3 divide-y divide-[rgba(26,21,18,0.06)]">
                        {group("epreuves").map((s) => (
                            <NoteInput key={s.key} id={`bac-${s.key}`} label={s.label} hint={s.hint} coef={s.coef} value={notes[s.key] ?? ""} onChange={(v) => setNote(s.key, v)} />
                        ))}
                    </div>
                </section>

                <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
                    <h2 className="font-serif-display text-2xl">Contrôle continu</h2>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                        40 % de la note · 40 coefficients. Pour chaque matière, mets la moyenne de tes moyennes annuelles
                        de première et de terminale.
                    </p>
                    <div className="mt-3 divide-y divide-[rgba(26,21,18,0.06)]">
                        {group("controle").map((s) => (
                            <NoteInput key={s.key} id={`bac-${s.key}`} label={s.label} hint={s.hint} coef={s.coef} value={notes[s.key] ?? ""} onChange={(v) => setNote(s.key, v)} />
                        ))}
                    </div>
                </section>

                <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
                    <h2 className="font-serif-display text-2xl">Options</h2>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                        Chaque enseignement optionnel ajoute un coefficient {OPTION_COEF_PER_YEAR} par année suivie
                        (latin, maths expertes, DGEMC…).
                    </p>
                    <div className="mt-3 space-y-3">
                        {options.map((o) => (
                            <div key={o.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--wk-paper)] p-3">
                                <input
                                    value={o.label}
                                    onChange={(e) => updateOption(o.id, { label: e.target.value })}
                                    placeholder="Nom de l'option"
                                    aria-label="Nom de l'option"
                                    className="min-w-0 flex-1 rounded-xl border border-[rgba(26,21,18,0.12)] bg-white px-3 py-1.5 text-sm"
                                />
                                <select
                                    value={o.years}
                                    onChange={(e) => updateOption(o.id, { years: Number(e.target.value) === 2 ? 2 : 1 })}
                                    aria-label="Années suivies"
                                    className="rounded-xl border border-[rgba(26,21,18,0.12)] bg-white px-2 py-1.5 text-sm"
                                >
                                    <option value={1}>1 an (coef {OPTION_COEF_PER_YEAR})</option>
                                    <option value={2}>2 ans (coef {OPTION_COEF_PER_YEAR * 2})</option>
                                </select>
                                <input
                                    value={o.note}
                                    onChange={(e) => updateOption(o.id, { note: e.target.value })}
                                    inputMode="decimal"
                                    placeholder="—"
                                    aria-label="Moyenne de l'option sur 20"
                                    className="w-20 rounded-xl border border-[rgba(26,21,18,0.12)] bg-white px-3 py-1.5 text-right text-sm font-semibold tabular-nums"
                                />
                                <button
                                    type="button"
                                    onClick={() => setOptions((list) => list.filter((x) => x.id !== o.id))}
                                    className="rounded-full p-2 text-[rgba(26,21,18,0.5)] hover:bg-[rgba(26,21,18,0.06)]"
                                    aria-label="Retirer l'option"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setOptions((list) => [...list, { id: Date.now(), label: "", note: "", years: 2 }])}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--wk-accent)]"
                        >
                            <Plus className="h-4 w-4" /> Ajouter une option
                        </button>
                    </div>
                </section>

                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm("Effacer toutes les notes ?")) {
                            setNotes({});
                            setOptions([]);
                        }
                    }}
                    className="text-sm font-semibold text-[rgba(26,21,18,0.5)] underline-offset-4 hover:underline"
                >
                    Tout effacer
                </button>
            </div>

            <div className="lg:col-span-4">
                <ResultCard
                    average={r.average}
                    partial={partial}
                    verdict={r.average !== null && !partial ? VERDICT[bacStatus(r.average)] : null}
                >
                    <p>
                        <span className="tabular-nums">{fmt(r.points, 1)}</span> points sur{" "}
                        <span className="tabular-nums">{fmt(r.filledCoef * 20, 0)}</span> possibles
                        {partial && <> (coefficients saisis : {fmt(r.filledCoef, 0)} / {fmt(r.totalCoef, 0)})</>}.
                    </p>
                    {r.needed && (
                        <div className="mt-4">
                            <p className="font-semibold text-white">Moyenne à viser sur le reste :</p>
                            <ul className="mt-2 space-y-1">
                                {r.needed.map((n) => (
                                    <li key={n.target} className="flex justify-between gap-3">
                                        <span>{n.target === 10 ? "Pour l'avoir" : `Pour ${n.target}/20`}</span>
                                        <span className="tabular-nums font-semibold text-white">
                                            {n.note <= 0 ? "déjà acquis" : n.note > 20 ? "hors d'atteinte" : `${fmt(n.note)}/20`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {!partial && r.average !== null && bacStatus(r.average) === "rattrapage" && (
                        <p className="mt-4">
                            Entre 8 et 10 : tu passes deux oraux de rattrapage (français, philosophie, spécialités ou
                            maths de première). Le jury garde la meilleure des deux notes.
                        </p>
                    )}
                </ResultCard>
            </div>
        </div>
    );
}
