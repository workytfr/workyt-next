import Image from "next/image";
import '@radix-ui/themes/styles.css';
import {
    PageHeader,
    PageHeaderDescription,
    PageHeaderHeading,
} from "@/components/ui/pageHeader";
import { Cover } from "@/components/ui/cover";
import { BannerWithButton } from "@/components/ui/notificationHome";
import NosServices from "@/components/home/nos-services";
import { WobbleCardDemo } from "@/components/home/notre-mission";
import { FeedCard } from "@/components/home/news";
import Footer from '@/components/home/footer';
import { Avis } from '@/components/home/avis';
import PartenairesView from "@/components/home/partenaires";
import OrgChart from "@/components/home/OrgChart";
import { GamificationSection } from "@/components/home/gamification";
import { CoursSystemSection } from "@/components/home/cours-system";
import * as React from "react";
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

export default function Home() {
    return (
        <div className="grid bg-white">
            <BannerWithButton
                tTitle="🎉 Bienvenue sur Workyt v4.1.0  !"
                tDetails="Après une année d'absence, les cours font leur retour sur Workyt, désormais enrichis de fonctionnalités innovantes."
                tButton="Voir les cours"
                linkHref="/cours"
                tDismiss="Masquer"
            />
            <div
                className="h-[30rem] w-full bg-white bg-grid-black/[0.2] relative flex items-center justify-center"
            >

                <div className="absolute top-4 left-4"> {/* Ajustez 'top-4' et 'left-4' pour positionner l'image */}
                    <Image
                        src="/notation.png" // Remplacez par le chemin réel de votre image
                        alt="Notation 20/20"
                        width={100} // Ajustez la largeur si nécessaire
                        height={100} // Ajustez la hauteur si nécessaire
                    />
                </div>
                <PageHeader>
                    <PageHeaderHeading>
                        <Cover>Plongez et commencez</Cover>
                        <span className="text-black"> à apprendre, </span>
                        <span className="bg-gradient-to-r from-orange-500 to-teal-300 bg-clip-text text-transparent">
                            {"Workyt la plate-forme d'apprentissage gratuite"}
                        </span>
                    </PageHeaderHeading>
                    <PageHeaderDescription>
                        Les ressources d&apos;apprentissage gratuites sont au cœur de notre mission sociale, car nous
                        pensons
                        que les principaux obstacles au début de l&apos;éducation sont l&apos;accès, le manque de
                        confiance et
                        le coût.
                    </PageHeaderDescription>
                </PageHeader>
            </div>
            <NosServices/>
            <CoursSystemSection/>
            <WobbleCardDemo/>
            <PartenairesView/>
            <GamificationSection/>
            <FeedCard/>
            <div className="px-4 md:px-8 lg:px-16 py-8 w-full max-w-full overflow-x-hidden">
                <Avis/>
            </div>
            <OrgChart/>
        </div>
    );
}
