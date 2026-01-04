"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Trophy, Clock, Calendar, Award, Medal, Target, Filter, Search, ArrowRight, CalendarDays, Gift, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import CalendarComponent from '@/components/Calendar';
import NoSSR from '@/components/NoSSR';
import Image from 'next/image';

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
    const { data: session, status: sessionStatus } = useSession();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [filteredRewards, setFilteredRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<'active' | 'upcoming' | 'ended'>('active');
    const [animate, setAnimate] = useState(false);

    const fetchRewards = useCallback(async () => {
        try {
            setLoading(true);
            // Construire les paramètres de requête
            const params = new URLSearchParams();
            if (statusFilter) {
                params.append('status', statusFilter);
            }
            if (startDate) {
                params.append('startDate', startDate);
            }
            if (endDate) {
                params.append('endDate', endDate);
            }

            const url = `/api/recompenses${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
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
    }, [statusFilter, startDate, endDate]);

    const applyFilters = useCallback(() => {
        if (rewards.length === 0) {
            setFilteredRewards([]);
            return;
        }

        // Le filtrage par statut et dates est fait côté serveur
        // On ne fait que le filtrage par recherche textuelle côté client
        let filtered = [...rewards];

        // Filtre par recherche textuelle uniquement
        if (searchTerm) {
            filtered = filtered.filter(reward =>
                reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reward.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reward.prize.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRewards(filtered);
    }, [rewards, searchTerm]);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

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
            return <Badge variant="outline" className="bg-white/80 backdrop-blur-xl text-blue-700 border-blue-300 shadow-md">À venir</Badge>;
        } else if (end < now) {
            return <Badge variant="outline" className="bg-white/80 backdrop-blur-xl text-gray-700 border-gray-300 shadow-md">Terminé</Badge>;
        } else {
            return <Badge variant="outline" className="bg-white/80 backdrop-blur-xl text-green-700 border-green-300 shadow-md animate-pulse">En cours</Badge>;
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
                    <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-xl px-6 py-3 rounded-full shadow-lg border border-white/20 hover:bg-white/80 transition-all duration-300">
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
                    className={`bg-white/60 backdrop-blur-xl shadow-xl border border-white/30 transition-all duration-700 hover:bg-white/70 hover:shadow-2xl ${
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
                                <Select 
                                    value={statusFilter} 
                                    onValueChange={(value: 'active' | 'upcoming' | 'ended') => {
                                        setStatusFilter(value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">En cours</SelectItem>
                                        <SelectItem value="upcoming">À venir</SelectItem>
                                        <SelectItem value="ended">Terminés (6 derniers)</SelectItem>
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
                        className={`text-center py-16 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl transition-all duration-700 ${
                            animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune récompense trouvée</h3>
                        <p className="text-gray-500 mb-4">Essayez de modifier vos critères de recherche</p>
                        <Button onClick={clearFilters} variant="outline" className="bg-white/70 backdrop-blur-sm border-white/40 hover:bg-white/90">
                            Voir toutes les récompenses
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRewards.map((reward, index) => (
                            <Card
                                key={reward._id}
                                className={`group cursor-pointer bg-white/60 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-2xl hover:bg-white/80 hover:scale-[1.02] transition-all duration-500 overflow-hidden ${
                                    animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                }`}
                                style={{ transitionDelay: `${200 + index * 50}ms` }}
                                onClick={() => router.push(`/recompenses/${reward._id}`)}
                            >
                                <div className="relative">
                                    {reward.imageUrl ? (
                                        <div className="h-48 overflow-hidden relative">
                                            <Image
                                                src={reward.imageUrl}
                                                alt={reward.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
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
                                        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-lg border border-white/40">
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
                                            <Badge variant="secondary" className="w-fit bg-white/60 backdrop-blur-sm border border-white/30 shadow-sm">
                                                {reward.category}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300" size="sm">
                                        Voir le classement
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Calendrier - Affiché en bas uniquement pour les utilisateurs connectés */}
                {sessionStatus !== 'loading' && session && (
                    <div
                        id="calendar-section"
                        className={`transition-all duration-700 ${
                            animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                        style={{ transitionDelay: '400ms' }}
                    >
                        <Card className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <CardTitle className="text-xl">Calendrier Mensuel</CardTitle>
                                </div>
                                <CardDescription>
                                    Réclamez votre récompense quotidienne le jour même ! Connectez-vous chaque jour pour ne rien manquer.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Informations */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                                        <Gift className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">Récompense quotidienne</p>
                                            <p className="text-xs text-gray-600">
                                                Réclamez une récompense uniquement le jour même. Si vous manquez un jour, la récompense est perdue.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <Image 
                                                src="/badge/points.png" 
                                                alt="Points" 
                                                width={20} 
                                                height={20} 
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Points</p>
                                            <p className="text-xs text-gray-600">
                                                Gagnez entre 5 et 20 points par jour pendant les fêtes. Les jours normaux, vous gagnez 5 points.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <Image 
                                                src="/badge/diamond.png" 
                                                alt="Diamants" 
                                                width={20} 
                                                height={20} 
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Diamants</p>
                                            <p className="text-xs text-gray-600">
                                                Les diamants sont rares ! Vous avez 1 chance sur 18 de gagner un diamant pendant les fêtes.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                                        <Calendar className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-sm">Jours spéciaux</p>
                                            <p className="text-xs text-gray-600">
                                                Les jours marqués d&apos;une étoile ⭐ sont des jours spéciaux avec des récompenses améliorées.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendrier */}
                                <NoSSR>
                                    <CalendarComponent />
                                </NoSSR>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Bulle flottante pour indiquer le calendrier en bas */}
            {sessionStatus !== 'loading' && session && (
                <CalendarFloatingBubble />
            )}
        </div>
    );
}

// Composant bulle flottante pour indiquer le calendrier
function CalendarFloatingBubble() {
    const { data: session } = useSession();
    const [isVisible, setIsVisible] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [todayReward, setTodayReward] = useState<{ type: 'points' | 'gems'; amount: number } | null>(null);
    const [loading, setLoading] = useState(false);

    // Charger la récompense du jour actuel
    useEffect(() => {
        if (!session) return;

        const loadTodayReward = async () => {
            try {
                setLoading(true);
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                const startStr = `${year}-${month}-01`;
                const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
                const endStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

                const response = await fetch(`/api/calendar/data?startDate=${startStr}&endDate=${endStr}`);
                if (response.ok) {
                    const data = await response.json();
                    const todayData = data.days.find((d: any) => {
                        const dateObj = new Date(d.date);
                        const dYear = dateObj.getFullYear();
                        const dMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const dDay = String(dateObj.getDate()).padStart(2, '0');
                        return `${dYear}-${dMonth}-${dDay}` === todayStr;
                    });
                    
                    if (todayData) {
                        setTodayReward(todayData.reward);
                    } else {
                        // Récompense par défaut
                        setTodayReward({ type: 'points', amount: 5 });
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la récompense du jour:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTodayReward();
    }, [session]);

    useEffect(() => {
        const checkCalendarVisibility = () => {
            const calendarSection = document.getElementById('calendar-section');
            if (!calendarSection) {
                setIsVisible(false);
                return;
            }

            const rect = calendarSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Si le calendrier n'est pas visible dans la fenêtre (en bas)
            if (rect.top > windowHeight) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        const handleScroll = () => {
            setIsScrolling(true);
            checkCalendarVisibility();
            
            // Réinitialiser l'état de défilement après un délai
            setTimeout(() => setIsScrolling(false), 150);
        };

        // Vérifier au chargement
        checkCalendarVisibility();

        // Écouter le scroll
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', checkCalendarVisibility);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', checkCalendarVisibility);
        };
    }, []);

    const scrollToCalendar = () => {
        const calendarSection = document.getElementById('calendar-section');
        if (calendarSection) {
            calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToCalendar}
            className={`fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-2xl flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-110 ${
                isScrolling ? 'animate-bounce' : ''
            }`}
            aria-label="Aller au calendrier"
        >
            <Calendar className="w-5 h-5 mb-0.5" />
            {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : todayReward ? (
                <div className="flex items-center gap-1 text-xs font-bold">
                    {todayReward.type === 'gems' ? (
                        <>
                            <Image 
                                src="/badge/diamond.png" 
                                alt="Diamants" 
                                width={12} 
                                height={12} 
                                className="object-contain"
                            />
                            <span>{todayReward.amount}</span>
                        </>
                    ) : (
                        <>
                            <Image 
                                src="/badge/points.png" 
                                alt="Points" 
                                width={12} 
                                height={12} 
                                className="object-contain"
                            />
                            <span>{todayReward.amount}</span>
                        </>
                    )}
                </div>
            ) : null}
        </button>
    );
}