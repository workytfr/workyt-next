import { fmt, mentionFor } from "@/lib/exams/common";

/** Carte de résultat collante : moyenne, mention et détails. */
export default function ResultCard({
    average,
    partial,
    verdict,
    children,
}: {
    average: number | null;
    /** Toutes les notes ne sont pas encore saisies */
    partial: boolean;
    verdict?: { label: string; tone: "ok" | "warn" | "ko" } | null;
    children?: React.ReactNode;
}) {
    const mention = average !== null ? mentionFor(average) : null;
    const tone = verdict?.tone === "ok" ? "bg-[#e9f8e1] text-[#2f6b1a]" : verdict?.tone === "warn" ? "bg-[#fff1d6] text-[#8a5a00]" : "bg-[#fde4e1] text-[#9b2c1f]";

    return (
        <div className="rounded-[28px] bg-[var(--wk-ink)] p-6 text-[var(--wk-paper)] lg:sticky lg:top-28">
            <div className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/55">
                {partial ? "Moyenne provisoire" : "Moyenne finale"}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif-display text-6xl leading-none tabular-nums">{average !== null ? fmt(average) : "—"}</span>
                <span className="text-white/50">/20</span>
            </div>
            {average !== null && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {verdict && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{verdict.label}</span>}
                    {mention && mention.min >= 12 && (
                        <span className="rounded-full bg-[var(--wk-accent)] px-3 py-1 text-xs font-semibold text-white">
                            Mention {mention.label.toLowerCase()}
                        </span>
                    )}
                </div>
            )}
            {partial && average !== null && (
                <p className="mt-3 text-xs text-white/55">Calculée sur les notes déjà saisies uniquement.</p>
            )}
            {children && <div className="mt-5 border-t border-white/10 pt-5 text-sm text-white/80">{children}</div>}
        </div>
    );
}
