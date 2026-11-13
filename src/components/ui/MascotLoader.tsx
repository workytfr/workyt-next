"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Foxy, { type FoxyPose } from "@/components/foxy/Foxy";

interface MascotLoaderProps {
    /** Message affiché sous les mascottes. */
    message?: string;
    /** Intervalle (ms) entre chaque mascotte. */
    interval?: number;
    /** Taille de l'ASCII. */
    size?: "sm" | "md" | "lg";
    className?: string;
}

// Pendant le chargement, Foxy passe d'une pose « au travail » à l'autre.
const FOXY_SIZE = { sm: 72, md: 104, lg: 140 } as const;
const CYCLE: FoxyPose[] = ["reflechit", "lecture", "cherche"];

export default function MascotLoader({
    message = "Chargement…",
    interval = 1400,
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
            <div className="relative flex items-center justify-center" style={{ height: FOXY_SIZE[size] * 1.03 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.96, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -6 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <Foxy pose={current} size={FOXY_SIZE[size]} />
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
