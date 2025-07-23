"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/Tooltip";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/home/footer";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Footer />
        </ThemeProvider>
      </SessionProvider>
    </>
  );
} 