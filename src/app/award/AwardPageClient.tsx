"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import NoSSR from "@/components/NoSSR";
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
    Gift,
    Gem,
    ArrowRight,
    Package,
} from "lucide-react";
import "@/app/cours/_components/styles/notion-theme.css";

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
    { value: 'restauration', label: 'Restauration', color: 'bg-orange-100 text-orange-800', icon: '\uD83C\uDF7D\uFE0F' },
    { value: 'sport', label: 'Sport', color: 'bg-blue-100 text-blue-800', icon: '\uD83C\uDFC3' },
    { value: 'culture', label: 'Culture', color: 'bg-purple-100 text-purple-800', icon: '\uD83C\uDFAD' },
    { value: 'tech', label: 'Tech', color: 'bg-green-100 text-green-800', icon: '\uD83D\uDCBB' },
    { value: 'bien-etre', label: 'Bien-\u00EAtre', color: 'bg-pink-100 text-pink-800', icon: '\uD83E\uDDD8' },
    { value: 'loisirs', label: 'Loisirs', color: 'bg-yellow-100 text-yellow-800', icon: '\uD83C\uDFAE' },
    { value: 'autre', label: 'Autre', color: 'bg-gray-100 text-gray-800', icon: '\uD83C\uDFAF' }
];

// Filtres
const PartnersFilters = ({
    searchTerm, setSearchTerm,
    selectedCity, setSelectedCity,
    selectedCategory, setSelectedCategory,
    cities, filteredCount
}: {
    searchTerm: string; setSearchTerm: (v: string) => void;
    selectedCity: string; setSelectedCity: (v: string) => void;
    selectedCategory: string; setSelectedCategory: (v: string) => void;
    cities: string[]; filteredCount: number;
}) => (
    <div className="bg-[#f7f6f3] rounded-2xl p-4 md:p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Rechercher un partenaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger><SelectValue placeholder="Toutes les villes" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue placeholder="Toutes les catégories" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="text-sm text-gray-500 flex items-center justify-center">
                {filteredCount} partenaire{filteredCount > 1 ? 's' : ''}
            </div>
        </div>
    </div>
);

// Carte partenaire
const PartnerCard = ({ partner, userCodes, onClaim, claiming }: {
    partner: Partner;
    userCodes: UserPromoCode[];
    onClaim: (partner: Partner, offerType: 'free' | 'premium') => void;
    claiming: boolean;
}) => {
    const [copied, setCopied] = useState(false);
    const myCode = userCodes.find(c => c.partnerId?._id === partner._id) || null;
    const isMyPartner = !!myCode;
    const freeEnabled = partner.offersEnabled?.free !== false && partner.offers?.free;
    const premiumEnabled = partner.offersEnabled?.premium !== false && partner.offers?.premium;
    const freeStock = partner.availableCodes?.free ?? 0;
    const premiumStock = partner.availableCodes?.premium ?? 0;
    const totalStock = freeStock + premiumStock;

    const copyCode = () => {
        if (myCode?.code) {
            navigator.clipboard.writeText(myCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card className="notion-card overflow-hidden">
            <div className="h-40 bg-gray-200 relative">
                <img src={partner.image} alt={partner.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                    <Badge className={categories.find(c => c.value === partner.category)?.color}>
                        {categories.find(c => c.value === partner.category)?.icon} {categories.find(c => c.value === partner.category)?.label}
                    </Badge>
                </div>
                {isMyPartner && (
                    <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" /> Mon code
                        </Badge>
                    </div>
                )}
                {!isMyPartner && totalStock > 0 && (
                    <div className="absolute bottom-3 left-3">
                        <Badge className="bg-green-500 text-white text-xs shadow-sm">
                            <Ticket className="w-3 h-3 mr-1" />
                            {totalStock} code{totalStock > 1 ? 's' : ''} dispo
                        </Badge>
                    </div>
                )}
                {!isMyPartner && totalStock === 0 && (freeEnabled || premiumEnabled) && (
                    <div className="absolute bottom-3 left-3">
                        <Badge className="bg-gray-500/80 text-white text-xs">Rupture de stock</Badge>
                    </div>
                )}
            </div>

            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <img src={partner.logo} alt={`Logo ${partner.name}`} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                        <CardTitle className="text-base">{partner.name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />{partner.city}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">{partner.description}</p>

                {/* Code de l'utilisateur pour ce partenaire */}
                {isMyPartner && myCode && (
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Ticket className="w-4 h-4 text-green-700" />
                            <span className="text-sm font-semibold text-green-800">Votre code promo personnel</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 text-lg font-mono font-bold text-green-900 bg-white px-3 py-2 rounded border-2 border-green-200 text-center tracking-wider">
                                {myCode.code}
                            </div>
                            <Button size="sm" variant="outline" onClick={copyCode} className="border-green-300 text-green-700 hover:bg-green-100">
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-green-600">{partner.offers?.[myCode.offerType]?.promoDescription}</p>
                        <p className="text-xs text-green-500 mt-1">Obtenu le {new Date(myCode.assignedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                )}

                {/* Boutons pour réclamer */}
                {!isMyPartner && (
                    <>
                        {freeEnabled && partner.offers.free && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-800">Offre gratuite</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">0 gemmes</Badge>
                                </div>
                                <div className="text-sm text-green-700 mb-2">
                                    {partner.offers.free.type === 'percentage' && `${partner.offers.free.value}% de réduction`}
                                    {partner.offers.free.type === 'fixed' && `${partner.offers.free.value}\u20AC de réduction`}
                                    {partner.offers.free.type === 'welcome' && partner.offers.free.description}
                                </div>
                                {partner.offers.free.promoDescription && (
                                    <p className="text-xs text-green-600 mb-2">{partner.offers.free.promoDescription}</p>
                                )}
                                {freeStock > 0 ? (
                                    <>
                                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => onClaim(partner, 'free')} disabled={claiming}>
                                            <Ticket className="w-4 h-4 mr-2" />
                                            {claiming ? 'Attribution...' : 'Obtenir mon code promo'}
                                        </Button>
                                        <p className="text-xs text-green-500 mt-1 text-center">{freeStock} code{freeStock > 1 ? 's' : ''} restant{freeStock > 1 ? 's' : ''}</p>
                                    </>
                                ) : (
                                    <div className="text-xs text-red-500 text-center p-2 bg-red-50 rounded border border-red-200">Plus de codes disponibles pour le moment</div>
                                )}
                            </div>
                        )}

                        {premiumEnabled && partner.offers.premium && (
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-purple-800">Offre premium</span>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                        <img src="/badge/diamond.png" alt="" width={14} height={14} className="inline object-contain mr-1" />
                                        {partner.offers.premium.gemsCost} gemmes
                                    </Badge>
                                </div>
                                <div className="text-sm text-purple-700 mb-2">
                                    {partner.offers.premium.type === 'percentage' && `${partner.offers.premium.value}% de réduction`}
                                    {partner.offers.premium.type === 'fixed' && `${partner.offers.premium.value}\u20AC de réduction`}
                                    {partner.offers.premium.type === 'welcome' && partner.offers.premium.description}
                                </div>
                                {partner.offers.premium.promoDescription && (
                                    <p className="text-xs text-purple-600 mb-2">{partner.offers.premium.promoDescription}</p>
                                )}
                                {partner.offers.premium.additionalBenefits && partner.offers.premium.additionalBenefits.length > 0 && (
                                    <div className="text-xs text-purple-700 mb-2">
                                        <div className="font-medium">Avantages :</div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {partner.offers.premium.additionalBenefits.map((b, i) => <li key={i}>{b}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {premiumStock > 0 ? (
                                    <>
                                        <Button size="sm" variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100" onClick={() => onClaim(partner, 'premium')} disabled={claiming}>
                                            <Ticket className="w-4 h-4 mr-2" />
                                            {claiming ? 'Attribution...' : `Obtenir avec ${partner.offers.premium.gemsCost} gemmes`}
                                        </Button>
                                        <p className="text-xs text-purple-500 mt-1 text-center">{premiumStock} code{premiumStock > 1 ? 's' : ''} restant{premiumStock > 1 ? 's' : ''}</p>
                                    </>
                                ) : (
                                    <div className="text-xs text-red-500 text-center p-2 bg-red-50 rounded border border-red-200">Plus de codes disponibles pour le moment</div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Contact */}
                <div className="space-y-1 text-xs text-gray-500">
                    {partner.website && (
                        <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Site web</a>
                        </div>
                    )}
                    {partner.phone && (
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{partner.phone}</div>
                    )}
                    {partner.email && (
                        <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{partner.email}</div>
                    )}
                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{partner.address}</div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function AwardPageClient() {
    const { data: session } = useSession();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cities, setCities] = useState<string[]>([]);
    const [claiming, setClaiming] = useState(false);

    const [userCodes, setUserCodes] = useState<UserPromoCode[]>([]);
    const [loadingUserCode, setLoadingUserCode] = useState(true);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmPartner, setConfirmPartner] = useState<Partner | null>(null);
    const [confirmOfferType, setConfirmOfferType] = useState<'free' | 'premium'>('free');

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successCode, setSuccessCode] = useState('');
    const [successPartner, setSuccessPartner] = useState<Partner | null>(null);
    const [copiedSuccess, setCopiedSuccess] = useState(false);

    useEffect(() => { fetchPartners(); }, []);
    useEffect(() => {
        if (session?.user?.email) fetchUserCode();
        else setLoadingUserCode(false);
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
        const existing = userCodes.find(c => c.partnerId?._id === partner._id);
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

    const filteredPartners = partners.filter(partner => {
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

    if (loading) {
        return (
            <div className="notion-layout notion-animate-fade-in min-h-screen">
                <div className="notion-container-wide py-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--notion-accent)' }}></div>
                        <p className="mt-4 notion-text-secondary">Chargement...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <NoSSR>
            <div className="notion-layout notion-animate-fade-in min-h-screen">
                {/* Header */}
                <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 text-white">
                    <div className="notion-container-wide py-12 md:py-16">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                                    <img src="/badge/diamond.png" alt="" width={36} height={36} className="object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Workyt Award</h1>
                                    <p className="text-white/90 text-base md:text-lg max-w-xl">
                                        Obtenez des codes promo exclusifs chez nos partenaires.
                                        Échangez vos gemmes ou profitez d'offres gratuites !
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {totalCodes > 0 && (
                                    <div className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                                        <Package className="w-5 h-5" />
                                        <span className="text-lg font-bold">{totalCodes}</span>
                                        <span className="text-sm">code{totalCodes > 1 ? 's' : ''} disponible{totalCodes > 1 ? 's' : ''}</span>
                                    </div>
                                )}
                                <Link href="/gems" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-sm transition-colors">
                                    <Gem className="w-4 h-4" />
                                    Gérer mes gemmes
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="notion-container-wide py-8 md:py-12">
                    {/* Bandeau codes actifs */}
                    {session && userCodes.length > 0 && (
                        <div className="rounded-2xl p-4 mb-6 bg-green-50 border border-green-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Ticket className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-800">Mes codes promo ({userCodes.length})</h4>
                                    <p className="text-sm text-green-600">Retrouvez vos codes sur les cartes partenaires ci-dessous</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {session && userCodes.length === 0 && (
                        <div className="rounded-2xl p-4 mb-6 bg-blue-50 border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Ticket className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-800">Pas encore de code promo</h4>
                                    <p className="text-sm text-blue-600">Choisissez un partenaire ci-dessous pour obtenir un code promo unique et personnel.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!session && (
                        <div className="rounded-2xl p-4 mb-6 bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-amber-800">Connectez-vous</h4>
                                    <p className="text-sm text-amber-600">Vous devez être connecté pour obtenir un code promo.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <PartnersFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        selectedCity={selectedCity} setSelectedCity={setSelectedCity}
                        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                        cities={cities} filteredCount={filteredPartners.length}
                    />

                    {/* Grille des partenaires */}
                    <div className="notion-grid notion-grid-3">
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

                    {filteredPartners.length === 0 && (
                        <div className="notion-empty">
                            <Store className="notion-empty-icon mx-auto" />
                            <h3 className="notion-empty-title">Aucun partenaire trouvé</h3>
                            <p className="notion-empty-text">Essayez de modifier vos critères de recherche</p>
                        </div>
                    )}

                    {/* Modal de confirmation */}
                    {showConfirmModal && confirmPartner && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-md w-full p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={confirmPartner.logo} alt={confirmPartner.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                                    <div>
                                        <h3 className="text-lg font-semibold">{confirmPartner.name}</h3>
                                        <p className="text-sm text-gray-600">{confirmPartner.city}</p>
                                    </div>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Confirmation</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                Un seul code promo par partenaire.
                                                {confirmOfferType === 'premium' && ' Le coût en gemmes sera débité de votre solde.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-lg border mb-4 ${confirmOfferType === 'free' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'}`}>
                                    <p className="text-sm font-medium mb-1">
                                        {confirmOfferType === 'free' ? 'Offre gratuite' : `Offre premium (${confirmPartner.offers.premium?.gemsCost ?? 0} gemmes)`}
                                    </p>
                                    <p className="text-sm text-gray-600">{confirmPartner.offers[confirmOfferType]?.description}</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
                                    <Button
                                        className={`flex-1 ${confirmOfferType === 'free' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                        onClick={confirmClaim} disabled={claiming}
                                    >
                                        <Ticket className="w-4 h-4 mr-2" />
                                        {claiming ? 'Attribution...' : 'Confirmer'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal de succès */}
                    {showSuccessModal && successPartner && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-green-800 mb-2">Code promo attribué !</h3>
                                <p className="text-gray-600 mb-4">
                                    Voici votre code promo unique chez <strong>{successPartner.name}</strong>
                                </p>
                                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-300 mb-4">
                                    <div className="text-3xl font-mono font-bold text-green-900 tracking-wider mb-2">{successCode}</div>
                                    <Button size="sm" variant="outline" onClick={copySuccessCode} className="border-green-300 text-green-700 hover:bg-green-100">
                                        {copiedSuccess ? <><CheckCircle className="w-4 h-4 mr-2" /> Copié !</> : <><Copy className="w-4 h-4 mr-2" /> Copier le code</>}
                                    </Button>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-left text-sm text-gray-600 mb-4">
                                    <p className="font-medium mb-1">Comment l&apos;utiliser :</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>1. Allez sur le site du partenaire</li>
                                        <li>2. Ajoutez vos articles au panier</li>
                                        <li>3. Entrez votre code promo au moment du paiement</li>
                                    </ul>
                                </div>
                                <Button className="w-full" onClick={() => { setShowSuccessModal(false); setSuccessCode(''); setSuccessPartner(null); }}>
                                    Compris !
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </NoSSR>
    );
}
