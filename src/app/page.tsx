import '@radix-ui/themes/styles.css';
import { BannerWithButton } from "@/components/ui/notificationHome";
import Hero2026 from "@/components/home/hero-2026";
import NosServices from "@/components/home/nos-services";
import { WobbleCardDemo } from "@/components/home/notre-mission";
import { FeedCard } from "@/components/home/news";
import { Avis } from '@/components/home/avis';
import PartenairesView from "@/components/home/partenaires";
import WorkytAwardSection from "@/components/home/workyt-award";
import OrgChart from "@/components/home/OrgChart";
import { GamificationSection } from "@/components/home/gamification";
import { CoursSystemSection } from "@/components/home/cours-system";
import LearningSimulations from "@/components/home/learning-simulations";
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
    "logo": "https://workyt.fr/apple-touch-icon.png",
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
        <div className="flex flex-col bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(educationalOrganizationSchema),
                }}
            />
            <BannerWithButton
                tVersion="v4.6"
                tTitle="🎉 Bienvenue sur Workyt v4.6.0 !"
                tDetails="Après une année d'absence, les cours font leur retour sur Workyt, désormais enrichis de fonctionnalités innovantes."
                tButton="Voir les cours"
                linkHref="/cours"
                tDismiss="Masquer"
            />
            <Hero2026 />
            <NosServices/>
            <CoursSystemSection/>
            <LearningSimulations/>
            <WobbleCardDemo/>
            <PartenairesView/>
            <WorkytAwardSection/>
            <GamificationSection/>
            <FeedCard/>
            <div className="px-4 md:px-8 lg:px-16 py-8 w-full max-w-full overflow-x-hidden">
                <Avis/>
            </div>
            <OrgChart/>
        </div>
    );
}
