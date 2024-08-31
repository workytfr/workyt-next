import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import Head from "next/head";

// Définitions des types pour les props de RootLayout
interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="fr">
        <Head>
            {/* Meta Tags pour SEO */}
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="Les ressources d'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l'éducation sont l'accès, le manque de confiance et le coût." />
            <title>Workyt - La plate-forme d'apprentissage gratuite</title>

            {/* Tidio Script */}
            <script src="//code.tidio.co/hpgdmupdosivjm7gryravknira1bbbgu.js" async></script>

            {/* Cookie Consent Scripts */}
            <script
                type="text/javascript"
                src="https://cache.consentframework.com/js/pa/28806/c/pjmlS/stub"
                referrerPolicy="unsafe-url"
                charSet="utf-8"
            ></script>
            <script
                type="text/javascript"
                src="https://choices.consentframework.com/js/pa/28806/c/pjmlS/cmp"
                referrerPolicy="unsafe-url"
                charSet="utf-8"
                async
            ></script>

            {/* Google Ads Scripts */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=AW-10979332706"></script>
            <script
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
        </body>
        </html>
    );
}