"use client";

import React from "react";
import Link from "next/link";
import { WobbleCard } from "../ui/wobble-card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Badge } from "@/components/ui/Badge";
import {
    Gem,
    Trophy,
    Zap,
    Crown,
    Gift,
    FileText,
    Palette,
    Flame,
    Calendar,
    Target,
    Award,
    ArrowRight,
    Sparkles,
    TrendingUp,
    MessageCircle,
    Heart,
    CheckCircle,
} from "lucide-react";
import Image from "next/image";
import { GEM_CONFIG } from "@/lib/gemConfig";

const POINT_SOURCES = [
    { action: "Créer une fiche de révision", points: "+10 pts", icon: <FileText className="w-4 h-4" /> },
    { action: "Répondre sur le forum", points: "+2 pts", icon: <MessageCircle className="w-4 h-4" /> },
    { action: "Réponse validée", points: "+variable", icon: <CheckCircle className="w-4 h-4" /> },
    { action: "Like reçu sur une fiche", points: "+5 pts", icon: <Heart className="w-4 h-4" /> },
    { action: "Compléter un quiz", points: "+score", icon: <Target className="w-4 h-4" /> },
];

const WORLDS = [
    { name: "Mangas", levels: "1-3", color: "from-red-500 to-orange-500", emoji: "🥷" },
    { name: "Français", levels: "4-6", color: "from-blue-500 to-indigo-500", emoji: "🇫🇷" },
    { name: "Renards", levels: "7-9", color: "from-pink-500 to-rose-500", emoji: "🦊" },
    { name: "Québec", levels: "10-12", color: "from-red-600 to-red-400", emoji: "🍁" },
    { name: "Égypte", levels: "13-15", color: "from-yellow-600 to-amber-500", emoji: "🏛️" },
    { name: "Neiges", levels: "16-18", color: "from-cyan-500 to-blue-400", emoji: "❄️" },
    { name: "Imaginaire", levels: "19-21", color: "from-purple-600 to-pink-500", emoji: "✨" },
];

const STREAK_MILESTONES = [
    { days: 3, label: "Naissante", reward: "+5 pts", color: "text-yellow-400" },
    { days: 7, label: "Stable", reward: "+15 pts +1", rewardIcon: "mushroom", color: "text-yellow-500" },
    { days: 14, label: "Ardente", reward: "+30 pts +1", rewardIcon: "mushroom", color: "text-orange-500" },
    { days: 30, label: "Infernale", reward: "+50 pts +1", rewardIcon: "gem", color: "text-red-500" },
    { days: 60, label: "Éternelle", reward: "+100 pts +2", rewardIcon: "gem", color: "text-red-600" },
    { days: 100, label: "Légendaire", reward: "+200 pts +5", rewardIcon: "gem", color: "text-purple-500" },
];

export function GamificationSection() {
    return (
        <div className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                        <Zap className="w-4 h-4 mr-2" />
                        Système de progression
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Apprends.{" "}
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Progresse.
                        </span>
                        {" "}Débloque.
                    </h2>
                    <div className="max-w-3xl mx-auto">
                        <TextGenerateEffect
                            words="Chaque action sur Workyt te rapporte des points : créer des fiches, répondre au forum, compléter des quiz. Tu commences avec 20 points offerts pour bien démarrer ! Accumule des points pour monter de niveau, débloquer des badges et personnaliser ton profil avec des gemmes."
                            className="text-lg md:text-xl text-gray-600 leading-relaxed"
                        />
                    </div>
                </div>

                {/* ========== ÉTAPE 1 : Comment gagner des points ========== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <WobbleCard
                        containerClassName="bg-gradient-to-br from-emerald-600 to-teal-700 min-h-[320px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Image src="/badge/points.png" alt="Points" width={24} height={24} className="w-6 h-6 object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Gagne des points</h3>
                                    <p className="text-emerald-200 text-sm">20 points offerts à l&apos;inscription !</p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {POINT_SOURCES.map((source) => (
                                    <div key={source.action} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2.5 backdrop-blur-sm">
                                        <div className="flex items-center gap-2.5 text-white">
                                            <span className="text-emerald-300">{source.icon}</span>
                                            <span className="text-sm">{source.action}</span>
                                        </div>
                                        <span className="text-emerald-300 font-bold text-sm">{source.points}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                <Image src="/badge/champiworkyt.webp" alt="Champignon" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                                <p className="text-emerald-200/70 text-xs">
                                    Active un boost champignon pour x1.25 sur tes points !
                                </p>
                            </div>
                        </div>
                    </WobbleCard>

                    {/* Streak */}
                    <WobbleCard
                        containerClassName="bg-gradient-to-br from-orange-500 to-red-600 min-h-[320px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Flame className="w-6 h-6 text-orange-200" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Série quotidienne</h3>
                                    <p className="text-orange-200 text-sm">Reviens chaque jour</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {STREAK_MILESTONES.map((m) => (
                                    <div key={m.days} className="bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Flame className={`w-3.5 h-3.5 ${m.color}`} />
                                            <span className="text-white font-bold text-sm">{m.days}j</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-orange-100 text-[11px]">{m.reward}</span>
                                            {m.rewardIcon === "gem" && (
                                                <Image src="/badge/diamond.png" alt="Gemme" width={11} height={11} className="w-[11px] h-[11px] object-contain" />
                                            )}
                                            {m.rewardIcon === "mushroom" && (
                                                <Image src="/badge/champiworkyt.webp" alt="Champignon" width={11} height={11} className="w-[11px] h-[11px] object-contain" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-orange-200/70 text-xs mt-3 text-center">
                                Ta flamme évolue visuellement à chaque palier !
                            </p>
                        </div>
                    </WobbleCard>
                </div>

                {/* ========== ÉTAPE 2 : Quêtes + Calendrier ========== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <WobbleCard
                        containerClassName="lg:col-span-2 bg-gradient-to-br from-violet-600 to-purple-700 min-h-[280px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-violet-200" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Quêtes & Missions</h3>
                                    <p className="text-violet-200 text-sm">Des objectifs renouvelés chaque jour</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm text-center">
                                    <p className="text-2xl font-bold text-white">3</p>
                                    <p className="text-violet-200 text-xs">Quêtes / jour</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm text-center">
                                    <p className="text-2xl font-bold text-white">Hebdo</p>
                                    <p className="text-violet-200 text-xs">+ défis semaine</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm text-center">
                                    <p className="text-2xl font-bold text-white">Mensuel</p>
                                    <p className="text-violet-200 text-xs">+ objectif du mois</p>
                                </div>
                            </div>
                            <p className="text-violet-100 text-sm leading-relaxed">
                                Complète des quêtes pour gagner des{" "}
                                <span className="inline-flex items-center gap-0.5 font-semibold text-white">
                                    <Image src="/badge/points.png" alt="" width={12} height={12} className="w-3 h-3 object-contain" /> points,{" "}
                                    <Image src="/badge/diamond.png" alt="" width={12} height={12} className="w-3 h-3 object-contain" /> gemmes,{" "}
                                    <Image src="/badge/champiworkyt.webp" alt="" width={12} height={12} className="w-3 h-3 object-contain" /> champignons
                                </span>{" "}
                                et même des <span className="font-semibold text-white">coffres</span> contenant des récompenses aléatoires !
                            </p>
                        </div>
                    </WobbleCard>

                    <WobbleCard
                        containerClassName="bg-gradient-to-br from-sky-500 to-blue-600 min-h-[280px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-sky-200" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Calendrier</h3>
                                    <p className="text-sky-200 text-sm">Récompense quotidienne</p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <div className="bg-white/10 rounded-lg px-3 py-2.5 backdrop-blur-sm">
                                    <p className="text-white text-sm font-medium">Chaque jour</p>
                                    <div className="flex items-center gap-1 text-sky-200 text-xs">
                                        <span>1-3</span>
                                        <Image src="/badge/points.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                        <span>ou 1</span>
                                        <Image src="/badge/diamond.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                        <span>(5% chance)</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-lg px-3 py-2.5 backdrop-blur-sm">
                                    <p className="text-white text-sm font-medium">Jours fériés</p>
                                    <div className="flex items-center gap-1 text-sky-200 text-xs">
                                        <span>10</span>
                                        <Image src="/badge/points.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                        <span>bonus + événements spéciaux</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-lg px-3 py-2.5 backdrop-blur-sm">
                                    <p className="text-white text-sm font-medium">Le 15 du mois</p>
                                    <p className="text-sky-200 text-xs">Coffre surprise garanti !</p>
                                </div>
                            </div>
                        </div>
                    </WobbleCard>
                </div>

                {/* ========== ÉTAPE 3 : Progression — Mondes & Niveaux ========== */}
                <div className="mb-8">
                    <WobbleCard
                        containerClassName="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 min-h-[240px]"
                        className=""
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Crown className="w-6 h-6 text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">7 Mondes, 21 Niveaux</h3>
                                    <p className="text-gray-400 text-sm">Traverse les mondes en accumulant des points</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {WORLDS.map((world, i) => (
                                    <div key={world.name} className="flex items-center gap-2">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${world.color} text-white text-sm font-medium`}>
                                            <span>{world.emoji}</span>
                                            <span>{world.name}</span>
                                            <span className="text-white/70 text-xs">Nv.{world.levels}</span>
                                        </div>
                                        {i < WORLDS.length - 1 && (
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 hidden sm:block" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <p className="text-yellow-400 text-xl font-bold">20</p>
                                    <p className="text-gray-400 text-xs">pts offerts au départ</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <p className="text-orange-400 text-xl font-bold">500</p>
                                    <p className="text-gray-400 text-xs">pts → Monde Français</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <p className="text-red-400 text-xl font-bold">2 500</p>
                                    <p className="text-gray-400 text-xs">pts → Monde Québec</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <p className="text-purple-400 text-xl font-bold">8 000</p>
                                    <p className="text-gray-400 text-xs">pts → Immortel</p>
                                </div>
                            </div>
                        </div>
                    </WobbleCard>
                </div>

                {/* ========== ÉTAPE 4 : Gemmes + Personnalisation ========== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <WobbleCard
                        containerClassName="lg:col-span-2 bg-gradient-to-br from-blue-600 to-purple-700 min-h-[340px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Image src="/badge/diamond.png" alt="Gemme" width={24} height={24} className="w-6 h-6 object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Gemmes & Boutique</h3>
                                    <div className="flex items-center gap-1 text-blue-200 text-sm">
                                        <span>100</span>
                                        <Image src="/badge/points.png" alt="" width={12} height={12} className="w-3 h-3 object-contain" />
                                        <span>= 1</span>
                                        <Image src="/badge/diamond.png" alt="" width={12} height={12} className="w-3 h-3 object-contain" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-blue-100 text-sm leading-relaxed mb-5">
                                Convertis tes points en gemmes pour débloquer des personnalisations exclusives : couleurs de pseudo, avatars Foxy, contours de profil et badge de profil.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm text-center">
                                    <Palette className="w-5 h-5 text-blue-300 mx-auto mb-1" />
                                    <p className="text-white font-semibold text-sm">Couleurs</p>
                                    <div className="flex items-center justify-center gap-0.5 text-blue-200 text-xs">
                                        <span>{Math.min(...Object.values(GEM_CONFIG.PRICES.usernameColor))}-{Math.max(...Object.values(GEM_CONFIG.PRICES.usernameColor))}</span>
                                        <Image src="/badge/diamond.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm text-center">
                                    <Crown className="w-5 h-5 text-pink-300 mx-auto mb-1" />
                                    <p className="text-white font-semibold text-sm">Avatars</p>
                                    <div className="flex items-center justify-center gap-0.5 text-blue-200 text-xs">
                                        <span>2-50</span>
                                        <Image src="/badge/diamond.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm text-center">
                                    <Sparkles className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
                                    <p className="text-white font-semibold text-sm">Contours</p>
                                    <div className="flex items-center justify-center gap-0.5 text-blue-200 text-xs">
                                        <span>2-20</span>
                                        <Image src="/badge/diamond.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                    </div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm text-center">
                                    <Award className="w-5 h-5 text-orange-300 mx-auto mb-1" />
                                    <p className="text-white font-semibold text-sm">Badge profil</p>
                                    <div className="flex items-center justify-center gap-0.5 text-blue-200 text-xs">
                                        <span>5</span>
                                        <Image src="/badge/diamond.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                                {[
                                    { name: "Arc-en-ciel", price: GEM_CONFIG.PRICES.usernameColor.rainbow },
                                    { name: "Néon", price: GEM_CONFIG.PRICES.usernameColor.neon },
                                    { name: "Lightning", price: GEM_CONFIG.PRICES.usernameColor.lightning },
                                    { name: "Légendaire", price: GEM_CONFIG.PRICES.usernameColor.legendary },
                                ].map((c) => (
                                    <div key={c.name} className="bg-white/5 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                                        <span className="text-white text-xs">{c.name}</span>
                                        <div className="flex items-center gap-0.5 text-blue-300 text-xs font-semibold">
                                            <span>{c.price}</span>
                                            <Image src="/badge/diamond.png" alt="" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </WobbleCard>

                    <WobbleCard
                        containerClassName="bg-gradient-to-br from-pink-500 to-rose-600 min-h-[340px]"
                        className=""
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Crown className="w-6 h-6 text-pink-200" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Avatars Foxy</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[
                                    { name: "Mecha", file: "FoxyMecha.webp", price: GEM_CONFIG.PRICES.profileImage["FoxyMecha.webp"] },
                                    { name: "Terreur", file: "FoxyTerreur.webp", price: GEM_CONFIG.PRICES.profileImage["FoxyTerreur.webp"] },
                                    { name: "Frenchies", file: "FoxyFrenchies.webp", price: GEM_CONFIG.PRICES.profileImage["FoxyFrenchies.webp"] },
                                ].map((p) => (
                                    <div key={p.name} className="bg-white/10 rounded-lg p-2.5 text-center backdrop-blur-sm">
                                        <Image
                                            src={`/profile/${p.file}`}
                                            alt={p.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full mx-auto mb-1.5 object-cover"
                                        />
                                        <p className="text-white text-xs font-medium">{p.name}</p>
                                        <div className="flex items-center justify-center gap-0.5 text-pink-200 text-[11px]">
                                            <span>{p.price}</span>
                                            <Image src="/badge/diamond.png" alt="" width={9} height={9} className="w-[9px] h-[9px] object-contain" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Image src="/badge/champiworkyt.webp" alt="Champignon" width={16} height={16} className="w-4 h-4 object-contain" />
                                    <span className="font-semibold text-white text-sm">Champignons</span>
                                </div>
                                <p className="text-pink-100 text-xs leading-relaxed">
                                    Gagne-les via les streaks, quêtes et le calendrier. Utilise-les pour activer des boosts temporaires : x1.25 points, quête bonus ou chance de coffre améliorée !
                                </p>
                            </div>
                        </div>
                    </WobbleCard>
                </div>

                {/* ========== ÉTAPE 5 : Badges ========== */}
                <div className="mb-8">
                    <WobbleCard
                        containerClassName="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 min-h-[200px]"
                        className=""
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="md:w-1/2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Trophy className="w-8 h-8 text-yellow-100" />
                                        <h3 className="text-2xl font-bold text-white">48 Badges à débloquer</h3>
                                    </div>
                                    <p className="text-yellow-100 text-sm leading-relaxed">
                                        Des badges automatiques qui se débloquent au fur et à mesure de ta progression : fiches, forum, quiz, streak, points, champignons, calendrier et événements spéciaux.
                                    </p>
                                </div>
                                <div className="md:w-1/2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: "Commun", count: "20+", dot: "bg-gray-300" },
                                        { label: "Rare", count: "12+", dot: "bg-blue-400" },
                                        { label: "Épique", count: "10+", dot: "bg-purple-400" },
                                        { label: "Légendaire", count: "5+", dot: "bg-yellow-300" },
                                    ].map((r) => (
                                        <div key={r.label} className="bg-white/15 rounded-lg p-2.5 text-center backdrop-blur-sm">
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${r.dot}`} />
                                                <span className="text-white font-bold text-lg">{r.count}</span>
                                            </div>
                                            <p className="text-yellow-100 text-xs">{r.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </WobbleCard>
                </div>

                {/* ========== CTA ========== */}
                <div className="text-center">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
                        <Gift className="w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-2xl md:text-3xl font-bold mb-3">
                            Prêt à commencer ton aventure ?
                        </h3>
                        <p className="text-purple-100 text-base mb-6 max-w-2xl mx-auto">
                            Rejoins la communauté, contribue et regarde ta flamme grandir.
                            Chaque fiche, chaque réponse, chaque quiz te rapproche du prochain monde !
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
                                Déposer une fiche
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
