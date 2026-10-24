"use client";

/**
 * Mini-Pomodoro flottant (bas gauche) visible pendant la navigation, et lecteur
 * de la radio lofi. Le lecteur vit ici, au niveau de la mise en page, pour que
 * la musique ne s'arrête pas quand l'élève change de page. Il n'est monté que
 * pendant un focus : la radio démarre avec le focus et s'arrête avec lui.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play, Radio, Square, X } from "lucide-react";
import { formatClock, phaseLabel, usePomodoro } from "./PomodoroProvider";
import { radioEmbedUrl } from "@/lib/pomodoro/radio";

const POMODORO_PATH = "/kits/pomodoro";

export default function PomodoroWidget() {
    const pathname = usePathname();
    const p = usePomodoro();
    if (!p.hydrated) return null;

    const onPomodoroPage = pathname === POMODORO_PATH;
    const active = p.status !== "idle";
    const showTimer = active && !onPomodoroPage;
    const radioOn = p.focusing && p.radio !== null;
    if (!showTimer && !radioOn) return null;

    const progress = 1 - p.remainingMs / p.totalMs;
    const isFocus = p.phase === "focus";

    return (
        <div className="fixed bottom-24 left-4 z-50 flex flex-col items-start gap-2 md:bottom-6 print:hidden">
            {radioOn && p.radio && (
                // Taille minimale de 200×200 exigée par YouTube pour les lecteurs intégrés
                <div className="overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.12)] bg-[var(--wk-ink)] shadow-xl">
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] text-white/80">
                        <span className="flex min-w-0 items-center gap-1.5">
                            <Radio className="h-3.5 w-3.5 shrink-0 text-[var(--wk-accent-2)]" />
                            <span className="truncate">{p.radio.label}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => p.setRadio(null)}
                            className="rounded-full p-0.5 hover:bg-white/10"
                            aria-label="Couper la radio"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <iframe
                        src={radioEmbedUrl(p.radio.videoId)}
                        title="Radio lofi (YouTube)"
                        width={240}
                        height={200}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="block"
                    />
                </div>
            )}

            {showTimer && (
                <div className="flex items-center gap-1.5 rounded-full border border-[rgba(26,21,18,0.1)] bg-white/95 py-1.5 pl-1.5 pr-2 shadow-[0_10px_30px_rgba(26,21,18,0.18)] backdrop-blur">
                    <Link
                        href={POMODORO_PATH}
                        className="relative flex h-10 w-10 items-center justify-center rounded-full"
                        aria-label="Ouvrir le Pomodoro"
                        style={{
                            background: `conic-gradient(${isFocus ? "var(--wk-accent)" : "var(--wk-accent-3)"} ${progress * 360}deg, rgba(26,21,18,0.08) 0deg)`,
                        }}
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base">
                            {isFocus ? "🧀" : "☕"}
                        </span>
                    </Link>
                    <Link href={POMODORO_PATH} className="flex flex-col pr-1 leading-tight">
                        <span className="font-mono-ui text-base font-semibold tabular-nums text-[var(--wk-ink)]">
                            {formatClock(p.remainingMs)}
                        </span>
                        <span className="text-[11px] text-[rgba(26,21,18,0.55)]">
                            {p.status === "paused" ? "En pause" : phaseLabel(p.phase)}
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={p.status === "running" ? p.pause : p.start}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wk-ink)] text-[var(--wk-paper)] transition hover:bg-black"
                        aria-label={p.status === "running" ? "Mettre en pause" : "Reprendre"}
                    >
                        {p.status === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!isFocus || window.confirm("Abandonner le focus ? Foxy va prendre le fromage.")) p.stop();
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[rgba(26,21,18,0.55)] transition hover:bg-[rgba(26,21,18,0.06)]"
                        aria-label={isFocus ? "Abandonner le focus" : "Terminer la pause"}
                        title={isFocus ? "Abandonner (Foxy prend le fromage)" : "Terminer la pause"}
                    >
                        <Square className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
