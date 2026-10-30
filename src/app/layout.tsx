import { jsonLd } from "@/lib/jsonLd";
import "./globals.css";
import Script from "next/script";
import CookieConsent from "@/components/consent/CookieConsent";
import { CONSENT_BOOTSTRAP_SCRIPT } from "@/lib/consent";
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
    icons: {
        icon: [
            { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
            { url: "/icon.svg", type: "image/svg+xml" },
        ],
        apple: "/apple-touch-icon.png",
    },
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
                alt: "Workyt — Plateforme d'entraide scolaire gratuite pour le collège et le lycée",
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
        languages: {
            "fr-FR": "https://workyt.fr",
        },
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
    // JSON-LD WebSite schema avec SearchAction pour la sitelinks searchbox Google
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Workyt",
        "url": "https://workyt.fr",
        "description": "Plateforme d'entraide scolaire gratuite : cours, fiches de révision, forum d'aide aux devoirs.",
        "inLanguage": "fr",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://workyt.fr/forum?search={search_term_string}",
            },
            "query-input": "required name=search_term_string",
        },
    };

    // JSON-LD Organization schema pour le Knowledge Panel Google
    // Cohérent avec EducationalOrganization sur la home — sameAs complet pour signaler
    // tous les profils sociaux (Twitter, Instagram, LinkedIn, Discord) au Knowledge Graph.
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Workyt",
        "alternateName": "Asso Workyt",
        "url": "https://workyt.fr",
        "logo": {
            "@type": "ImageObject",
            "url": "https://workyt.fr/apple-touch-icon.png",
            "width": 180,
            "height": 180,
        },
        "sameAs": [
            "https://twitter.com/workyt_fr",
            "https://www.instagram.com/workyt/",
            "https://www.linkedin.com/company/workyt",
            "https://dc.gg/workyt",
        ],
        "description": "Plateforme d'entraide scolaire gratuite portée par une association loi 1901 100 % bénévole. Cours, fiches de révision et forum d'aide aux devoirs pour collège, lycée et supérieur.",
        "foundingDate": "2020",
        "areaServed": { "@type": "Country", "name": "France" },
    };

    // Analytics : sans configuration, rien n'est chargé (voir plus bas).
    // L'URL sert aussi à construire le CSP dans next.config.mjs — les deux
    // doivent désigner la même instance.
    const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL?.replace(/\/$/, "");
    const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

    return (
        <html lang="fr" suppressHydrationWarning>
        <body className={`${funnelDisplay.variable} ${montserrat.variable} font-sans overflow-x-clip`}>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }}
        />
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
        />
        {/* Avant tout le reste : Google reçoit « refusé » par défaut */}
        <Script id="consent-default" strategy="beforeInteractive">
            {CONSENT_BOOTSTRAP_SCRIPT}
        </Script>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ClientProviders>
            {children}
        </ClientProviders>
        {/* Analytics Umami — afterInteractive pour compter la pageview sans
            bloquer le LCP. Sans cookie, donc sans consentement ; l'enregistrement
            de session (recorder) attend l'accord, voir CookieConsent.
            Piloté par NEXT_PUBLIC_UMAMI_URL / NEXT_PUBLIC_UMAMI_WEBSITE_ID :
            variables absentes (dev, préproduction) = aucun script chargé, donc
            pas de pageviews parasites dans les statistiques de production. */}
        {umamiUrl && umamiWebsiteId && (
            <Script
                id="umami-analytics"
                src={`${umamiUrl}/script.js`}
                data-website-id={umamiWebsiteId}
                data-performance="true"
                strategy="afterInteractive"
            />
        )}
        {/* Consentement (Consent Mode v2) : bandeau maison, puis Google Ads,
            Mailchimp et l'enregistrement de session Umami selon le choix. */}
        <CookieConsent umamiUrl={umamiUrl} umamiWebsiteId={umamiWebsiteId} />
        </body>
        </html>
    );
}
