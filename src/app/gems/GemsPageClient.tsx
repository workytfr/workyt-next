"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import GemManager from '@/components/ui/GemManager';
import { Gem } from 'lucide-react';
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
    Search
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
    offers: {
        free: {
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
        premium: {
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
    <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
            <Gem className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
                Gestionnaire de Gemmes
            </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convertissez vos points en gemmes et personnalisez votre profil avec des éléments uniques. 
            Créez un style qui vous ressemble !
        </p>
    </div>
);

// Composant pour l'en-tête des partenaires
const PartnersHeader = () => (
    <div className="bg-white shadow-sm border-b mb-8">
        <div className="container mx-auto px-4 py-6">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Store className="w-10 h-10 text-blue-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Workyt Award</h2>
                </div>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Découvrez nos partenaires et profitez d&apos;offres exclusives partout en France !
                </p>
                <p className="text-sm text-gray-500 mt-2">
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
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
const PartnerCard = ({ partner, onUseOffer, isOfferActivated }: { 
    partner: Partner; 
    onUseOffer: (partner: Partner, offerType: 'free' | 'premium') => void; 
    isOfferActivated: (partnerId: string, offerType: 'free' | 'premium') => boolean;
}) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
            
            {/* Offre gratuite */}
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
                
                {/* Code promo caché ou révélé */}
                {isOfferActivated(partner._id, 'free') ? (
                    <div className="bg-green-100 p-2 rounded border border-green-300 mb-2">
                        <div className="text-xs text-green-800 font-medium mb-1">Code promo pour achats en ligne :</div>
                        <div className="text-sm font-mono text-green-900 bg-white px-2 py-1 rounded border">
                            {partner.offers.free.promoCode}
                        </div>
                        <div className="text-xs text-green-600 mt-1">✅ Offre activée</div>
                    </div>
                ) : (
                    <div className="bg-gray-100 p-2 rounded border border-gray-300 mb-2">
                        <div className="text-xs text-gray-600 font-medium mb-1">Code promo pour achats en ligne :</div>
                        <div className="text-sm font-mono text-gray-400 bg-white px-2 py-1 rounded border">
                            ••••••••••••
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Cliquez pour révéler</div>
                    </div>
                )}
                
                {/* Description de la promo */}
                {partner.offers.free.promoDescription && (
                    <div className="text-xs text-green-700 mb-2">
                        {partner.offers.free.promoDescription}
                    </div>
                )}
                
                <Button 
                    size="sm" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => onUseOffer(partner, 'free')}
                >
                    {isOfferActivated(partner._id, 'free') ? 'Offre activée' : 'Utiliser l\'offre'}
                </Button>
            </div>

            {/* Offre premium */}
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Offre premium</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        <Gem className="w-3 h-3 mr-1" />
                        {partner.offers.premium.gemsCost} gemmes
                    </Badge>
                </div>
                <div className="text-sm text-purple-700 mb-2">
                    {partner.offers.premium.type === 'percentage' && `${partner.offers.premium.value}% de réduction`}
                    {partner.offers.premium.type === 'fixed' && `${partner.offers.premium.value}€ de réduction`}
                    {partner.offers.premium.type === 'welcome' && partner.offers.premium.description}
                </div>
                
                {/* Code promo caché ou révélé */}
                {isOfferActivated(partner._id, 'premium') ? (
                    <div className="bg-purple-100 p-2 rounded border border-purple-300 mb-2">
                        <div className="text-xs text-purple-800 font-medium mb-1">Code promo pour achats en ligne :</div>
                        <div className="text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border">
                            {partner.offers.premium.promoCode}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">✅ Offre activée</div>
                    </div>
                ) : (
                    <div className="bg-gray-100 p-2 rounded border border-gray-300 mb-2">
                        <div className="text-xs text-gray-600 font-medium mb-1">Code promo pour achats en ligne :</div>
                        <div className="text-sm font-mono text-gray-400 bg-white px-2 py-1 rounded border">
                            ••••••••••••
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Cliquez pour révéler</div>
                    </div>
                )}
                
                {/* Description de la promo */}
                {partner.offers.premium.promoDescription && (
                    <div className="text-xs text-purple-700 mb-2">
                        {partner.offers.premium.promoDescription}
                    </div>
                )}
                
                {/* Avantages supplémentaires */}
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
                
                <Button 
                    size="sm" 
                    variant="outline"
                    className={`w-full border-purple-300 ${
                        isOfferActivated(partner._id, 'premium') 
                            ? 'text-green-700 bg-green-50 border-green-300' 
                            : 'text-purple-700 hover:bg-purple-100'
                    }`}
                    onClick={() => onUseOffer(partner, 'premium')}
                >
                    {isOfferActivated(partner._id, 'premium') 
                        ? 'Offre activée' 
                        : `Booster avec ${partner.offers.premium.gemsCost} gemmes`
                    }
                </Button>
            </div>

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

export default function GemsPageClient() {
    const { data: session } = useSession();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cities, setCities] = useState<string[]>([]);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [selectedOfferType, setSelectedOfferType] = useState<'free' | 'premium' | null>(null);
    const [offerLoading, setOfferLoading] = useState(false);
    const [justificationImage, setJustificationImage] = useState<string | null>(null);
    const [showJustification, setShowJustification] = useState(false);
    const [activatedOffers, setActivatedOffers] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchPartners();
        loadActivatedOffers();
    }, []);

    // Charger les offres activées depuis le localStorage et la base de données
    const loadActivatedOffers = async () => {
        try {
            // 1. Charger depuis le localStorage
            const savedOffers = localStorage.getItem('workyt-activated-offers');
            if (savedOffers) {
                const parsedOffers = JSON.parse(savedOffers);
                setActivatedOffers(new Set(parsedOffers));
            }

            // 2. Vérifier dans la base de données (si l'utilisateur est connecté)
            if (session?.user?.email) {
                const response = await fetch('/api/gems/history?limit=100');
                if (response.ok) {
                    const data = await response.json();
                    const dbActivatedOffers = new Set<string>();
                    
                    // Filtrer les transactions de type 'partner_offer'
                    if (data.data && data.data.transactions && Array.isArray(data.data.transactions)) {
                        data.data.transactions.forEach((transaction: any) => {
                            if (transaction.type === 'partner_offer' && transaction.status === 'completed') {
                                const offerKey = `${transaction.partnerId}-${transaction.offerType}`;
                                dbActivatedOffers.add(offerKey);
                            }
                        });
                    }
                    
                    // Fusionner avec le localStorage
                    const allOffers = new Set([...Array.from(activatedOffers), ...Array.from(dbActivatedOffers)]);
                    setActivatedOffers(allOffers);
                    
                    // Sauvegarder dans le localStorage
                    localStorage.setItem('workyt-activated-offers', JSON.stringify(Array.from(allOffers)));
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des offres activées:', error);
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
            
            // Extraire les villes uniques
            const uniqueCities = [...new Set(data.map((p: Partner) => p.city))].sort() as string[];
            setCities(uniqueCities);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUseOffer = (partner: Partner, offerType: 'free' | 'premium') => {
        if (!session) {
            alert('Vous devez être connecté pour utiliser cette offre');
            return;
        }

        setSelectedPartner(partner);
        setSelectedOfferType(offerType);
        setJustificationImage(null);
        setShowJustification(false);
        setShowOfferModal(true);
    };

    const submitOffer = async () => {
        if (!selectedPartner || !selectedOfferType) return;

        try {
            setOfferLoading(true);
            
            const response = await fetch('/api/gems/partner-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId: selectedPartner._id,
                    offerType: selectedOfferType
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Marquer l'offre comme activée
                const offerKey = `${selectedPartner._id}-${selectedOfferType}`;
                const newActivatedOffers = new Set([...activatedOffers, offerKey]);
                setActivatedOffers(newActivatedOffers);
                
                // Sauvegarder dans le localStorage
                localStorage.setItem('workyt-activated-offers', JSON.stringify(Array.from(newActivatedOffers)));
                
                // Si un justificatif est requis, le générer
                if (data.data.justificationRequired) {
                    await generateJustification();
                } else {
                    // Sinon, afficher directement la confirmation
                    alert(`🎉 ${data.data.message}\n\nCode promo pour achats en ligne : ${data.data.promoCode}\n\nPartenaire : ${data.data.partnerName}\nOffre : ${data.data.offerDescription}`);
                    setShowOfferModal(false);
                    setSelectedPartner(null);
                    setSelectedOfferType(null);
                }
            } else {
                alert(`Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur lors de l\'activation de l\'offre:', error);
            alert('Erreur lors de l\'activation de l\'offre');
        } finally {
            setOfferLoading(false);
        }
    };

    const generateJustification = async () => {
        if (!selectedPartner || !selectedOfferType) return;

        try {
            const response = await fetch('/api/gems/generate-justification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId: selectedPartner._id,
                    offerType: selectedOfferType
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setJustificationImage(data.data.justificationImage);
                setShowJustification(true);
            } else {
                alert(`Erreur lors de la génération du justificatif : ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur lors de la génération du justificatif:', error);
            alert('Erreur lors de la génération du justificatif');
        }
    };

    // Fonction pour vérifier si une offre est activée
    const isOfferActivated = (partnerId: string, offerType: 'free' | 'premium') => {
        const offerKey = `${partnerId}-${offerType}`;
        return activatedOffers.has(offerKey);
    };

    const resetActivatedOffers = () => {
        if (confirm('Voulez-vous vraiment réinitialiser toutes les offres activées ? Cela supprimera toutes les offres sauvegardées.')) {
            setActivatedOffers(new Set());
            alert('Toutes les offres activées ont été réinitialisées.');
        }
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
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Chargement des partenaires...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <NoSSR>
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto py-6">
                    {/* Section Gemmes */}
                    <GemsHeader />
                    <GemManager />

                    {/* Section Partenaires */}
                    <div className="mt-16">
                        <PartnersHeader />
                        
                        {/* Indicateur de persistance */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 text-sm">💾</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-blue-800">Offres persistantes</h4>
                                        <p className="text-sm text-blue-600">
                                            Vos offres activées sont sauvegardées et restent visibles même après actualisation de la page
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-blue-600">
                                        {activatedOffers.size} offre{activatedOffers.size > 1 ? 's' : ''} activée{activatedOffers.size > 1 ? 's' : ''}
                                    </span>
                                    {process.env.NODE_ENV === 'development' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetActivatedOffers}
                                            className="text-xs"
                                        >
                                            🔄 Reset
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPartners.map((partner) => (
                                <PartnerCard 
                                    key={partner._id} 
                                    partner={partner} 
                                    onUseOffer={handleUseOffer}
                                    isOfferActivated={isOfferActivated}
                                />
                            ))}
                        </div>

                        {filteredPartners.length === 0 && (
                            <div className="text-center py-16">
                                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun partenaire trouvé</h3>
                                <p className="text-gray-500">
                                    Essayez de modifier vos critères de recherche
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Modal pour les offres */}
                    {showOfferModal && selectedPartner && selectedOfferType && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg max-w-md w-full p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={selectedPartner.logo}
                                        alt={`Logo ${selectedPartner.name}`}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedPartner.name}</h3>
                                        <p className="text-sm text-gray-600">{selectedPartner.city}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">
                                        {selectedOfferType === 'free' ? 'Offre gratuite' : 'Offre premium'}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {selectedPartner.offers[selectedOfferType].type === 'percentage' && 
                                            `${selectedPartner.offers[selectedOfferType].value}% de réduction`}
                                        {selectedPartner.offers[selectedOfferType].type === 'fixed' && 
                                            `${selectedPartner.offers[selectedOfferType].value}€ de réduction`}
                                        {selectedPartner.offers[selectedOfferType].type === 'welcome' && 
                                            selectedPartner.offers[selectedOfferType].description}
                                    </p>
                                    
                                    {/* Code promo caché jusqu'à activation */}
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                                        <div className="text-sm text-gray-600 font-medium mb-1">Code promo pour achats en ligne :</div>
                                        <div className="text-lg font-mono text-gray-400 bg-gray-100 px-3 py-2 rounded border">
                                            ••••••••••••
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Révélé après activation de l&apos;offre
                                        </p>
                                    </div>
                                    
                                    {/* Description de la promo */}
                                    {selectedPartner.offers[selectedOfferType].promoDescription && (
                                        <div className="text-sm text-gray-700 mb-3 p-2 bg-gray-50 rounded">
                                            {selectedPartner.offers[selectedOfferType].promoDescription}
                                        </div>
                                    )}
                                    
                                    {selectedOfferType === 'premium' && (
                                        <div className="flex items-center gap-2 text-sm text-purple-600 mb-3">
                                            <Gem className="w-4 h-4" />
                                            Coût : {selectedPartner.offers.premium.gemsCost} gemmes
                                        </div>
                                    )}

                                    {/* Informations sur le justificatif */}
                                    {selectedOfferType === 'free' && selectedPartner.offers.free.justificationRequired && (
                                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-3">
                                            <div className="text-sm text-yellow-800">
                                                <strong>ℹ️ Justificatif requis :</strong> Un justificatif sera généré pour présenter au commerçant sur place.
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedOfferType === 'premium' && selectedPartner.offers.premium.justificationType && (
                                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-3">
                                            <div className="text-sm text-yellow-800">
                                                <strong>ℹ️ Justificatif requis :</strong> Un justificatif sera généré pour présenter au commerçant sur place.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowOfferModal(false);
                                            setSelectedPartner(null);
                                            setSelectedOfferType(null);
                                            setJustificationImage(null);
                                            setShowJustification(false);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        disabled={offerLoading}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={submitOffer}
                                        disabled={offerLoading}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {offerLoading ? 'Activation...' : 'Activer l&apos;offre'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal pour afficher le justificatif */}
                    {showJustification && justificationImage && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-green-700">🎉 Offre activée avec succès !</h3>
                                        <button
                                            onClick={() => {
                                                setShowJustification(false);
                                                setJustificationImage(null);
                                                setShowOfferModal(false);
                                                setSelectedPartner(null);
                                                setSelectedOfferType(null);
                                            }}
                                            className="text-gray-500 hover:text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded-full"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    
                                    <div className="text-center mb-8">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-4xl">✅</span>
                                        </div>
                                        <h4 className="text-xl font-semibold text-green-800 mb-3">
                                            Votre offre {selectedOfferType === 'free' ? 'gratuite' : 'premium'} a été activée !
                                        </h4>
                                        <p className="text-gray-600 text-lg">
                                            Vous pouvez maintenant bénéficier de cette offre chez <strong>{selectedPartner?.name}</strong>
                                        </p>
                                    </div>

                                    {/* Code promo révélé - Section principale */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border-2 border-blue-200 mb-8 shadow-lg">
                                        <div className="text-center">
                                            <h4 className="text-2xl font-bold text-blue-800 mb-4">
                                                🎯 Code promo pour achats en ligne
                                            </h4>
                                            <div className="bg-white p-6 rounded-xl border-2 border-blue-300 shadow-xl">
                                                <div className="text-4xl font-mono text-blue-900 font-bold tracking-wider break-all">
                                                    {selectedPartner?.offers[selectedOfferType || 'free'].promoCode}
                                                </div>
                                            </div>
                                            <p className="text-blue-700 mt-4 text-lg">
                                                💡 Utilisez ce code sur le site web du partenaire pour bénéficier de votre réduction
                                            </p>
                                            <div className="mt-4 text-sm text-blue-600 bg-white p-3 rounded-lg border border-blue-200">
                                                <strong>Partenaire :</strong> {selectedPartner?.name} | 
                                                <strong> Offre :</strong> {selectedPartner?.offers[selectedOfferType || 'free'].description}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Justificatif pour commerces sur place */}
                                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-8">
                                        <h4 className="font-bold text-yellow-800 mb-4 text-center text-xl">
                                            🏪 Justificatif pour présenter au commerçant sur place
                                        </h4>
                                        <p className="text-yellow-700 text-center mb-6 text-lg">
                                            Présentez ce justificatif au commerçant pour bénéficier de votre offre directement en magasin
                                        </p>
                                        
                                        <div className="flex justify-center">
                                            <img
                                                src={justificationImage}
                                                alt="Justificatif"
                                                className="max-w-full h-auto border-2 border-yellow-300 rounded-xl shadow-lg"
                                                style={{ maxHeight: '400px' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Instructions d'utilisation */}
                                    <div className="bg-gray-50 p-6 rounded-xl mb-8">
                                        <h4 className="font-bold text-gray-800 mb-4 text-center text-xl">
                                            📋 Comment utiliser votre offre
                                        </h4>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-base">
                                            <div className="bg-white p-4 rounded-xl border shadow-md">
                                                <h5 className="font-bold text-blue-700 mb-3 text-lg">🛒 Achats en ligne</h5>
                                                <ul className="text-gray-600 space-y-2">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-blue-500 font-bold">•</span>
                                                        <span>Allez sur le site web du partenaire</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-blue-500 font-bold">•</span>
                                                        <span>Ajoutez vos articles au panier</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-blue-500 font-bold">•</span>
                                                        <span>Entrez le code promo lors du paiement</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-blue-500 font-bold">•</span>
                                                        <span>Profitez de votre réduction !</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border shadow-md">
                                                <h5 className="font-bold text-green-700 mb-3 text-lg">🏪 En magasin</h5>
                                                <ul className="text-gray-600 space-y-2">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-500 font-bold">•</span>
                                                        <span>Présentez le justificatif au commerçant</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-500 font-bold">•</span>
                                                        <span>Montrez votre identité si demandé</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-500 font-bold">•</span>
                                                        <span>Bénéficiez de votre offre sur place</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-500 font-bold">•</span>
                                                        <span>Gardez le justificatif pour référence</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Boutons d'action */}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = justificationImage;
                                                link.download = `justificatif-${selectedPartner?.name}-${selectedOfferType}.png`;
                                                link.click();
                                            }}
                                            className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            📥 Télécharger le justificatif
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowJustification(false);
                                                setJustificationImage(null);
                                                setShowOfferModal(false);
                                                setSelectedPartner(null);
                                                setSelectedOfferType(null);
                                            }}
                                            className="px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </NoSSR>
    );
}
