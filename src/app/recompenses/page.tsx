"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Clock, Calendar, Award, Medal, Target, Filter, Search, ArrowRight, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface Reward {
    _id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    startDate: string;
    endDate: string;
    method: string;
    category?: string;
    prize: string;
    createdAt: string;
}

export default function RewardsListPage() {
    const router = useRouter();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('active');
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        fetchRewards();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [rewards, searchTerm, startDate, endDate, statusFilter]);

    const fetchRewards = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/recompenses');
            if (response.ok) {
                const data = await response.json();
                setRewards(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des récompenses:', error);
        } finally {
            setLoading(false);
            setTimeout(() => setAnimate(true), 100);
        }
    };

    const applyFilters = () => {
        let filtered = [...rewards];
        const now = new Date();

        // Filtre par statut
        if (statusFilter !== 'all') {
            filtered = filtered.filter(reward => {
                const start = new Date(reward.startDate);
                const end = new Date(reward.endDate);

                switch (statusFilter) {
                    case 'active':
                        return start <= now && end >= now;
                    case 'upcoming':
                        return start > now;
                    case 'ended':
                        return end < now;
                    default:
                        return true;
                }
            });
        }

        // Filtre par recherche textuelle
        if (searchTerm) {
            filtered = filtered.filter(reward =>
                reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reward.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reward.prize.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtre par dates
        if (startDate) {
            filtered = filtered.filter(reward =>
                new Date(reward.startDate) >= new Date(startDate)
            );
        }

        if (endDate) {
            filtered = filtered.filter(reward =>
                new Date(reward.endDate) <= new Date(endDate)
            );
        }

        setFilteredRewards(filtered);
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'highestPoints': return <Target className="w-4 h-4" />;
            case 'mostRevisions': return <Award className="w-4 h-4" />;
            case 'mostRevisionsInCategory': return <Medal className="w-4 h-4" />;
            default: return <Trophy className="w-4 h-4" />;
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'highestPoints': return 'Plus de points';
            case 'mostRevisions': return 'Plus de révisions';
            case 'mostRevisionsInCategory': return 'Révisions par catégorie';
            default: return method;
        }
    };

    const getStatusBadge = (reward: Reward) => {
        const now = new Date();
        const start = new Date(reward.startDate);
        const end = new Date(reward.endDate);

        if (start > now) {
            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">À venir</Badge>;
        } else if (end < now) {
            return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Terminé</Badge>;
        } else {
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">En cours</Badge>;
        }
    };

    const getRemainingTime = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return 'Terminé';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        if (days > 0) return `${days}j ${hours}h`;
        return `${hours}h restantes`;
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setStatusFilter('active');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div
                    className={`text-center space-y-4 transition-all duration-700 ${
                        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                >
                    <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Récompenses & Événements
                        </h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Découvrez les récompenses disponibles et participez aux événements pour gagner des prix !
                    </p>
                </div>

                {/* Filters */}
                <Card
                    className={`shadow-lg border-0 transition-all duration-700 ${
                        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: '100ms' }}
                >
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-lg">Filtres</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="space-y-2">
                                <Label htmlFor="search">Rechercher</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="search"
                                        placeholder="Titre, description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <Label>Statut</Label>
                                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="active">En cours</SelectItem>
                                        <SelectItem value="upcoming">À venir</SelectItem>
                                        <SelectItem value="ended">Terminés</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Start Date Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Date de début</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="endDate">Date de fin</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-gray-600">
                                {filteredRewards.length} récompense{filteredRewards.length !== 1 ? 's' : ''} trouvée{filteredRewards.length !== 1 ? 's' : ''}
                            </p>
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                Effacer les filtres
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Rewards Grid */}
                {filteredRewards.length === 0 ? (
                    <div
                        className={`text-center py-16 transition-all duration-700 ${
                            animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune récompense trouvée</h3>
                        <p className="text-gray-500 mb-4">Essayez de modifier vos critères de recherche</p>
                        <Button onClick={clearFilters} variant="outline">
                            Voir toutes les récompenses
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRewards.map((reward, index) => (
                            <Card
                                key={reward._id}
                                className={`group cursor-pointer hover:shadow-xl transition-all duration-500 border-0 overflow-hidden ${
                                    animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                }`}
                                style={{ transitionDelay: `${200 + index * 50}ms` }}
                                onClick={() => router.push(`/recompenses/${reward._id}`)}
                            >
                                <div className="relative">
                                    {reward.imageUrl ? (
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={reward.imageUrl}
                                                alt={reward.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                            <Trophy className="w-16 h-16 text-blue-400" />
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-4 right-4 flex justify-between">
                                        {getStatusBadge(reward)}
                                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                                            {getMethodIcon(reward.method)}
                                            <span className="text-xs font-medium text-gray-700">
                                                {getMethodLabel(reward.method)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <CardHeader className="space-y-3">
                                    <div className="space-y-2">
                                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-300">
                                            {reward.title}
                                        </CardTitle>
                                        {reward.description && (
                                            <CardDescription className="line-clamp-2">
                                                {reward.description}
                                            </CardDescription>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium text-gray-900">{reward.prize}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {new Date(reward.startDate).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })} - {new Date(reward.endDate).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span className="font-medium">
                                                    {getRemainingTime(reward.endDate)}
                                                </span>
                                            </div>
                                        </div>

                                        {reward.category && (
                                            <Badge variant="secondary" className="w-fit">
                                                {reward.category}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <Button className="w-full group-hover:bg-blue-600 transition-colors duration-300" size="sm">
                                        Voir le classement
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}