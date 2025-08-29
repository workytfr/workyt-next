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
    Gem
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
        offers: {
            free: {
                type: 'percentage' as const,
                value: 0,
                description: '',
                conditions: '',
                promoCode: '',
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
                promoCode: '',
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
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des partenaires:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePromoCode = (name: string, type: 'free' | 'premium') => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const cleanName = name.toUpperCase().replace(/\s+/g, '').slice(0, 8);
        return `${type === 'free' ? 'FREE' : 'PREMIUM'}${cleanName}${timestamp}`;
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
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowAddModal(false);
                setEditingPartner(null);
                resetForm();
                fetchPartners();
                alert(editingPartner ? 'Partenaire mis à jour avec succès !' : 'Partenaire ajouté avec succès !');
            } else {
                const error = await response.json();
                alert(`Erreur : ${error.message}`);
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
            offers: partner.offers
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
            offers: {
                free: {
                    type: 'percentage',
                    value: 0,
                    description: '',
                    conditions: '',
                    promoCode: '',
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
                    promoCode: '',
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
                        Administrez les partenaires et leurs offres exclusives pour les étudiants
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter un partenaire
                </Button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <CardTitle className="text-sm font-medium text-gray-600">Économies Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {partners.reduce((sum, p) => sum + p.totalSavings, 0)}€
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
                        {partners.map((partner) => (
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
                                
                                {/* Statistiques rapides */}
                                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="font-semibold text-blue-600">{partner.totalUses}</div>
                                        <div className="text-gray-600">Utilisations</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold text-green-600">{partner.totalSavings}€</div>
                                        <div className="text-gray-600">Économies</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold text-purple-600">
                                            {partner.offers.premium.gemsCost}
                                        </div>
                                        <div className="text-gray-600">Coût en gemmes</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Modal d'ajout/édition */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">
                                    {editingPartner ? 'Modifier le partenaire' : 'Ajouter un partenaire'}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingPartner(null);
                                        resetForm();
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Informations de base */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Nom du partenaire *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            required
                                        />
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
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">Ville *</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="address">Adresse *</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="website">Site web</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Téléphone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="logo">URL du logo *</Label>
                                        <Input
                                            id="logo"
                                            value={formData.logo}
                                            onChange={(e) => handleInputChange('logo', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="image">URL de l&apos;image *</Label>
                                        <Input
                                            id="image"
                                            value={formData.image}
                                            onChange={(e) => handleInputChange('image', e.target.value)}
                                            required
                                        />
                                    </div>
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
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isActive"
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                        />
                                        <Label htmlFor="isActive">Actif</Label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="maxUsesPerDay">Utilisations max par jour</Label>
                                        <Input
                                            id="maxUsesPerDay"
                                            type="number"
                                            value={formData.maxUsesPerDay}
                                            onChange={(e) => handleInputChange('maxUsesPerDay', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxUsesPerUser">Utilisations max par utilisateur</Label>
                                        <Input
                                            id="maxUsesPerUser"
                                            type="number"
                                            value={formData.maxUsesPerUser}
                                            onChange={(e) => handleInputChange('maxUsesPerUser', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Offre gratuite */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4 text-green-700">Offre Gratuite</h3>
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
                                    
                                    <div className="mt-4">
                                        <Label htmlFor="freeDescription">Description de l&apos;offre *</Label>
                                        <Textarea
                                            id="freeDescription"
                                            value={formData.offers.free.description}
                                            onChange={(e) => handleInputChange('offers.free.description', e.target.value)}
                                            rows={2}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <Label htmlFor="freePromoCode">Code promo *</Label>
                                            <Input
                                                id="freePromoCode"
                                                value={formData.offers.free.promoCode}
                                                onChange={(e) => handleInputChange('offers.free.promoCode', e.target.value)}
                                                placeholder="Généré automatiquement"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="freePromoDescription">Description de la promo *</Label>
                                            <Input
                                                id="freePromoDescription"
                                                value={formData.offers.free.promoDescription}
                                                onChange={(e) => handleInputChange('offers.free.promoDescription', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                                        <div className="mt-4">
                                            <Label htmlFor="freeJustificationTemplate">Template du justificatif</Label>
                                            <Textarea
                                                id="freeJustificationTemplate"
                                                value={formData.offers.free.justificationTemplate}
                                                onChange={(e) => handleInputChange('offers.free.justificationTemplate', e.target.value)}
                                                rows={2}
                                                placeholder="Template personnalisé pour le justificatif"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Offre premium */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4 text-purple-700">Offre Premium</h3>
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
                                            <Label htmlFor="premiumGemsCost">Coût en gemmes *</Label>
                                            <Input
                                                id="premiumGemsCost"
                                                type="number"
                                                value={formData.offers.premium.gemsCost}
                                                onChange={(e) => handleInputChange('offers.premium.gemsCost', parseInt(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <Label htmlFor="premiumDescription">Description de l&apos;offre *</Label>
                                        <Textarea
                                            id="premiumDescription"
                                            value={formData.offers.premium.description}
                                            onChange={(e) => handleInputChange('offers.premium.description', e.target.value)}
                                            rows={2}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <Label htmlFor="premiumPromoCode">Code promo *</Label>
                                            <Input
                                                id="premiumPromoCode"
                                                value={formData.offers.premium.promoCode}
                                                onChange={(e) => handleInputChange('offers.premium.promoCode', e.target.value)}
                                                placeholder="Généré automatiquement"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="premiumPromoDescription">Description de la promo *</Label>
                                            <Input
                                                id="premiumPromoDescription"
                                                value={formData.offers.premium.promoDescription}
                                                onChange={(e) => handleInputChange('offers.premium.promoDescription', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <Label>Avantages supplémentaires</Label>
                                        <div className="space-y-2">
                                            {formData.offers.premium.additionalBenefits?.map((benefit, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        value={benefit}
                                                        onChange={(e) => updateAdditionalBenefit(index, e.target.value)}
                                                        placeholder="Avantage supplémentaire"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeAdditionalBenefit(index)}
                                                        className="text-red-600"
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
                                                className="w-full"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Ajouter un avantage
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4">
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
                                        {editingPartner ? 'Mettre à jour' : 'Ajouter'}
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
                                                <div><span className="font-medium">Code promo :</span> <code className="bg-gray-100 px-2 py-1 rounded">{viewingPartner.offers.free.promoCode}</code></div>
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
                                                <div><span className="font-medium">Code promo :</span> <code className="bg-gray-100 px-2 py-1 rounded">{viewingPartner.offers.premium.promoCode}</code></div>
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
