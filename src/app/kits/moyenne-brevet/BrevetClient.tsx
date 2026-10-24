"use client";

import NoteInput from "../_components/NoteInput";
import ResultCard from "../_components/ResultCard";
import { useStoredState } from "../_components/useStoredState";
import { BREVET_DISCIPLINES, BREVET_EXAMS, computeBrevet } from "@/lib/exams/brevet";
import { fmt, parseNote } from "@/lib/exams/common";

export default function BrevetClient() {
    const [exams, setExams] = useStoredState<Record<string, string>>("wk-brevet-epreuves", {});
    const [cc, setCc] = useStoredState<Record<string, string>>("wk-brevet-controle", {});
    const [option, setOption] = useStoredState<string>("wk-brevet-option", "");

    const examNotes = BREVET_EXAMS.map((e) => ({ note: parseNote(exams[e.key] ?? ""), coef: e.coef }));
    const ccNotes = BREVET_DISCIPLINES.map((d) => parseNote(cc[d] ?? ""));
    const r = computeBrevet(examNotes, ccNotes, parseNote(option));
    // Une matière de contrôle continu laissée vide = non suivie, pas une note manquante
    const partial = examNotes.some((n) => n.note === null) || r.controle === null;
    const optionBonus = parseNote(option);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
                <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
                    <h2 className="font-serif-display text-2xl">Contrôle continu</h2>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                        40 % de la note. Mets ta moyenne annuelle de 3e dans chaque matière : elles comptent toutes
                        pareil. Laisse vide une matière que tu ne suis pas.
                    </p>
                    <div className="mt-3 divide-y divide-[rgba(26,21,18,0.06)]">
                        {BREVET_DISCIPLINES.map((d) => (
                            <NoteInput key={d} id={`cc-${d}`} label={d} value={cc[d] ?? ""} onChange={(v) => setCc((c) => ({ ...c, [d]: v }))} />
                        ))}
                        <NoteInput
                            id="cc-option"
                            label="Enseignement facultatif (bonus)"
                            hint="Latin, grec, LCE, chant choral, langue régionale… Seuls les points au-dessus de 10 comptent."
                            value={option}
                            onChange={setOption}
                        />
                    </div>
                </section>

                <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
                    <h2 className="font-serif-display text-2xl">Épreuves finales</h2>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">60 % de la note · chaque épreuve est notée sur 20.</p>
                    <div className="mt-3 divide-y divide-[rgba(26,21,18,0.06)]">
                        {BREVET_EXAMS.map((e) => (
                            <NoteInput
                                key={e.key}
                                id={`dnb-${e.key}`}
                                label={e.label}
                                hint={e.hint}
                                coef={e.coef}
                                value={exams[e.key] ?? ""}
                                onChange={(v) => setExams((x) => ({ ...x, [e.key]: v }))}
                            />
                        ))}
                    </div>
                </section>

                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm("Effacer toutes les notes ?")) {
                            setExams({});
                            setCc({});
                            setOption("");
                        }
                    }}
                    className="text-sm font-semibold text-[rgba(26,21,18,0.5)] underline-offset-4 hover:underline"
                >
                    Tout effacer
                </button>
            </div>

            <div className="lg:col-span-4">
                <ResultCard
                    average={r.final}
                    partial={partial}
                    verdict={r.final !== null && !partial ? (r.final >= 10 ? { label: "Admis", tone: "ok" } : { label: "Non admis", tone: "ko" }) : null}
                >
                    <ul className="space-y-1.5">
                        <li className="flex justify-between gap-3">
                            <span>Contrôle continu (40 %)</span>
                            <span className="font-semibold tabular-nums text-white">{r.controle !== null ? `${fmt(r.controle)}/20` : "—"}</span>
                        </li>
                        {optionBonus !== null && optionBonus > 10 && (
                            <li className="flex justify-between gap-3 text-xs text-white/60">
                                <span>dont bonus option</span>
                                <span className="tabular-nums">+{fmt(optionBonus - 10)} pts au total</span>
                            </li>
                        )}
                        <li className="flex justify-between gap-3">
                            <span>Épreuves finales (60 %)</span>
                            <span className="font-semibold tabular-nums text-white">{r.exams !== null ? `${fmt(r.exams)}/20` : "—"}</span>
                        </li>
                    </ul>
                    {r.neededExams !== null && r.exams === null && (
                        <p className="mt-4">
                            Avec ce contrôle continu, il te faut{" "}
                            <strong className="text-white">
                                {r.neededExams <= 0 ? "n'importe quelle note" : `${fmt(r.neededExams)}/20`}
                            </strong>{" "}
                            de moyenne aux épreuves finales pour avoir ton brevet.
                        </p>
                    )}
                </ResultCard>
            </div>
        </div>
    );
}
