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
    Crown,
    Gift,
    Activity,
    Settings,
    File,
    HelpCircle,
    MessageCircle,
    Gem
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
    const generateUniqueGradient = (userId: string | null): string => {
        if (!userId) return 'from-purple-600 via-purple-500 to-indigo-600';

        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }

        const gradients = [
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

    const uniqueGradient = generateUniqueGradient(id);

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
            <div className="bg-gray-50 min-h-screen">
                <div className="container mx-auto mt-6 space-y-6 px-4">
                    <Skeleton className="w-full h-48 rounded-2xl" />
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
        <div className="bg-gray-50 min-h-screen">
            {/* Cover Section */}
            <div className={`relative z-0 w-full h-48 bg-gradient-to-br ${uniqueGradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" aria-hidden></div>
                <div className="absolute inset-0 bg-[url('/noise.webp')] opacity-10 pointer-events-none" aria-hidden></div>
            </div>

            {/* Profile Header - z-20 pour être au-dessus du cover */}
            <div className="container mx-auto px-4 relative z-20">
                <div className="relative -mt-16 mb-6">
                    <div className="flex items-end gap-5">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="rounded-full ring-4 ring-white">
                                <ProfileAvatar
                                    username={formData.username}
                                    size="large"
                                    userId={id}
                                />
                            </div>
                        </div>

                        {/* User info */}
                        <div className="pt-18 pb-1">
                            <CustomUsername
                                username={formData.username}
                                userId={id}
                                className="text-2xl font-bold text-gray-900"
                                role={user?.role}
                            />
                        </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-3 flex-wrap mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            Nv {userRank.level}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Image src="/badge/points.png" alt="Points" width={14} height={14} className="object-contain" />
                            {formatPoints(formData.points)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Image src="/badge/diamond.png" alt="Diamants" width={14} height={14} className="object-contain" />
                            {gems}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            🏆 {formData.badges?.length || 0} badges
                        </span>
                    </div>

                    {/* Bio */}
                    {formData.bio && (
                        <p className="text-gray-500 text-sm mt-2 max-w-2xl">{formData.bio}</p>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-6 pb-8">
                    {/* Rank Section */}
                    <Card className="border border-gray-200 rounded-2xl shadow-sm">
                        <CardHeader className="bg-white border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Crown className="w-5 h-5 text-gray-400" />
                                Progression & Niveau
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <UserRank points={formData.points} />
                        </CardContent>
                    </Card>

                    {/* Badges Section */}
                    <Card className="border border-gray-200 rounded-2xl shadow-sm">
                        <CardHeader className="bg-white border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-gray-400" />
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

                    {/* Contribution Graph Section - compact style GitHub */}
                    <Card className="border border-gray-200 rounded-2xl shadow-sm">
                        <CardHeader className="bg-white border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-gray-400" />
                                Activité & Contributions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ContributionGraph userId={id} />
                        </CardContent>
                    </Card>

                    {/* Editable Fields - Only for owner or admin */}
                    {(isOwner || isAdmin) && (
                        <Card className="border border-gray-200 rounded-2xl shadow-sm">
                            <CardHeader className="bg-white border-b border-gray-100">
                                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-gray-400" />
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
                    <Card className="border border-gray-200 rounded-2xl shadow-sm">
                        <CardHeader className="bg-white border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <File className="w-5 h-5 text-gray-400" />
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
                            <div className="text-center py-8">
                                <File className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Aucune fiche de révision publiée.</p>
                            </div>
                        )}
                        </CardContent>
                    </Card>

                    {/* Questions posées */}
                    <Card className="border border-gray-200 rounded-2xl shadow-sm">
                        <CardHeader className="bg-white border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-gray-400" />
                                Questions posées
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                        {questions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {questions.map((question) => (
                                    <div
                                        key={question._id}
                                        className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition cursor-pointer"
                                        onClick={() => router.push(`/forum/${question._id}`)}
                                    >
                                        <h3 className="font-semibold text-gray-800 line-clamp-2">{question.title}</h3>
                                        <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                                            <span>{question.answersCount} réponse(s)</span>
                                            <span className="text-gray-400">{new Date(question.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Aucune question posée.</p>
                            </div>
                        )}
                        </CardContent>
                    </Card>

                    {/* Réponses données */}
                    <Card className="border border-gray-200 rounded-2xl shadow-sm">
                        <CardHeader className="bg-white border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-gray-400" />
                                Réponses données
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                        {answers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {answers.map((answer) => (
                                    <div
                                        key={answer._id}
                                        className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition cursor-pointer"
                                        onClick={() => router.push(`/forum/${answer.question?._id}`)}
                                    >
                                        <h3 className="font-semibold text-gray-800 line-clamp-2">{answer.question?.title}</h3>
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{answer.content.substring(0, 100)}...</p>
                                        <div className="text-right text-gray-400 text-xs mt-2">
                                            {new Date(answer.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Aucune réponse donnée.</p>
                            </div>
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
        </div>
    );
}
