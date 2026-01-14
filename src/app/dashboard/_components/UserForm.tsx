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
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Info, User, Mail, Award, FileText } from "lucide-react";

interface User {
    _id: string;
    name: string;
    email: string;
    username: string;
    role: "Apprenti" | "Helpeur" | "Rédacteur" | "Correcteur" | "Modérateur" | "Admin";
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
    const isEditing = !!user;

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [username, setUsername] = useState(user?.username || "");
    const [role, setRole] = useState<"Apprenti" | "Helpeur" | "Rédacteur" | "Correcteur" | "Modérateur" | "Admin">(user?.role || "Apprenti");
    const [points, setPoints] = useState(user?.points || 20);
    const [badges, setBadges] = useState(user?.badges?.join(", ") || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validation des champs
        if (!name.trim() || !email.trim() || !username.trim()) {
            setError("Tous les champs obligatoires doivent être remplis.");
            setLoading(false);
            return;
        }

        if (email && !email.includes('@')) {
            setError("L&apos;adresse email n&apos;est pas valide.");
            setLoading(false);
            return;
        }

        if (username.length < 3) {
            setError("Le nom d&apos;utilisateur doit contenir au moins 3 caractères.");
            setLoading(false);
            return;
        }

        const payload: Partial<User> & { userId?: string } = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            username: username.trim().toLowerCase(),
            role,
            points: Math.max(0, points),
            badges: badges.split(",").map((b) => b.trim()).filter((b) => b.length > 0),
            bio: bio.trim(),
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

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erreur lors de la soumission");
                return;
            }

            setSuccess(isEditing ? "Utilisateur mis à jour avec succès !" : "Utilisateur créé avec succès !");
            onSuccess(data.user);
            
            // Réinitialiser le formulaire si c'est une création
            if (!isEditing) {
                setName("");
                setEmail("");
                setUsername("");
                setRole("Apprenti");
                setPoints(20);
                setBadges("");
                setBio("");
            }
        } catch (err) {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages d'erreur et de succès */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            {success && (
                <Alert>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {/* Informations sur la création */}
            {!isEditing && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Un mot de passe temporaire sera généré. L&apos;utilisateur devra le changer lors de sa première connexion.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                        <User className="h-5 w-5" />
                        Informations personnelles
                    </div>
                    
                    <div>
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Prénom Nom"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="utilisateur@exemple.com"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="username">Nom d&apos;utilisateur *</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="nom_utilisateur"
                            required
                        />
                    </div>
                </div>

                {/* Informations du compte */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                        <Award className="h-5 w-5" />
                        Informations du compte
                    </div>
                    
                    <div>
                        <Label htmlFor="role">Rôle *</Label>
                        <Select
                            value={role}
                            onValueChange={(value) =>
                                setRole(value as "Apprenti" | "Helpeur" | "Rédacteur" | "Correcteur" | "Modérateur" | "Admin")
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Apprenti">Apprenti</SelectItem>
                                <SelectItem value="Helpeur">Helpeur</SelectItem>
                                <SelectItem value="Rédacteur">Rédacteur</SelectItem>
                                <SelectItem value="Correcteur">Correcteur</SelectItem>
                                <SelectItem value="Modérateur">Modérateur</SelectItem>
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
                            min="0"
                            placeholder="20"
                        />
                    </div>

                    <div>
                        <Label htmlFor="badges">Badges (séparés par des virgules)</Label>
                        <Input
                            id="badges"
                            value={badges}
                            onChange={(e) => setBadges(e.target.value)}
                            placeholder="Badge1, Badge2, Badge3"
                        />
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4">
                    <FileText className="h-5 w-5" />
                    Biographie
                </div>
                <Label htmlFor="bio">Description</Label>
                <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Une courte description de l&apos;utilisateur..."
                    rows={3}
                />
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="submit" disabled={loading} className="min-w-[120px]">
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isEditing ? "Mise à jour..." : "Création..."}
                        </>
                    ) : (
                        isEditing ? "Mettre à jour" : "Créer"
                    )}
                </Button>
            </div>
        </form>
    );
}
