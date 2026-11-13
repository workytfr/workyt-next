"use client";

import { motion } from "framer-motion";
import { getMascot, type MascotName, type Emotion } from "@/data/mascots";
import Foxy, { type FoxyPose } from "@/components/foxy/Foxy";

/** Foxy est dessiné : chaque émotion correspond à une pose illustrée */
const FOXY_POSE: Record<Emotion, FoxyPose> = {
    joyeux: "bonjour",
    triste: "oups",
    surpris: "reflechit",
    amoureux: "bravo",
    fache: "oups",
    endormi: "pause",
    clin: "bonjour",
};
const FOXY_SIZE: Record<NonNullable<MascotProps["size"]>, number> = { sm: 72, md: 104, lg: 140 };

interface MascotProps {
    name?: MascotName;
    emotion?: Emotion;
    /** Message affiché dans une bulle à côté de la mascotte. */
    message?: string;
    /** Couleur du tracé ASCII (par défaut orange Workyt). */
    color?: string;
    /** Taille du texte ASCII. */
    size?: "sm" | "md" | "lg";
    /** Petit flottement animé. */
    float?: boolean;
    className?: string;
}

const SIZE_CLASS: Record<NonNullable<MascotProps["size"]>, string> = {
    sm: "text-[10px]",
    md: "text-sm",
    lg: "text-base",
};

export default function Mascot({
    name = "foxy",
    emotion = "joyeux",
    message,
    color = "#f97316",
    size = "md",
    float = true,
    className = "",
}: MascotProps) {
    const art = getMascot(name, emotion);
    const floatProps = float
        ? { animate: { y: [0, -4, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const } }
        : {};

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {name === "foxy" ? (
                <motion.div aria-hidden className="shrink-0" {...floatProps}>
                    <Foxy pose={FOXY_POSE[emotion]} size={FOXY_SIZE[size]} />
                </motion.div>
            ) : (
            <motion.pre
                aria-hidden
                className={`shrink-0 select-none font-mono leading-none whitespace-pre ${SIZE_CLASS[size]}`}
                style={{ color }}
                {...(float
                    ? { animate: { y: [0, -4, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
                    : {})}
            >
                {art}
            </motion.pre>
            )}

            {message && (
                <motion.div
                    initial={{ opacity: 0, x: -6, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                    className="relative rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white px-4 py-2.5 text-sm text-[#37352f] shadow-sm"
                >
                    {/* petite flèche pointant vers la mascotte */}
                    <span className="absolute left-[-7px] top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 border-b border-l border-[rgba(26,21,18,0.1)] bg-white" />
                    {message}
                </motion.div>
            )}
        </div>
    );
}
