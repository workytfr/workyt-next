"use client";

import React from "react";
import Link from "next/link";
import { WobbleCard } from "../ui/wobble-card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, FileText, Trophy, Users, Zap, Target, Brain, Share2, Clock, Star } from "lucide-react";
import Image from "next/image";

export function CoursSystemSection() {
    const features = [
        {
            icon: <BookOpen className="w-6 h-6" />,
            title: "Cours Interactifs",
            description: "Des cours structurés avec théorie, exercices pratiques et quiz de validation pour un apprentissage progressif."
        },
        {
            icon: <FileText className="w-6 h-6" />,
            title: "Fiches de Révision",
            description: "Partagez vos synthèses et accédez à celles de la communauté pour réviser efficacement."
        },
        {
            icon: <Target className="w-6 h-6" />,
            title: "Quiz & Points",
            description: "Testez vos connaissances avec des quiz et gagnez des points pour chaque bonne réponse."
        },
        {
            icon: <Share2 className="w-6 h-6" />,
            title: "Partage Collaboratif",
            description: "Une plateforme d'entraide où chaque ressource partagée enrichit l'apprentissage de tous."
        }
    ];

    return (
        <div className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Système d&apos;Apprentissage Complet
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Cours & Ressources
                        </span>
                        {" "}Collaboratives
                    </h2>
                    <div className="max-w-3xl mx-auto">
                        <TextGenerateEffect
                            words="Découvrez notre écosystème d'apprentissage complet ! Des cours structurés aux fiches de révision partagées, en passant par des quiz interactifs et des manuels d'exercices. Chaque ressource contribue à la réussite collective et vous récompense pour votre engagement."
                            className="text-lg md:text-xl text-gray-600 leading-relaxed"
                        />
                    </div>
                </div>

                {/* Main Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Cours Interactifs */}
                    <WobbleCard
                        containerClassName="col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 min-h-[450px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <BookOpen className="w-8 h-8 text-blue-200 mr-3" />
                                <h3 className="text-2xl md:text-3xl font-bold text-white">
                                    Cours Interactifs 📚
                                </h3>
                            </div>
                            <p className="text-blue-100 text-lg leading-relaxed mb-6">
                                Des cours complets structurés comme de véritables manuels numériques avec théorie, exercices pratiques et évaluations.
                            </p>
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Brain className="w-5 h-5 text-blue-200 mr-2" />
                                        <div className="text-white font-semibold">Théorie & Concepts</div>
                                    </div>
                                    <div className="text-blue-200 text-sm">Cours détaillés avec explications claires</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Target className="w-5 h-5 text-blue-200 mr-2" />
                                        <div className="text-white font-semibold">Exercices Pratiques</div>
                                    </div>
                                    <div className="text-blue-200 text-sm">Manuel d&apos;exercices intégré avec corrections</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Trophy className="w-5 h-5 text-blue-200 mr-2" />
                                        <div className="text-white font-semibold">Quiz de Validation</div>
                                    </div>
                                    <div className="text-blue-200 text-sm">Gagnez des points pour chaque quiz réussi</div>
                                </div>
                            </div>
                        </div>
                    </WobbleCard>

                    {/* Fiches de Révision */}
                    <WobbleCard containerClassName="col-span-1 bg-gradient-to-br from-green-600 to-emerald-700 min-h-[450px]">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <FileText className="w-8 h-8 text-green-200 mr-3" />
                                <h3 className="text-2xl md:text-3xl font-bold text-white">
                                    Fiches Collaboratives 📝
                                </h3>
                            </div>
                            <p className="text-green-100 text-lg leading-relaxed mb-6">
                                Partagez vos synthèses et bénéficiez du travail de toute la communauté pour réviser plus efficacement.
                            </p>
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Share2 className="w-5 h-5 text-green-200 mr-2" />
                                        <div className="text-white font-semibold">Partage de Ressources</div>
                                    </div>
                                    <div className="text-green-200 text-sm">Créez et partagez vos fiches de révision</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Users className="w-5 h-5 text-green-200 mr-2" />
                                        <div className="text-white font-semibold">Entraide Communautaire</div>
                                    </div>
                                    <div className="text-green-200 text-sm">Accédez aux fiches de vos camarades</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Star className="w-5 h-5 text-green-200 mr-2" />
                                        <div className="text-white font-semibold">Système de Points</div>
                                    </div>
                                    <div className="text-green-200 text-sm">Gagnez des points pour chaque fiche créée</div>
                                </div>
                            </div>
                        </div>
                    </WobbleCard>
                </div>

                {/* Manuel d'Exercices Section */}
                <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 min-h-[400px] mb-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between p-8">
                        <div className="lg:w-1/2 mb-8 lg:mb-0">
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 flex items-center gap-3">
                                <Target className="w-10 h-10 text-yellow-300" />
                                Manuel d&apos;Exercices Interactif
                            </h3>
                            <p className="text-gray-200 text-lg leading-relaxed mb-6">
                                Chaque cours intègre un véritable manuel d&apos;exercices avec des problèmes graduels, des corrections détaillées et un système de points pour motiver votre progression.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Clock className="w-5 h-5 text-yellow-300 mr-2" />
                                        <div className="text-white font-semibold">Exercices Progressifs</div>
                                    </div>
                                    <div className="text-gray-300 text-sm">Du niveau débutant à avancé</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Brain className="w-5 h-5 text-yellow-300 mr-2" />
                                        <div className="text-white font-semibold">Corrections Détaillées</div>
                                    </div>
                                    <div className="text-gray-300 text-sm">Explications pas à pas</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Zap className="w-5 h-5 text-yellow-300 mr-2" />
                                        <div className="text-white font-semibold">Points & Progression</div>
                                    </div>
                                    <div className="text-gray-300 text-sm">Récompenses pour chaque réussite</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <div className="flex items-center mb-2">
                                        <Trophy className="w-5 h-5 text-yellow-300 mr-2" />
                                        <div className="text-white font-semibold">Quiz de Validation</div>
                                    </div>
                                    <div className="text-gray-300 text-sm">Testez vos acquis régulièrement</div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 flex justify-center">
                            <Image
                                src="/AnimeCours.png"
                                width={400}
                                height={300}
                                alt="Workyt cours system"
                                className="rounded-2xl opacity-90 shadow-2xl"
                            />
                        </div>
                    </div>
                </WobbleCard>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                                {feature.icon}
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="text-center">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                        <BookOpen className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Commencez Votre Parcours d&apos;Apprentissage
                        </h3>
                        <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
                            Explorez nos cours interactifs, créez des fiches de révision, réussissez les quiz et gagnez des points. L&apos;apprentissage collaboratif vous attend !
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href="/cours" 
                                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <BookOpen className="w-4 h-4" />
                                Explorer les Cours
                            </Link>
                            <Link 
                                href="/fiches" 
                                className="bg-blue-700 border border-blue-400 px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Voir les Fiches
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
