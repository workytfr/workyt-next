"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Handshake,
    MapPin,
    Globe,
    Phone,
    Mail,
    Search,
    Filter,
    X,
    ExternalLink,
    Ticket,
    Star,
    Users,
    TrendingUp,
    Heart,
    Store,
    ChevronRight,
    Sparkles,
    Gem,
    Gift,
    ArrowRight,
    Package,
} from "lucide-react";
import "@/app/cours/_components/styles/notion-theme.css";

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
    {
        name: "YumeGo",
        logo: "/yumego.png",
        website: "https://yumego.ai/",
        description:
            "Extension Chrome pour apprendre le japonais avec Netflix — traduction des sous-titres, suivi JLPT et vocabulaire",
        darkBg: true,
    },
];

interface Partner {
    _id: string;
    name: string;
    description: string;
    logo: string;
    image: string;
    category: string;
    city: string;
    address: string;
    website?: string;
    phone?: string;
    email?: string;
    offersEnabled?: {
        free: boolean;
        premium: boolean;
    };
    availableCodes?: {
        free: number;
        premium: number;
    };
    offers: {
        free?: {
            type: string;
            value: number;
            description: string;
            conditions?: string;
        };
        premium?: {
            type: string;
            value: number;
            gemsCost: number;
            description: string;
            conditions?: string;
            additionalBenefits?: string[];
        };
    };
    isActive: boolean;
    startDate: string;
    endDate?: string;
}

const categories = [
    { value: "restauration", label: "Restauration", icon: "\uD83C\uDF7D\uFE0F" },
    { value: "sport", label: "Sport", icon: "\uD83C\uDFC3" },
    { value: "culture", label: "Culture", icon: "\uD83C\uDFAD" },
    { value: "tech", label: "Tech", icon: "\uD83D\uDCBB" },
    { value: "bien-etre", label: "Bien-\u00EAtre", icon: "\uD83E\uDDD8" },
    { value: "loisirs", label: "Loisirs", icon: "\uD83C\uDFAE" },
    { value: "autre", label: "Autre", icon: "\uD83C\uDFAF" },
];

const categoryColors: Record<string, string> = {
    restauration: "bg-orange-100 text-orange-800 border-orange-200",
    sport: "bg-blue-100 text-blue-800 border-blue-200",
    culture: "bg-purple-100 text-purple-800 border-purple-200",
    tech: "bg-green-100 text-green-800 border-green-200",
    "bien-etre": "bg-pink-100 text-pink-800 border-pink-200",
    loisirs: "bg-yellow-100 text-yellow-800 border-yellow-200",
    autre: "bg-gray-100 text-gray-800 border-gray-200",
};

function formatOfferValue(type: string, value: number): string {
    if (type === "percentage") return `-${value}%`;
    if (type === "fixed") return `-${value}\u20AC`;
    return "Offre de bienvenue";
}

function getTotalAvailableCodes(partner: Partner): number {
    const free = (partner.offersEnabled?.free && partner.availableCodes?.free) ? partner.availableCodes.free : 0;
    const premium = (partner.offersEnabled?.premium && partner.availableCodes?.premium) ? partner.availableCodes.premium : 0;
    return free + premium;
}

export default function PartenairesPageClient() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await fetch("/api/partners?active=true");
                if (res.ok) {
                    const data = await res.json();
                    setPartners(Array.isArray(data) ? data : data.partners || []);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des partenaires:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPartners();
    }, []);

    const cities = [...new Set(partners.map((p) => p.city))].sort();
    const totalCodes = partners.reduce((sum, p) => sum + getTotalAvailableCodes(p), 0);

    const filteredPartners = partners.filter((partner) => {
        const matchesSearch =
            !searchTerm ||
            partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            partner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            partner.city.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCity = !selectedCity || partner.city === selectedCity;
        const matchesCategory = !selectedCategory || partner.category === selectedCategory;
        return matchesSearch && matchesCity && matchesCategory;
    });

    const hasActiveFilters = searchTerm || selectedCity || selectedCategory;

    return (
        <div className="notion-layout notion-animate-fade-in min-h-screen">
            {/* Hero */}
            <header className="bg-white border-b border-[#e3e2e0]">
                <div className="notion-container-wide py-16 md:py-20">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-medium mb-5">
                            <Handshake className="w-4 h-4" />
                            Ils nous font confiance
                        </div>
                        <h1 className="notion-title-large mb-5">
                            Nos partenaires
                        </h1>
                        <p className="notion-subtitle text-lg max-w-2xl">
                            Des entreprises et organisations engagées pour la réussite étudiante.
                            Ensemble, nous créons un écosystème d'entraide où apprendre est valorisé
                            et récompensé.
                        </p>
                    </div>
                </div>
            </header>

            <main className="notion-container-wide py-12 md:py-16">
                {/* Bandeau Workyt Award - CTA principal */}
                <section className="mb-12">
                    <Link href="/award" className="block group">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 p-6 md:p-8 text-white shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/60 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2" />
                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                                        <img src="/badge/diamond.png" alt="" width={32} height={32} className="object-contain" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold mb-1">Workyt Award</h2>
                                        <p className="text-white/90 text-sm md:text-base max-w-lg">
                                            Utilisez vos gemmes pour débloquer des codes promo exclusifs chez nos partenaires.
                                            {totalCodes > 0 && (
                                                <span className="font-semibold"> {totalCodes} code{totalCodes > 1 ? 's' : ''} disponible{totalCodes > 1 ? 's' : ''} !</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-full text-sm font-semibold group-hover:bg-orange-50 transition-colors shrink-0">
                                    Obtenir mes réductions
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </section>

                {/* Partenaires officiels - logos */}
                <section className="mb-16">
                    <div className="text-center mb-8">
                        <h2 className="notion-heading">Ils nous font confiance</h2>
                        <p className="text-sm text-[#6b6b6b] max-w-xl mx-auto">
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
                                className="group relative bg-white hover:bg-white border border-[#e3e2e0] hover:border-orange-200 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-1"
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
                                <h3 className="text-sm font-semibold text-[#37352f] mb-1 group-hover:text-[#f97316] transition-colors">
                                    {partenaire.name}
                                </h3>
                                <p className="text-xs text-[#9ca3af] mb-2">{partenaire.description}</p>
                                <ExternalLink className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#f97316] transition-colors" />
                            </a>
                        ))}
                    </div>
                </section>

                {/* Avantages */}
                <section className="mb-16">
                    <h2 className="notion-heading mb-8">Pourquoi nos partenaires s'engagent</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { icon: Ticket, title: "Offres exclusives", description: "Accédez à des réductions et codes promo réservés aux membres Workyt dans toute la France." },
                            { icon: Star, title: "Partenaires vérifiés", description: "Chaque partenaire est sélectionné pour la qualité de ses services et son engagement envers les étudiants." },
                            { icon: Heart, title: "Soutien à l'éducation", description: "Nos partenaires partagent notre mission : rendre l'apprentissage accessible et valoriser l'effort." },
                            { icon: TrendingUp, title: "Économies garanties", description: "Profitez d'avantages concrets : réductions, offres de bienvenue et avantages premium avec vos gemmes." },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="bg-white border border-[#e3e2e0] rounded-2xl p-6 hover:border-orange-200 hover:shadow-md transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                                    <item.icon className="w-5 h-5 text-[#f97316]" />
                                </div>
                                <h3 className="text-sm font-semibold text-[#37352f] mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-[#6b6b6b] leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA devenir partenaire */}
                <section className="mb-16">
                    <div className="bg-gradient-to-br from-[#37352f] to-[#2c2b27] rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-medium mb-4">
                                <Sparkles className="w-3.5 h-3.5" />
                                Rejoignez-nous
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                Devenez partenaire Workyt
                            </h2>
                            <p className="text-white/70 mb-6 leading-relaxed">
                                Rejoignez un réseau d'entreprises engagées auprès des étudiants.
                                En devenant partenaire, vous bénéficiez d'une visibilité auprès
                                de milliers d'étudiants motivés, tout en soutenant une mission
                                éducative qui a du sens.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <Users className="w-5 h-5 text-orange-400 mb-2" />
                                    <p className="text-sm font-medium">Visibilité</p>
                                    <p className="text-xs text-white/50 mt-1">
                                        Touchez des milliers d'étudiants actifs sur la plateforme
                                    </p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <TrendingUp className="w-5 h-5 text-orange-400 mb-2" />
                                    <p className="text-sm font-medium">Engagement</p>
                                    <p className="text-xs text-white/50 mt-1">
                                        Associez votre marque à l'éducation et la réussite
                                    </p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <Heart className="w-5 h-5 text-orange-400 mb-2" />
                                    <p className="text-sm font-medium">Impact</p>
                                    <p className="text-xs text-white/50 mt-1">
                                        Contribuez concrètement à la réussite des étudiants
                                    </p>
                                </div>
                            </div>
                            <a
                                href="mailto:contact@workyt.fr"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full text-sm font-medium transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                Contactez-nous
                            </a>
                        </div>
                    </div>
                </section>

                {/* Section partenaires */}
                <section>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Store className="w-6 h-6" style={{ color: "var(--notion-accent)" }} />
                            <h2 className="notion-heading !mb-0">
                                Toutes les réductions
                            </h2>
                        </div>
                        {!isLoading && totalCodes > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                                <Package className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                    {totalCodes} code{totalCodes > 1 ? 's' : ''} promo disponible{totalCodes > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Filtres */}
                    <div className="bg-[#f7f6f3] rounded-2xl p-4 md:p-5 mb-8">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un partenaire..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3e2e0] rounded-xl text-sm text-[#37352f] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-colors"
                                />
                            </div>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-[#e3e2e0] rounded-xl text-sm text-[#37352f] focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-colors"
                            >
                                <option value="">Toutes les villes</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-[#e3e2e0] rounded-xl text-sm text-[#37352f] focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-colors"
                            >
                                <option value="">Toutes les catégories</option>
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#e3e2e0]">
                                <span className="text-xs text-[#9ca3af] font-medium flex items-center gap-1">
                                    <Filter className="w-3 h-3" />
                                    Filtres actifs :
                                </span>
                                {searchTerm && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs text-[#37352f] border border-[#e3e2e0]">
                                        {searchTerm.length > 20
                                            ? searchTerm.substring(0, 20) + "..."
                                            : searchTerm}
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="hover:text-[#f97316]"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {selectedCity && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs text-[#37352f] border border-[#e3e2e0]">
                                        {selectedCity}
                                        <button
                                            onClick={() => setSelectedCity("")}
                                            className="hover:text-[#f97316]"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {selectedCategory && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs text-[#37352f] border border-[#e3e2e0]">
                                        {categories.find((c) => c.value === selectedCategory)
                                            ?.label || selectedCategory}
                                        <button
                                            onClick={() => setSelectedCategory("")}
                                            className="hover:text-[#f97316]"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedCity("");
                                        setSelectedCategory("");
                                    }}
                                    className="text-xs text-[#f97316] hover:text-[#ea580c] font-medium ml-auto"
                                >
                                    Tout effacer
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    {!isLoading && (
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-[#6b6b6b]">
                                <span className="font-medium text-[#37352f]">
                                    {filteredPartners.length}
                                </span>{" "}
                                partenaire{filteredPartners.length > 1 ? "s" : ""}
                            </p>
                        </div>
                    )}

                    {/* Grille partenaires */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading
                            ? [...Array(6)].map((_, i) => (
                                  <div
                                      key={i}
                                      className="bg-white border border-[#e3e2e0] rounded-2xl overflow-hidden"
                                  >
                                      <Skeleton className="h-48 w-full" />
                                      <div className="p-5 space-y-3">
                                          <Skeleton className="h-5 w-3/4" />
                                          <Skeleton className="h-4 w-full" />
                                          <Skeleton className="h-4 w-2/3" />
                                          <div className="flex gap-2 pt-2">
                                              <Skeleton className="h-6 w-20 rounded-full" />
                                              <Skeleton className="h-6 w-16 rounded-full" />
                                          </div>
                                      </div>
                                  </div>
                              ))
                            : filteredPartners.map((partner) => (
                                  <PartnerCard key={partner._id} partner={partner} />
                              ))}
                    </div>

                    {/* Vide */}
                    {!isLoading && filteredPartners.length === 0 && (
                        <div className="notion-empty py-16">
                            <Store className="notion-empty-icon w-16 h-16" />
                            <h3 className="notion-empty-title text-lg">
                                Aucun partenaire trouvé
                            </h3>
                            <p className="notion-empty-text max-w-md mx-auto">
                                Essayez de modifier vos critères de recherche ou réinitialisez les
                                filtres.
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedCity("");
                                        setSelectedCategory("");
                                    }}
                                    className="mt-4 px-6 py-2.5 bg-[#f97316] text-white rounded-full text-sm font-medium hover:bg-[#ea580c] transition-colors"
                                >
                                    Réinitialiser les filtres
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* CTA gemmes en bas */}
                <section className="mt-16 pt-12 border-t border-[#e3e2e0]">
                    <div className="bg-orange-50 rounded-2xl p-8 md:p-10 text-center">
                        <img
                            src="/badge/diamond.png"
                            alt=""
                            width={48}
                            height={48}
                            className="mx-auto mb-4"
                        />
                        <h3 className="text-xl font-bold text-[#37352f] mb-2">
                            Débloquez encore plus d'avantages
                        </h3>
                        <p className="text-sm text-[#6b6b6b] max-w-lg mx-auto mb-6">
                            Utilisez vos gemmes pour accéder aux offres premium de nos
                            partenaires. Gagnez des gemmes en étant actif sur Workyt !
                        </p>
                        <Link
                            href="/award"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full text-sm font-medium transition-colors"
                        >
                            Découvrir les gemmes
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}

function PartnerCard({ partner }: { partner: Partner }) {
    const category = categories.find((c) => c.value === partner.category);
    const colorClass = categoryColors[partner.category] || categoryColors.autre;

    const hasFreeOffer = partner.offersEnabled?.free && partner.offers.free;
    const hasPremiumOffer = partner.offersEnabled?.premium && partner.offers.premium;
    const totalCodes = getTotalAvailableCodes(partner);

    // Meilleure offre à afficher
    const bestOffer = hasPremiumOffer && partner.offers.premium
        ? formatOfferValue(partner.offers.premium.type, partner.offers.premium.value)
        : hasFreeOffer && partner.offers.free
        ? formatOfferValue(partner.offers.free.type, partner.offers.free.value)
        : null;

    return (
        <Link href="/award" className="block group">
            <div className="bg-white border border-[#e3e2e0] rounded-2xl overflow-hidden hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 h-full flex flex-col">
                {/* Image */}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                    <Image
                        src={partner.image}
                        alt={partner.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Badge catégorie */}
                    <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                            {category?.icon} {category?.label}
                        </span>
                    </div>

                    {/* Badge réduction */}
                    {bestOffer && (
                        <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-[#f97316] shadow-sm">
                                <Ticket className="w-3.5 h-3.5" />
                                {bestOffer}
                            </span>
                        </div>
                    )}

                    {/* Badge codes disponibles */}
                    {totalCodes > 0 && (
                        <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500 text-white rounded-full text-xs font-medium shadow-sm">
                                <Gift className="w-3 h-3" />
                                {totalCodes} code{totalCodes > 1 ? 's' : ''} dispo
                            </span>
                        </div>
                    )}
                    {totalCodes === 0 && (hasFreeOffer || hasPremiumOffer) && (
                        <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/80 text-white rounded-full text-xs font-medium">
                                Rupture de stock
                            </span>
                        </div>
                    )}
                </div>

                {/* Contenu */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-gray-50 border border-[#e3e2e0] flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <Image
                                src={partner.logo}
                                alt={partner.name}
                                width={36}
                                height={36}
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-[#37352f] group-hover:text-[#f97316] transition-colors truncate">
                                {partner.name}
                            </h3>
                            <p className="text-xs text-[#9ca3af] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {partner.city}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-[#6b6b6b] leading-relaxed mb-4 line-clamp-2 flex-1">
                        {partner.description}
                    </p>

                    {/* Offres */}
                    <div className="space-y-2 mb-4">
                        {hasFreeOffer && partner.offers.free && (
                            <div className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                    <span className="text-xs text-green-800 font-medium">
                                        Offre gratuite
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-green-700">
                                    {formatOfferValue(partner.offers.free.type, partner.offers.free.value)}
                                </span>
                            </div>
                        )}
                        {hasPremiumOffer && partner.offers.premium && (
                            <div className="flex items-center justify-between px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center gap-2">
                                    <Gem className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                                    <span className="text-xs text-purple-800 font-medium">
                                        Premium
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-purple-700">
                                        {formatOfferValue(partner.offers.premium.type, partner.offers.premium.value)}
                                    </span>
                                    <span className="text-[10px] text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded-full">
                                        {partner.offers.premium.gemsCost} gemmes
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#e3e2e0]">
                        <div className="flex items-center gap-3">
                            {partner.website && (
                                <Globe className="w-4 h-4 text-[#9ca3af]" />
                            )}
                            {partner.phone && (
                                <Phone className="w-4 h-4 text-[#9ca3af]" />
                            )}
                            {partner.email && (
                                <Mail className="w-4 h-4 text-[#9ca3af]" />
                            )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-[#f97316] font-medium group-hover:gap-2 transition-all">
                            Voir les offres
                            <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
