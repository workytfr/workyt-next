"use client";

import { parseNote } from "@/lib/exams/common";

/** Ligne de saisie d'une note sur 20, avec son coefficient. */
export default function NoteInput({
    id,
    label,
    hint,
    coef,
    value,
    onChange,
}: {
    id: string;
    label: string;
    hint?: string;
    coef?: number;
    value: string;
    onChange: (v: string) => void;
}) {
    const invalid = value.trim() !== "" && parseNote(value) === null;
    return (
        <div className="flex items-center gap-3 py-2.5">
            <label htmlFor={id} className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug">{label}</span>
                {hint && <span className="block text-xs text-[rgba(26,21,18,0.5)]">{hint}</span>}
            </label>
            {coef !== undefined && (
                <span className="wk-chip shrink-0 tabular-nums" title="Coefficient">
                    coef {coef.toLocaleString("fr-FR")}
                </span>
            )}
            <span
                className={`flex w-[92px] shrink-0 items-center rounded-xl border bg-[var(--wk-paper)] px-2.5 py-1.5 ${
                    invalid ? "border-red-400" : "border-[rgba(26,21,18,0.14)] focus-within:border-[var(--wk-accent)]"
                }`}
            >
                <input
                    id={id}
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="—"
                    aria-invalid={invalid}
                    className="w-full min-w-0 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
                />
                <span className="pl-1 text-xs text-[rgba(26,21,18,0.45)]">/20</span>
            </span>
        </div>
    );
}
