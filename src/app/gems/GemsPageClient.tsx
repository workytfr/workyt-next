"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import GemManager from '@/components/ui/GemManager';
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
    Lock,
    AlertTriangle
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
    { value: 'restauration', label: 'Restauration', color: 'bg-orange-100 text-orange-800', icon: '🍽️' },
    { value: 'sport', label: 'Sport', color: 'bg-blue-100 text-blue-800', icon: '🏃' },
    { value: 'culture', label: 'Culture', color: 'bg-purple-100 text-purple-800', icon: '🎭' },
    { value: 'tech', label: 'Tech', color: 'bg-green-100 text-green-800', icon: '💻' },
    { value: 'bien-etre', label: 'Bien-être', color: 'bg-pink-100 text-pink-800', icon: '🧘' },
    { value: 'loisirs', label: 'Loisirs', color: 'bg-yellow-100 text-yellow-800', icon: '🎮' },
    { value: 'autre', label: 'Autre', color: 'bg-gray-100 text-gray-800', icon: '🎯' }
];

// Composant pour l'en-tête des gemmes
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

// Composant pour l'en-tête des partenaires
const PartnersHeader = () => (
    <div className="notion-divider" style={{ margin: '3rem 0 2rem' }} >
        <div className="py-8">
            <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <Store className="w-8 h-8" style={{ color: 'var(--notion-accent)' }} />
                    <h2 className="notion-title">Workyt Award</h2>
                </div>
                <p className="notion-subtitle">
                    Découvrez nos partenaires et profitez d&apos;offres exclusives partout en France !
                </p>
                <p className="notion-text-small mt-2">
                    Réductions, avantages et offres spéciales pour les étudiants
                </p>
            </div>
        </div>
    </div>
);

// Composant pour les filtres
const PartnersFilters = ({
    searchTerm,
    setSearchTerm,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    cities,
    filteredPartners
}: {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    selectedCity: string;
    setSelectedCity: (value: string) => void;
    selectedCategory: string;
    setSelectedCategory: (value: string) => void;
    cities: string[];
    filteredPartners: Partner[];
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
                <SelectTrigger>
                    <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
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
                {filteredPartners.length} partenaire{filteredPartners.length > 1 ? 's' : ''} trouvé{filteredPartners.length > 1 ? 's' : ''}
            </div>
        </div>
    </div>
);

// Composant pour une carte de partenaire
const PartnerCard = ({ partner, userCode, onClaim, claiming }: {
    partner: Partner;
    userCode: UserPromoCode | null;
    onClaim: (partner: Partner, offerType: 'free' | 'premium') => void;
    claiming: boolean;
}) => {
    const [copied, setCopied] = useState(false);
    const isMyPartner = userCode && userCode.partnerId?._id === partner._id;
    const hasCodeElsewhere = userCode && !isMyPartner;
    const freeEnabled = partner.offersEnabled?.free !== false && partner.offers?.free;
    const premiumEnabled = partner.offersEnabled?.premium !== false && partner.offers?.premium;
    const freeStock = partner.availableCodes?.free ?? 0;
    const premiumStock = partner.availableCodes?.premium ?? 0;

    const copyCode = () => {
        if (userCode?.code) {
            navigator.clipboard.writeText(userCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card className="notion-card overflow-hidden">
            <div className="h-40 bg-gray-200 relative">
                <img
                    src={partner.image}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                />
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
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {partner.city}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                    {partner.description}
                </p>

                {/* Si l'user a un code pour CE partenaire : afficher le code */}
                {isMyPartner && userCode && (
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Ticket className="w-4 h-4 text-green-700" />
                            <span className="text-sm font-semibold text-green-800">Votre code promo personnel</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 text-lg font-mono font-bold text-green-900 bg-white px-3 py-2 rounded border-2 border-green-200 text-center tracking-wider">
                                {userCode.code}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyCode}
                                className="border-green-300 text-green-700 hover:bg-green-100"
                            >
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-green-600">
                            {partner.offers?.[userCode.offerType]?.promoDescription}
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                            Obtenu le {new Date(userCode.assignedAt).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                )}

                {/* Si l'user a un code chez un AUTRE partenaire : verrouillé */}
                {hasCodeElsewhere && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm font-medium">Code promo indisponible</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            Vous avez déjà un code promo actif chez {userCode?.partnerId?.name || 'un autre partenaire'}.
                            Un seul code promo par utilisateur.
                        </p>
                    </div>
                )}

                {/* Si l'user n'a aucun code : boutons pour réclamer */}
                {!userCode && (
                    <>
                        {/* Offre gratuite */}
                        {freeEnabled && partner.offers.free && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-800">Offre gratuite</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        0 gemmes
                                    </Badge>
                                </div>
                                <div className="text-sm text-green-700 mb-2">
                                    {partner.offers.free.type === 'percentage' && `${partner.offers.free.value}% de réduction`}
                                    {partner.offers.free.type === 'fixed' && `${partner.offers.free.value}€ de réduction`}
                                    {partner.offers.free.type === 'welcome' && partner.offers.free.description}
                                </div>
                                <div className="bg-gray-100 p-2 rounded border border-gray-300 mb-2">
                                    <div className="text-xs text-gray-600 font-medium mb-1">Code promo :</div>
                                    <div className="text-sm font-mono text-gray-400 bg-white px-2 py-1 rounded border text-center">
                                        ••••••••••••
                                    </div>
                                </div>
                                {partner.offers.free.promoDescription && (
                                    <p className="text-xs text-green-600 mb-2">{partner.offers.free.promoDescription}</p>
                                )}
                                {freeStock > 0 ? (
                                    <>
                                        <Button
                                            size="sm"
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            onClick={() => onClaim(partner, 'free')}
                                            disabled={claiming}
                                        >
                                            <Ticket className="w-4 h-4 mr-2" />
                                            {claiming ? 'Attribution...' : 'Obtenir mon code promo'}
                                        </Button>
                                        <p className="text-xs text-green-500 mt-1 text-center">{freeStock} code{freeStock > 1 ? 's' : ''} restant{freeStock > 1 ? 's' : ''}</p>
                                    </>
                                ) : (
                                    <div className="text-xs text-red-500 text-center p-2 bg-red-50 rounded border border-red-200">
                                        Plus de codes disponibles pour le moment
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Offre premium */}
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
                                    {partner.offers.premium.type === 'fixed' && `${partner.offers.premium.value}€ de réduction`}
                                    {partner.offers.premium.type === 'welcome' && partner.offers.premium.description}
                                </div>
                                <div className="bg-gray-100 p-2 rounded border border-gray-300 mb-2">
                                    <div className="text-xs text-gray-600 font-medium mb-1">Code promo :</div>
                                    <div className="text-sm font-mono text-gray-400 bg-white px-2 py-1 rounded border text-center">
                                        ••••••••••••
                                    </div>
                                </div>
                                {partner.offers.premium.promoDescription && (
                                    <p className="text-xs text-purple-600 mb-2">{partner.offers.premium.promoDescription}</p>
                                )}
                                {partner.offers.premium.additionalBenefits && partner.offers.premium.additionalBenefits.length > 0 && (
                                    <div className="text-xs text-purple-700 mb-2">
                                        <div className="font-medium">Avantages supplémentaires :</div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {partner.offers.premium.additionalBenefits.map((benefit, index) => (
                                                <li key={index}>{benefit}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {premiumStock > 0 ? (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                                            onClick={() => onClaim(partner, 'premium')}
                                            disabled={claiming}
                                        >
                                            <Ticket className="w-4 h-4 mr-2" />
                                            {claiming ? 'Attribution...' : `Obtenir avec ${partner.offers.premium.gemsCost} gemmes`}
                                        </Button>
                                        <p className="text-xs text-purple-500 mt-1 text-center">{premiumStock} code{premiumStock > 1 ? 's' : ''} restant{premiumStock > 1 ? 's' : ''}</p>
                                    </>
                                ) : (
                                    <div className="text-xs text-red-500 text-center p-2 bg-red-50 rounded border border-red-200">
                                        Plus de codes disponibles pour le moment
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Informations de contact */}
                <div className="space-y-1 text-xs text-gray-500">
                    {partner.website && (
                        <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Site web
                            </a>
                        </div>
                    )}
                    {partner.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {partner.phone}
                        </div>
                    )}
                    {partner.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {partner.email}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {partner.address}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function GemsPageClient() {
    const { data: session } = useSession();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cities, setCities] = useState<string[]>([]);
    const [claiming, setClaiming] = useState(false);

    // Code promo de l'utilisateur (un seul global)
    const [userCode, setUserCode] = useState<UserPromoCode | null>(null);
    const [loadingUserCode, setLoadingUserCode] = useState(true);

    // Modal de confirmation
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmPartner, setConfirmPartner] = useState<Partner | null>(null);
    const [confirmOfferType, setConfirmOfferType] = useState<'free' | 'premium'>('free');

    // Modal de succès
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successCode, setSuccessCode] = useState('');
    const [successPartner, setSuccessPartner] = useState<Partner | null>(null);
    const [copiedSuccess, setCopiedSuccess] = useState(false);

    useEffect(() => {
        fetchPartners();
    }, []);

    useEffect(() => {
        if (session?.user?.email) {
            fetchUserCode();
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
                setUserCode(data.hasCode ? data.code : null);
            }
        } catch (error) {
            console.error('Erreur chargement code promo:', error);
        } finally {
            setLoadingUserCode(false);
        }
    };

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/partners?active=true');
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des partenaires');
            }
            const data = await response.json();
            setPartners(data);

            const uniqueCities = [...new Set(data.map((p: Partner) => p.city))].sort() as string[];
            setCities(uniqueCities);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = (partner: Partner, offerType: 'free' | 'premium') => {
        if (!session) {
            alert('Vous devez être connecté pour obtenir un code promo');
            return;
        }

        if (userCode) {
            alert('Vous avez déjà un code promo actif. Un seul code par utilisateur.');
            return;
        }

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
                body: JSON.stringify({
                    partnerId: confirmPartner._id,
                    offerType: confirmOfferType
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.alreadyHasCode) {
                    // L'user a déjà un code
                    await fetchUserCode();
                    alert(data.data.message);
                } else {
                    // Nouveau code attribué
                    setSuccessCode(data.data.promoCode);
                    setSuccessPartner(confirmPartner);
                    setShowSuccessModal(true);
                    await fetchUserCode();
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
            !partner.description.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        if (selectedCity && selectedCity !== 'all' && partner.city !== selectedCity) return false;
        if (selectedCategory && selectedCategory !== 'all' && partner.category !== selectedCategory) return false;
        return true;
    });

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
                    {/* Section Gemmes */}
                    <GemsHeader />
                <div className="notion-container-wide py-8 md:py-12">
                    <GemManager />

                    {/* Section Partenaires */}
                    <div className="mt-8">
                        <PartnersHeader />

                        {/* Bandeau "Mon code promo" */}
                        {session && (
                            <div className={`rounded-2xl p-4 mb-6 ${
                                userCode
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-blue-50 border border-blue-200'
                            }`}>
                                {userCode ? (
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <Ticket className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-green-800">Votre code promo actif</h4>
                                                <p className="text-sm text-green-600">
                                                    Chez <strong>{userCode.partnerId?.name || 'Partenaire'}</strong> - Offre {userCode.offerType === 'free' ? 'gratuite' : 'premium'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-lg font-mono font-bold text-green-900 bg-white px-4 py-2 rounded-lg border-2 border-green-300 tracking-wider">
                                                {userCode.code}
                                            </code>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(userCode.code);
                                                }}
                                                className="border-green-300 text-green-700"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Ticket className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-blue-800">Pas encore de code promo</h4>
                                            <p className="text-sm text-blue-600">
                                                Choisissez un partenaire ci-dessous pour obtenir votre code promo unique et personnel.
                                                Attention : un seul code promo par utilisateur !
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <PartnersFilters
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            selectedCity={selectedCity}
                            setSelectedCity={setSelectedCity}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            cities={cities}
                            filteredPartners={filteredPartners}
                        />

                        {/* Grille des partenaires */}
                        <div className="notion-grid notion-grid-3">
                            {filteredPartners.map((partner) => (
                                <PartnerCard
                                    key={partner._id}
                                    partner={partner}
                                    userCode={userCode}
                                    onClaim={handleClaim}
                                    claiming={claiming}
                                />
                            ))}
                        </div>

                        {filteredPartners.length === 0 && (
                            <div className="notion-empty">
                                <Store className="notion-empty-icon mx-auto" />
                                <h3 className="notion-empty-title">Aucun partenaire trouvé</h3>
                                <p className="notion-empty-text">
                                    Essayez de modifier vos critères de recherche
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Modal de confirmation */}
                    {showConfirmModal && confirmPartner && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-md w-full p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={confirmPartner.logo}
                                        alt={confirmPartner.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <div>
                                        <h3 className="text-lg font-semibold">{confirmPartner.name}</h3>
                                        <p className="text-sm text-gray-600">{confirmPartner.city}</p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Attention : choix définitif</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                Vous ne pouvez avoir qu&apos;un seul code promo.
                                                Une fois attribué, vous ne pourrez pas en obtenir un autre chez un autre partenaire.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border mb-4 ${
                                    confirmOfferType === 'free'
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-purple-50 border-purple-200'
                                }`}>
                                    <p className="text-sm font-medium mb-1">
                                        {confirmOfferType === 'free' ? 'Offre gratuite' : `Offre premium (${confirmPartner.offers.premium?.gemsCost ?? 0} gemmes)`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {confirmPartner.offers[confirmOfferType]?.description}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowConfirmModal(false)}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        className={`flex-1 ${
                                            confirmOfferType === 'free'
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-purple-600 hover:bg-purple-700'
                                        }`}
                                        onClick={confirmClaim}
                                        disabled={claiming}
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
                                    <div className="text-3xl font-mono font-bold text-green-900 tracking-wider mb-2">
                                        {successCode}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={copySuccessCode}
                                        className="border-green-300 text-green-700 hover:bg-green-100"
                                    >
                                        {copiedSuccess ? (
                                            <><CheckCircle className="w-4 h-4 mr-2" /> Copié !</>
                                        ) : (
                                            <><Copy className="w-4 h-4 mr-2" /> Copier le code</>
                                        )}
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

                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        setSuccessCode('');
                                        setSuccessPartner(null);
                                    }}
                                >
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
