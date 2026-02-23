"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/Tooltip";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/home/footer";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <Navbar />
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Footer />
      </ThemeProvider>
    </SessionProvider>
  );
} 