"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Store, Users, TrendingUp, Award } from "lucide-react";

interface PartnerStats {
    totalPartners: number;
    activePartners: number;
    totalUses: number;
    totalSavings: number;
    topPartners: Array<{
        name: string;
        totalUses: number;
        totalSavings: number;
    }>;
}

export default function PartnerStats() {
    const [stats, setStats] = useState<PartnerStats>({
        totalPartners: 0,
        activePartners: 0,
        totalUses: 0,
        totalSavings: 0,
        topPartners: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPartnerStats() {
            try {
                const response = await fetch("/api/partners");
                if (response.ok) {
                    const partners = await response.json();
                    
                    const totalPartners = partners.length;
                    const activePartners = partners.filter((p: any) => p.isActive).length;
                    const totalUses = partners.reduce((sum: number, p: any) => sum + p.totalUses, 0);
                    const totalSavings = partners.reduce((sum: number, p: any) => sum + p.totalSavings, 0);
                    
                    // Top 3 des partenaires les plus utilisés
                    const topPartners = partners
                        .sort((a: any, b: any) => b.totalUses - a.totalUses)
                        .slice(0, 3)
                        .map((p: any) => ({
                            name: p.name,
                            totalUses: p.totalUses,
                            totalSavings: p.totalSavings
                        }));

                    setStats({
                        totalPartners,
                        activePartners,
                        totalUses,
                        totalSavings,
                        topPartners
                    });
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des statistiques des partenaires:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPartnerStats();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Chargement...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            Total Partenaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPartners}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Partenaires Actifs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.activePartners}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Total Utilisations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalUses}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Économies Totales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.totalSavings}€</div>
                    </CardContent>
                </Card>
            </div>

            {/* Top des partenaires */}
            {stats.topPartners.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Top 3 des Partenaires
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.topPartners.map((partner, index) => (
                                <div key={partner.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                            index === 0 ? 'bg-yellow-500' : 
                                            index === 1 ? 'bg-gray-400' : 
                                            'bg-orange-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{partner.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {partner.totalUses} utilisation{partner.totalUses > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-green-600">
                                            {partner.totalSavings}€
                                        </div>
                                        <div className="text-xs text-gray-500">économies</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
