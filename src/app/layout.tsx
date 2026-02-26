import "./globals.css";
import Script from "next/script";
import ClientProviders from "@/components/ClientProviders";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import { Funnel_Display, Montserrat } from "next/font/google";

const funnelDisplay = Funnel_Display({
    subsets: ["latin"],
    variable: "--font-funnel-display",
    display: "swap",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://workyt.fr"),
    title: {
        default: "Workyt - Plateforme d'entraide scolaire gratuite",
        template: "%s | Workyt",
    },
    description: "Workyt est une plateforme d'entraide scolaire gratuite. Cours, fiches de révision, forum d'aide aux devoirs et outils pour réussir au collège et au lycée.",
    keywords: "entraide scolaire, aide devoirs, cours gratuits, fiches de révision, forum scolaire, bac, brevet, lycée, collège",
    authors: [{ name: "Workyt" }],
    creator: "Workyt",
    publisher: "Workyt",
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: "website",
        locale: "fr_FR",
        url: "https://workyt.fr",
        siteName: "Workyt",
        title: "Workyt - Plateforme d'entraide scolaire gratuite",
        description: "Cours, fiches de révision, forum d'aide aux devoirs et outils pour réussir au collège et au lycée.",
        images: [
            {
                url: "/default-thumbnail.png",
                width: 1200,
                height: 630,
                alt: "Workyt",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        creator: "@workyt_fr",
        site: "@workyt_fr",
    },
    alternates: {
        canonical: "https://workyt.fr",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover", // Pour safe-area sur iPhone (notch, home indicator)
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="fr" suppressHydrationWarning>
        <body className={`${funnelDisplay.variable} ${montserrat.variable} font-sans overflow-x-hidden`}>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ClientProviders>
            {children}
        </ClientProviders>
        {/* Umami Analytics */}
        <Script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id="35576d18-82a4-49a7-8a72-cb4be757983b"
            strategy="afterInteractive"
        />
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
