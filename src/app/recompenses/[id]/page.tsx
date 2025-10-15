"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, Clock, Calendar, Award, Medal, Crown, Target, Users, ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import { Separator } from '@/components/ui/Separator';

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

interface LeaderboardEntry {
    userId: string;
    username: string;
    total: number;
}

interface LeaderboardResponse {
    top10: LeaderboardEntry[];
    me?: { total: number; rank: number; userId: string; username: string };
}

export default function RewardDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [reward, setReward] = useState<Reward | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [remaining, setRemaining] = useState<string>('');
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resReward, resLb] = await Promise.all([
                fetch(`/api/recompenses?id=${id}`),
                fetch(`/api/recompenses/${id}?id=${id}`)
            ]);

            if (resReward.ok) {
                const data = await resReward.json();
                setReward(data);
            }

            if (resLb.ok) {
                const data = await resLb.json();
                setLeaderboard(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
            setTimeout(() => setAnimate(true), 100);
        }
    };

    // Countdown logic
    useEffect(() => {
        if (!reward) return;
        const end = new Date(reward.endDate).getTime();
        const timer = setInterval(() => {
            const now = Date.now();
            const diff = end - now;
            if (diff <= 0) {
                setRemaining('Terminé');
                clearInterval(timer);
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);
            setRemaining(`${days}j ${hours}h ${mins}m ${secs}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, [reward]);

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'highestPoints': return <Target className="w-5 h-5" />;
            case 'mostRevisions': return <Award className="w-5 h-5" />;
            case 'mostRevisionsInCategory': return <Medal className="w-5 h-5" />;
            default: return <Trophy className="w-5 h-5" />;
        }
    };

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'highestPoints': return 'Plus de points';
            case 'mostRevisions': return 'Plus de révisions';
            case 'mostRevisionsInCategory': return `Plus de révisions en ${reward?.category}`;
            default: return method;
        }
    };

    const getMethodDescription = (method: string) => {
        switch (method) {
            case 'highestPoints':
                return 'Gagnez des points en répondant correctement aux questions et en complétant des révisions.';
            case 'mostRevisions':
                return 'Effectuez le maximum de révisions pendant la période de l\'événement.';
            case 'mostRevisionsInCategory':
                return `Concentrez-vous sur les révisions dans la catégorie ${reward?.category} pour maximiser vos chances.`;
            default:
                return 'Participez à cet événement pour avoir une chance de gagner !';
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
            case 2: return <Medal className="w-6 h-6 text-gray-400" />;
            case 3: return <Award className="w-6 h-6 text-amber-600" />;
            default: return (
                <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                    {rank}
                </div>
            );
        }
    };

    const getInitials = (username: string) => {
        return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getStatusInfo = () => {
        if (!reward) return { status: 'unknown', color: 'gray', text: 'Inconnu' };

        const now = new Date();
        const start = new Date(reward.startDate);
        const end = new Date(reward.endDate);

        if (start > now) {
            return { status: 'upcoming', color: 'blue', text: 'À venir' };
        } else if (end < now) {
            return { status: 'ended', color: 'gray', text: 'Terminé' };
        } else {
            return { status: 'active', color: 'green', text: 'En cours' };
        }
    };

    const shareReward = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: reward?.title,
                    text: `Découvrez cette récompense : ${reward?.title}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Partage annulé');
            }
        } else {
            // Fallback: copier l'URL
            navigator.clipboard.writeText(window.location.href);
            // Vous pourriez ajouter un toast ici
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-96 w-full rounded-3xl" />
                    <Skeleton className="h-96 w-full rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!reward) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <Card className="max-w-md mx-auto">
                    <CardContent className="p-8 text-center">
                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Événement introuvable</h2>
                        <p className="text-gray-600 mb-6">Cet événement n&apos;existe pas ou a été supprimé.</p>
                        <Button onClick={() => router.push('/recompenses')} variant="outline" className="text-black">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour aux récompenses
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusInfo = getStatusInfo();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Navigation */}
                <div
                    className={`flex items-center justify-between transition-all duration-700 ${
                        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                >
                    <Button
                        variant="outline"
                        onClick={() => router.push('/recompenses')}
                        className="bg-white/80 backdrop-blur-sm text-black"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour aux récompenses
                    </Button>
                    <Button
                        variant="outline"
                        onClick={shareReward}
                        className="bg-white/80 backdrop-blur-sm text-black"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                    </Button>
                </div>

                {/* Header Card */}
                <Card
                    className={`overflow-hidden shadow-lg border-0 transition-all duration-700 ${
                        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: '100ms' }}
                >
                    <div className="relative">
                        {reward.imageUrl && (
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={reward.imageUrl}
                                    alt={reward.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                    <Badge
                                        variant="secondary"
                                        className={`bg-white/90 backdrop-blur-sm text-${statusInfo.color}-700 border-${statusInfo.color}-200`}
                                    >
                                        {statusInfo.text}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <CardHeader className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {getMethodIcon(reward.method)}
                                    <Badge variant="outline" className="text-sm">
                                        {getMethodLabel(reward.method)}
                                    </Badge>
                                    {reward.category && (
                                        <Badge variant="secondary">
                                            {reward.category}
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                                        {reward.title}
                                    </CardTitle>
                                    {reward.description && (
                                        <CardDescription className="text-lg leading-relaxed">
                                            {reward.description}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <Trophy className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-600 font-medium">Prix à gagner</p>
                                        <p className="text-xl font-bold text-green-800">{reward.prize}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Calendar className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Période</p>
                                        <p className="text-sm font-semibold text-blue-800">
                                            Du {new Date(reward.startDate).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                        </p>
                                        <p className="text-sm font-semibold text-blue-800">
                                            Au {new Date(reward.endDate).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-4 p-6 rounded-2xl border transition-colors duration-300 ${
                                    statusInfo.status === 'ended'
                                        ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
                                        : statusInfo.status === 'upcoming'
                                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100'
                                            : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100'
                                }`}>
                                    <div className={`p-3 rounded-xl ${
                                        statusInfo.status === 'ended'
                                            ? 'bg-red-100'
                                            : statusInfo.status === 'upcoming'
                                                ? 'bg-blue-100'
                                                : 'bg-orange-100'
                                    }`}>
                                        <Clock className={`w-8 h-8 ${
                                            statusInfo.status === 'ended'
                                                ? 'text-red-600'
                                                : statusInfo.status === 'upcoming'
                                                    ? 'text-blue-600'
                                                    : 'text-orange-600'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${
                                            statusInfo.status === 'ended'
                                                ? 'text-red-600'
                                                : statusInfo.status === 'upcoming'
                                                    ? 'text-blue-600'
                                                    : 'text-orange-600'
                                        }`}>
                                            {statusInfo.status === 'ended'
                                                ? 'Statut'
                                                : statusInfo.status === 'upcoming'
                                                    ? 'Débute dans'
                                                    : 'Temps restant'
                                            }
                                        </p>
                                        <p className={`text-lg font-bold font-mono ${
                                            statusInfo.status === 'ended'
                                                ? 'text-red-800'
                                                : statusInfo.status === 'upcoming'
                                                    ? 'text-blue-800'
                                                    : 'text-orange-800'
                                        }`}>
                                            {remaining}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* How to participate */}
                            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                                <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Comment participer
                                </h3>
                                <p className="text-purple-700">
                                    {getMethodDescription(reward.method)}
                                </p>
                            </div>
                        </CardHeader>
                    </div>
                </Card>

                {/* Leaderboard Card */}
                <Card
                    className={`shadow-lg border-0 transition-all duration-700 ${
                        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: '300ms' }}
                >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-blue-600" />
                                <div>
                                    <CardTitle className="text-2xl">Classement en temps réel</CardTitle>
                                    <CardDescription>
                                        Suivez votre progression et celle des autres participants
                                    </CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchData}>
                                Actualiser
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!leaderboard || leaderboard.top10.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold mb-2">Aucun participant</h3>
                                <p>Soyez le premier à participer à cet événement !</p>
                            </div>
                        ) : (
                            <>
                                {/* Top 3 podium */}
                                {leaderboard.top10.length >= 3 && (
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        {[1, 0, 2].map((index) => {
                                            const entry = leaderboard.top10[index];
                                            if (!entry) return null;
                                            const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
                                            const isMe = leaderboard.me?.userId === entry.userId;

                                            return (
                                                <div
                                                    key={entry.userId}
                                                    className={`text-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                                                        rank === 1
                                                            ? 'bg-gradient-to-b from-yellow-50 to-amber-50 border-yellow-200 transform scale-105'
                                                            : rank === 2
                                                                ? 'bg-gradient-to-b from-gray-50 to-slate-50 border-gray-200'
                                                                : 'bg-gradient-to-b from-orange-50 to-amber-50 border-orange-200'
                                                    } ${isMe ? 'ring-2 ring-blue-300' : ''}`}
                                                >
                                                    <div className="flex justify-center mb-3">
                                                        {getRankIcon(rank)}
                                                    </div>
                                                    <ProfileAvatar username={ entry.username } userId={entry.userId} />

                                                    <h4 className="font-bold text-lg mb-1">
                                                        <UsernameDisplay 
                                                            username={entry.username}
                                                            userId={entry.userId}
                                                        />
                                                        {isMe && <span className="text-blue-600 text-sm ml-1">(Vous)</span>}
                                                    </h4>
                                                    <p className="text-2xl font-bold text-gray-800">
                                                        {entry.total.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {reward.method === 'highestPoints' ? 'points' : 'révisions'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <Separator />

                                {/* Complete leaderboard */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-lg mb-4">Classement complet</h4>
                                    {leaderboard.top10.map((entry, i) => {
                                        const isMe = leaderboard.me?.userId === entry.userId;
                                        const rank = i + 1;

                                        return (
                                            <div
                                                key={entry.userId}
                                                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:shadow-md ${
                                                    isMe
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm'
                                                        : rank <= 3
                                                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100'
                                                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getRankIcon(rank)}
                                                    <ProfileAvatar username={ entry.username } userId={entry.userId} />
                                                </div>

                                                <div className="flex-1">
                                                    <p className={`font-semibold ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        <UsernameDisplay 
                                                            username={entry.username}
                                                            userId={entry.userId}
                                                        />
                                                        {isMe && <span className="text-blue-600 ml-2">(Vous)</span>}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {rank === 1 ? '🏆 Champion' :
                                                            rank === 2 ? '🥈 2ème place' :
                                                                rank === 3 ? '🥉 3ème place' :
                                                                    `${rank}ème position`}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className={`text-xl font-bold ${
                                                        isMe ? 'text-blue-700' : rank <= 3 ? 'text-amber-700' : 'text-gray-700'
                                                    }`}>
                                                        {entry.total.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {reward.method === 'highestPoints' ? 'points' : 'révisions'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Personal rank if outside top 10 */}
                        {leaderboard?.me &&
                            !leaderboard.top10.find(e => e.userId === leaderboard.me?.userId) && (
                                <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Award className="w-8 h-8 text-purple-600" />
                                            <div>
                                                <h4 className="text-lg font-bold text-purple-800">Votre position</h4>
                                                <p className="text-purple-600">Continuez vos efforts pour grimper au classement !</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-purple-800">
                                                {leaderboard.me.rank}ᵉ
                                            </p>
                                            <p className="text-lg font-semibold text-purple-600">
                                                {leaderboard.me.total.toLocaleString()} {reward.method === 'highestPoints' ? 'points' : 'révisions'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}