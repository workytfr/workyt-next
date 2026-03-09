"use client";

import React from "react";
import Image from "next/image";
import { Handshake, ExternalLink } from "lucide-react";

const partenairesList = [
    {
        name: "La Maison des étudiants",
        logo: "/mde.png",
        website: "https://www.lyoncampus.com/s-impliquer/la-maison-des-etudiants-de-la-metropole-de-lyon",
        description: "Accompagnement et vie étudiante à Lyon",
        darkBg: false,
    },
    {
        name: "Le Monde du PC",
        logo: "/lemondedupc.svg",
        website: "https://www.lemondedupc.fr",
        description: "Informatique et hardware",
        darkBg: true,
    },
    {
        name: "Shiftek Hosting",
        logo: "/ShiftekHosting.png",
        website: "https://shiftek.fr/hosting/",
        description: "Hébergement web performant",
        darkBg: true,
    },
    {
        name: "LearnHouse",
        logo: "/learnhouse_2.webp",
        website: "https://www.learnhouse.app",
        description: "Plateforme éducative open-source",
        darkBg: true,
    },
];

const PartenairesView = () => {
    return (
        <div className="py-14 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-medium mb-4">
                        <Handshake className="w-4 h-4" />
                        Ils nous font confiance
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Nos{" "}
                        <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                            partenaires
                        </span>
                    </h2>
                    <p className="text-gray-500 max-w-xl mx-auto text-sm">
                        Des organisations qui soutiennent notre mission éducative et contribuent à rendre l&apos;apprentissage accessible à tous.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {partenairesList.map((partenaire) => (
                        <a
                            key={partenaire.name}
                            href={partenaire.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-orange-200 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-1"
                        >
                            <div className={`w-full h-16 flex items-center justify-center mb-3 rounded-xl ${partenaire.darkBg ? "bg-gray-800 p-2" : ""}`}>
                                <Image
                                    src={partenaire.logo}
                                    alt={partenaire.name}
                                    width={140}
                                    height={64}
                                    className="max-h-14 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                                    unoptimized
                                />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
                                {partenaire.name}
                            </h3>
                            <p className="text-xs text-gray-400 mb-2">{partenaire.description}</p>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-400 transition-colors" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PartenairesView;
