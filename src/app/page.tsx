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
import * as React from "react";

export default function Home() {
    return (
        <div className="grid">
            <Navbar />
            <BannerWithButton
                tTitle="🎉 Bienvenue sur Workyt v3.beta !"
                tDetails="Découvrez notre plateforme d'apprentissage gratuite."
                tButton="Commencer"
                linkHref="/cours"
                tDismiss="Masquer"
            />
            <div
                className="h-[30rem] w-full dark:bg-black bg-white dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center"
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
                        <Cover>Plongez et commencez</Cover> à apprendre,
                        <span className="bg-gradient-to-r from-orange-500 to-teal-300 bg-clip-text text-transparent">
                            {"Workyt la plate-forme d'apprentissage gratuite"}
                        </span>
                    </PageHeaderHeading>
                    <PageHeaderDescription>
                        Les ressources d&apos;apprentissage gratuites sont au cœur de notre mission sociale, car nous pensons
                        que les principaux obstacles au début de l&apos;éducation sont l&apos;accès, le manque de confiance et
                        le coût.
                    </PageHeaderDescription>
                </PageHeader>
            </div>
            <NosServices />
            <WobbleCardDemo />
            <FeedCard />
            <Footer />
        </div>
    );
}
