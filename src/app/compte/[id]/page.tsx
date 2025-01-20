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
import Image from "next/image";

export default function UserAccountPage({ params }: { params: { id: string } }) {
    const { id } = params; // ID de l'utilisateur cible
    const { data: session } = useSession(); // Session utilisateur connecté
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true); // Ajout de l'état de chargement
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        bio: "",
        badges: [],
        points: 0,
        image: "",
    });

    useEffect(() => {
        async function fetchUser() {
            try {
                setLoading(true); // Début du chargement
                const res = await fetch(`/api/user/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setUser(data.data.user);
                    setRevisions(data.data.revisions);
                    setFormData({
                        name: data.data.user.name,
                        username: data.data.user.username,
                        bio: data.data.user.bio || "",
                        badges: data.data.user.badges || [],
                        points: data.data.user.points || 0,
                        image: data.data.user.image || "",
                    });
                } else {
                    Toast({ title: "Error", content: data.error, variant: "destructive" });
                    router.push("/");
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
                Toast({
                    title: "Error",
                    content: "Unable to fetch user data.",
                    variant: "destructive",
                });
                router.push("/");
            } finally {
                setLoading(false); // Fin du chargement
            }
        }

        fetchUser();
    }, [id, router]);

    // Fonction pour annuler l'édition
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

    if (loading) {
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

                {/* Badges Section */}
                <div>
                    <h2 className="text-lg font-bold">Badges</h2>
                    <div className="flex gap-2 flex-wrap mt-4">
                        {formData.badges.length > 0 ? (
                            formData.badges.map((badge: string, idx: number) => (
                                <Badge key={idx} variant="secondary">
                                    {badge}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">Aucun badge obtenu.</p>
                        )}
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
            </div>
        </div>
    );
}
