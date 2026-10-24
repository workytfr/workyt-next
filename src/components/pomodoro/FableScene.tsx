"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CROW_LINES, FOX_FLATTERIES, FOX_LINES } from "@/lib/pomodoro/fable";
import { CrowArt, FoxArt, TreeArt, type CrowMood, type FoxMood } from "./FableArt";
import type { Outcome, Phase, Status } from "./PomodoroProvider";

/** Une nouvelle flatterie de Foxy toutes les 90 secondes de focus. */
const FLATTERY_EVERY_MS = 90_000;

/** La scène est composée sur une toile fixe, mise à l'échelle sur petit écran. */
const STAGE_W = 720;
const STAGE_H = 320;

interface FableSceneProps {
    phase: Phase;
    status: Status;
    outcome: Outcome;
    remainingMs: number;
    totalMs: number;
}

interface Cast {
    crow: CrowMood;
    fox: FoxMood;
    crowLine: string;
    foxLine: string;
    /** Où est le fromage */
    cheese: "crow" | "fox";
}

function cast({ phase, status, outcome, remainingMs, totalMs }: FableSceneProps): Cast {
    if (phase === "focus") {
        if (status === "running") {
            const i = Math.floor((totalMs - remainingMs) / FLATTERY_EVERY_MS) % FOX_FLATTERIES.length;
            return { crow: "concentre", fox: i % 2 ? "charmeur" : "ruse", crowLine: CROW_LINES.focus, foxLine: FOX_FLATTERIES[i], cheese: "crow" };
        }
        if (status === "paused") {
            return { crow: "inquiet", fox: "charmeur", crowLine: CROW_LINES.paused, foxLine: FOX_LINES.paused, cheese: "crow" };
        }
        if (outcome === "stolen") {
            return { crow: "triste", fox: "content", crowLine: CROW_LINES.stolen, foxLine: FOX_LINES.stolen, cheese: "fox" };
        }
        return { crow: "calme", fox: "ruse", crowLine: CROW_LINES.idle, foxLine: FOX_LINES.idle, cheese: "crow" };
    }
    // Pauses : le fromage a été gardé, Corvy en profite
    if (status === "idle" && outcome === "kept") {
        return { crow: "fier", fox: "decu", crowLine: CROW_LINES.kept, foxLine: FOX_LINES.kept, cheese: "crow" };
    }
    return {
        crow: phase === "long" ? "dort" : "fier",
        fox: "decu",
        crowLine: phase === "long" ? CROW_LINES.longBreak : CROW_LINES.shortBreak,
        foxLine: FOX_LINES.break,
        cheese: "crow",
    };
}

const INK = "#3A2E2E";

const SPEAKERS = {
    corvy: { name: "Corvy", bg: "#EFEBFA", color: "#3B3553" },
    foxy: { name: "Foxy", bg: "#FFEBDD", color: "#D9500C" },
} as const;

type Tail = "left" | "right" | "up-left" | "up-right";

/** Pointe de la bulle : elle recouvre la bordure et vise le personnage qui parle. */
function BubbleTail({ tail, bg }: { tail: Tail; bg: string }) {
    const common = { fill: bg, stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const };
    if (tail === "left" || tail === "right") {
        return (
            <svg
                width="18"
                height="22"
                viewBox="0 0 18 22"
                className={`absolute top-[14px] ${tail === "left" ? "-left-[15px]" : "-right-[15px]"}`}
                aria-hidden
            >
                <path d={tail === "left" ? "M18 1 L2 11 L18 21" : "M0 1 L16 11 L0 21"} {...common} />
            </svg>
        );
    }
    return (
        <svg
            width="22"
            height="18"
            viewBox="0 0 22 18"
            className={`absolute -top-[15px] ${tail === "up-left" ? "left-[84px]" : "right-[40px]"}`}
            aria-hidden
        >
            <path d="M1 18 L11 2 L21 18" {...common} />
        </svg>
    );
}

function Bubble({ who, text, tail }: { who: keyof typeof SPEAKERS; text: string; tail: Tail }) {
    const sp = SPEAKERS[who];
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={text}
                initial={{ opacity: 0, y: 6, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="relative w-max max-w-[230px] rounded-2xl border-[3px] px-3.5 pb-2 pt-1.5 text-[14px] font-medium leading-snug shadow-[0_3px_0_#3A2E2E]"
                style={{ background: sp.bg, borderColor: INK, color: INK }}
            >
                <span className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: sp.color }}>
                    {sp.name}
                </span>
                {text}
                <BubbleTail tail={tail} bg={sp.bg} />
            </motion.div>
        </AnimatePresence>
    );
}

export default function FableScene(props: FableSceneProps) {
    const c = cast(props);
    const isBreak = props.phase !== "focus";
    const focusing = props.phase === "focus" && props.status === "running";

    const boxRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / STAGE_W)));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    // Trop petites une fois réduites : les bulles passent sous la scène
    const compact = scale < 0.75;

    return (
        <div>
            <div
                ref={boxRef}
                className={`relative overflow-hidden rounded-[28px] border border-[rgba(26,21,18,0.08)] transition-colors duration-700 ${
                    isBreak ? "bg-gradient-to-b from-[#d9eefa] to-[#f4f9fc]" : "bg-gradient-to-b from-[#ffe9d4] to-[#fff8ef]"
                }`}
                style={{ height: STAGE_H * scale }}
                aria-label="Corvy et Foxy"
            >
                <div className="absolute left-0 top-0 origin-top-left" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
                    {/* Ciel : soleil (focus) ou lune douce (pause) et nuages */}
                    <div
                        className={`absolute right-16 top-8 h-16 w-16 rounded-full border-[3px] border-[#3A2E2E] transition-colors duration-700 ${
                            isBreak ? "bg-[#fff4c2]" : "bg-[#ffb547]"
                        }`}
                        aria-hidden
                    />
                    <motion.svg
                        viewBox="0 0 120 50"
                        className="absolute left-[380px] top-1 w-20"
                        animate={{ x: [0, 18, 0] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        aria-hidden
                    >
                        <path d="M14 42 C 0 42, 2 24, 18 26 C 20 10, 46 8, 52 22 C 60 12, 84 14, 84 30 C 100 26, 112 42, 96 42 Z" fill="#fff" stroke="#3A2E2E" strokeWidth="3.5" strokeLinejoin="round" />
                    </motion.svg>

                    {/* Colline */}
                    <svg viewBox="0 0 720 80" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-20 w-full" aria-hidden>
                        <path d="M0 34 C 160 10, 360 20, 520 18 C 620 16, 690 26, 720 30 L720 80 L0 80 Z" fill="#B9E28C" stroke="#3A2E2E" strokeWidth="4" />
                    </svg>

                    {/* Arbre et Corvy */}
                    <div className="absolute bottom-0 left-0 h-[300px] w-[380px]">
                        <TreeArt className="absolute inset-0 h-full w-full" />
                        <motion.div
                            className="absolute left-[136px] top-[3px] w-[140px]"
                            animate={focusing ? { y: [0, -2, 0] } : { y: 0 }}
                            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <CrowArt mood={c.crow} holding={c.cheese === "crow"} className="h-auto w-full" />
                        </motion.div>
                        </div>
                    {!compact && (
                        <div className="absolute left-[302px] top-[46px]">
                            <Bubble who="corvy" text={c.crowLine} tail="left" />
                        </div>
                    )}

                    {/* Foxy */}
                    <motion.div
                        className="absolute bottom-[14px] right-[40px] w-[170px]"
                        animate={focusing ? { x: [0, -8, 0, 5, 0] } : { x: 0 }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <FoxArt mood={c.fox} holding={c.cheese === "fox"} className="h-auto w-full" />
                    </motion.div>
                    {!compact && (
                        <div className="absolute right-[178px] top-[176px]">
                            <Bubble who="foxy" text={c.foxLine} tail="right" />
                        </div>
                    )}
                </div>
            </div>
            {compact && (
                <div className="mt-5 flex flex-col gap-5">
                    <Bubble who="corvy" text={c.crowLine} tail="up-left" />
                    <div className="flex justify-end">
                        <Bubble who="foxy" text={c.foxLine} tail="up-right" />
                    </div>
                </div>
            )}
        </div>
    );
}
