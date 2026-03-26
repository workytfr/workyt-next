"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Ticket, ArrowRight, Gift, Gem, MapPin } from "lucide-react";

interface PartnerPreview {
    _id: string;
    name: string;
    logo: string;
    image: string;
    city: string;
    category: string;
    offersEnabled?: { free: boolean; premium: boolean };
    availableCodes?: { free: number; premium: number };
    offers: {
        free?: { type: string; value: number };
        premium?: { type: string; value: number; gemsCost: number };
    };
}

function formatOffer(type: string, value: number): string {
    if (type === "percentage") return `-${value}%`;
    if (type === "fixed") return `-${value}\u20AC`;
    return "Offre";
}

const WorkytAwardSection = () => {
    const [partners, setPartners] = useState<PartnerPreview[]>([]);
    const [totalCodes, setTotalCodes] = useState(0);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await fetch("/api/partners?active=true");
                if (res.ok) {
                    const data = await res.json();
                    const list: PartnerPreview[] = Array.isArray(data) ? data : data.partners || [];
                    setPartners(list.slice(0, 4));
                    setTotalCodes(list.reduce((sum: number, p: PartnerPreview) => {
                        const free = (p.offersEnabled?.free !== false && p.availableCodes?.free) ? p.availableCodes.free : 0;
                        const premium = (p.offersEnabled?.premium !== false && p.availableCodes?.premium) ? p.availableCodes.premium : 0;
                        return sum + free + premium;
                    }, 0));
                }
            } catch { /* silently fail */ }
        };
        fetchPartners();
    }, []);

    if (partners.length === 0) return null;

    return (
        <div className="py-14 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-medium mb-4">
                        <Gift className="w-4 h-4" />
                        Workyt Award
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Vos{" "}
                        <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                            réductions exclusives
                        </span>
                    </h2>
                    <p className="text-gray-500 max-w-xl mx-auto text-sm">
                        Utilisez vos gemmes pour débloquer des codes promo chez nos partenaires.
                        {totalCodes > 0 && (
                            <span className="font-semibold text-green-600"> {totalCodes} code{totalCodes > 1 ? 's' : ''} disponible{totalCodes > 1 ? 's' : ''} !</span>
                        )}
                    </p>
                </div>

                {/* Grille partenaires */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {partners.map((partner) => {
                        const codes = ((partner.offersEnabled?.free !== false && partner.availableCodes?.free) ? partner.availableCodes.free : 0) +
                            ((partner.offersEnabled?.premium !== false && partner.availableCodes?.premium) ? partner.availableCodes.premium : 0);
                        const bestOffer = partner.offers.premium
                            ? formatOffer(partner.offers.premium.type, partner.offers.premium.value)
                            : partner.offers.free
                            ? formatOffer(partner.offers.free.type, partner.offers.free.value)
                            : null;

                        return (
                            <Link key={partner._id} href="/award" className="group">
                                <div className="relative bg-white border border-gray-100 hover:border-orange-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-1">
                                    {/* Image */}
                                    <div className="relative h-28 bg-gray-100 overflow-hidden">
                                        <Image
                                            src={partner.image}
                                            alt={partner.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        {bestOffer && (
                                            <div className="absolute top-2 right-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-orange-600">
                                                    <Ticket className="w-3 h-3" />
                                                    {bestOffer}
                                                </span>
                                            </div>
                                        )}
                                        {codes > 0 && (
                                            <div className="absolute bottom-2 left-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white rounded-full text-[10px] font-medium">
                                                    {codes} dispo
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <Image
                                                src={partner.logo}
                                                alt=""
                                                width={24}
                                                height={24}
                                                className="rounded-full object-cover"
                                                unoptimized
                                            />
                                            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors truncate">
                                                {partner.name}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {partner.city}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href="/award"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/60"
                    >
                        Voir toutes les réductions
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default WorkytAwardSection;
