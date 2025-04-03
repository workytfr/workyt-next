"use client";

import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/Select";
import { useSession } from "next-auth/react";

interface User {
    _id: string;
    name: string;
    email: string;
    username: string;
    role: "Apprenti" | "Rédacteur" | "Correcteur" | "Admin";
    points: number;
    badges: string[];
    bio: string;
    createdAt: string;
}

interface UserFormProps {
    user?: User | null;
    onSuccess: (user: User) => void;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
    const { data: session } = useSession();

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [username, setUsername] = useState(user?.username || "");
    const [role, setRole] = useState<"Apprenti" | "Rédacteur" | "Correcteur" | "Admin">(user?.role || "Apprenti");
    const [points, setPoints] = useState(user?.points || 20);
    const [badges, setBadges] = useState(user?.badges.join(", ") || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload: Partial<User> & { userId?: string } = {
            name,
            email,
            username,
            role,
            points,
            badges: badges.split(",").map((b) => b.trim()).filter((b) => b.length > 0),
            bio,
        };

        if (user && user._id) {
            payload.userId = user._id;
        }

        try {
            const method = user && user._id ? "PATCH" : "POST";
            const res = await fetch("/api/dashboard/users", {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Erreur lors de la soumission");
            } else {
                const data = await res.json();
                onSuccess(data.user);
            }
        } catch (err) {
            setError("Erreur réseau");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div>
                <Label htmlFor="role">Rôle</Label>
                <Select
                    value={role}
                    onValueChange={(value) =>
                        setRole(value as "Apprenti" | "Rédacteur" | "Correcteur" | "Admin")
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Choisir un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Apprenti">Apprenti</SelectItem>
                        <SelectItem value="Rédacteur">Rédacteur</SelectItem>
                        <SelectItem value="Correcteur">Correcteur</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="points">Points</Label>
                <Input
                    id="points"
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    required
                />
            </div>
            <div>
                <Label htmlFor="badges">Badges (séparés par des virgules)</Label>
                <Input
                    id="badges"
                    value={badges}
                    onChange={(e) => setBadges(e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? "En cours..." : user ? "Mettre à jour" : "Créer"}
                </Button>
            </div>
        </form>
    );
}
