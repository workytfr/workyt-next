import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
    BookOpen, 
    CheckCircle, 
    Clock, 
    XCircle, 
    TrendingUp, 
    Users, 
    FileText,
    Award,
    Calendar
} from "lucide-react";

interface CourseStatsProps {
    stats: {
        total: number;
        published: number;
        pending: number;
        cancelled: number;
        withSections: number;
        byLevel: Record<string, number>;
        bySubject: Record<string, number>;
        recentCourses: number;
        avgSectionsPerCourse: number;
    };
}

export default function CourseStats({ stats }: CourseStatsProps) {
    const statusStats = [
        { name: "Publiés", count: stats.published, icon: CheckCircle, color: "green", bgColor: "bg-green-50", textColor: "text-green-600" },
        { name: "En attente", count: stats.pending, icon: Clock, color: "yellow", bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
        { name: "Annulés", count: stats.cancelled, icon: XCircle, color: "red", bgColor: "bg-red-50", textColor: "text-red-600" },
        { name: "Avec sections", count: stats.withSections, icon: FileText, color: "purple", bgColor: "bg-purple-50", textColor: "text-purple-600" },
    ];

    const getLevelStats = () => {
        const levels = Object.entries(stats.byLevel).map(([level, count]) => ({
            name: level,
            count,
            percentage: stats.total > 0 ? (count / stats.total) * 100 : 0
        }));
        return levels.sort((a, b) => b.count - a.count);
    };

    const getSubjectStats = () => {
        const subjects = Object.entries(stats.bySubject).map(([subject, count]) => ({
            name: subject,
            count,
            percentage: stats.total > 0 ? (count / stats.total) * 100 : 0
        }));
        return subjects.sort((a, b) => b.count - a.count).slice(0, 6); // Top 6
    };

    return (
        <div className="space-y-6">
            {/* Cartes principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cours</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Cours créés sur la plateforme
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Publiés</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.published}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% du total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avec Sections</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.withSections}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.withSections / stats.total) * 100) : 0}% du total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sections/Cours</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgSectionsPerCourse.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">
                            Moyenne par cours
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Répartition par statut */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Répartition par Statut
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {statusStats.map((status) => {
                            const percentage = stats.total > 0 ? (status.count / stats.total) * 100 : 0;
                            const IconComponent = status.icon;
                            
                            return (
                                <div key={status.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${status.bgColor} ${status.textColor}`}>
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">{status.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{status.count}</div>
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

            {/* Répartition par niveau */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Répartition par Niveau
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getLevelStats().map((level) => {
                            const IconComponent = BookOpen;
                            
                            return (
                                <div key={level.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">{level.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{level.count}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {level.percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    <Progress 
                                        value={level.percentage} 
                                        className="h-2"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Top matières */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Top Matières
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getSubjectStats().map((subject, index) => (
                            <div key={subject.name} className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-700">
                                    {subject.count}
                                </div>
                                <div className="text-sm text-gray-600">{subject.name}</div>
                                <div className="text-xs text-gray-500">
                                    {subject.percentage.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Badges d'activité */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {stats.total} cours
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {stats.published} publiés
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {stats.pending} en attente
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {stats.withSections} avec sections
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats.avgSectionsPerCourse.toFixed(1)} sections/cours
                </Badge>
            </div>
        </div>
    );
} 