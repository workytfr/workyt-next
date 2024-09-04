import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import Head from "next/head";

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="fr">
        <Head>
            {/* Meta Tags pour SEO */}
            <meta charSet="UTF-8"/>
            <meta name="viewport" content="initial-scale=1.0"/>
            <title>Workyt - La plate-forme d&apos;apprentissage gratuite</title>
            <meta name="description"
                  content="Les ressources d&apos;apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l&apos;éducation sont l&apos;accès, le manque de confiance et le coût."/>

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content="website"/>
            <meta property="og:title" content="Workyt - La plateforme d&apos;apprentissage"/>
            <meta property="og:description"
                  content="Les ressources d&apos;apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l&apos;éducation sont l&apos;accès, le manque de confiance et le coût."/>
            <meta name="twitter:image" content="/zDKvjW3h_400x400.jpg"/>
            <meta property="og:url" content="https://www.workyt.fr"/>
            <meta property="og:locale" content="fr_FR"/>
            <meta name="twitter:card" content="summary_large_image"/>
            <meta name="twitter:title" content="Workyt - La plateforme d&apos;apprentissage"/>
            <meta name="twitter:description"
                  content="Les ressources d&apos;apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l&apos;éducation sont l&apos;accès, le manque de confiance et le coût."/>
            <meta name="twitter:image" content="/zDKvjW3h_400x400.jpg"/>
            <meta name="twitter:url" content="https://www.workyt.fr"/>
        </Head>
        <body>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>

        {/* Tidio Script */}
        <Script src="//code.tidio.co/hpgdmupdosivjm7gryravknira1bbbgu.js" strategy="lazyOnload" />

        {/* Cookie Consent Scripts */}
        <Script
            type="text/javascript"
            src="https://cache.consentframework.com/js/pa/28806/c/pjmlS/stub"
            referrerPolicy="unsafe-url"
            charSet="utf-8"
            strategy="lazyOnload"
        />
        <Script
            type="text/javascript"
            src="https://choices.consentframework.com/js/pa/28806/c/pjmlS/cmp"
            referrerPolicy="unsafe-url"
            charSet="utf-8"
            strategy="lazyOnload"
        />

        {/* Google Ads Scripts */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-10979332706" strategy="lazyOnload" />
        <Script
            id="google-analytics"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
                __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'AW-10979332706');
                            gtag('event', 'conversion', {'send_to': 'AW-10979332706/HSH7CP-6g9sDEOKkrfMo'});
                        `,
            }}
        />
        </body>
        </html>
    );
}
