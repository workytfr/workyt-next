"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    Store,
    MapPin,
    Globe,
    Phone,
    Mail,
    Save,
    X,
    Upload,
    Gem,
    Ticket,
    Package,
    CheckCircle,
    Clock,
    AlertCircle,
    Info,
    Image,
    Link,
    Calendar,
    Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';

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
            type: 'percentage';
            value: number;
            description: string;
            conditions: string;
            promoCode: string;
            promoDescription: string;
            justificationRequired: boolean;
            justificationType: 'image';
            justificationTemplate: string;
        };
        premium: {
            type: 'percentage';
            value: number;
            gemsCost: number;
            description: string;
            conditions: string;
            promoCode: string;
            promoDescription: string;
            additionalBenefits: string[];
            justificationType: 'image';
        };
    };
    offersEnabled: {
        free: boolean;
        premium: boolean;
    };
    promoCodePrefix?: string;
    totalCodesFree: number;
    totalCodesPremium: number;
    availableCodes?: { free: number; premium: number };
    isActive: boolean;
    startDate: string;
    endDate?: string;
    maxUsesPerDay?: number;
    maxUsesPerUser?: number;
    totalUses: number;
    totalSavings: number;
    createdAt: string;
    updatedAt: string;
}

interface PromoCodeStats {
    total: number;
    available: number;
    assigned: number;
    used: number;
}

const categories = [
    { value: 'restauration', label: 'Restauration', icon: '🍽️' },
    { value: 'sport', label: 'Sport', icon: '🏃' },
    { value: 'culture', label: 'Culture', icon: '🎭' },
    { value: 'tech', label: 'Tech', icon: '💻' },
    { value: 'bien-etre', label: 'Bien-être', icon: '🧘' },
    { value: 'loisirs', label: 'Loisirs', icon: '🎮' },
    { value: 'autre', label: 'Autre', icon: '🎯' }
];

export default function PartnersAdminClient() {
    const { data: session } = useSession();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [viewingPartner, setViewingPartner] = useState<Partner | null>(null);
    const [promoCodeStats, setPromoCodeStats] = useState<Record<string, PromoCodeStats>>({});

    // Modal de génération de codes
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generatePartnerId, setGeneratePartnerId] = useState('');
    const [generateOfferType, setGenerateOfferType] = useState<'free' | 'premium'>('free');
    const [generateCount, setGenerateCount] = useState(50);
    const [generatePrefix, setGeneratePrefix] = useState('');
    const [generating, setGenerating] = useState(false);

    // État du formulaire
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo: '',
        image: '',
        category: '',
        city: '',
        address: '',
        website: '',
        phone: '',
        email: '',
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        maxUsesPerDay: '',
        maxUsesPerUser: '',
        promoCodePrefix: '',
        offersEnabled: {
            free: true,
            premium: true
        },
        offers: {
            free: {
                type: 'percentage' as const,
                value: 0,
                description: '',
                conditions: '',
                promoCode: 'POOL',
                promoDescription: '',
                justificationRequired: true,
                justificationType: 'image' as const,
                justificationTemplate: ''
            },
            premium: {
                type: 'percentage' as const,
                value: 0,
                gemsCost: 0,
                description: '',
                conditions: '',
                promoCode: 'POOL',
                promoDescription: '',
                additionalBenefits: [''],
                justificationType: 'image' as const
            }
        }
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/partners');
            if (response.ok) {
                const data = await response.json();
                setPartners(data);
                // Charger les stats de codes promo pour chaque partenaire
                for (const partner of data) {
                    fetchPromoStats(partner._id);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des partenaires:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPromoStats = async (partnerId: string) => {
        try {
            const response = await fetch(`/api/promo-codes?partnerId=${partnerId}`);
            if (response.ok) {
                const data = await response.json();
                setPromoCodeStats(prev => ({ ...prev, [partnerId]: data.stats }));
            }
        } catch (error) {
            console.error('Erreur stats promo:', error);
        }
    };

    const handleInputChange = (field: string, value: any, offerType?: 'free' | 'premium', subField?: string) => {
        if (offerType && subField) {
            setFormData(prev => ({
                ...prev,
                offers: {
                    ...prev.offers,
                    [offerType]: {
                        ...prev.offers[offerType],
                        [subField]: value
                    }
                }
            }));
        } else if (field.startsWith('offers.')) {
            const [_, offerType, subField] = field.split('.');
            if (offerType === 'free' || offerType === 'premium') {
                setFormData(prev => ({
                    ...prev,
                    offers: {
                        ...prev.offers,
                        [offerType]: {
                            ...prev.offers[offerType],
                            [subField]: value
                        }
                    }
                }));
            }
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingPartner ? `/api/partners/${editingPartner._id}` : '/api/partners';
            const method = editingPartner ? 'PUT' : 'POST';

            // S'assurer que les promoCode ont une valeur par défaut (pool)
            const submitData = {
                ...formData,
                offers: {
                    free: { ...formData.offers.free, promoCode: formData.offers.free.promoCode || 'POOL' },
                    premium: { ...formData.offers.premium, promoCode: formData.offers.premium.promoCode || 'POOL' }
                }
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                setShowAddModal(false);
                setEditingPartner(null);
                resetForm();
                fetchPartners();
                alert(editingPartner ? 'Partenaire mis à jour avec succès !' : 'Partenaire ajouté avec succès !');
            } else {
                const error = await response.json();
                alert(`Erreur : ${error.error || error.message}`);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    const handleEdit = (partner: Partner) => {
        setEditingPartner(partner);
        setFormData({
            name: partner.name,
            description: partner.description,
            logo: partner.logo,
            image: partner.image,
            category: partner.category,
            city: partner.city,
            address: partner.address,
            website: partner.website || '',
            phone: partner.phone || '',
            email: partner.email || '',
            isActive: partner.isActive,
            startDate: new Date(partner.startDate).toISOString().split('T')[0],
            endDate: partner.endDate ? new Date(partner.endDate).toISOString().split('T')[0] : '',
            maxUsesPerDay: partner.maxUsesPerDay?.toString() || '',
            maxUsesPerUser: partner.maxUsesPerUser?.toString() || '',
            promoCodePrefix: partner.promoCodePrefix || '',
            offersEnabled: partner.offersEnabled || { free: true, premium: true },
            offers: {
                free: partner.offers?.free || {
                    type: 'percentage' as const,
                    value: 0,
                    description: '',
                    conditions: '',
                    promoCode: 'POOL',
                    promoDescription: '',
                    justificationRequired: true,
                    justificationType: 'image' as const,
                    justificationTemplate: ''
                },
                premium: partner.offers?.premium || {
                    type: 'percentage' as const,
                    value: 0,
                    gemsCost: 0,
                    description: '',
                    conditions: '',
                    promoCode: 'POOL',
                    promoDescription: '',
                    additionalBenefits: [''],
                    justificationType: 'image' as const
                }
            }
        });
        setShowAddModal(true);
    };

    const handleDelete = async (partnerId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) return;

        try {
            const response = await fetch(`/api/partners/${partnerId}`, { method: 'DELETE' });
            if (response.ok) {
                fetchPartners();
                alert('Partenaire supprimé avec succès !');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleGenerateCodes = async () => {
        if (!generatePartnerId || !generatePrefix || generateCount < 1) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        setGenerating(true);
        try {
            const response = await fetch('/api/promo-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId: generatePartnerId,
                    offerType: generateOfferType,
                    count: generateCount,
                    prefix: generatePrefix
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`${data.count} codes générés !\nExemples : ${data.sample.join(', ')}`);
                setShowGenerateModal(false);
                fetchPromoStats(generatePartnerId);
                fetchPartners();
            } else {
                alert(`Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error('Erreur génération:', error);
            alert('Erreur lors de la génération');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteUnusedCodes = async (partnerId: string, offerType?: string) => {
        if (!confirm('Supprimer tous les codes non attribués ?')) return;

        try {
            const params = new URLSearchParams({ partnerId });
            if (offerType) params.set('offerType', offerType);

            const response = await fetch(`/api/promo-codes?${params}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                fetchPromoStats(partnerId);
            }
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    const openGenerateModal = (partnerId: string, partnerName: string) => {
        setGeneratePartnerId(partnerId);
        setGeneratePrefix(partnerName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
        setGenerateCount(50);
        setGenerateOfferType('free');
        setShowGenerateModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            logo: '',
            image: '',
            category: '',
            city: '',
            address: '',
            website: '',
            phone: '',
            email: '',
            isActive: true,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            maxUsesPerDay: '',
            maxUsesPerUser: '',
            promoCodePrefix: '',
            offersEnabled: {
                free: true,
                premium: true
            },
            offers: {
                free: {
                    type: 'percentage',
                    value: 0,
                    description: '',
                    conditions: '',
                    promoCode: 'POOL',
                    promoDescription: '',
                    justificationRequired: true,
                    justificationType: 'image',
                    justificationTemplate: ''
                },
                premium: {
                    type: 'percentage',
                    value: 0,
                    gemsCost: 0,
                    description: '',
                    conditions: '',
                    promoCode: 'POOL',
                    promoDescription: '',
                    additionalBenefits: [''],
                    justificationType: 'image'
                }
            }
        });
    };

    const addAdditionalBenefit = () => {
        setFormData(prev => ({
            ...prev,
            offers: {
                ...prev.offers,
                premium: {
                    ...prev.offers.premium,
                    additionalBenefits: [...(prev.offers.premium.additionalBenefits || []), '']
                }
            }
        }));
    };

    const removeAdditionalBenefit = (index: number) => {
        setFormData(prev => ({
            ...prev,
            offers: {
                ...prev.offers,
                premium: {
                    ...prev.offers.premium,
                    additionalBenefits: prev.offers.premium.additionalBenefits?.filter((_, i) => i !== index) || []
                }
            }
        }));
    };

    const updateAdditionalBenefit = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            offers: {
                ...prev.offers,
                premium: {
                    ...prev.offers.premium,
                    additionalBenefits: prev.offers.premium.additionalBenefits?.map((benefit, i) =>
                        i === index ? value : benefit
                    ) || []
                }
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Partenaires</h1>
                    <p className="text-gray-600 mt-2">
                        Administrez les partenaires, leurs offres et les codes promo
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter un partenaire
                </Button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Partenaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{partners.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Partenaires Actifs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {partners.filter(p => p.isActive).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Utilisations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {partners.reduce((sum, p) => sum + p.totalUses, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Codes Disponibles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {Object.values(promoCodeStats).reduce((sum, s) => sum + (s?.available || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Codes Attribués</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {Object.values(promoCodeStats).reduce((sum, s) => sum + (s?.assigned || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des partenaires */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Partenaires</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {partners.map((partner) => {
                            const stats = promoCodeStats[partner._id];
                            return (
                                <div key={partner._id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={partner.logo}
                                                alt={partner.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div>
                                                <h3 className="font-semibold text-lg">{partner.name}</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {partner.city}
                                                    </span>
                                                    <Badge className={categories.find(c => c.value === partner.category)?.value === partner.category ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                                        {categories.find(c => c.value === partner.category)?.icon} {categories.find(c => c.value === partner.category)?.label}
                                                    </Badge>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${partner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {partner.isActive ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openGenerateModal(partner._id, partner.name)}
                                                className="text-orange-600 hover:text-orange-700"
                                                title="Générer des codes promo"
                                            >
                                                <Ticket className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setViewingPartner(partner)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(partner)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(partner._id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Stats codes promo */}
                                    <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="font-semibold text-blue-600">{partner.totalUses}</div>
                                            <div className="text-gray-600">Utilisations</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-gray-700">{stats?.total || 0}</div>
                                            <div className="text-gray-600">Codes totaux</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-green-600">{stats?.available || 0}</div>
                                            <div className="text-gray-600">Disponibles</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-orange-600">{stats?.assigned || 0}</div>
                                            <div className="text-gray-600">Attribués</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-purple-600">
                                                {partner.offers.premium.gemsCost}
                                            </div>
                                            <div className="text-gray-600">Coût gemmes</div>
                                        </div>
                                    </div>

                                    {/* Barre de progression des codes */}
                                    {stats && stats.total > 0 && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                <span>Stock de codes promo</span>
                                                <span>{stats.available} / {stats.total} disponibles</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${
                                                        stats.available === 0 ? 'bg-red-500' :
                                                        stats.available < stats.total * 0.2 ? 'bg-orange-500' :
                                                        'bg-green-500'
                                                    }`}
                                                    style={{ width: `${(stats.available / stats.total) * 100}%` }}
                                                />
                                            </div>
                                            {stats.available === 0 && (
                                                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Plus de codes disponibles ! Générez-en de nouveaux.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(!stats || stats.total === 0) && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                            <AlertCircle className="w-4 h-4" />
                                            Aucun code promo généré. Cliquez sur <Ticket className="w-3 h-3 inline" /> pour en créer.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Modal de génération de codes promo */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Ticket className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Générer des codes promo</h2>
                                    <p className="text-sm text-gray-500">
                                        {partners.find(p => p._id === generatePartnerId)?.name}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowGenerateModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>Type d&apos;offre</Label>
                                <Select value={generateOfferType} onValueChange={(v: 'free' | 'premium') => setGenerateOfferType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Offre gratuite</SelectItem>
                                        <SelectItem value="premium">Offre premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Préfixe du code</Label>
                                <Input
                                    value={generatePrefix}
                                    onChange={(e) => setGeneratePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                                    placeholder="Ex: WORKYT"
                                    maxLength={10}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Les codes auront le format : {generatePrefix || 'PREFIX'}XXXXXX
                                </p>
                            </div>

                            <div>
                                <Label>Nombre de codes à générer</Label>
                                <Input
                                    type="number"
                                    value={generateCount}
                                    onChange={(e) => setGenerateCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                                    min={1}
                                    max={1000}
                                />
                                <p className="text-xs text-gray-500 mt-1">Maximum 1000 codes par batch</p>
                            </div>

                            {/* Stats actuelles */}
                            {promoCodeStats[generatePartnerId] && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Stock actuel :</p>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div className="text-center">
                                            <div className="font-bold text-green-600">{promoCodeStats[generatePartnerId].available}</div>
                                            <div className="text-gray-500 text-xs">Disponibles</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-orange-600">{promoCodeStats[generatePartnerId].assigned}</div>
                                            <div className="text-gray-500 text-xs">Attribués</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-gray-600">{promoCodeStats[generatePartnerId].total}</div>
                                            <div className="text-gray-500 text-xs">Total</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowGenerateModal(false)}
                                disabled={generating}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                onClick={handleGenerateCodes}
                                disabled={generating || !generatePrefix}
                            >
                                {generating ? 'Génération...' : `Générer ${generateCount} codes`}
                            </Button>
                        </div>

                        {/* Bouton supprimer les codes non utilisés */}
                        {promoCodeStats[generatePartnerId]?.available > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteUnusedCodes(generatePartnerId)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Supprimer les {promoCodeStats[generatePartnerId].available} codes non attribués
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal d'ajout/édition */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${editingPartner ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {editingPartner ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-green-600" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire'}
                                        </h2>
                                        <p className="text-sm text-gray-500">Les champs avec * sont obligatoires</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingPartner(null);
                                        resetForm();
                                    }}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Section 1 : Identité */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Store className="w-5 h-5 text-gray-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Identité du partenaire</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">Nom *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value.slice(0, 100))}
                                                placeholder="Nom du partenaire"
                                                required
                                                maxLength={100}
                                            />
                                            <p className={`text-xs mt-1 text-right ${formData.name.length > 80 ? 'text-orange-500' : 'text-gray-400'}`}>
                                                {formData.name.length}/100
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="category">Catégorie *</Label>
                                            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une catégorie" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            {cat.icon} {cat.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value.slice(0, 2000))}
                                            rows={3}
                                            placeholder="Décrivez le partenaire, ses activités et ses services..."
                                            required
                                            maxLength={2000}
                                        />
                                        <p className={`text-xs mt-1 text-right ${formData.description.length > 1800 ? 'text-orange-500' : 'text-gray-400'}`}>
                                            {formData.description.length}/2000
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2 : Localisation & Contact */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <MapPin className="w-5 h-5 text-gray-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Localisation & Contact</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="city">Ville *</Label>
                                            <Input
                                                id="city"
                                                value={formData.city}
                                                onChange={(e) => handleInputChange('city', e.target.value)}
                                                placeholder="Ex: Paris, Sans Adresse..."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="address">Adresse *</Label>
                                            <Input
                                                id="address"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                placeholder="Ex: 12 rue de la Paix, En ligne..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="website" className="flex items-center gap-1">
                                                <Globe className="w-3.5 h-3.5" /> Site web
                                            </Label>
                                            <Input
                                                id="website"
                                                type="url"
                                                value={formData.website}
                                                onChange={(e) => handleInputChange('website', e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone" className="flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5" /> Téléphone
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder="01 23 45 67 89"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email" className="flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5" /> Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="contact@..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3 : Visuels */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Image className="w-5 h-5 text-gray-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Visuels</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="logo">URL du logo *</Label>
                                            <Input
                                                id="logo"
                                                value={formData.logo}
                                                onChange={(e) => handleInputChange('logo', e.target.value)}
                                                placeholder="https://example.com/logo.png"
                                                required
                                            />
                                            {formData.logo && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <img src={formData.logo} alt="Aperçu logo" className="w-10 h-10 rounded-full object-cover border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                    <span className="text-xs text-gray-400">Aperçu</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="image">URL de l&apos;image *</Label>
                                            <Input
                                                id="image"
                                                value={formData.image}
                                                onChange={(e) => handleInputChange('image', e.target.value)}
                                                placeholder="https://example.com/image.png"
                                                required
                                            />
                                            {formData.image && (
                                                <div className="mt-2">
                                                    <img src={formData.image} alt="Aperçu image" className="w-full h-20 rounded-lg object-cover border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4 : Planification */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Calendar className="w-5 h-5 text-gray-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Planification</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="startDate">Date de début *</Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="endDate">Date de fin</Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 pt-6">
                                            <Switch
                                                id="isActive"
                                                checked={formData.isActive}
                                                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                            />
                                            <Label htmlFor="isActive" className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                                {formData.isActive ? 'Actif' : 'Inactif'}
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Info codes promo */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-blue-800 mb-1">Codes promo</h4>
                                            <p className="text-sm text-blue-700">
                                                Les codes promo sont gérés via un pool de codes uniques.
                                                Après avoir créé le partenaire, utilisez le bouton <Ticket className="w-3 h-3 inline" /> pour générer un batch de codes.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5 : Types d'offres */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Tag className="w-5 h-5 text-gray-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Offres</h3>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Activez les types d&apos;offres disponibles pour ce partenaire.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${formData.offersEnabled.free ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                                            <div>
                                                <Label htmlFor="enableFree" className="font-semibold">Offre gratuite</Label>
                                                <p className="text-xs text-gray-500">Sans coût en gemmes</p>
                                            </div>
                                            <Switch
                                                id="enableFree"
                                                checked={formData.offersEnabled.free}
                                                onCheckedChange={(checked) => setFormData(prev => ({
                                                    ...prev,
                                                    offersEnabled: { ...prev.offersEnabled, free: checked }
                                                }))}
                                            />
                                        </div>
                                        <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${formData.offersEnabled.premium ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'}`}>
                                            <div>
                                                <Label htmlFor="enablePremium" className="font-semibold">Offre premium</Label>
                                                <p className="text-xs text-gray-500">Coût en gemmes</p>
                                            </div>
                                            <Switch
                                                id="enablePremium"
                                                checked={formData.offersEnabled.premium}
                                                onCheckedChange={(checked) => setFormData(prev => ({
                                                    ...prev,
                                                    offersEnabled: { ...prev.offersEnabled, premium: checked }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    {!formData.offersEnabled.free && !formData.offersEnabled.premium && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            Au moins un type d&apos;offre doit être activé.
                                        </p>
                                    )}
                                </div>

                                {/* Offre gratuite */}
                                {formData.offersEnabled.free && (
                                <div className="space-y-4 bg-green-50/50 p-5 rounded-xl border border-green-200">
                                    <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Offre Gratuite
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="freeType">Type d&apos;offre</Label>
                                            <Select
                                                value={formData.offers.free.type}
                                                onValueChange={(value: 'percentage' | 'fixed' | 'welcome') =>
                                                    handleInputChange('offers.free.type', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Pourcentage</SelectItem>
                                                    <SelectItem value="fixed">Montant fixe</SelectItem>
                                                    <SelectItem value="welcome">Offre de bienvenue</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="freeValue">
                                                {formData.offers.free.type === 'percentage' ? 'Pourcentage (%)' :
                                                 formData.offers.free.type === 'fixed' ? 'Montant (€)' : 'Valeur'}
                                            </Label>
                                            <Input
                                                id="freeValue"
                                                type="number"
                                                value={formData.offers.free.value}
                                                onChange={(e) => handleInputChange('offers.free.value', parseFloat(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="freeDescription">Description de l&apos;offre *</Label>
                                        <Textarea
                                            id="freeDescription"
                                            value={formData.offers.free.description}
                                            onChange={(e) => handleInputChange('offers.free.description', e.target.value.slice(0, 500))}
                                            rows={2}
                                            required
                                            maxLength={500}
                                            placeholder="Décrivez l'offre gratuite proposée..."
                                        />
                                        <p className={`text-xs mt-1 text-right ${formData.offers.free.description.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                                            {formData.offers.free.description.length}/500
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="freePromoDescription">Description de la promo *</Label>
                                        <Input
                                            id="freePromoDescription"
                                            value={formData.offers.free.promoDescription}
                                            onChange={(e) => handleInputChange('offers.free.promoDescription', e.target.value.slice(0, 300))}
                                            placeholder="Ex: Utilisez ce code sur le site pour 10% de réduction"
                                            required
                                            maxLength={300}
                                        />
                                        <p className={`text-xs mt-1 text-right ${formData.offers.free.promoDescription.length > 270 ? 'text-orange-500' : 'text-gray-400'}`}>
                                            {formData.offers.free.promoDescription.length}/300
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="freeJustificationRequired"
                                                checked={formData.offers.free.justificationRequired}
                                                onCheckedChange={(checked) => handleInputChange('offers.free.justificationRequired', checked)}
                                            />
                                            <Label htmlFor="freeJustificationRequired">Justificatif requis</Label>
                                        </div>
                                        <div>
                                            <Label htmlFor="freeJustificationType">Type de justificatif</Label>
                                            <Select
                                                value={formData.offers.free.justificationType}
                                                onValueChange={(value: 'image' | 'qr' | 'pdf') =>
                                                    handleInputChange('offers.free.justificationType', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="image">Image</SelectItem>
                                                    <SelectItem value="qr">QR Code</SelectItem>
                                                    <SelectItem value="pdf">PDF</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {formData.offers.free.justificationRequired && (
                                        <div>
                                            <Label htmlFor="freeJustificationTemplate">Template du justificatif</Label>
                                            <Textarea
                                                id="freeJustificationTemplate"
                                                value={formData.offers.free.justificationTemplate}
                                                onChange={(e) => handleInputChange('offers.free.justificationTemplate', e.target.value.slice(0, 500))}
                                                rows={2}
                                                placeholder="Template personnalisé pour le justificatif"
                                                maxLength={500}
                                            />
                                            <p className={`text-xs mt-1 text-right ${formData.offers.free.justificationTemplate.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                                                {formData.offers.free.justificationTemplate.length}/500
                                            </p>
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* Offre premium */}
                                {formData.offersEnabled.premium && (
                                <div className="space-y-4 bg-purple-50/50 p-5 rounded-xl border border-purple-200">
                                    <h3 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                                        <Gem className="w-5 h-5" />
                                        Offre Premium
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="premiumType">Type d&apos;offre</Label>
                                            <Select
                                                value={formData.offers.premium.type}
                                                onValueChange={(value: 'percentage' | 'fixed' | 'welcome') =>
                                                    handleInputChange('offers.premium.type', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Pourcentage</SelectItem>
                                                    <SelectItem value="fixed">Montant fixe</SelectItem>
                                                    <SelectItem value="welcome">Offre de bienvenue</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="premiumValue">
                                                {formData.offers.premium.type === 'percentage' ? 'Pourcentage (%)' :
                                                 formData.offers.premium.type === 'fixed' ? 'Montant (€)' : 'Valeur'}
                                            </Label>
                                            <Input
                                                id="premiumValue"
                                                type="number"
                                                value={formData.offers.premium.value}
                                                onChange={(e) => handleInputChange('offers.premium.value', parseFloat(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="premiumGemsCost" className="flex items-center gap-1">
                                                <Gem className="w-3.5 h-3.5 text-purple-500" /> Coût en gemmes *
                                            </Label>
                                            <Input
                                                id="premiumGemsCost"
                                                type="number"
                                                value={formData.offers.premium.gemsCost}
                                                onChange={(e) => handleInputChange('offers.premium.gemsCost', parseInt(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="premiumDescription">Description de l&apos;offre *</Label>
                                        <Textarea
                                            id="premiumDescription"
                                            value={formData.offers.premium.description}
                                            onChange={(e) => handleInputChange('offers.premium.description', e.target.value.slice(0, 500))}
                                            rows={3}
                                            required
                                            maxLength={500}
                                            placeholder="Décrivez l'offre premium proposée..."
                                        />
                                        <p className={`text-xs mt-1 text-right ${formData.offers.premium.description.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                                            {formData.offers.premium.description.length}/500
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="premiumPromoDescription">Description de la promo *</Label>
                                        <Input
                                            id="premiumPromoDescription"
                                            value={formData.offers.premium.promoDescription}
                                            onChange={(e) => handleInputChange('offers.premium.promoDescription', e.target.value.slice(0, 300))}
                                            maxLength={300}
                                            placeholder="Ex: -20% sur l'abonnement annuel"
                                        />
                                        <p className={`text-xs mt-1 text-right ${formData.offers.premium.promoDescription.length > 270 ? 'text-orange-500' : 'text-gray-400'}`}>
                                            {formData.offers.premium.promoDescription.length}/300
                                        </p>
                                    </div>

                                    <div>
                                        <Label>Avantages supplémentaires</Label>
                                        <div className="space-y-2">
                                            {formData.offers.premium.additionalBenefits?.map((benefit, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        value={benefit}
                                                        onChange={(e) => updateAdditionalBenefit(index, e.target.value)}
                                                        placeholder="Avantage supplémentaire"
                                                        maxLength={100}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeAdditionalBenefit(index)}
                                                        className="text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAdditionalBenefit}
                                                className="w-full border-dashed"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Ajouter un avantage
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="premiumJustificationType">Type de justificatif</Label>
                                        <Select
                                            value={formData.offers.premium.justificationType}
                                            onValueChange={(value: 'image' | 'qr' | 'pdf') =>
                                                handleInputChange('offers.premium.justificationType', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="image">Image</SelectItem>
                                                <SelectItem value="qr">QR Code</SelectItem>
                                                <SelectItem value="pdf">PDF</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                )}

                                {/* Boutons d'action */}
                                <div className="flex justify-end gap-3 pt-6 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setEditingPartner(null);
                                            resetForm();
                                        }}
                                    >
                                        Annuler
                                    </Button>
                                    <Button type="submit" className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        {editingPartner ? 'Mettre à jour' : 'Ajouter le partenaire'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de visualisation */}
            {viewingPartner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Détails du partenaire</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewingPartner(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="font-medium">Nom :</span> {viewingPartner.name}
                                        </div>
                                        <div>
                                            <span className="font-medium">Catégorie :</span>
                                            <Badge className="ml-2">
                                                {categories.find(c => c.value === viewingPartner.category)?.icon}
                                                {categories.find(c => c.value === viewingPartner.category)?.label}
                                            </Badge>
                                        </div>
                                        <div>
                                            <span className="font-medium">Ville :</span> {viewingPartner.city}
                                        </div>
                                        <div>
                                            <span className="font-medium">Adresse :</span> {viewingPartner.address}
                                        </div>
                                        <div>
                                            <span className="font-medium">Statut :</span>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${viewingPartner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {viewingPartner.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="font-medium">Total utilisations :</span> {viewingPartner.totalUses}
                                        </div>
                                        <div>
                                            <span className="font-medium">Économies totales :</span> {viewingPartner.totalSavings}€
                                        </div>
                                        <div>
                                            <span className="font-medium">Date de création :</span> {new Date(viewingPartner.createdAt).toLocaleDateString('fr-FR')}
                                        </div>
                                        <div>
                                            <span className="font-medium">Dernière mise à jour :</span> {new Date(viewingPartner.updatedAt).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>

                                    {/* Stats codes promo */}
                                    {promoCodeStats[viewingPartner._id] && (
                                        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                            <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                                <Ticket className="w-4 h-4" /> Pool de codes promo
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Disponibles:</span>
                                                    <span className="ml-1 font-bold text-green-600">{promoCodeStats[viewingPartner._id].available}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Attribués:</span>
                                                    <span className="ml-1 font-bold text-orange-600">{promoCodeStats[viewingPartner._id].assigned}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="ml-1 font-bold">{promoCodeStats[viewingPartner._id].total}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4">Offres</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-green-700">Offre Gratuite</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div><span className="font-medium">Type :</span> {viewingPartner.offers.free.type}</div>
                                                <div><span className="font-medium">Valeur :</span> {viewingPartner.offers.free.value}</div>
                                                <div><span className="font-medium">Description :</span> {viewingPartner.offers.free.description}</div>
                                                <div><span className="font-medium">Justificatif requis :</span> {viewingPartner.offers.free.justificationRequired ? 'Oui' : 'Non'}</div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-purple-700">Offre Premium</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div><span className="font-medium">Type :</span> {viewingPartner.offers.premium.type}</div>
                                                <div><span className="font-medium">Valeur :</span> {viewingPartner.offers.premium.value}</div>
                                                <div><span className="font-medium">Coût en gemmes :</span> <span className="text-purple-600 font-medium">{viewingPartner.offers.premium.gemsCost}</span></div>
                                                <div><span className="font-medium">Description :</span> {viewingPartner.offers.premium.description}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button onClick={() => setViewingPartner(null)}>
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
