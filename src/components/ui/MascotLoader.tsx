"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Mascot from "@/components/ui/Mascot";
import type { MascotName, Emotion } from "@/data/mascots";

interface MascotLoaderProps {
    /** Message affiché sous les mascottes. */
    message?: string;
    /** Intervalle (ms) entre chaque mascotte. */
    interval?: number;
    /** Taille de l'ASCII. */
    size?: "sm" | "md" | "lg";
    className?: string;
}

// On fait défiler les différentes mascottes ASCII de Workyt pendant le chargement.
const CYCLE: { name: MascotName; emotion: Emotion }[] = [
    { name: "foxy", emotion: "joyeux" },
    { name: "pando", emotion: "surpris" },
    { name: "corvy", emotion: "joyeux" },
    { name: "foxy", emotion: "clin" },
    { name: "pando", emotion: "joyeux" },
    { name: "corvy", emotion: "surpris" },
];

export default function MascotLoader({
    message = "Chargement…",
    interval = 900,
    size = "lg",
    className = "",
}: MascotLoaderProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((i) => (i + 1) % CYCLE.length);
        }, interval);
        return () => clearInterval(id);
    }, [interval]);

    const current = CYCLE[index];

    return (
        <div className={`flex flex-col items-center justify-center gap-4 py-8 ${className}`}>
            <div className="relative h-24 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -8 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <Mascot name={current.name} emotion={current.emotion} size={size} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Petits points qui pulsent */}
            <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className="block w-2 h-2 rounded-full bg-[#f97316]"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </div>

            <p className="text-sm font-medium text-[#6b6b6b]">{message}</p>
        </div>
    );
}
