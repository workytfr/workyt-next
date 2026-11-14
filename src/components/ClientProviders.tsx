"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/Tooltip";
import Navbar from "@/components/navbar/Navbar";
import { Toaster } from "sonner";
import PomodoroGate from "@/components/pomodoro/PomodoroGate";

// Pastille des lives : rien à afficher au premier rendu (elle attend la réponse
// de /api/youtube-live). Son code arrive après le chargement de la page, quand
// le navigateur est libre, au lieu de passer dans le bundle commun.
const YoutubeLivePill = dynamic(() => import("@/components/ui/YoutubeLivePill"), { ssr: false });

/** Vrai une fois la page chargée et le navigateur au repos. */
function useIdle(): boolean {
    const [idle, setIdle] = useState(false);
    useEffect(() => {
        const ric = window.requestIdleCallback;
        if (ric) {
            const id = ric(() => setIdle(true), { timeout: 3000 });
            return () => window.cancelIdleCallback(id);
        }
        const id = window.setTimeout(() => setIdle(true), 1500);
        return () => clearTimeout(id);
    }, []);
    return idle;
}

export default function ClientProviders({
    children,
    footer,
}: {
    children: React.ReactNode;
    /** Pied de page rendu côté serveur par le layout (aucun JavaScript). */
    footer: React.ReactNode;
}) {
    const pathname = usePathname();
    const idle = useIdle();

    // Cacher la navbar et le footer sur le dashboard
    const isDashboard = pathname?.startsWith("/dashboard");
    // Versions imprimables d'un cours (PDF) : la page seule, sans navigation
    const isPrint = /^\/cours\/[^/]+\/imprimer(\/|$)/.test(pathname ?? "");

    return (
        <SessionProvider>
            <ThemeProvider>
                {!isDashboard && !isPrint && <Navbar />}
                <TooltipProvider>
                    <main id="main-content">{children}</main>
                </TooltipProvider>
                {!isDashboard && !isPrint && footer}
                {!isPrint && idle && <YoutubeLivePill />}
                {/* Pomodoro : moteur chargé seulement s'il sert (voir PomodoroGate) */}
                <PomodoroGate showWidget={!isDashboard && !isPrint} />
                <Toaster position="bottom-right" richColors />
            </ThemeProvider>
        </SessionProvider>
    );
}
