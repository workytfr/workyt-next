"use client";

import React from "react";
import { Partenaires } from "@/components/ui/parternship";

const partenairesList = [
    {
        name: "La Maison des étudiants",
        logo: "/mde.png",
        website: "https://www.lyoncampus.com/s-impliquer/la-maison-des-etudiants-de-la-metropole-de-lyon",
    },
    {
        name: "Le Monde du PC",
        logo: "/lemondedupc.svg",
        website: "https://www.lemondedupc.fr",
    },
    {
        name: "Shiftek Hosting",
        logo: "/ShiftekHosting.png",
        website: "https://shiftek.fr/hosting/",
    },
    {
        name: "LearnHouse",
        logo: "/learnhouse_2.webp",
        website: "https://www.learnhouse.app",
    }
];

const PartenairesView = () => {
    return (
        <div className="container mx-auto p-4">
            <div className="text-center mb-6">
                {/* Color gradient text orange to pink */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-4"
                    style={{
                        background: "linear-gradient(90deg, #FFA500, #FF1493)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}
                >
                    Partenaires & soutiens
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto text-center mb-8 text-sm sm:text-base">
                    Découvrez les partenaires et soutiens qui nous accompagnent dans notre mission éducative, contribuant activement à la réussite de nos projets et à l’épanouissement de chaque apprenant.
                </p>
            </div>
            <Partenaires partenaires={partenairesList} direction="left" speed="normal"/>
        </div>
    );
};

export default PartenairesView;
