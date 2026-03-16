"use client";
import Image from "next/image";
import React from "react";
import { WobbleCard } from "../ui/wobble-card";

export function WobbleCardDemo() {
    return (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 bg-white">
            {/* Carte 1 - Association */}
            <WobbleCard
                containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-[400px] sm:min-h-[450px] lg:min-h-[300px]"
                className="p-6 sm:p-8"
            >
                <div>
                    <h2 className="text-left text-balance text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-white">
                        🎓 Nous sommes une association comptant plus de 100 bénévoles actifs.
                    </h2>
                    <p className="mt-4 text-left text-sm sm:text-base leading-relaxed text-neutral-200">
                        Avec nous, profitez de contenus de qualité, d&apos;une aide toujours dans la bonne humeur 😄 et d&apos;une éducation sans stress ! 🚀 Parce qu&apos;apprendre, c&apos;est aussi s&apos;amuser ! 📚😊
                    </p>
                </div>
            </WobbleCard>

            {/* Carte 2 - Opportunités */}
            <WobbleCard 
                containerClassName="col-span-1 min-h-[300px] sm:min-h-[350px] lg:min-h-[300px]"
                className="p-6 sm:p-8"
            >
                <h2 className="text-left text-balance text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-white">
                    🚀 Opportunités et inspiration
                </h2>
                <p className="mt-4 text-left text-sm sm:text-base leading-relaxed text-neutral-200">
                    Nous ouvrons des portes pour que les Workeurs puissent façonner leur avenir de manière autonome et atteindre leurs objectifs. ✨ Investir dans la jeunesse, c&apos;est aussi la motiver et l&apos;inspirer, surtout en ces temps difficiles. 🌱
                </p>
            </WobbleCard>

            {/* Carte 3 - Mission avec image */}
            <WobbleCard 
                containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] sm:min-h-[550px] lg:min-h-[350px] xl:min-h-[320px]"
                className="p-6 sm:p-8 lg:p-10"
            >
                <div className="relative z-10 max-w-full lg:max-w-[55%] xl:max-w-[50%]">
                    <h2 className="text-left text-balance text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-white">
                        🌟 Votre succès est notre mission : Apprendre avec plaisir et sans stress !
                    </h2>
                    <p className="mt-4 text-left text-sm sm:text-base leading-relaxed text-neutral-200">
                        Notre vision de l&apos;éducation est différente ! Nous nous démarquons par notre contenu original et notre approche dynamique pour vous offrir le meilleur.
                        Découvrez vos forces et faiblesses avec nos exercices interactifs et apprenez à mieux vous connaître ! 💡 Répondez à toutes vos questions et préparez-vous pour le jour de l&apos;examen avec nos cours complets. 📚
                    </p>
                </div>
                
                {/* Image - Positionnement adaptatif */}
                <Image
                    src="/workytanim.gif"
                    width={500}
                    height={500}
                    alt="Workyt animation"
                    className="absolute right-0 sm:-right-4 lg:-right-[5%] xl:-right-[2%] 
                               bottom-0 sm:-bottom-4 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2
                               w-[200px] sm:w-[280px] md:w-[320px] lg:w-[380px] xl:w-[420px]
                               h-auto object-contain rounded-2xl
                               opacity-90 lg:opacity-100"
                    unoptimized
                />
            </WobbleCard>
        </div>
    );
}
