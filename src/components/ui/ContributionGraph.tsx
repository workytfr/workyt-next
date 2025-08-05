'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, Calendar, TrendingUp, Target } from 'lucide-react';

interface Contribution {
    date: string;
    points: number;
    level: 0 | 1 | 2 | 3 | 4;
}

interface ContributionStats {
    totalPoints: number;
    totalTransactions: number;
    averagePointsPerDay: number;
    maxPointsInDay: number;
    activeDays: number;
    totalDays: number;
}

interface ContributionGraphProps {
    userId: string;
}

export default function ContributionGraph({ userId }: ContributionGraphProps) {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [stats, setStats] = useState<ContributionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContributions = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/user/${userId}/contributions`);
                
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des contributions');
                }

                const data = await response.json();
                setContributions(data.contributions);
                setStats(data.stats);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        };

        fetchContributions();
    }, [userId]);

    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-gray-100';
            case 1: return 'bg-orange-200';
            case 2: return 'bg-orange-300';
            case 3: return 'bg-orange-400';
            case 4: return 'bg-orange-500';
            default: return 'bg-gray-100';
        }
    };

    const getTooltipText = (contribution: Contribution) => {
        const date = new Date(contribution.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        if (contribution.points === 0) {
            return `${date}\nAucun point gagné`;
        }
        
        return `${date}\n${contribution.points} point${contribution.points > 1 ? 's' : ''} gagné${contribution.points > 1 ? 's' : ''}`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Graphique de contribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse">
                        <div className="grid grid-cols-13 gap-0.5 mb-4">
                            {Array.from({ length: 91 }).map((_, i) => (
                                <div key={i} className="w-2.5 h-2.5 bg-gray-200 rounded-sm" />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Graphique de contribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-500">
                        <p>Erreur lors du chargement des contributions</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Graphique de contribution (3 derniers mois)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistiques */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{stats.totalPoints}</div>
                            <div className="text-sm text-gray-600">Points totaux</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-500">{stats.activeDays}</div>
                            <div className="text-sm text-gray-600">Jours actifs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-400">{stats.maxPointsInDay}</div>
                            <div className="text-sm text-gray-600">Max/jour</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-700">{stats.averagePointsPerDay}</div>
                            <div className="text-sm text-gray-600">Moyenne/jour</div>
                        </div>
                    </div>
                )}

                {/* Graphique de contribution */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">Moins</span>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                            <div className="w-3 h-3 bg-orange-200 rounded-sm"></div>
                            <div className="w-3 h-3 bg-orange-300 rounded-sm"></div>
                            <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                        </div>
                        <span className="text-sm text-gray-600">Plus</span>
                    </div>

                    {/* Grille de contribution avec moins d'espacement */}
                    <div className="grid grid-cols-13 gap-0.5">
                        {contributions.map((contribution, index) => (
                            <div
                                key={contribution.date}
                                className={`w-2.5 h-2.5 rounded-sm transition-colors duration-200 hover:scale-150 cursor-pointer ${getLevelColor(contribution.level)}`}
                                title={getTooltipText(contribution)}
                                data-tooltip={getTooltipText(contribution)}
                            />
                        ))}
                    </div>


                </div>

                {/* Informations supplémentaires */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Période : 3 derniers mois</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{stats?.totalTransactions || 0} transactions de points</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 