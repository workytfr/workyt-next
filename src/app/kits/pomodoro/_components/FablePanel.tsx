"use client";

import { Lock } from "lucide-react";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";
import { FABLE_CREDIT, FABLE_TITLE, FABLE_VERSES, POMODOROS_PER_FABLE, VERSES_PER_POMODORO, fableProgress } from "@/lib/pomodoro/fable";

export default function FablePanel() {
    const { fableCount } = usePomodoro();
    const { recitations, unlockedVerses, complete } = fableProgress(fableCount);
    const left = POMODOROS_PER_FABLE - unlockedVerses / VERSES_PER_POMODORO;

    return (
        <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif-display text-2xl">La fable : {FABLE_TITLE}</h2>
                {recitations > 0 && (
                    <span className="wk-chip">Récitée {recitations}×</span>
                )}
            </div>
            <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                {complete
                    ? "Fable complète ! Comme Corvy, tu as gardé ton fromage."
                    : `Chaque focus réussi dévoile ${VERSES_PER_POMODORO} vers. Encore ${left} pomodoro${left > 1 ? "s" : ""} pour la finir.`}
            </p>

            <ol className="mt-5 space-y-1 font-serif-display text-[15px] leading-relaxed">
                {FABLE_VERSES.map((verse, i) =>
                    i < unlockedVerses ? (
                        <li key={i} className="text-[var(--wk-ink)]">{verse}</li>
                    ) : (
                        <li key={i} className="flex items-center gap-2 text-[rgba(26,21,18,0.22)]" aria-label="Vers verrouillé">
                            <Lock className="h-3 w-3 shrink-0" />
                            <span className="h-2 flex-1 rounded-full bg-[rgba(26,21,18,0.06)]" style={{ maxWidth: `${40 + ((i * 37) % 50)}%` }} />
                        </li>
                    ),
                )}
            </ol>
            <p className="mt-4 text-right text-xs italic text-[rgba(26,21,18,0.45)]">{FABLE_CREDIT}</p>
        </section>
    );
}
