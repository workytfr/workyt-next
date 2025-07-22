"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/ui/profile";
import FicheCard from "@/components/fiches/FicheCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Separator } from "@/components/ui/Separator";
import { Toast } from "@/components/ui/UseToast";
import { Label } from "@/components/ui/Label";
import BadgeDisplay from "@/components/ui/BadgeDisplay";
import UserRank from "@/components/ui/UserRank";
import BadgeProgress from "@/components/ui/BadgeProgress";
import { FaQuestionCircle, FaReply } from "react-icons/fa";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/Pagination";
import Image from "next/image";

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

    // Resolve params promise
    useEffect(() => {
        async function resolveParams() {
            const resolvedParams = await params;
            setId(resolvedParams.id);
        }
        resolveParams();
    }, [params]);

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
        <div className="bg-white text-black">
            {/* Cover Section */}
            <div className="relative w-full h-48 bg-blue-500">
                <Image
                    src="/avatars/background.png"
                    alt="Cover Image"
                    fill
                    className="object-cover"
                />
                <div className="absolute top-16 left-8 flex items-center">
                    <ProfileAvatar
                        username={formData.username}
                        size="large"
                    />
                </div>
            </div>

            {/* User Details Section */}
            <div className="container mx-auto mt-16 space-y-6 px-4">
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">{formData.username}</h1>
                    <p className="text-gray-700">{formData.points} points</p>
                    <p className="text-gray-700 mt-2 max-w-lg">{formData.bio}</p>
                </div>

                <Separator className="my-6" />

                {/* Rank Section */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Niveau & Rank</h2>
                    <UserRank points={formData.points} />
                </div>

                <Separator className="my-6" />

                {/* Badges Section */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Badges</h2>
                    <BadgeProgress badgesCount={formData.badges.length} totalBadges={18} />
                    <div className="mt-4">
                        <BadgeDisplay userId={id} showProgress={true} />
                    </div>
                </div>

                <Separator className="my-6" />

                {/* Editable Fields - Only for owner or admin */}
                {(isOwner || isAdmin) && (
                    <div>
                        <h2 className="text-lg font-bold">Modifier votre profil</h2>
                        <div className="mt-4 space-y-4">
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
                    </div>
                )}

                <Separator className="my-6" />

                {/* User Revisions */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Fiches de révision</h2>
                    {revisions.length > 0 ? (
                        <div className="space-y-4">
                            {revisions.map((fiche) => (
                                <FicheCard key={fiche._id} fiche={fiche} username={formData.username} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Aucune fiche de révision publiée.</p>
                    )}
                </div>

                {/* 📌 Questions posées */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
                        <FaQuestionCircle className="text-blue-600" /> Questions posées
                    </h2>

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
                </div>

                {/* 📌 Réponses données */}
                <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-600">
                        <FaReply className="text-green-600" /> Réponses données
                    </h2>

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
                </div>

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