import '@radix-ui/themes/styles.css';
import HeroBackdrop from "@/components/home/hero-backdrop";
import Hero2026 from "@/components/home/hero-2026";
import NosServices from "@/components/home/nos-services";
import LearningSimulations from "@/components/home/learning-simulations";
import { WobbleCardDemo } from "@/components/home/notre-mission";
import { GamificationSection } from "@/components/home/gamification";
import FaqSection from "@/components/home/faq";
import PartenairesView from "@/components/home/partenaires";
import CtaFinal from "@/components/home/cta-final";
import { Metadata } from 'next'


export const metadata: Metadata = {
    title: "Workyt - Plateforme d'entraide scolaire gratuite",
    description: "Workyt est une plateforme d'entraide scolaire gratuite. Cours, fiches de révision, forum d'aide aux devoirs et outils pour réussir au collège et au lycée. Rejoignez la communauté !",
    keywords: "entraide scolaire, aide devoirs, cours gratuits, fiches de révision, forum scolaire, bac, brevet, lycée, collège, plateforme éducative",
    openGraph: {
        type: "website",
        title: "Workyt - Plateforme d'entraide scolaire gratuite",
        description: "Cours gratuits, fiches de révision, forum d'aide aux devoirs. Tout pour réussir au collège et au lycée.",
        url: "https://workyt.fr",
        siteName: "Workyt",
        locale: "fr_FR",
        images: [
            {
                url: "https://workyt.fr/default-thumbnail.png",
                width: 1200,
                height: 630,
                alt: "Workyt - Plateforme d'entraide scolaire gratuite",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        site: "@workyt_fr",
        creator: "@workyt_fr",
        title: "Workyt - Plateforme d'entraide scolaire gratuite",
        description: "Cours gratuits, fiches de révision, forum d'aide aux devoirs. Tout pour réussir au collège et au lycée.",
        images: ["https://workyt.fr/default-thumbnail.png"],
    },
    alternates: {
        canonical: "https://workyt.fr",
    },
};

const educationalOrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Workyt",
    "url": "https://workyt.fr",
    "logo": {
        "@type": "ImageObject",
        "url": "https://workyt.fr/apple-touch-icon.png",
        "width": 180,
        "height": 180,
    },
    "foundingDate": "2020",
    "areaServed": { "@type": "Country", "name": "France" },
    "description":
        "Association d'entraide scolaire gratuite pour les élèves du collège et du lycée en France. Cours en ligne, fiches de révision, forum d'aide aux devoirs et gamification de l'apprentissage.",
    "inLanguage": "fr",
    "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "student",
    },
    "teaches": [
        "Mathématiques",
        "Français",
        "SVT",
        "Physique-Chimie",
        "Histoire-Géographie",
        "Anglais",
        "Espagnol",
        "Philosophie",
        "NSI",
        "SES",
    ],
    "educationalLevel": ["collège", "lycée"],
    "isAccessibleForFree": true,
    "knowsAbout": [
        "Brevet des collèges",
        "Baccalauréat",
        "Méthodologie scolaire",
        "Orientation scolaire",
    ],
    "sameAs": [
        "https://twitter.com/workyt_fr",
        "https://www.instagram.com/workyt/",
        "https://www.linkedin.com/company/workyt",
        "https://dc.gg/workyt",
    ],
};

export default function Home() {
    return (
        /* `relative` + fond papier : la navbar est une pilule flottante posée
           sur la page, avec de la marge autour d'elle. En blanc, cette marge
           dessinait un bandeau clair jusqu'au hero. Le fond papier et les
           calques d'ambiance partent maintenant de y=0, donc derrière elle. */
        <div className="relative flex flex-col bg-[var(--wk-paper)]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(educationalOrganizationSchema),
                }}
            />
            {/* Parcours : ce qu'on propose → la preuve jouable → qui on est →
                pourquoi on revient → les objections → la confiance → l'action.

                Retirés de la page d'accueil :
                - BannerWithButton (v4.6.0) : un numéro de version n'est pas une
                  information visiteur ; le retour des cours est porté par le hero.
                - CoursSystemSection : redondant avec les simulations, qui montrent
                  la même chose en interactif.
                - WorkytAwardSection et OrgChart : contenu institutionnel → /a-propos.
                - Avis : témoignages non sourcés. Une page sans avis est neutre,
                  une page avec de faux avis est un risque. À rétablir avec de
                  vrais retours signés.
                - FeedCard (blog) : contenu périphérique → footer. */}
            <HeroBackdrop />
            <Hero2026 />
            <NosServices />
            <LearningSimulations />
            <WobbleCardDemo />
            <GamificationSection />
            <FaqSection />
            <PartenairesView />
            <CtaFinal />
        </div>
    );
}
