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
import SessionWrapper from "@/components/SessionWrapper";
import * as React from "react";
import { Metadata } from 'next'


export const metadata = {
    title: "Workyt - La plate-forme d'apprentissage gratuite",
    description:
        "Les ressources d'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l'éducation sont l'accès, le manque de confiance et le coût.",
    openGraph: {
        type: "website",
        title: "Workyt - La plateforme d'apprentissage",
        description:
            "Les ressources d'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l'éducation sont l'accès, le manque de confiance et le coût.",
        url: "https://www.workyt.fr",
        locale: "fr_FR",
    },
    twitter: {
        card: "summary_large_image",
        title: "Workyt - La plateforme d'apprentissage",
        description:
            "Les ressources d'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l'éducation sont l'accès, le manque de confiance et le coût.",
    },
};

export default function Home() {
    return (
        <SessionWrapper>
        <div className="grid bg-white">
            <BannerWithButton
                tTitle="🎉 Bienvenue sur Workyt v3.9 Beta !"
                tDetails="Après une année d'absence, les cours font leur retour sur Workyt, désormais enrichis de fonctionnalités innovantes."
                tButton="Voir les fiches"
                linkHref="/fiches"
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
            <WobbleCardDemo/>
            <FeedCard/>
            <div className="px-4 md:px-8 lg:px-16 py-8 w-full max-w-full overflow-x-hidden">
                <Avis/>
                <PartenairesView/>
            </div>
            <OrgChart/>
        </div>
        </SessionWrapper>
    );
}
