import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";

export const metadata = {
    title: "Workyt - La plate-forme d'apprentissage gratuite",
    description: "Les ressources d'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l'éducation sont l'accès, le manque de confiance et le coût.",
    openGraph: {
        type: "website",
        title: "Workyt - La plateforme d'apprentissage",
        description: "Les ressources d'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l'éducation sont l'accès, le manque de confiance et le coût.",
        url: "https://www.workyt.fr",
        locale: "fr_FR",
    },
    twitter: {
        card: "summary_large_image",
        title: "Workyt - La plateforme d'apprentissage",
        description: "Les ressources d'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l'éducation sont l'accès, le manque de confiance et le coût.",
    },
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="fr">
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
        <script src="//code.tidio.co/hpgdmupdosivjm7gryravknira1bbbgu.js" async></script>
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
