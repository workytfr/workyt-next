"use client";

import React from "react";
import { InfiniteMovingCards } from "../ui/infinite-moving-cards";
import { Star, Quote } from "lucide-react";

export function Avis() {
    return (
        <section className="relative py-20 overflow-hidden bg-white">
            {/* Motif de points décoratif subtil */}
            <div className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-12">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
                        <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                        <span>Ils nous font confiance</span>
                    </div>

                    {/* Title avec gradient */}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                            Les avis de nos utilisateurs
                        </span>
                    </h2>

                    <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                        Découvrez ce que nos utilisateurs pensent de Workyt et comment notre plateforme les aide dans leur parcours éducatif.
                    </p>

                    {/* Séparateur décoratif */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-500" />
                        <div className="h-1 w-3 rounded-full bg-pink-400" />
                        <div className="h-1 w-3 rounded-full bg-purple-400" />
                    </div>
                </div>

                {/* Cards Container */}
                <div className="relative">
                    {/* Gradient overlays pour effet de fade sur les côtés */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                    
                    <div className="h-[320px] rounded-2xl flex flex-col antialiased items-center justify-center relative overflow-hidden">
                        <InfiniteMovingCards
                            items={testimonials}
                            direction="right"
                            speed="slow"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

const testimonials = [
    {
        quote:
            "Un site en construction qui propose déjà des services complets : aide aux exercices, fiches de révision, blog d'actualité... Très ravi de ce site !",
        name: "Mouloud L.",
        title: "Un site d'éducation complet",
    },
    {
        quote:
            "Un véritable bijou pour les étudiants ! L'équipe est réactive et les ressources sont vraiment bien organisées. Une aide précieuse pour réussir.",
        name: "Sofia B.",
        title: "Super plateforme éducative",
    },
    {
        quote:
            "Workyt propose une grande diversité de contenus adaptés à tous les niveaux. C'est exactement ce qu'il manquait pour m'accompagner dans mes études.",
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
            "Le blog d'actualité est super pour rester informé tout en révisant. L'équipe fait un excellent travail pour rendre l'apprentissage accessible.",
        name: "Lucas T.",
        title: "Apprentissage accessible",
    },
    {
        quote:
            "Les fiches de révision sont super bien faites ! J'ai réussi à améliorer mes notes grâce à Workyt. Merci pour ce soutien !",
        name: "Amélie R.",
        title: "Meilleure organisation",
    },
    {
        quote:
            "Une plateforme dynamique avec une équipe à l'écoute et des projets innovants. J'adore les podcasts et les conseils d'orientation proposés.",
        name: "Yasmine K.",
        title: "Projets innovants",
    },
    {
        quote:
            "Workyt m'a permis de trouver de nouvelles méthodes de travail et d'apprendre à mieux m'organiser. Le forum est très utile pour poser des questions.",
        name: "Nicolas F.",
        title: "Support et organisation",
    },
    {
        quote:
            "Une équipe passionnée et des ressources de qualité. J'ai hâte de voir l'évolution du site et les nouveautés à venir !",
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
