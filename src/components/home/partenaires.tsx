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
        name: "Le Max de Culture",
        logo: "le-max-de-culture.png",
        website: "https://www.le-max-de-culture.fr",
    }
];

const PartenairesView = () => {
    return (
        <div className="container mx-auto p-4">
            <Partenaires partenaires={partenairesList} direction="left" speed="normal" />
        </div>
    );
};

export default PartenairesView;
