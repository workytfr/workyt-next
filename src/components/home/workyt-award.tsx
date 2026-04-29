"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Ticket,
    ArrowRight,
    Gift,
    MapPin,
    Sparkles,
    ArrowUpRight,
} from "lucide-react";

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
    if (type === "fixed") return `-${value}€`;
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
                    const list: PartnerPreview[] = Array.isArray(data)
                        ? data
                        : data.partners || [];
                    setPartners(list.slice(0, 4));
                    setTotalCodes(
                        list.reduce((sum: number, p: PartnerPreview) => {
                            const free =
                                p.offersEnabled?.free !== false && p.availableCodes?.free
                                    ? p.availableCodes.free
                                    : 0;
                            const premium =
                                p.offersEnabled?.premium !== false && p.availableCodes?.premium
                                    ? p.availableCodes.premium
                                    : 0;
                            return sum + free + premium;
                        }, 0)
                    );
                }
            } catch {
                /* silently fail */
            }
        };
        fetchPartners();
    }, []);

    if (partners.length === 0) return null;

    return (
        <section
            id="award"
            className="relative overflow-hidden bg-[#fff8ee] px-4 py-20 md:py-28"
        >
            <div
                className="wk-cahier pointer-events-none absolute inset-0 opacity-[0.35]"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-[1400px]">
                {/* Header */}
                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                        <div className="font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)]">
                            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
                            <span>06</span>
                            <span>Workyt Award</span>
                        </div>
                        <h2 className="font-serif-display mt-4 text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                            Vos réductions{" "}
                            <span className="italic text-[var(--wk-accent)]">
                                exclusives
                            </span>
                            .
                        </h2>
                        <p className="mt-4 max-w-md text-[rgba(26,21,18,0.7)]">
                            Utilisez vos gemmes pour débloquer des codes promo chez nos partenaires éducatifs.
                            {totalCodes > 0 && (
                                <span className="ml-1 font-semibold text-[#1a5a1a]">
                                    {totalCodes} code{totalCodes > 1 ? "s" : ""} disponible{totalCodes > 1 ? "s" : ""} !
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="relative">
                        <div
                            className="wk-float-y rotate-[-4deg] rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white p-4 shadow-xl"
                            style={{ animationDelay: "-1s" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(255,106,26,0.12)] text-[var(--wk-accent)]">
                                    <Gift className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-mono-ui text-[10px] uppercase tracking-widest text-[rgba(26,21,18,0.5)]">
                                        Gemmes → Codes
                                    </div>
                                    <div className="font-serif-display text-xl">
                                        100 pts = 1 💎
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Partners grid */}
                <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {partners.map((partner, i) => {
                        const codes =
                            (partner.offersEnabled?.free !== false && partner.availableCodes?.free
                                ? partner.availableCodes.free
                                : 0) +
                            (partner.offersEnabled?.premium !== false &&
                            partner.availableCodes?.premium
                                ? partner.availableCodes.premium
                                : 0);
                        const bestOffer = partner.offers.premium
                            ? formatOffer(partner.offers.premium.type, partner.offers.premium.value)
                            : partner.offers.free
                            ? formatOffer(partner.offers.free.type, partner.offers.free.value)
                            : null;

                        return (
                            <Link
                                key={partner._id}
                                href="/award"
                                className="wk-tilt group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(26,21,18,0.08)]"
                            >
                                <div className="relative h-36 overflow-hidden bg-[var(--wk-paper-2)]">
                                    <Image
                                        src={partner.image}
                                        alt={`Offre partenaire ${partner.name} sur Workyt Award`}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                    {bestOffer && (
                                        <div className="absolute right-3 top-3">
                                            <span className="wk-pulse-glow inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--wk-accent)] shadow-lg">
                                                <Ticket className="h-3 w-3" />
                                                {bestOffer}
                                            </span>
                                        </div>
                                    )}
                                    {codes > 0 && (
                                        <div className="absolute bottom-3 left-3">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#1a5a1a] px-2.5 py-1 text-[10px] font-semibold text-white">
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7ed957]" />
                                                {codes} dispo
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="wk-chip !border-[#ffd8a8] !bg-[#fff3e0] !text-[#7a3a0a]">
                                            <Sparkles className="h-3 w-3" />
                                            {partner.category?.toUpperCase() || "AWARD"}
                                        </span>
                                        <span className="font-mono-ui text-[10px] text-[rgba(26,21,18,0.4)]">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                    </div>

                                    <div className="mt-1 flex items-center gap-2.5">
                                        <Image
                                            src={partner.logo}
                                            alt=""
                                            width={28}
                                            height={28}
                                            className="h-7 w-7 rounded-full border border-[rgba(26,21,18,0.1)] object-cover"
                                            unoptimized
                                        />
                                        <h3 className="font-serif-display truncate text-lg leading-tight">
                                            {partner.name}
                                        </h3>
                                    </div>

                                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[rgba(26,21,18,0.55)]">
                                        <MapPin className="h-3 w-3" />
                                        {partner.city}
                                    </p>

                                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--wk-accent)] opacity-0 transition group-hover:opacity-100">
                                        Débloquer
                                        <ArrowUpRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link href="/award" className="wk-btn-orange wk-animate-shine inline-flex">
                        Voir toutes les réductions
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default WorkytAwardSection;
