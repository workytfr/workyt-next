"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/Tooltip";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/home/footer";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Cacher la navbar et le footer sur le dashboard
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <SessionProvider>
      <ThemeProvider>
        {!isDashboard && <Navbar />}
        <TooltipProvider>
          {children}
        </TooltipProvider>
        {!isDashboard && <Footer />}
      </ThemeProvider>
    </SessionProvider>
  );
}
