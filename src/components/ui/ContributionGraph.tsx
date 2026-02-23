'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

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

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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
            <div className="animate-pulse space-y-3">
                <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-8 flex-1 bg-gray-100 rounded" />
                    ))}
                </div>
                <div className="h-24 bg-gray-100 rounded" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-6 text-gray-400 text-sm">
                <p>Erreur lors du chargement des contributions</p>
                <p className="text-xs mt-1">{error}</p>
            </div>
        );
    }

    // Map date -> contribution
    const contributionsByDate = new Map(contributions.map(c => [c.date, c]));

    // Trouver le premier lundi dans la plage
    const firstDate = contributions[0]?.date;
    const lastDate = contributions[contributions.length - 1]?.date;
    if (!firstDate || !lastDate) {
        return <div className="text-sm text-gray-400 py-4">Aucune donnée</div>;
    }

    const first = new Date(firstDate + 'T12:00:00');
    let firstMonday = new Date(first);
    const dayOfWeek = first.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(first.getDate() - daysToMonday);

    // Construire la grille : 7 lignes (Lun-Dim), colonnes = semaines
    const grid: (Contribution | null)[][] = [];
    for (let row = 0; row < 7; row++) grid.push([]);

    let currentMonday = new Date(firstMonday);
    const endDate = new Date(lastDate + 'T12:00:00');

    while (currentMonday <= endDate) {
        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(currentMonday);
            cellDate.setDate(currentMonday.getDate() + d);
            const dateKey = cellDate.toISOString().split('T')[0];
            const contrib = contributionsByDate.get(dateKey) ?? null;
            grid[d].push(contrib);
        }
        currentMonday.setDate(currentMonday.getDate() + 7);
    }

    return (
        <div className="space-y-3">
            {/* Stats compactes style GitHub */}
            {stats && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span><strong className="text-gray-800">{stats.totalPoints}</strong> points</span>
                    <span><strong className="text-gray-800">{stats.activeDays}</strong> jours actifs</span>
                    <span><strong className="text-gray-800">{stats.maxPointsInDay}</strong> max/jour</span>
                </div>
            )}

            {/* Graphique style GitHub : Lun-Dim en lignes, label aligné avec chaque ligne */}
            <div className="flex flex-col gap-[2px] w-full">
                {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2">
                        <div className="w-8 shrink-0 text-[10px] text-gray-400 flex items-center">
                            {DAY_LABELS[rowIndex]}
                        </div>
                        <div className="flex gap-[2px] flex-1 min-w-0">
                            {row.map((contrib, colIndex) => (
                                <div
                                    key={colIndex}
                                    className={`aspect-square w-full min-w-[8px] rounded-[2px] transition-colors hover:ring-2 hover:ring-gray-300 cursor-pointer ${contrib ? getLevelColor(contrib.level) : 'bg-gray-100'}`}
                                    title={contrib ? getTooltipText(contrib) : undefined}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Légende compacte */}
            <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    3 derniers mois
                    <span className="mx-0.5">·</span>
                    <TrendingUp className="h-3 w-3" />
                    {stats?.totalTransactions || 0} transactions
                </span>
                <div className="flex items-center gap-1">
                    <span>Moins</span>
                    <div className="w-2 h-2 bg-gray-100 rounded-[2px]" />
                    <div className="w-2 h-2 bg-orange-200 rounded-[2px]" />
                    <div className="w-2 h-2 bg-orange-300 rounded-[2px]" />
                    <div className="w-2 h-2 bg-orange-400 rounded-[2px]" />
                    <div className="w-2 h-2 bg-orange-500 rounded-[2px]" />
                    <span>Plus</span>
                </div>
            </div>
        </div>
    );
}
