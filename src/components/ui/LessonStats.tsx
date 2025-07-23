import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
    BookOpen, 
    CheckCircle, 
    Clock, 
    FileText, 
    TrendingUp, 
    Users, 
    Video,
    Award,
    Calendar,
    Edit
} from "lucide-react";

interface LessonStatsProps {
    stats: {
        total: number;
        published: number;
        pending: number;
        draft: number;
        withMedia: number;
        byCourse: Record<string, number>;
        byStatus: Record<string, number>;
        recentLessons: number;
        avgMediaPerLesson: number;
    };
}

export default function LessonStats({ stats }: LessonStatsProps) {
    const statusStats = [
        { name: "Publiées", count: stats.published, icon: CheckCircle, color: "green", bgColor: "bg-green-50", textColor: "text-green-600" },
        { name: "En attente", count: stats.pending, icon: Clock, color: "yellow", bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
        { name: "Brouillons", count: stats.draft, icon: Edit, color: "gray", bgColor: "bg-gray-50", textColor: "text-gray-600" },
        { name: "Avec média", count: stats.withMedia, icon: Video, color: "purple", bgColor: "bg-purple-50", textColor: "text-purple-600" },
    ];

    const getCourseStats = () => {
        const courses = Object.entries(stats.byCourse).map(([course, count]) => ({
            name: course,
            count,
            percentage: stats.total > 0 ? (count / stats.total) * 100 : 0
        }));
        return courses.sort((a, b) => b.count - a.count).slice(0, 5); // Top 5
    };

    const getStatusStats = () => {
        const statuses = Object.entries(stats.byStatus).map(([status, count]) => ({
            name: status,
            count,
            percentage: stats.total > 0 ? (count / stats.total) * 100 : 0
        }));
        return statuses.sort((a, b) => b.count - a.count);
    };

    return (
        <div className="space-y-6">
            {/* Cartes principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leçons</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Leçons créées sur la plateforme
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Publiées</CardTitle>
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
                        <CardTitle className="text-sm font-medium">Avec Média</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.withMedia}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.withMedia / stats.total) * 100) : 0}% du total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Média/Leçon</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgMediaPerLesson.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">
                            Moyenne par leçon
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

            {/* Répartition par cours */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Top Cours par Leçons
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getCourseStats().map((course) => {
                            const IconComponent = BookOpen;
                            
                            return (
                                <div key={course.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">{course.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{course.count}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {course.percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    <Progress 
                                        value={course.percentage} 
                                        className="h-2"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Répartition par statut détaillée */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Répartition par Statut Détaillée
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getStatusStats().map((status, index) => (
                            <div key={status.name} className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-700">
                                    {status.count}
                                </div>
                                <div className="text-sm text-gray-600">{status.name}</div>
                                <div className="text-xs text-gray-500">
                                    {status.percentage.toFixed(1)}%
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
                    {stats.total} leçons
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {stats.published} publiées
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {stats.pending} en attente
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    {stats.withMedia} avec média
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats.avgMediaPerLesson.toFixed(1)} média/leçon
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {stats.recentLessons} récentes
                </Badge>
            </div>
        </div>
    );
} 