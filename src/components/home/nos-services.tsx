"use client";

import * as React from 'react';
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { HoverEffect } from "@/components/ui/card-hover-effect";

const myServices = [
    {
        title: "Cours en ligne",
        description: "Développer des compétences pour une véritable évolution dans vos études.",
        imageSrc: "/workytcours.png",
        link: "https://cours.workyt.fr/"
    },
    {
        title: "Forum",
        description: "L'espace d'entraide gratuit et illimité, Workyt aide les élèves à obtenir des explications.",
        imageSrc: "/workytforum.png",
        link: "/forum"
    },
    {
        title: "Blog",
        description: "Toute l'actualité sur le sujet Éducation. Consultez l'ensemble des articles, reportages, photos et vidéos.",
        imageSrc: "/workytblog.png",
        link: "https://blog.workyt.fr/"
    },
    {
        title: "Discord",
        description: "Nous battons la bête de la procrastination ici tous ensemble ! Un serveur de divertissements en dehors des études",
        imageSrc: "/workytdiscord.png",
        link: "https://dc.gg/workyt"
    },
    {
        title: "Orientation",
        description: "Des conseils pour vous aider à choisir votre orientation. Trouvez votre voie.",
        imageSrc: "/workytorientation.png",
        link: "https://dc.gg/workyt"
    },
    {
        title: "Fiche de révision",
        description: "Partagez vos fiches de révision et consultez celles des autres élèves.",
        imageSrc: "workytfiche.png",
        link: ""
    },
];

export default function NosServices() {
    return (
        <div className="p-6 md:p-12 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Section du texte */}
                <div className="flex items-center justify-center p-4 md:p-2 md:col-span-1">
                    <TextGenerateEffect
                        words="Workyt rassemble tous les membres de la communauté éducative pour aider les workeurs à réussir. Nous créons des technologies, du contenu et des plateformes qui relient les enseignants, les élèves et les parents les uns aux autres et aident tous les apprenants à découvrir leurs passions et à améliorer leurs compétences."
                        className="text-lg md:text-xl lg:text-2xl font-medium leading-relaxed text-gray-800"
                    />
                </div>

                {/* Section des services avec effet hover */}
                <div className="flex items-center justify-center p-4 md:p-8 md:col-span-2">
                    <HoverEffect items={myServices} />
                </div>
            </div>
        </div>
    );
}
