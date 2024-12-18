import Image from "next/image";
import '@radix-ui/themes/styles.css';
import {
    PageHeader,
    PageHeaderDescription,
    PageHeaderHeading,
} from "@/components/ui/pageHeader";
import Navbar from "@/components/navbar/Navbar";
import { Cover } from "@/components/ui/cover";
import { BannerWithButton } from "@/components/ui/notificationHome";
import NosServices from "@/components/home/nos-services";
import { WobbleCardDemo } from "@/components/home/notre-mission";
import { FeedCard } from "@/components/home/news";
import Footer from '@/components/home/footer';
import { Avis } from '@/components/home/avis';
import PartenairesView from "@/components/home/partenaires";
import OrgChart from "@/components/home/OrgChart";
import * as React from "react";
import { Metadata } from 'next'


export const metadata: Metadata = {
    title: 'Workyt - La plate-forme d\'apprentissage gratuite',
    description: 'Les ressources d\'apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons que les principaux obstacles au début de l\'éducation sont l\'accès, le manque de confiance et le coût.',
    twitter: {
        card: 'summary_large_image',
        site: '@workyt',
    },
}

export default function Home() {
    return (
        <div className="grid bg-white">
            <Navbar/>
            <BannerWithButton
                tTitle="🎉 Bienvenue sur Workyt v3.beta !"
                tDetails="Découvrez notre plateforme d'apprentissage gratuite."
                tButton="Commencer"
                linkHref="https://cours.workyt.fr/"
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
            <Footer/>
        </div>
    );
}
