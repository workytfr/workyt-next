"use client";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react"; // Import du SessionProvider
import { TooltipProvider } from "@/components/ui/Tooltip";
import { ReactNode } from "react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/home/footer";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="fr">
        <body>
        {/* Enveloppe avec le SessionProvider */}
        <NextSSRPlugin
            /**
             * The `extractRouterConfig` will extract **only** the route configs
             * from the router to prevent additional information from being
             * leaked to the client. The data passed to the client is the same
             * as if you were to fetch `/api/uploadthing` directly.
             */
            routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <Navbar />
                <TooltipProvider>
                {children}
                </TooltipProvider>
                <Footer />
            </ThemeProvider>
        </SessionProvider>

        {/* Tidio Script */}
        <script
            src="//code.tidio.co/hpgdmupdosivjm7gryravknira1bbbgu.js"
            async
        ></script>

        {/* Cookie Consent Scripts */}
        <script
            type="text/javascript"
            src="https://cache.consentframework.com/js/pa/28806/c/pjmlS/stub"
            referrerPolicy="unsafe-url"
            charSet="utf-8"
            async
        ></script>
        <script
            type="text/javascript"
            src="https://choices.consentframework.com/js/pa/28806/c/pjmlS/cmp"
            referrerPolicy="unsafe-url"
            charSet="utf-8"
            async
        ></script>

        {/* Google Ads Scripts */}
        <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=AW-10979332706"
        ></script>
        <script
            id="google-analytics"
            dangerouslySetInnerHTML={{
                __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'AW-10979332706');
                            gtag('event', 'conversion', {'send_to': 'AW-10979332706/HSH7CP-6g9sDEOKkrfMo'});
                        `,
            }}
        ></script>

        {/* Mailchimp Script */}
        <script
            id="mcjs"
            dangerouslySetInnerHTML={{
                __html: `
                            (function(c,h,i,m,p){
                                m = c.createElement(h),
                                p = c.getElementsByTagName(h)[0],
                                m.async = 1;
                                m.src = i;
                                p.parentNode.insertBefore(m,p);
                            })(document,"script","https://chimpstatic.com/mcjs-connected/js/users/7e5e31a95d8d924397deba535/7bee0dc79cb596b3ac1a6081a.js");
                        `,
            }}
        ></script>
        </body>
        </html>
    );
}
