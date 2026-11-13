"use client";

import { motion } from "framer-motion";

/** Tampon « Validée » qui s'abat sur le parchemin quand il entre à l'écran. */
export default function Stamp() {
    return (
        <motion.span
            initial={{ opacity: 0, scale: 2.2, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -8 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.9, duration: 0.35, ease: "easeOut" }}
            className="mt-2 inline-block rounded-md border-[3px] border-[#2f7a3a] px-2 py-0.5 font-mono-ui text-xs font-bold uppercase not-italic tracking-widest text-[#2f7a3a]"
        >
            ✓ Validée
        </motion.span>
    );
}
