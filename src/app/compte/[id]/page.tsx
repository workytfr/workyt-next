"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/ui/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Separator } from "@/components/ui/Separator";
import { Toast } from "@/components/ui/UseToast";
import { Label } from "@/components/ui/Label";

export default function UserAccountPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { data: session } = useSession();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
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
                const res = await fetch(`/api/user/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setUser(data.data.user);
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
            }
        }

        fetchUser();
    }, [id, router]);

    const handleEdit = () => {
        setIsEditing(true);
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

    if (!user) {
        return (
            <div className="bg-white">
                <div className="container mx-auto mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-4">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div>
                                    <Skeleton className="w-24 h-6 mb-2" />
                                    <Skeleton className="w-16 h-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Skeleton className="w-full h-10" />
                                <Skeleton className="w-full h-10" />
                                <Skeleton className="w-full h-24" />
                                <Skeleton className="w-full h-10" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const isOwner = session?.user?.email === user.email;
    const isAdmin = session?.user?.role === "Admin";

    return (
        <div className="bg-white">
            <div className="container mx-auto mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <ProfileAvatar
                                username={formData.username}
                                points={formData.points}
                            />
                            <div>
                                <CardTitle>{formData.username}</CardTitle>
                                <CardDescription>{formData.points} points</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
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
                            <Separator className="my-4" />
                            <div className="flex items-start gap-4">
                                <div>
                                    <Label>Badges</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {formData.badges.length > 0 ? (
                                            formData.badges.map((badge: string, idx: number) => (
                                                <Badge key={idx} variant="secondary">
                                                    {badge}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Aucun badge obtenu.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {(isOwner || isAdmin) && (
                                <div className="flex justify-end gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button variant="outline" onClick={handleCancel}>
                                                Annuler
                                            </Button>
                                            <Button onClick={handleSave}>Sauvegarder</Button>
                                        </>
                                    ) : (
                                        <Button onClick={handleEdit}>Modifier</Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
