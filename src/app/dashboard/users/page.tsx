"use client";

import React, { useState, useEffect, useCallback } from "react";
import "../styles/dashboard-theme.css";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Loader2, Download, Filter, Users, TrendingUp, Award } from "lucide-react";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { Info, Calendar, Mail, User, Shield } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import UserForm from "../_components/UserForm";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/Accordion";
import AdvancedPagination from "@/components/ui/AdvancedPagination";
import AdvancedSearch from "@/components/ui/AdvancedSearch";
import UserStats from "@/components/ui/UserStats";

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

interface SearchFilters {
    query: string;
    role: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    hasBadges: boolean;
    minPoints: number;
    maxPoints: number;
}

interface Stats {
    roles: {
        apprenti: number;
        redacteur: number;
        correcteur: number;
        admin: number;
    };
    withBadges: number;
    points: {
        minPoints: number;
        maxPoints: number;
        avgPoints: number;
    };
}

// Accès et permissions par rôle (basé sur l'analyse du code)
const ROLE_ACCESS: Record<string, string[]> = {
    Apprenti: [
        "Création de fiches de révision (statut Non Certifiée)",
        "Cours, quiz, fiches : lecture et utilisation",
        "Forum : poser des questions, répondre",
        "Profil, points, badges",
        "Pas d'accès au dashboard",
    ],
    Helpeur: [
        "Dashboard : vue d'ensemble, stats, exercices, quiz, certificats",
        "Fiches : création (Certifiée auto), modification, changement de statut",
        "Exercices et quiz : création et modification",
        "Forum : valider les réponses des autres",
        "Upload de fichiers",
        "Pas : cours, leçons, sections — Pas : Utilisateurs, Partenaires, Statistiques, Modération, suppression de cours",
    ],
    Rédacteur: [
        "Tous les accès Helpeur",
        "Cours, leçons, sections : création et modification (ses contenus)",
        "Réordonnancement des sections et leçons",
        "Pas : suppression de cours/leçons/sections — Pas : MaitreRenardAI (Admin uniquement)",
    ],
    Correcteur: [
        "Tous les accès Rédacteur",
        "Modification des leçons et contenus des autres (pas seulement les siens)",
        "Changement du statut des leçons (validation)",
        "Pas : suppression (réservée Admin)",
    ],
    Modérateur: [
        "Dashboard : accès complet au menu",
        "Modération : voir et traiter les signalements (reports)",
        "Section Modération du dashboard",
        "Pas : création de cours, leçons, sections, exercices, quiz",
        "Fiches : peut créer (Non Certifiée) mais pas modifier celles des autres",
    ],
    Admin: [
        "Accès total à la plateforme",
        "Suppression de cours, leçons, sections",
        "Gestion utilisateurs, Partenaires, Statistiques",
        "Certificats : création et génération PDF",
        "Génération de cours avec MaitreRenardAI (PDF → cours structuré)",
        "Modifier le profil de tout utilisateur",
    ],
};

export default function UsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [stats, setStats] = useState<Stats | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        role: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
        hasBadges: false,
        minPoints: 0,
        maxPoints: 999999
    });

    // Gestion du Toast
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default");

    const showToast = ({
                           title,
                           variant,
                       }: {
        title: string;
        variant?: "default" | "destructive";
    }) => {
        setToastMessage(title);
        setToastVariant(variant || "default");
        setToastOpen(true);
        setTimeout(() => setToastOpen(false), 3000);
    };

    const buildApiUrl = useCallback(() => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: itemsPerPage.toString(),
            search: filters.query,
            role: filters.role === "all" ? "" : filters.role,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            hasBadges: filters.hasBadges.toString(),
            minPoints: filters.minPoints.toString(),
            maxPoints: filters.maxPoints.toString(),
        });
        return `/api/dashboard/users?${params.toString()}`;
    }, [page, itemsPerPage, filters]);

    // Chargement des utilisateurs avec pagination et filtres
    useEffect(() => {
        async function fetchUsers() {
            if (!session?.accessToken) return;
            setLoading(true);
            try {
                const res = await fetch(buildApiUrl(), {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!res.ok) {
                    throw new Error(await res.text());
                }

                const data = await res.json();
                setUsers(data.users || []);
                setTotalUsers(data.total || 0);
                setTotalPages(data.totalPages || 0);
                setStats(data.stats || null);
            } catch (error) {
                console.error("Erreur lors du chargement des utilisateurs :", error);
                showToast({ title: "Erreur de chargement", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, [buildApiUrl, session?.accessToken]);

    // Callback lors de la mise à jour ou création d'un utilisateur
    const handleUserUpdate = (updatedUser: User) => {
        setUsers((prev) =>
            prev.map((user) =>
                user._id === updatedUser._id ? updatedUser : user
            )
        );
        setDialogOpen(false);
        showToast({ title: "Utilisateur mis à jour" });
    };

    // Gestion de la modification du rôle via le Select
    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!session?.accessToken) return;

        try {
            const res = await fetch("/api/dashboard/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ userId, role: newRole }),
            });

            if (!res.ok) {
                const data = await res.json();
                console.error("Erreur lors de la mise à jour du rôle :", data.error);
                showToast({ title: "Erreur de mise à jour", variant: "destructive" });
                return;
            }

            const { user: updatedUser } = await res.json();
            setUsers((prev) =>
                prev.map((user) =>
                    user._id === userId ? updatedUser : user
                )
            );
            showToast({ title: "Rôle mis à jour" });
        } catch (err) {
            console.error("Erreur réseau :", err);
            showToast({ title: "Erreur réseau", variant: "destructive" });
        }
    };

    // Gestion des filtres
    const handleFiltersChange = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        setPage(1); // Retour à la première page lors du changement de filtres
    };

    // Gestion de la pagination
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setPage(1); // Retour à la première page
    };

    // Export des données
    const handleExport = () => {
        const csvContent = [
            ['Nom', 'Email', 'Username', 'Rôle', 'Points', 'Badges', 'Bio', 'Date de création'],
            ...users.map(user => [
                user.name,
                user.email,
                user.username,
                user.role,
                user.points.toString(),
                user.badges.join(', '),
                user.bio || '',
                new Date(user.createdAt).toLocaleDateString('fr-FR')
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ToastProvider>
            <div className="space-y-6">
                {/* En-tête avec statistiques */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
                        <p className="text-gray-600">Gérez les utilisateurs de la plateforme</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport} disabled={loading}>
                            <Download className="mr-2 h-4 w-4" />
                            Exporter
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setSelectedUser(null)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Ajouter un utilisateur
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl w-full">
                                <DialogHeader>
                                    <DialogTitle>
                                        {selectedUser ? "Modifier l'utilisateur" : "Ajouter un nouvel utilisateur"}
                                    </DialogTitle>
                                </DialogHeader>
                                <UserForm user={selectedUser} onSuccess={handleUserUpdate} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Statistiques détaillées */}
                {stats && (
                    <UserStats stats={stats} totalUsers={totalUsers} />
                )}

                {/* Barre de recherche et filtres */}
                <AdvancedSearch
                    onFiltersChange={handleFiltersChange}
                    isLoading={loading}
                    totalResults={totalUsers}
                />

                {/* Référence des accès par rôle */}
                <div className="bg-white rounded-lg shadow">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="role-access" className="border-b-0">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <span className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-gray-600" />
                                    Accès et permissions par rôle
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(ROLE_ACCESS).map(([role, accesses]) => (
                                        <div
                                            key={role}
                                            className="rounded-lg border border-gray-200 p-4 bg-gray-50/50"
                                        >
                                            <h4 className="font-semibold text-gray-900 mb-2">{role}</h4>
                                            <ul className="space-y-1 text-sm text-gray-600">
                                                {accesses.map((access, idx) => (
                                                    <li key={idx} className="flex gap-2">
                                                        <span className="text-gray-400">•</span>
                                                        <span>{access}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Table des utilisateurs */}
                <div className="bg-white rounded-lg shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Badges</TableHead>
                                <TableHead>Bio</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                        <p className="mt-2 text-gray-500">Chargement des utilisateurs...</p>
                                    </TableCell>
                                </TableRow>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <ProfileAvatar
                                                        username={user.username}
                                                        userId={user._id}
                                                        role={user.role}
                                                        size="small"
                                                        showPoints={false}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.username}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm">
                                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                                    {user.email}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={user.role}
                                                onValueChange={(newRole) => handleRoleChange(user._id, newRole)}
                                                disabled={loading}
                                            >
                                                <SelectTrigger className="w-[140px]">
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
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <span className="font-medium">{user.points}</span>
                                                <span className="text-sm text-gray-500 ml-1">pts</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.badges && user.badges.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.badges.slice(0, 3).map((badge, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {badge}
                                                        </Badge>
                                                    ))}
                                                    {user.badges.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{user.badges.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Aucun badge</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.bio ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-pointer">
                                                            <Info className="w-4 h-4 text-gray-600" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs p-2 text-sm">
                                                        {user.bio}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setDialogOpen(true);
                                                }}
                                                disabled={loading}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <div className="text-gray-500">
                                            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>Aucun utilisateur trouvé</p>
                                            <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination avancée */}
                {totalPages > 1 && (
                    <AdvancedPagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalUsers}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        isLoading={loading}
                    />
                )}
            </div>

            {/* Affichage du Toast */}
            <ToastViewport>
                {toastOpen && (
                    <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastVariant}>
                        <ToastTitle>{toastMessage}</ToastTitle>
                        <ToastClose />
                    </Toast>
                )}
            </ToastViewport>
        </ToastProvider>
    );
}
