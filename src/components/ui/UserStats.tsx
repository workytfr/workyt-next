import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
    Users, 
    Award, 
    TrendingUp, 
    Filter, 
    Crown, 
    BookOpen, 
    CheckCircle, 
    Shield 
} from "lucide-react";

interface UserStatsProps {
    stats: {
        roles: {
            apprenti: number;
            redacteur: number;
            correcteur: number;
            admin: number;
        };
        withBadges: number;
        points: {
            minPoints: number;
            maxPoints: number;
            avgPoints: number;
        };
    };
    totalUsers: number;
}

export default function UserStats({ stats, totalUsers }: UserStatsProps) {
    const roleStats = [
        { name: "Apprenti", count: stats.roles.apprenti, icon: BookOpen, color: "blue" },
        { name: "Rédacteur", count: stats.roles.redacteur, icon: TrendingUp, color: "green" },
        { name: "Correcteur", count: stats.roles.correcteur, icon: CheckCircle, color: "purple" },
        { name: "Admin", count: stats.roles.admin, icon: Crown, color: "orange" },
    ];

    const getColorClasses = (color: string) => {
        const colors = {
            blue: "bg-blue-50 text-blue-600 border-blue-200",
            green: "bg-green-50 text-green-600 border-green-200",
            purple: "bg-purple-50 text-purple-600 border-purple-200",
            orange: "bg-orange-50 text-orange-600 border-orange-200",
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    const getProgressColor = (color: string) => {
        const colors = {
            blue: "bg-blue-600",
            green: "bg-green-600",
            purple: "bg-purple-600",
            orange: "bg-orange-600",
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div className="space-y-6">
            {/* Cartes principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Utilisateurs actifs sur la plateforme
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avec Badges</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.withBadges}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalUsers > 0 ? Math.round((stats.withBadges / totalUsers) * 100) : 0}% des utilisateurs
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Points Moyens</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(stats.points.avgPoints)}</div>
                        <p className="text-xs text-muted-foreground">
                            Moyenne des points par utilisateur
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rôles Actifs</CardTitle>
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.values(stats.roles).filter(count => count > 0).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Types de rôles utilisés
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Répartition des rôles */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Répartition des Rôles
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roleStats.map((role) => {
                            const percentage = totalUsers > 0 ? (role.count / totalUsers) * 100 : 0;
                            const IconComponent = role.icon;
                            
                            return (
                                <div key={role.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${getColorClasses(role.color)}`}>
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">{role.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{role.count}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    <Progress 
                                        value={percentage} 
                                        className="h-2"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Statistiques des points */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Statistiques des Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.points.minPoints}
                            </div>
                            <div className="text-sm text-blue-600">Points Minimum</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {Math.round(stats.points.avgPoints)}
                            </div>
                            <div className="text-sm text-green-600">Points Moyens</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.points.maxPoints}
                            </div>
                            <div className="text-sm text-purple-600">Points Maximum</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Badges d'activité */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {totalUsers} utilisateurs
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {stats.withBadges} avec badges
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {Math.round(stats.points.avgPoints)} pts en moyenne
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    {Object.values(stats.roles).filter(count => count > 0).length} rôles actifs
                </Badge>
            </div>
        </div>
    );
} 