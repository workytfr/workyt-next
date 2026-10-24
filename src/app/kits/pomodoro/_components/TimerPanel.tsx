"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import FableScene from "@/components/pomodoro/FableScene";
import { formatClock, phaseLabel, usePomodoro, type Phase } from "@/components/pomodoro/PomodoroProvider";
import { SUBJECTS } from "@/lib/pomodoro/settings";

const PHASES: Phase[] = ["focus", "short", "long"];

export default function TimerPanel() {
    const p = usePomodoro();
    const isFocus = p.phase === "focus";
    const progress = Math.min(1, Math.max(0, 1 - p.remainingMs / p.totalMs));
    const nextLong = p.settings.cyclesBeforeLong - (p.cycle % p.settings.cyclesBeforeLong);

    const onStop = () => {
        if (isFocus && p.status !== "idle" && !window.confirm("Abandonner le focus ? Foxy va prendre le fromage.")) return;
        p.stop();
    };

    return (
        <div className="space-y-4">
            <FableScene
                phase={p.phase}
                status={p.status}
                outcome={p.outcome}
                remainingMs={p.remainingMs}
                totalMs={p.totalMs}
            />

            <div className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-5 sm:p-7">
                {/* Choix de la phase (seulement à l'arrêt) */}
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Phase">
                    {PHASES.map((ph) => (
                        <button
                            key={ph}
                            type="button"
                            role="tab"
                            aria-selected={p.phase === ph}
                            disabled={p.status !== "idle" && p.phase !== ph}
                            onClick={() => p.selectPhase(ph)}
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:opacity-40 ${
                                p.phase === ph
                                    ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                                    : "bg-[var(--wk-paper-2)] text-[rgba(26,21,18,0.7)] hover:bg-[#ece3d1]"
                            }`}
                        >
                            {phaseLabel(ph)}
                        </button>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <div
                        className="font-mono-ui text-[clamp(4rem,14vw,7rem)] font-semibold leading-none tabular-nums text-[var(--wk-ink)]"
                        aria-live="off"
                    >
                        {formatClock(p.remainingMs)}
                    </div>
                    <div className="mx-auto mt-5 h-2 max-w-md overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)]">
                        <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                                width: `${progress * 100}%`,
                                background: isFocus ? "var(--wk-accent)" : "var(--wk-accent-3)",
                            }}
                        />
                    </div>
                    <p className="mt-3 text-sm text-[rgba(26,21,18,0.55)]">
                        {p.status === "paused" ? "En pause · " : ""}
                        {isFocus
                            ? `Pause longue dans ${nextLong} focus`
                            : p.phase === "long" ? "Grande pause : la série recommence ensuite" : "Petite pause"}
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={onStop}
                        disabled={p.status === "idle" && p.remainingMs === p.totalMs}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(26,21,18,0.12)] text-[rgba(26,21,18,0.6)] transition hover:bg-[var(--wk-paper-2)] disabled:opacity-30"
                        aria-label={isFocus ? "Abandonner le focus" : "Terminer la pause"}
                        title={isFocus ? "Abandonner" : "Terminer la pause"}
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
                    {p.status === "running" ? (
                        <button type="button" onClick={p.pause} className="wk-btn-ink min-w-[160px] justify-center text-lg">
                            <Pause className="h-5 w-5" /> Pause
                        </button>
                    ) : (
                        <button type="button" onClick={p.start} className="wk-btn-orange min-w-[160px] justify-center text-lg">
                            <Play className="h-5 w-5" /> {p.status === "paused" ? "Reprendre" : "Démarrer"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={p.skip}
                        disabled={isFocus}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(26,21,18,0.12)] text-[rgba(26,21,18,0.6)] transition hover:bg-[var(--wk-paper-2)] disabled:opacity-30"
                        aria-label="Passer la pause"
                        title="Passer la pause"
                    >
                        <SkipForward className="h-5 w-5" />
                    </button>
                </div>

                {/* Série en cours */}
                <div className="mt-6 flex items-center justify-center gap-2" aria-label={`${p.cycle % p.settings.cyclesBeforeLong} focus sur ${p.settings.cyclesBeforeLong} dans la série`}>
                    {Array.from({ length: p.settings.cyclesBeforeLong }, (_, i) => (
                        <span
                            key={i}
                            className={`h-2.5 w-2.5 rounded-full ${i < p.cycle % p.settings.cyclesBeforeLong ? "bg-[var(--wk-accent)]" : "bg-[rgba(26,21,18,0.12)]"}`}
                        />
                    ))}
                </div>

                {p.isAuthenticated && (
                    <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                        <label htmlFor="pomodoro-subject" className="text-sm text-[rgba(26,21,18,0.6)]">
                            Je travaille :
                        </label>
                        <select
                            id="pomodoro-subject"
                            value={p.subject}
                            onChange={(e) => p.setSubject(e.target.value)}
                            className="rounded-full border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] px-4 py-2 text-sm"
                        >
                            <option value="">Sans matière</option>
                            {SUBJECTS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
