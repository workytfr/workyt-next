"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GemManager from '@/components/ui/GemManager';
import NoSSR from "@/components/NoSSR";
import { Store, ArrowRight } from "lucide-react";
import "@/app/cours/_components/styles/notion-theme.css";

const GemsHeader = () => (
    <header className="bg-white">
        <div className="notion-container-wide py-16 md:py-20">
            <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-5">
                    <img src="/badge/diamond.png" alt="" width={40} height={40} className="object-contain" />
                    <h1 className="notion-title-large">
                        Gemmes & Personnalisation
                    </h1>
                </div>
                <p className="notion-subtitle text-lg">
                    Convertissez vos points en gemmes et personnalisez votre profil avec des éléments uniques.
                    Créez un style qui vous ressemble !
                </p>
            </div>
        </div>
    </header>
);

export default function GemsPageClient() {
    return (
        <NoSSR>
            <div className="notion-layout notion-animate-fade-in min-h-screen">
                <GemsHeader />
                <div className="notion-container-wide py-8 md:py-12">
                    <GemManager />

                    {/* Lien vers Workyt Award */}
                    <div className="mt-8">
                        <Link href="/award" className="block group">
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 p-6 md:p-8 text-white shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/60 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                                            <Store className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-bold mb-1">Workyt Award</h2>
                                            <p className="text-white/90 text-sm md:text-base">
                                                Échangez vos gemmes contre des codes promo exclusifs chez nos partenaires
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-full text-sm font-semibold group-hover:bg-orange-50 transition-colors shrink-0">
                                        Voir les réductions
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </NoSSR>
    );
}
