"use client";
import Image from "next/image";
import React from "react";
import { WobbleCard } from "../ui/wobble-card";

export function WobbleCardDemo() {
    return (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full bg-white dark:bg-white">
            <WobbleCard
                containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-[500px] lg:min-h-[300px]"
                className=""
            >
                <div className="">
                    <h2 className="max-w-xs text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                        🎓 Nous sommes une association comptant plus de 100 bénévoles actifs.
                    </h2>
                    <p className="mt-4 text-left text-base/6 text-neutral-200">
                        Avec nous, profitez de contenus de qualité, d&apos;une aide toujours dans la bonne humeur 😄 et d&apos;une éducation sans stress ! 🚀 Parce qu&apos;apprendre, c&apos;est aussi s&apos;amuser ! 📚😊
                    </p>
                </div>
            </WobbleCard>
            <WobbleCard containerClassName="col-span-1 min-h-[300px]">
                <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                    🚀 Opportunités et inspiration
                </h2>
                <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                    Nous ouvrons des portes pour que les Workeurs puissent façonner leur avenir de manière autonome et atteindre leurs objectifs. ✨ Investir dans la jeunesse, c&apos;est aussi la motiver et l&apos;inspirer, surtout en ces temps difficiles. 🌱
                </p>
            </WobbleCard>
            <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
                <div className="max-w-sm">
                    <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
                        🌟 Votre succès est notre mission : Apprendre avec plaisir et sans stress !
                    </h2>
                    <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                        Notre vision de l&apos;éducation est différente ! Nous nous démarquons par notre contenu original et notre approche dynamique pour vous offrir le meilleur.
                        Découvrez vos forces et faiblesses avec nos exercices interactifs et apprenez à mieux vous connaître ! 💡 Répondez à toutes vos questions et préparez-vous pour le jour de l&apos;examen avec nos cours complets. 📚
                    </p>
                </div>
                <Image
                    src="/workytanim.gif"
                    width={1000}
                    height={1000}
                    alt="Workyt animation"
                    className="absolute -right-10 md:-right-[40%] lg:-right-[20%] -bottom-10 object-contain rounded-2xl"
                    unoptimized
                />
            </WobbleCard>
        </div>
    );
}
