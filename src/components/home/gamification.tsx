"use client";

import React from "react";
import Link from "next/link";
import { WobbleCard } from "../ui/wobble-card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Badge } from "@/components/ui/Badge";
import { Gem, Trophy, Star, Zap, Crown, Gift, FileText, Palette } from "lucide-react";
import Image from "next/image";
import { GEM_CONFIG } from "@/lib/gemConfig";

export function GamificationSection() {
    const features = [
        {
            icon: <Gem className="w-6 h-6" />,
            title: "Système de Gemmes",
            description: "Convertissez vos points en gemmes précieuses pour débloquer des personnalisations exclusives."
        },
        {
            icon: <Crown className="w-6 h-6" />,
            title: "Profils Personnalisés",
            description: "Customisez votre avatar avec des images uniques et des contours spéciaux."
        },
        {
            icon: <Star className="w-6 h-6" />,
            title: "Couleurs Légendaires",
            description: "Du simple au légendaire : arc-en-ciel, néon, holographique, galaxie et plus encore !"
        },
        {
            icon: <Trophy className="w-6 h-6" />,
            title: "Badges d'Excellence",
            description: "Débloquez des badges uniques en fonction de vos contributions et performances."
        }
    ];

    return (
        <div className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                        <Zap className="w-4 h-4 mr-2" />
                        Workyt v4.0.0 - Nouveauté
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Gamification
                        </span>
                        {" "}& Récompenses
                    </h2>
                    <div className="max-w-3xl mx-auto">
                        <TextGenerateEffect
                            words="Découvrez notre système de gamification révolutionnaire ! Sur Workyt, chaque action compte : créer des fiches de révision, participer aux cours, aider la communauté sur le forum. Gagnez des points, convertissez-les en gemmes précieuses et débloquez des personnalisations exclusives pour exprimer votre personnalité unique. Notre objectif ? Rendre l'apprentissage plus motivant, interactif et gratifiant, tout en construisant une communauté d'entraide où chaque contribution est valorisée."
                            className="text-lg md:text-xl text-gray-600 leading-relaxed"
                        />
                    </div>
                </div>

                {/* Main Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
                    {/* Gemmes Card */}
                    <WobbleCard
                        containerClassName="col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-600 to-purple-700 min-h-[400px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <Gem className="w-8 h-8 text-blue-200 mr-3" />
                                <h3 className="text-2xl md:text-3xl font-bold text-white">
                                    Système de Gemmes 💎
                                </h3>
                            </div>
                            <p className="text-blue-100 text-lg leading-relaxed mb-6">
                                Transformez vos points d&apos;activité en gemmes précieuses ! 
                                Ratio : <span className="font-bold text-white">100 points = 1 gemme</span>
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="text-2xl font-bold text-white">{Math.min(...Object.values(GEM_CONFIG.PRICES.usernameColor))}-{Math.max(...Object.values(GEM_CONFIG.PRICES.usernameColor))}</div>
                                    <div className="text-blue-200 text-sm">Gamme de prix couleurs</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="text-2xl font-bold text-white">{Object.keys(GEM_CONFIG.CUSTOMIZATION_TYPES.usernameColor).length + Object.keys(GEM_CONFIG.CUSTOMIZATION_TYPES.profileImage).length}+</div>
                                    <div className="text-blue-200 text-sm">Personnalisations</div>
                                </div>
                            </div>
                        </div>
                    </WobbleCard>

                    {/* Personnalisation Card */}
                    <WobbleCard containerClassName="col-span-1 bg-gradient-to-br from-pink-500 to-rose-600 min-h-[400px]">
                        <div className="p-6">
                            <Crown className="w-8 h-8 text-pink-200 mb-4" />
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                                Profils Exclusifs
                            </h3>
                            <p className="text-pink-100 text-base leading-relaxed mb-4">
                                Débloquez des avatars Foxy uniques et des contours dorés/argentés pour personnaliser votre profil.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { name: 'FoxyMecha', file: 'FoxyMecha.webp', price: GEM_CONFIG.PRICES.profileImage['FoxyMecha.webp'] },
                                    { name: 'FoxyTerreur', file: 'FoxyTerreur.webp', price: GEM_CONFIG.PRICES.profileImage['FoxyTerreur.webp'] },
                                    { name: 'FoxyFrenchies', file: 'FoxyFrenchies.webp', price: GEM_CONFIG.PRICES.profileImage['FoxyFrenchies.webp'] }
                                ].map((profile) => (
                                    <div key={profile.name} className="bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm">
                                        <Image
                                            src={`/profile/${profile.file}`}
                                            alt={profile.name}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full mx-auto mb-1 object-cover"
                                        />
                                        <div className="text-xs text-pink-200 mb-1">{profile.name}</div>
                                        <div className="text-xs text-pink-300 font-semibold">{profile.price} 💎</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </WobbleCard>
                </div>

                {/* Couleurs Légendaires */}
                <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 min-h-[350px] mb-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between p-8">
                        <div className="lg:w-1/2 mb-8 lg:mb-0">
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 flex items-center gap-3">
                                <Palette className="w-10 h-10 text-yellow-300" />
                                Couleurs Légendaires
                            </h3>
                            <p className="text-gray-200 text-lg leading-relaxed mb-6">
                                Personnalisez votre nom d&apos;utilisateur avec des effets visuels époustouflants ! 
                                Du simple au légendaire, chaque couleur raconte votre histoire.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { name: "Arc-en-ciel", price: GEM_CONFIG.PRICES.usernameColor.rainbow, rarity: "⭐⭐" },
                                    { name: "Néon", price: GEM_CONFIG.PRICES.usernameColor.neon, rarity: "⭐⭐" },
                                    { name: "Lightning", price: GEM_CONFIG.PRICES.usernameColor.lightning, rarity: "⭐⭐⭐" },
                                    { name: "Légendaire", price: GEM_CONFIG.PRICES.usernameColor.legendary, rarity: "⭐⭐⭐⭐⭐" }
                                ].map((color) => (
                                    <div key={color.name} className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                                        <div className="text-yellow-300 text-xs mb-1">{color.rarity}</div>
                                        <div className="text-white font-semibold text-sm">{color.name}</div>
                                        <div className="text-gray-300 text-xs">{color.price} gemmes</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 flex justify-center">
                            <Image
                                src="/learngaming.png"
                                width={300}
                                height={300}
                                alt="Workyt gamification"
                                className="rounded-2xl opacity-80"
                                unoptimized
                            />
                        </div>
                    </div>
                </WobbleCard>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mb-4">
                                {feature.icon}
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="text-center mt-16">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
                        <Gift className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Prêt à commencer votre aventure ?
                        </h3>
                        <p className="text-purple-100 text-lg mb-6 max-w-2xl mx-auto">
                            Rejoignez notre communauté d&apos;apprentissage ! Créez et partagez des fiches de révision, participez aux cours interactifs, répondez aux quiz, aidez vos camarades sur le forum. Chaque contribution vous rapporte des points que vous pouvez transformer en gemmes pour personnaliser votre profil et montrer votre engagement envers l&apos;éducation collaborative.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href="/cours" 
                                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Découvrir les cours
                            </Link>
                            <Link 
                                href="/fiches" 
                                className="bg-purple-700 border border-purple-400 px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Déposer une fiche de révision
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
