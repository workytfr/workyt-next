"use client";

import { useState } from "react";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";
import { PRESETS, SETTINGS_LIMITS, type PomodoroSettings } from "@/lib/pomodoro/settings";

type NumberKey = keyof typeof SETTINGS_LIMITS;
type BoolKey = { [K in keyof PomodoroSettings]: PomodoroSettings[K] extends boolean ? K : never }[keyof PomodoroSettings];

const DURATIONS: { key: Exclude<NumberKey, "dailyGoal">; label: string; unit: string }[] = [
    { key: "focusMin", label: "Focus", unit: "min" },
    { key: "shortBreakMin", label: "Pause courte", unit: "min" },
    { key: "longBreakMin", label: "Pause longue", unit: "min" },
    { key: "cyclesBeforeLong", label: "Focus avant la pause longue", unit: "" },
];

const TOGGLES: { key: BoolKey; label: string; hint?: string }[] = [
    { key: "autoStartBreaks", label: "Lancer les pauses automatiquement" },
    { key: "autoStartFocus", label: "Relancer le focus après la pause" },
    { key: "sound", label: "Carillon en fin de phase" },
    { key: "notifications", label: "Notification du navigateur", hint: "Utile si l'onglet est en arrière-plan." },
    { key: "strictMode", label: "Mode strict", hint: "Quitter l'onglet plus de 30 s pendant un focus = Foxy prend le fromage." },
];

/** Champ numérique validé à la sortie du champ : taper « 15 » ne passe pas par « 1 » borné à 5. */
function NumberField({ label, unit, value, min, max, onCommit }: {
    label: string;
    unit: string;
    value: number;
    min: number;
    max: number;
    onCommit: (n: number) => void;
}) {
    // Remonté (key) quand la valeur change ailleurs : le brouillon repart de la valeur
    const [draft, setDraft] = useState(String(value));
    const commit = () => {
        const n = Number(draft);
        if (draft.trim() === "" || !Number.isFinite(n)) setDraft(String(value));
        else {
            const clamped = Math.min(max, Math.max(min, Math.round(n)));
            setDraft(String(clamped));
            onCommit(clamped);
        }
    };
    return (
        <label className="block">
            <span className="text-xs font-semibold text-[rgba(26,21,18,0.6)]">{label}</span>
            <span className="mt-1 flex items-center gap-2 rounded-2xl border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] px-3 py-2">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => e.key === "Enter" && commit()}
                    className="w-full bg-transparent text-sm font-semibold tabular-nums outline-none"
                />
                {unit && <span className="whitespace-nowrap text-xs text-[rgba(26,21,18,0.5)]">{unit}</span>}
            </span>
        </label>
    );
}

export default function SettingsPanel() {
    const { settings, updateSettings, status, isAuthenticated } = usePomodoro();
    const locked = status !== "idle";

    return (
        <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
            <h2 className="font-serif-display text-2xl">Réglages</h2>
            <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                {isAuthenticated
                    ? "Enregistrés sur ton compte : tu les retrouves sur tous tes appareils."
                    : "Enregistrés dans ce navigateur."}
                {locked && " Les durées s'appliqueront à la prochaine phase."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                {PRESETS.map((pr) => {
                    const on = settings.focusMin === pr.focusMin && settings.shortBreakMin === pr.shortBreakMin && settings.longBreakMin === pr.longBreakMin;
                    return (
                        <button
                            key={pr.label}
                            type="button"
                            aria-pressed={on}
                            onClick={() => updateSettings({ focusMin: pr.focusMin, shortBreakMin: pr.shortBreakMin, longBreakMin: pr.longBreakMin })}
                            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                                on ? "bg-[var(--wk-accent)] text-white" : "bg-[var(--wk-paper-2)] text-[rgba(26,21,18,0.7)] hover:bg-[#ece3d1]"
                            }`}
                        >
                            {pr.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                {DURATIONS.map((d) => (
                    <NumberField
                        key={`${d.key}-${settings[d.key]}`}
                        label={d.label}
                        unit={d.unit}
                        value={settings[d.key]}
                        min={SETTINGS_LIMITS[d.key][0]}
                        max={SETTINGS_LIMITS[d.key][1]}
                        onCommit={(n) => updateSettings({ [d.key]: n })}
                    />
                ))}
            </div>

            {isAuthenticated && (
                <div className="mt-3">
                    <NumberField
                        key={settings.dailyGoal}
                        label="Objectif quotidien"
                        unit="pomodoros / jour"
                        value={settings.dailyGoal}
                        min={SETTINGS_LIMITS.dailyGoal[0]}
                        max={SETTINGS_LIMITS.dailyGoal[1]}
                        onCommit={(n) => updateSettings({ dailyGoal: n })}
                    />
                </div>
            )}

            <div className="mt-5 space-y-3">
                {TOGGLES.map((t) => (
                    <label key={t.key} className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={settings[t.key]}
                            onChange={(e) => updateSettings({ [t.key]: e.target.checked })}
                            className="mt-0.5 h-4 w-4 accent-[var(--wk-accent)]"
                        />
                        <span className="text-sm">
                            {t.label}
                            {t.hint && <span className="block text-xs text-[rgba(26,21,18,0.5)]">{t.hint}</span>}
                        </span>
                    </label>
                ))}
            </div>
        </section>
    );
}
