"use client";

import React from "react";
import { InfiniteMovingCards } from "../ui/infinite-moving-cards";

export function Avis () {
    return (
        <div className="container mx-auto py-8 bg-white dark:bg-white px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="text-center mb-6">
                {/* Color gradient text orange to pink */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-4"
                    style={{
                        background: "linear-gradient(90deg, #FFA500, #FF1493)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}
                >
                    Les avis de nos utilisateurs
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto text-center mb-8 text-sm sm:text-base">
                    Découvrez ce que nos utilisateurs pensent de Workyt et comment notre plateforme les aide dans leur
                    parcours éducatif.
                </p>
            </div>
            <div
                className="h-[15rem] rounded-md flex flex-col antialiased bg-white items-center justify-center relative overflow-hidden">
                <InfiniteMovingCards
                    items={testimonials}
                    direction="right"
                    speed="slow"
                />
            </div>
        </div>

    );
}

const testimonials = [
    {
        quote:
            "Un site en construction, ils proposent pas mal de services comme : l'aide aux exercices, des fiches de révision ou cours, un blog d'actualité, conseils et méthodes. Très ravi de ce site, j'attend toujours la version finale du site ;) !",
        name: "Mouloud L.",
        title: "Un site d'éducation complet",
    },
    {
        quote:
            "Un véritable bijou pour les étudiants ! L'équipe est réactive et les ressources sont vraiment bien organisées. Une aide précieuse pour réussir mes examens.",
        name: "Sofia B.",
        title: "Super plateforme éducative",
    },
    {
        quote:
            "Workyt propose une grande diversité de contenus adaptés à tous les niveaux. C’est exactement ce qu’il manquait pour m’accompagner dans mes études.",
        name: "Arthur D.",
        title: "Ressources diversifiées",
                },
                {
                    quote:
                        "J'utilise Workyt depuis quelques mois et je suis impressionnée par la qualité des cours et la communauté bienveillante. Une vraie découverte !",
                    name: "Emma G.",
                    title: "Expérience enrichissante",
                },
                {
                    quote:
                        "Le blog d'actualité est super pour rester informé tout en révisant. L’équipe fait un excellent travail pour rendre l'apprentissage accessible.",
                    name: "Lucas T.",
                    title: "Apprentissage accessible",
                },
                {
                    quote:
                        "Les fiches de révision sont super bien faites ! J’ai réussi à améliorer mes notes grâce à Workyt. Merci pour ce soutien !",
                    name: "Amélie R.",
                    title: "Meilleure organisation",
                },
                {
                    quote:
                        "Une plateforme dynamique avec une équipe à l'écoute et des projets innovants. J’adore les podcasts et les conseils d’orientation.",
                    name: "Yasmine K.",
                    title: "Projets innovants",
                },
                {
                    quote:
                        "Workyt m’a permis de trouver de nouvelles méthodes de travail et d’apprendre à mieux m’organiser. Le forum est très utile pour poser des questions.",
                    name: "Nicolas F.",
                    title: "Support et organisation",
                },
                {
                    quote:
                        "Une équipe passionnée et des ressources de qualité. J’ai hâte de voir l’évolution du site et les nouveautés à venir !",
                    name: "Julien V.",
                    title: "Impressionné par le contenu",
                },
                {
                    quote:
                        "En tant que parent, je trouve cette plateforme géniale pour accompagner mes enfants dans leurs devoirs. Merci Workyt pour cet engagement !",
                    name: "Karim S.",
                    title: "Aide aux devoirs",
                },
                {
                    quote:
                        "Les cours sont bien structurés et le contenu est facile à comprendre. Continuez comme ça !",
                    name: "Amandine L.",
                    title: "Cours bien structurés",
                },
];
