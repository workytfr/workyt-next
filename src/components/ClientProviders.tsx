"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/Tooltip";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/home/footer";
import { Toaster } from "sonner";
import YoutubeLivePill from "@/components/ui/YoutubeLivePill";
import { PomodoroProvider } from "@/components/pomodoro/PomodoroProvider";
import PomodoroWidget from "@/components/pomodoro/PomodoroWidget";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Cacher la navbar et le footer sur le dashboard
  const isDashboard = pathname?.startsWith("/dashboard");
  // Versions imprimables d'un cours (PDF) : la page seule, sans navigation
  const isPrint = /^\/cours\/[^/]+\/imprimer(\/|$)/.test(pathname ?? "");

  return (
    <SessionProvider>
      <ThemeProvider>
        <PomodoroProvider>
          {!isDashboard && !isPrint && <Navbar />}
          <TooltipProvider>
            <main id="main-content">{children}</main>
          </TooltipProvider>
          {!isDashboard && !isPrint && <Footer />}
          {!isPrint && <YoutubeLivePill />}
          {!isDashboard && !isPrint && <PomodoroWidget />}
          <Toaster position="bottom-right" richColors />
        </PomodoroProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
