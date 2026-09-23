"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import NoSSR from "@/components/NoSSR";
import { PAGE_CONTAINER, Eyebrow } from "@/components/wk/primitives";
import { useBackdropDismiss } from "@/hooks/useBackdropDismiss";
import {
    Store,
    MapPin,
    Globe,
    Phone,
    Mail,
    Search,
    Ticket,
    Copy,
    CheckCircle,
    AlertTriangle,
    ArrowUpRight,
    Package,
    Sparkles,
    Lock,
    X,
} from "lucide-react";

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
            promoCode: string;
            promoDescription: string;
            justificationRequired: boolean;
            justificationType: 'image' | 'qr' | 'pdf';
            justificationTemplate?: string;
        };
        premium?: {
            type: string;
            value: number;
            gemsCost: number;
            description: string;
            conditions?: string;
            promoCode: string;
            promoDescription: string;
            additionalBenefits?: string[];
            justificationType: 'image' | 'qr' | 'pdf';
        };
    };
    isActive: boolean;
    startDate: string;
    endDate?: string;
}

interface UserPromoCode {
    code: string;
    partnerId: any;
    offerType: 'free' | 'premium';
    assignedAt: string;
    isUsed: boolean;
}

const categories = [
    { value: 'restauration', label: 'Restauration', icon: '🍽️' },
    { value: 'sport', label: 'Sport', icon: '🏃' },
    { value: 'culture', label: 'Culture', icon: '🎭' },
    { value: 'tech', label: 'Tech', icon: '💻' },
    { value: 'bien-etre', label: 'Bien-être', icon: '🧘' },
    { value: 'loisirs', label: 'Loisirs', icon: '🎮' },
    { value: 'autre', label: 'Autre', icon: '🎯' },
];

const categoryOf = (value: string) => categories.find((c) => c.value === value);

/** Libellé de la remise, quel que soit son type. */
const offerLabel = (offer?: { type: string; value: number; description: string }) => {
    if (!offer) return '';
    if (offer.type === 'percentage') return `${offer.value} % de réduction`;
    if (offer.type === 'fixed') return `${offer.value} € de réduction`;
    return offer.description;
};

const CARD = "rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white";
const FIELD =
    "w-full rounded-full border border-[rgba(26,21,18,0.12)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--wk-accent)] focus:ring-4 focus:ring-[rgba(255,106,26,0.12)]";

/* ─── Filtres ─── */
const PartnersFilters = ({
    searchTerm, setSearchTerm,
    selectedCity, setSelectedCity,
    selectedCategory, setSelectedCategory,
    cities, filteredCount,
}: {
    searchTerm: string; setSearchTerm: (v: string) => void;
    selectedCity: string; setSelectedCity: (v: string) => void;
    selectedCategory: string; setSelectedCategory: (v: string) => void;
    cities: string[]; filteredCount: number;
}) => (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(26,21,18,0.4)]" />
            <input
                type="search"
                placeholder="Rechercher un partenaire…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${FIELD} pl-11`}
                aria-label="Rechercher un partenaire"
            />
        </div>
        <select value={selectedCity || 'all'} onChange={(e) => setSelectedCity(e.target.value)} className={`${FIELD} md:w-48`} aria-label="Ville">
            <option value="all">Toutes les villes</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
        <select value={selectedCategory || 'all'} onChange={(e) => setSelectedCategory(e.target.value)} className={`${FIELD} md:w-52`} aria-label="Catégorie">
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>)}
        </select>
        <span className="shrink-0 text-sm text-[rgba(26,21,18,0.55)] md:ml-2">
            {filteredCount} partenaire{filteredCount > 1 ? 's' : ''}
        </span>
    </div>
);

/* ─── Carte partenaire ─── */
const PartnerCard = ({ partner, userCodes, onClaim, claiming }: {
    partner: Partner;
    userCodes: UserPromoCode[];
    onClaim: (partner: Partner, offerType: 'free' | 'premium') => void;
    claiming: boolean;
}) => {
    const [copied, setCopied] = useState(false);
    const myCode = userCodes.find((c) => c.partnerId?._id === partner._id) || null;
    const isMyPartner = !!myCode;
    const freeEnabled = partner.offersEnabled?.free !== false && partner.offers?.free;
    const premiumEnabled = partner.offersEnabled?.premium !== false && partner.offers?.premium;
    const freeStock = partner.availableCodes?.free ?? 0;
    const premiumStock = partner.availableCodes?.premium ?? 0;
    const totalStock = freeStock + premiumStock;
    const cat = categoryOf(partner.category);

    const copyCode = () => {
        if (myCode?.code) {
            navigator.clipboard.writeText(myCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <article className={`${CARD} flex min-w-0 flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)]`}>
            <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[var(--wk-paper-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={partner.image} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--wk-ink)]">
                    {cat?.icon} {cat?.label}
                </span>
                {isMyPartner ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                        <CheckCircle className="h-3 w-3" /> Mon code
                    </span>
                ) : totalStock > 0 ? (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--wk-ink)] px-2.5 py-1 text-[11px] font-semibold text-[var(--wk-paper)]">
                        <Ticket className="h-3 w-3" /> {totalStock} code{totalStock > 1 ? 's' : ''} dispo
                    </span>
                ) : (freeEnabled || premiumEnabled) ? (
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[rgba(26,21,18,0.6)]">
                        Rupture de stock
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={partner.logo} alt="" className="h-11 w-11 shrink-0 rounded-full border border-[rgba(26,21,18,0.1)] object-cover" />
                    <div className="min-w-0">
                        <h2 className="font-serif-display truncate text-[1.25rem] leading-tight">{partner.name}</h2>
                        <p className="flex items-center gap-1 text-xs text-[rgba(26,21,18,0.55)]">
                            <MapPin className="h-3.5 w-3.5" /> {partner.city}
                        </p>
                    </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-2">{partner.description}</p>

                {/* Mon code pour ce partenaire */}
                {isMyPartner && myCode && (
                    <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                            <Ticket className="h-3.5 w-3.5" /> Ton code personnel
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="font-mono-ui flex-1 rounded-xl bg-white px-3 py-2 text-center text-base font-bold tracking-[0.12em] text-emerald-900">
                                {myCode.code}
                            </span>
                            <button
                                type="button"
                                onClick={copyCode}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700 transition hover:bg-emerald-100"
                                aria-label="Copier le code"
                            >
                                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-emerald-700">{partner.offers?.[myCode.offerType]?.promoDescription}</p>
                        <p className="mt-1 text-[11px] text-emerald-600">
                            Obtenu le {new Date(myCode.assignedAt).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                )}

                {/* Offres disponibles */}
                {!isMyPartner && (
                    <div className="mt-4 space-y-2.5">
                        {freeEnabled && partner.offers.free && (
                            <div className="rounded-2xl bg-[var(--wk-paper)] p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold">Offre gratuite</span>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">0 gemme</span>
                                </div>
                                <p className="mt-1 text-sm text-[rgba(26,21,18,0.7)]">{offerLabel(partner.offers.free)}</p>
                                {partner.offers.free.promoDescription && (
                                    <p className="mt-1 text-xs text-[rgba(26,21,18,0.55)]">{partner.offers.free.promoDescription}</p>
                                )}
                                {freeStock > 0 ? (
                                    <>
                                        <button type="button" onClick={() => onClaim(partner, 'free')} disabled={claiming} className="wk-btn-ink mt-3 w-full justify-center !py-2 text-sm disabled:opacity-50">
                                            <Ticket className="h-4 w-4" /> {claiming ? 'Attribution…' : 'Obtenir mon code'}
                                        </button>
                                        <p className="mt-1.5 text-center text-[11px] text-[rgba(26,21,18,0.5)]">
                                            {freeStock} code{freeStock > 1 ? 's' : ''} restant{freeStock > 1 ? 's' : ''}
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-xs text-[rgba(26,21,18,0.55)]">
                                        Plus de codes pour le moment
                                    </p>
                                )}
                            </div>
                        )}

                        {premiumEnabled && partner.offers.premium && (
                            <div className="rounded-2xl bg-[rgba(255,106,26,0.07)] p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold">Offre premium</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#c24a0a]">
                                        <Image src="/badge/diamond.png" alt="" width={12} height={12} className="object-contain" />
                                        {partner.offers.premium.gemsCost} gemmes
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-[rgba(26,21,18,0.7)]">{offerLabel(partner.offers.premium)}</p>
                                {partner.offers.premium.promoDescription && (
                                    <p className="mt-1 text-xs text-[rgba(26,21,18,0.55)]">{partner.offers.premium.promoDescription}</p>
                                )}
                                {partner.offers.premium.additionalBenefits && partner.offers.premium.additionalBenefits.length > 0 && (
                                    <ul className="mt-2 space-y-0.5 text-xs text-[rgba(26,21,18,0.62)]">
                                        {partner.offers.premium.additionalBenefits.map((b, i) => (
                                            <li key={i} className="flex gap-1.5"><Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[var(--wk-accent)]" /> {b}</li>
                                        ))}
                                    </ul>
                                )}
                                {premiumStock > 0 ? (
                                    <>
                                        <button type="button" onClick={() => onClaim(partner, 'premium')} disabled={claiming} className="wk-btn-orange mt-3 w-full justify-center !py-2 text-sm disabled:opacity-50">
                                            <Ticket className="h-4 w-4" />
                                            {claiming ? 'Attribution…' : `Échanger ${partner.offers.premium.gemsCost} gemmes`}
                                        </button>
                                        <p className="mt-1.5 text-center text-[11px] text-[rgba(26,21,18,0.5)]">
                                            {premiumStock} code{premiumStock > 1 ? 's' : ''} restant{premiumStock > 1 ? 's' : ''}
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-xs text-[rgba(26,21,18,0.55)]">
                                        Plus de codes pour le moment
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Contact */}
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[rgba(26,21,18,0.06)] pt-3.5 text-[11px] text-[rgba(26,21,18,0.55)]">
                    {partner.website && (
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--wk-accent)] hover:underline">
                            <Globe className="h-3 w-3" /> Site
                        </a>
                    )}
                    {partner.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {partner.phone}</span>}
                    {partner.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {partner.email}</span>}
                    <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{partner.address}</span></span>
                </div>
            </div>
        </article>
    );
};

/* ─── Comment ça marche ─── */
const HowItWorks = () => (
    <section className="mb-8" aria-label="Comment ça marche">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
                { n: '01', t: 'Tu travailles', d: 'Cours, fiches, forum, quiz : chaque action utile sur Workyt te rapporte des points.' },
                { n: '02', t: 'Tu convertis', d: '100 points = 1 gemme, depuis la boutique. Les offres gratuites, elles, ne coûtent rien.' },
                { n: '03', t: 'Tu choisis une offre', d: 'Un code promo unique et personnel t’est attribué chez le partenaire.' },
                { n: '04', t: 'Tu en profites', d: 'Tu entres ton code au moment du paiement, chez le partenaire.' },
            ].map((s) => (
                <div key={s.n} className={`${CARD} p-5`}>
                    <span className="font-serif-display text-2xl leading-none text-[var(--wk-accent)]">{s.n}</span>
                    <h3 className="mt-2 font-semibold">{s.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[rgba(26,21,18,0.62)]">{s.d}</p>
                </div>
            ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--wk-paper-2)] px-4 py-3 text-sm">
                <b>Un seul code par partenaire.</b> <span className="text-[rgba(26,21,18,0.62)]">Ton code reste affiché sur sa carte.</span>
            </div>
            <div className="rounded-2xl bg-[var(--wk-paper-2)] px-4 py-3 text-sm">
                <b>Les stocks sont limités.</b> <span className="text-[rgba(26,21,18,0.62)]">Chaque partenaire fournit un nombre de codes défini.</span>
            </div>
            <div className="rounded-2xl bg-[var(--wk-paper-2)] px-4 py-3 text-sm">
                <b>Ton code est personnel.</b> <span className="text-[rgba(26,21,18,0.62)]">Ne le partage pas : il est à usage unique.</span>
            </div>
        </div>
    </section>
);

export default function AwardPageClient() {
    const { data: session } = useSession();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cities, setCities] = useState<string[]>([]);
    const [claiming, setClaiming] = useState(false);
    const [gemBalance, setGemBalance] = useState<number | null>(null);

    const [userCodes, setUserCodes] = useState<UserPromoCode[]>([]);
    const [loadingUserCode, setLoadingUserCode] = useState(true);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmPartner, setConfirmPartner] = useState<Partner | null>(null);
    const [confirmOfferType, setConfirmOfferType] = useState<'free' | 'premium'>('free');

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successCode, setSuccessCode] = useState('');
    const [successPartner, setSuccessPartner] = useState<Partner | null>(null);
    const [copiedSuccess, setCopiedSuccess] = useState(false);

    const confirmBackdrop = useBackdropDismiss(() => setShowConfirmModal(false), claiming);
    const successBackdrop = useBackdropDismiss(() => setShowSuccessModal(false));

    useEffect(() => { fetchPartners(); }, []);
    useEffect(() => {
        if (session?.user?.email) {
            fetchUserCode();
            fetch('/api/gems/balance')
                .then((r) => r.json())
                .then((d) => { if (d?.success) setGemBalance(d.data.gems.balance ?? 0); })
                .catch(() => {});
        } else {
            setLoadingUserCode(false);
        }
    }, [session]);

    const fetchUserCode = async () => {
        try {
            setLoadingUserCode(true);
            const response = await fetch('/api/promo-codes?myCode=true');
            if (response.ok) {
                const data = await response.json();
                setUserCodes(data.codes || []);
            }
        } catch (error) {
            console.error('Erreur chargement codes promo:', error);
        } finally {
            setLoadingUserCode(false);
        }
    };

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/partners?active=true');
            if (!response.ok) throw new Error('Erreur');
            const data = await response.json();
            const list = Array.isArray(data) ? data : data.partners || [];
            setPartners(list);
            setCities([...new Set(list.map((p: Partner) => p.city))].sort() as string[]);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = (partner: Partner, offerType: 'free' | 'premium') => {
        if (!session) { alert('Vous devez être connecté pour obtenir un code promo'); return; }
        const existing = userCodes.find((c) => c.partnerId?._id === partner._id);
        if (existing) { alert('Vous avez déjà un code promo pour ce partenaire.'); return; }
        setConfirmPartner(partner);
        setConfirmOfferType(offerType);
        setShowConfirmModal(true);
    };

    const confirmClaim = async () => {
        if (!confirmPartner) return;
        try {
            setClaiming(true);
            setShowConfirmModal(false);
            const response = await fetch('/api/gems/partner-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId: confirmPartner._id, offerType: confirmOfferType })
            });
            const data = await response.json();
            if (data.success) {
                if (data.alreadyHasCode) {
                    await fetchUserCode();
                    alert(data.data.message);
                } else {
                    setSuccessCode(data.data.promoCode);
                    setSuccessPartner(confirmPartner);
                    setShowSuccessModal(true);
                    await fetchUserCode();
                    await fetchPartners();
                    fetch('/api/gems/balance')
                        .then((r) => r.json())
                        .then((d) => { if (d?.success) setGemBalance(d.data.gems.balance ?? 0); })
                        .catch(() => {});
                }
            } else {
                alert(`Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'attribution du code promo');
        } finally {
            setClaiming(false);
        }
    };

    const copySuccessCode = () => {
        navigator.clipboard.writeText(successCode);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2000);
    };

    const filteredPartners = partners.filter((partner) => {
        if (searchTerm && !partner.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !partner.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (selectedCity && selectedCity !== 'all' && partner.city !== selectedCity) return false;
        if (selectedCategory && selectedCategory !== 'all' && partner.category !== selectedCategory) return false;
        return true;
    });

    const totalCodes = partners.reduce((sum, p) => {
        const free = (p.offersEnabled?.free !== false && p.availableCodes?.free) ? p.availableCodes.free : 0;
        const premium = (p.offersEnabled?.premium !== false && p.availableCodes?.premium) ? p.availableCodes.premium : 0;
        return sum + free + premium;
    }, 0);

    return (
        <NoSSR>
            <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
                {/* En-tête */}
                <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                    <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                    <div className={`${PAGE_CONTAINER} relative grid grid-cols-1 gap-8 pb-10 pt-10 md:pb-14 md:pt-14 lg:grid-cols-12 lg:items-end`}>
                        <div className="lg:col-span-8">
                            <Eyebrow>Workyt Award</Eyebrow>
                            <h1 className="font-serif-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] leading-[0.95]">
                                Ton travail te fait économiser<span className="text-[var(--wk-accent)]">.</span>
                            </h1>
                            <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                                Réviser sur Workyt rapporte des points, les points deviennent des gemmes, et les gemmes
                                ouvrent des codes promo chez nos partenaires. Certaines offres sont même gratuites.
                            </p>
                        </div>
                        <div className="lg:col-span-4">
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                {totalCodes > 0 && (
                                    <span className="wk-chip !px-3.5 !py-2 text-sm">
                                        <Package className="h-4 w-4" /> {totalCodes} code{totalCodes > 1 ? 's' : ''} disponible{totalCodes > 1 ? 's' : ''}
                                    </span>
                                )}
                                {gemBalance !== null && (
                                    <span className="wk-chip !px-3.5 !py-2 text-sm">
                                        <Image src="/badge/diamond.png" alt="" width={16} height={16} className="object-contain" />
                                        {gemBalance} gemme{gemBalance > 1 ? 's' : ''}
                                    </span>
                                )}
                                <Link href="/gems" className="wk-btn-ink !py-2 text-sm">
                                    Mes gemmes <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                    <HowItWorks />

                    {/* Rappel de situation */}
                    {!session ? (
                        <div className={`${CARD} mb-6 flex flex-wrap items-center gap-3 p-4`}>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--wk-paper-2)]">
                                <Lock className="h-5 w-5 text-[rgba(26,21,18,0.5)]" />
                            </span>
                            <p className="flex-1 text-sm">
                                <b>Connecte-toi pour obtenir un code.</b>{' '}
                                <span className="text-[rgba(26,21,18,0.62)]">Les offres restent visibles sans compte.</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new Event("workyt:open-auth"))}
                                className="wk-btn-orange !py-2 text-sm"
                            >
                                Se connecter
                            </button>
                        </div>
                    ) : !loadingUserCode && userCodes.length > 0 ? (
                        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-emerald-50 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                                <Ticket className="h-5 w-5 text-emerald-700" />
                            </span>
                            <p className="flex-1 text-sm">
                                <b className="text-emerald-900">Tu as {userCodes.length} code{userCodes.length > 1 ? 's' : ''} promo.</b>{' '}
                                <span className="text-emerald-700">Ils apparaissent sur les cartes des partenaires concernés.</span>
                            </p>
                        </div>
                    ) : null}

                    <PartnersFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        selectedCity={selectedCity} setSelectedCity={setSelectedCity}
                        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                        cities={cities} filteredCount={filteredPartners.length}
                    />

                    {/* Grille des partenaires */}
                    {loading ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[380px] animate-pulse rounded-3xl border border-[rgba(26,21,18,0.06)] bg-white/70" />
                            ))}
                        </div>
                    ) : filteredPartners.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                            {filteredPartners.map((partner) => (
                                <PartnerCard
                                    key={partner._id}
                                    partner={partner}
                                    userCodes={userCodes}
                                    onClaim={handleClaim}
                                    claiming={claiming}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-12 text-center">
                            <Store className="mx-auto h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                            <p className="font-serif-display mt-3 text-xl">Aucun partenaire trouvé</p>
                            <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">Essaie de modifier ta recherche ou tes filtres.</p>
                        </div>
                    )}

                    {/* Appel aux marques */}
                    <div className="wk-grain group relative mt-8 flex flex-col gap-5 overflow-hidden rounded-3xl bg-[var(--wk-ink)] p-6 text-[var(--wk-paper)] sm:flex-row sm:items-center sm:p-7">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                            <Store className="h-7 w-7 text-[var(--wk-accent-2)]" />
                        </span>
                        <span className="flex-1">
                            <span className="font-mono-ui block text-[11px] uppercase tracking-[0.18em] text-white/60">Vous êtes une marque ?</span>
                            <span className="font-serif-display mt-1 block text-2xl leading-tight">Proposez une offre à nos membres</span>
                            <span className="mt-2 block max-w-[70ch] text-sm leading-relaxed text-white/70">
                                Vous fournissez les codes, nous gérons l&apos;attribution, les limites et le suivi.
                            </span>
                        </span>
                        <Link href="/kit-media#contact" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--wk-ink)]">
                            Devenir partenaire <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Confirmation */}
                {showConfirmModal && confirmPartner && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4" {...confirmBackdrop}>
                        <div className="w-full max-w-md rounded-3xl bg-white p-6">
                            <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={confirmPartner.logo} alt="" className="h-12 w-12 rounded-full border border-[rgba(26,21,18,0.1)] object-cover" />
                                <div className="min-w-0">
                                    <h3 className="font-serif-display truncate text-xl">{confirmPartner.name}</h3>
                                    <p className="text-sm text-[rgba(26,21,18,0.55)]">{confirmPartner.city}</p>
                                </div>
                                <button type="button" onClick={() => setShowConfirmModal(false)} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--wk-paper-2)]" aria-label="Fermer">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className={`mt-4 rounded-2xl p-4 ${confirmOfferType === 'free' ? 'bg-[var(--wk-paper)]' : 'bg-[rgba(255,106,26,0.08)]'}`}>
                                <p className="text-sm font-semibold">
                                    {confirmOfferType === 'free'
                                        ? 'Offre gratuite'
                                        : `Offre premium · ${confirmPartner.offers.premium?.gemsCost ?? 0} gemmes`}
                                </p>
                                <p className="mt-1 text-sm text-[rgba(26,21,18,0.7)]">{confirmPartner.offers[confirmOfferType]?.description}</p>
                                {confirmPartner.offers[confirmOfferType]?.conditions && (
                                    <p className="mt-2 text-xs text-[rgba(26,21,18,0.55)]">{confirmPartner.offers[confirmOfferType]?.conditions}</p>
                                )}
                            </div>

                            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#fff4e0] p-3.5">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9a5d00]" />
                                <p className="text-xs text-[#9a5d00]">
                                    Un seul code par partenaire, et il est à usage unique.
                                    {confirmOfferType === 'premium' && ' Les gemmes seront débitées de ton solde.'}
                                </p>
                            </div>

                            <div className="mt-5 flex gap-2">
                                <button type="button" onClick={() => setShowConfirmModal(false)} className="wk-btn-ghost flex-1 justify-center !py-2.5 text-sm">
                                    Annuler
                                </button>
                                <button type="button" onClick={confirmClaim} disabled={claiming} className="wk-btn-orange flex-1 justify-center !py-2.5 text-sm disabled:opacity-50">
                                    <Ticket className="h-4 w-4" /> {claiming ? 'Attribution…' : 'Confirmer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Succès */}
                {showSuccessModal && successPartner && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4" {...successBackdrop}>
                        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                                <CheckCircle className="h-7 w-7 text-emerald-600" />
                            </span>
                            <h3 className="font-serif-display mt-4 text-2xl">Code attribué<span className="text-[var(--wk-accent)]">.</span></h3>
                            <p className="mt-1 text-sm text-[rgba(26,21,18,0.62)]">
                                Ton code personnel chez <b className="text-[var(--wk-ink)]">{successPartner.name}</b>
                            </p>

                            <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                                <p className="font-mono-ui text-2xl font-bold tracking-[0.15em] text-emerald-900">{successCode}</p>
                                <button type="button" onClick={copySuccessCode} className="wk-btn-ghost mt-3 !py-2 text-sm">
                                    {copiedSuccess ? <><CheckCircle className="h-4 w-4" /> Copié</> : <><Copy className="h-4 w-4" /> Copier le code</>}
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[var(--wk-paper)] p-4 text-left">
                                <p className="text-sm font-semibold">Comment l&apos;utiliser</p>
                                <ol className="mt-2 space-y-1 text-sm text-[rgba(26,21,18,0.68)]">
                                    <li>1. Va sur le site du partenaire.</li>
                                    <li>2. Ajoute tes articles au panier.</li>
                                    <li>3. Entre ton code au moment du paiement.</li>
                                </ol>
                            </div>

                            <button
                                type="button"
                                onClick={() => { setShowSuccessModal(false); setSuccessCode(''); setSuccessPartner(null); }}
                                className="wk-btn-ink mt-5 w-full justify-center !py-2.5 text-sm"
                            >
                                C&apos;est noté
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </NoSSR>
    );
}
