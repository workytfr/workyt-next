"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import NoSSR from "@/components/NoSSR";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Store, MapPin, Gem, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Partner {
    _id: string;
    name: string;
    description: string;
    logo: string;
    image: string;
    category: string;
    city: string;
    offers: {
        free: {
            type: string;
            value: number;
            description: string;
        };
        premium: {
            type: string;
            value: number;
            gemsCost: number;
            description: string;
        };
    };
}

const categories = [
    { value: 'restauration', label: 'Restauration', color: 'bg-orange-100 text-orange-800', icon: '🍽️' },
    { value: 'sport', label: 'Sport', color: 'bg-blue-100 text-blue-800', icon: '🏃' },
    { value: 'culture', label: 'Culture', color: 'bg-purple-100 text-purple-800', icon: '🎭' },
    { value: 'tech', label: 'Tech', color: 'bg-green-100 text-green-800', icon: '💻' },
    { value: 'bien-etre', label: 'Bien-être', color: 'bg-pink-100 text-pink-800', icon: '🧘' },
    { value: 'loisirs', label: 'Loisirs', color: 'bg-yellow-100 text-yellow-800', icon: '🎮' },
    { value: 'autre', label: 'Autre', color: 'bg-gray-100 text-gray-800', icon: '🎯' }
];

export default function PartnersSection() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/partners?active=true');
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des partenaires');
            }
            const data = await response.json();
            // Prendre seulement les 6 premiers partenaires pour la page d'accueil
            setPartners(data.slice(0, 6));
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Nos Partenaires
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Découvrez nos partenaires et profitez d&apos;offres exclusives partout en France
                        </p>
                    </div>
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    if (partners.length === 0) {
        return null; // Ne pas afficher la section s'il n'y a pas de partenaires
    }

    return (
        <NoSSR>
            <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Store className="w-12 h-12 text-blue-600" />
                            <h2 className="text-3xl font-bold text-gray-900">
                                Workyt Award
                            </h2>
                        </div>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
                            Découvrez nos partenaires et profitez d&apos;offres exclusives partout en France
                        </p>
                        <p className="text-sm text-gray-500">
                            Réductions, avantages et offres spéciales pour les étudiants
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {partners.map((partner) => (
                            <Card key={partner._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                <div className="h-32 bg-gray-200 relative">
                                    <img
                                        src={partner.image}
                                        alt={partner.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2">
                                        <Badge className={categories.find(c => c.value === partner.category)?.color}>
                                            {categories.find(c => c.value === partner.category)?.icon} {categories.find(c => c.value === partner.category)?.label}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={partner.logo}
                                            alt={`Logo ${partner.name}`}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                        />
                                        <div>
                                            <CardTitle className="text-base">{partner.name}</CardTitle>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {partner.city}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {partner.description}
                                    </p>
                                    
                                    {/* Offre gratuite */}
                                    <div className="bg-green-50 p-2 rounded border border-green-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-green-800">Offre gratuite</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                                0 gemmes
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-green-700">
                                            {partner.offers.free.type === 'percentage' && `${partner.offers.free.value}% de réduction`}
                                            {partner.offers.free.type === 'fixed' && `${partner.offers.free.value}€ de réduction`}
                                            {partner.offers.free.type === 'welcome' && partner.offers.free.description}
                                        </div>
                                    </div>

                                    {/* Offre premium */}
                                    <div className="bg-purple-50 p-2 rounded border border-purple-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-purple-800">Offre premium</span>
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                                <Gem className="w-3 h-3 mr-1" />
                                                {partner.offers.premium.gemsCost} gemmes
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-purple-700">
                                            {partner.offers.premium.type === 'percentage' && `${partner.offers.premium.value}% de réduction`}
                                            {partner.offers.premium.type === 'fixed' && `${partner.offers.premium.value}€ de réduction`}
                                            {partner.offers.premium.type === 'welcome' && partner.offers.premium.description}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link href="/partners">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                Voir tous nos partenaires
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </NoSSR>
    );
}
