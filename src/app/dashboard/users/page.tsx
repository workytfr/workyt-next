"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, Loader2 } from "lucide-react";
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
import { Info } from "lucide-react";
import UserForm from "../_components/UserForm";

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

export default function UsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const limit = 10; // Nombre d'éléments par page

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

    // Chargement des utilisateurs avec pagination
    useEffect(() => {
        async function fetchUsers() {
            if (!session?.accessToken) return;
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/dashboard/users?search=${search}&page=${page}&limit=${limit}`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error(await res.text());
                }

                const data = await res.json();
                setUsers(data.users || []);
                setTotalUsers(data.total || 0);
            } catch (error) {
                console.error("Erreur lors du chargement des utilisateurs :", error);
                showToast({ title: "Erreur de chargement" });
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, [search, page, session?.accessToken]);

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

    return (
        <ToastProvider>
            <div>
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
                    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setSelectedUser(null)}>
                                <Pencil className="mr-2" /> Ajouter / Modifier un utilisateur
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

                {/* Barre de recherche */}
                <div className="flex gap-4 mb-4">
                    <Input
                        placeholder="Rechercher un utilisateur..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table des utilisateurs */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Username</TableHead>
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
                                <TableCell colSpan={8} className="text-center">
                                    <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.role}
                                            onValueChange={(newRole) => handleRoleChange(user._id, newRole)}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Choisir un rôle" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Apprenti">Apprenti</SelectItem>
                                                <SelectItem value="Rédacteur">Rédacteur</SelectItem>
                                                <SelectItem value="Correcteur">Correcteur</SelectItem>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{user.points}</TableCell>
                                    <TableCell>
                                        {user.badges && user.badges.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {user.badges.map((badge, idx) => (
                                                    <Badge key={idx}>{badge}</Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span>Aucun badge</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {user.bio ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
        <span>
          <Info className="w-4 h-4 text-gray-600 cursor-pointer" />
        </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs p-2 text-sm">
                                                    {user.bio}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </TableCell>                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-gray-500">
                                    Aucun utilisateur trouvé
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex justify-center mt-4 gap-4">
                    <Button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
                        Précédent
                    </Button>
                    <span>Page {page}</span>
                    <Button
                        onClick={() => setPage((prev) => (prev * limit < totalUsers ? prev + 1 : prev))}
                        disabled={page * limit >= totalUsers}
                    >
                        Suivant
                    </Button>
                </div>
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
