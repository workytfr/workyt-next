"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Separator } from "@/components/ui/Separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { 
    User, 
    Mail, 
    Calendar, 
    MapPin, 
    Phone, 
    Instagram, 
    Twitter, 
    Linkedin, 
    Github, 
    Globe, 
    Rocket, 
    Sparkles, 
    Zap, 
    Flame, 
    Snowflake, 
    Droplets, 
    Sun, 
    Moon, 
    Cloud, 
    Rainbow, 
    Crown, 
    Diamond, 
    Gem, 
    Coins, 
    Banknote, 
    CreditCard, 
    Wallet, 
    ShoppingCart, 
    Gift, 
    Tag, 
    Percent, 
    Calculator, 
    BarChart, 
    TrendingUp, 
    TrendingDown, 
    Activity, 
    PieChart, 
    LineChart, 
    AreaChart, 
    File, 
    Folder, 
    Archive, 
    Code, 
    Terminal, 
    Database, 
    Server, 
    Network, 
    Wifi, 
    Bluetooth, 
    Signal, 
    Battery, 
    Power, 
    Settings, 
    Palette, 
    Brush, 
    Pencil, 
    Pen, 
    Eraser, 
    Scissors, 
    Copy, 
    Group, 
    Layers, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    Space,
    HelpCircle,
    MessageCircle
} from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import UserRank from "@/components/ui/UserRank";
import BadgeProgress from "@/components/ui/BadgeProgress";
import BadgeDisplay from "@/components/ui/BadgeDisplay";
import ContributionGraph from "@/components/ui/ContributionGraph";
import FicheCard from "@/components/fiches/FicheCard";
import CustomUsername from "@/components/ui/CustomUsername";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/UseToast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/Pagination";
import { calculateUserRank } from "@/lib/rankSystem";
import useSWR from "swr";

export default function UserAccountPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session } = useSession();
    const router = useRouter();

    const [id, setId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        bio: "",
        badges: [],
        points: 0,
        image: "",
    });

    // Récupérer les gems (seulement si c'est le profil de l'utilisateur connecté)
    const fetcher = (url: string) => fetch(url).then(res => res.json()).catch(() => null);
    const { data: gemData } = useSWR(
        id && session?.user?.id === id ? '/api/gems/balance' : null,
        fetcher,
        {
            refreshInterval: 60000,
            revalidateOnFocus: false,
        }
    );

    const gems = gemData?.success && gemData?.data?.user?.id === id 
        ? gemData.data.gems.balance || 0 
        : 0;

    // Fonction pour formater les points
    const formatPoints = (points: number): string => {
        if (points < 1000) return points.toString();
        if (points < 1000000) return Math.floor(points / 1000) + "K";
        return Math.floor(points / 1000000) + "M";
    };

    const userRank = calculateUserRank(formData.points);

    // Fonction pour générer un gradient unique basé sur l'ID utilisateur
    const generateUniqueGradient = (userId: string | null, variant: 'main' | 'avatar' = 'main'): string => {
        if (!userId) return variant === 'main' ? 'from-purple-600 via-purple-500 to-indigo-600' : 'from-purple-400 to-pink-400';
        
        // Hash simple de l'ID pour générer des valeurs cohérentes
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Gradients pour le fond principal
        const mainGradients = [
            'from-purple-600 via-purple-500 to-indigo-600',
            'from-blue-600 via-blue-500 to-cyan-600',
            'from-pink-600 via-pink-500 to-rose-600',
            'from-green-600 via-green-500 to-emerald-600',
            'from-orange-600 via-orange-500 to-amber-600',
            'from-red-600 via-red-500 to-pink-600',
            'from-indigo-600 via-indigo-500 to-purple-600',
            'from-teal-600 via-teal-500 to-cyan-600',
            'from-violet-600 via-violet-500 to-purple-600',
            'from-rose-600 via-rose-500 to-pink-600',
            'from-amber-600 via-amber-500 to-yellow-600',
            'from-emerald-600 via-emerald-500 to-green-600',
        ];
        
        // Gradients pour l'avatar (plus clairs)
        const avatarGradients = [
            'from-purple-400 to-pink-400',
            'from-blue-400 to-cyan-400',
            'from-pink-400 to-rose-400',
            'from-green-400 to-emerald-400',
            'from-orange-400 to-amber-400',
            'from-red-400 to-pink-400',
            'from-indigo-400 to-purple-400',
            'from-teal-400 to-cyan-400',
            'from-violet-400 to-purple-400',
            'from-rose-400 to-pink-400',
            'from-amber-400 to-yellow-400',
            'from-emerald-400 to-green-400',
        ];
        
        const gradients = variant === 'main' ? mainGradients : avatarGradients;
        return gradients[Math.abs(hash) % gradients.length];
    };

    // Resolve params promise
    useEffect(() => {
        async function resolveParams() {
            const resolvedParams = await params;
            setId(resolvedParams.id);
        }
        resolveParams();
    }, [params]);

    // Calculer les gradients une fois que l'ID est disponible
    const uniqueGradient = generateUniqueGradient(id, 'main');
    const avatarGradient = generateUniqueGradient(id, 'avatar');

    useEffect(() => {
        if (!id) return; // Wait for id to be resolved

        async function fetchUser() {
            try {
                setLoading(true);
                const res = await fetch(`/api/user/${id}?page=${pagination.page}&limit=5`);
                const data = await res.json();
                if (res.ok) {
                    setUser(data.data.user);
                    setRevisions(data.data.revisions);
                    setQuestions(data.data.questions);
                    setAnswers(data.data.answers);
                    setPagination({
                        page: data.data.pagination.currentPage,
                        totalPages: data.data.pagination.totalPages,
                    });
                    setFormData({
                        name: data.data.user.name,
                        username: data.data.user.username,
                        bio: data.data.user.bio || "",
                        badges: data.data.user.badges || [],
                        points: data.data.user.points || 0,
                        image: data.data.user.image || "",
                    });
                } else {
                    Toast({
                        title: "Erreur",
                        variant: "destructive",
                    });
                    router.push("/");
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
                Toast({
                    title: "Erreur",
                    variant: "destructive",
                });
                router.push("/");
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [id, pagination.page, router]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: user.name,
            username: user.username,
            bio: user.bio || "",
            badges: user.badges || [],
            points: user.points || 0,
            image: user.image || "",
        });
    };

    const handleSave = async () => {
        if (!id) return;

        try {
            const res = await fetch(`/api/user/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                Toast({ title: "Success", content: "User updated successfully." });
                setUser(data.data);
                setIsEditing(false);
            } else {
                Toast({ title: "Error", content: data.error, variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to save user:", error);
            Toast({
                title: "Error",
                content: "Unable to save user data.",
                variant: "destructive",
            });
        }
    };

    const isOwner = session?.user?.id === id;
    const isAdmin = session?.user?.role === "Admin";

    if (loading || !id) {
        return (
            <div className="bg-white">
                <div className="container mx-auto mt-6 space-y-6">
                    <Skeleton className="w-full h-48 rounded-md mb-4" />
                    <div className="flex items-center space-x-4">
                        <Skeleton className="w-24 h-24 rounded-full" />
                        <div>
                            <Skeleton className="w-48 h-6 mb-2" />
                            <Skeleton className="w-32 h-4" />
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                        <Skeleton className="w-full h-10" />
                        <Skeleton className="w-full h-10" />
                        <Skeleton className="w-full h-24" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-purple-50 via-white to-white min-h-screen">
            {/* Cover Section avec gradient unique */}
            <div className={`relative w-full h-64 bg-gradient-to-br ${uniqueGradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('/noise.webp')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                <div className="container mx-auto relative z-10 h-full flex items-end pb-8 px-4">
                    <div className="flex items-end gap-6 w-full">
                        {/* Avatar */}
                        <div className="relative">
                            <div className={`absolute -inset-2 bg-gradient-to-r ${avatarGradient} rounded-full blur opacity-75 animate-pulse`}></div>
                            <ProfileAvatar
                                username={formData.username}
                                size="large"
                                userId={id}
                            />
                        </div>
                        
                        {/* Informations utilisateur */}
                        <div className="flex-1 pb-2">
                            <CustomUsername 
                                username={formData.username} 
                                userId={id} 
                                className="text-3xl font-bold text-white drop-shadow-lg mb-2"
                                role={user?.role}
                            />
                            {formData.bio && (
                                <p className="text-white/90 text-sm max-w-2xl mb-3">{formData.bio}</p>
                            )}
                            
                            {/* Statistiques principales */}
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* Niveau */}
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white font-semibold text-sm">Nv {userRank.level}</span>
                                </div>
                                
                                {/* Points */}
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <Image 
                                        src="/badge/points.png" 
                                        alt="Points" 
                                        width={16} 
                                        height={16} 
                                        className="object-contain"
                                    />
                                    <span className="text-white font-semibold text-sm">{formatPoints(formData.points)}</span>
                                </div>
                                
                                {/* Gems */}
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <Image 
                                        src="/badge/diamond.png" 
                                        alt="Diamants" 
                                        width={16} 
                                        height={16} 
                                        className="object-contain"
                                    />
                                    <span className="text-white font-semibold text-sm">{gems}</span>
                                </div>
                                
                                {/* Badges count */}
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white font-semibold text-sm">🏆 {formData.badges?.length || 0} badges</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Details Section */}
            <div className="container mx-auto -mt-8 space-y-6 px-4 pb-8">
                {/* Rank Section */}
                <Card className="border-2 border-purple-200 shadow-lg mt-8">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                        <CardTitle className="text-xl font-bold text-purple-900 flex items-center gap-2">
                            <Crown className="w-6 h-6 text-purple-600" />
                            Progression & Niveau
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <UserRank points={formData.points} />
                    </CardContent>
                </Card>

                {/* Badges Section */}
                <Card className="border-2 border-yellow-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
                        <CardTitle className="text-xl font-bold text-yellow-900 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-yellow-600" />
                            Badges & Récompenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <BadgeProgress badgesCount={formData.badges?.length || 0} totalBadges={18} />
                        <div className="mt-6">
                            <BadgeDisplay userId={id} showProgress={true} />
                        </div>
                    </CardContent>
                </Card>

                {/* Contribution Graph Section */}
                <Card className="border-2 border-green-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                        <CardTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-green-600" />
                            Activité & Contributions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ContributionGraph userId={id} />
                    </CardContent>
                </Card>

                {/* Editable Fields - Only for owner or admin */}
                {(isOwner || isAdmin) && (
                    <Card className="border-2 border-gray-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-gray-600" />
                                Paramètres du profil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nom</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    disabled={!isEditing}
                                />
                            </div>
                            <div>
                                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    disabled={!isEditing}
                                />
                            </div>
                            <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) =>
                                        setFormData({ ...formData, bio: e.target.value })
                                    }
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={handleCancel}>
                                            Annuler
                                        </Button>
                                        <Button onClick={handleSave}>Sauvegarder</Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>Modifier</Button>
                                )}
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                )}

                {/* User Revisions */}
                <Card className="border-2 border-indigo-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                        <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                            <File className="w-6 h-6 text-indigo-600" />
                            Fiches de révision
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                    {revisions.length > 0 ? (
                        <div className="space-y-4">
                            {revisions.map((fiche) => (
                                <FicheCard key={fiche._id} fiche={fiche} username={formData.username} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Aucune fiche de révision publiée.</p>
                    )}
                    </CardContent>
                </Card>

                {/* 📌 Questions posées */}
                <Card className="border-2 border-blue-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                        <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                            <HelpCircle className="w-6 h-6 text-blue-600" />
                            Questions posées
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">

                    {questions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {questions.map((question) => (
                                <div
                                    key={question._id}
                                    className="p-4 bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition duration-300 cursor-pointer"
                                    onClick={() => router.push(`/forum/${question._id}`)}
                                >
                                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">{question.title}</h3>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                                        <span>{question.answersCount} réponse(s)</span>
                                        <span className="text-gray-400">{new Date(question.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Aucune question posée.</p>
                    )}
                    </CardContent>
                </Card>

                {/* 📌 Réponses données */}
                <Card className="border-2 border-green-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                        <CardTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-green-600" />
                            Réponses données
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">

                    {answers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {answers.map((answer) => (
                                <div
                                    key={answer._id}
                                    className="p-4 bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition duration-300 cursor-pointer"
                                    onClick={() => router.push(`/forum/${answer.question?._id}`)}
                                >
                                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">{answer.question?.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{answer.content.substring(0, 100)}...</p>
                                    <div className="text-right text-gray-400 text-xs mt-2">
                                        {new Date(answer.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Aucune réponse donnée.</p>
                    )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                className={pagination.page === 1 ? "opacity-50 pointer-events-none" : ""}
                            >
                                Précédent
                            </PaginationPrevious>
                        </PaginationItem>
                        {Array.from({ length: pagination.totalPages }, (_, index) => (
                            <PaginationItem key={index}>
                                <PaginationLink
                                    href="#"
                                    isActive={pagination.page === index + 1}
                                    onClick={() => handlePageChange(index + 1)}
                                >
                                    {index + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={() => handlePageChange(pagination.page + 1)}
                                className={pagination.page === pagination.totalPages ? "opacity-50 pointer-events-none" : ""}
                            >
                                Suivant
                            </PaginationNext>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}