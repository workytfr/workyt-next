"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/Pagination";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { PiFireSimpleFill } from "react-icons/pi";
import { MdInsertComment, MdInfoOutline } from "react-icons/md";
import { FiBookmark, FiArrowLeft } from "react-icons/fi";
import { FaBookmark } from "react-icons/fa";
import { Pencil, Trash2, X, Check, FolderCog, Dumbbell } from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import { subjectGradients } from "@/data/educationData";
import SubjectIcon from "@/components/fiches/SubjectIcon";

type BookmarkContentType = "fiche" | "forum" | "cours" | "exercise";

interface BookmarkedItem {
    bookmarkId: string;
    contentType: BookmarkContentType;
    refId: string;
    collection: string;
    bookmarkedAt: string;
    id: string;
    title: string;
    content?: string;
    likes?: number;
    comments?: number;
    status?: string;
    level?: string;
    subject?: string;
    classLevel?: string;
    points?: number;
    difficulty?: string;
    createdAt: string;
    authors?: { username: string; points?: number; _id: string; role?: string };
    href: string;
    image?: string;
}

interface Collection {
    name: string;
    count: number;
}

export default function FavorisPage() {
    const { data: session } = useSession();
    const [items, setItems] = useState<BookmarkedItem[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [activeCollection, setActiveCollection] = useState("");
    const [activeType, setActiveType] = useState<BookmarkContentType | "">("");
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    // Collection management state
    const [showCollectionManager, setShowCollectionManager] = useState(false);
    const [renamingCollection, setRenamingCollection] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [deletingCollection, setDeletingCollection] = useState<string | null>(null);
    const [collectionLoading, setCollectionLoading] = useState(false);

    const fetchCollections = async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch("/api/bookmarks/collections", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.success) {
                setCollections(data.data);
            }
        } catch {
            // Silencieux
        }
    };

    const fetchBookmarks = async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: "12",
            });
            if (activeCollection) params.set("collection", activeCollection);
            if (activeType) params.set("contentType", activeType);
            const res = await fetch(`/api/bookmarks?${params}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.success) {
                setItems(data.data);
                setPagination((prev) => ({
                    ...prev,
                    totalPages: data.pagination.totalPages,
                    total: data.pagination.total,
                }));
            }
        } catch {
            // Silencieux
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, [session?.accessToken]);

    useEffect(() => {
        fetchBookmarks();
    }, [session?.accessToken, pagination.page, activeCollection, activeType]);

    const getRemoveBody = (item: BookmarkedItem) => {
        switch (item.contentType) {
            case "fiche": return { revisionId: item.refId };
            case "forum": return { questionId: item.refId };
            case "cours": return { courseId: item.refId };
            case "exercise": return { exerciseId: item.refId };
            default: return { revisionId: item.refId };
        }
    };

    const handleRemoveBookmark = async (item: BookmarkedItem) => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch("/api/bookmarks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(getRemoveBody(item)),
            });
            const data = await res.json();
            if (data.success && !data.bookmarked) {
                setItems((prev) => prev.filter((i) => i.bookmarkId !== item.bookmarkId));
                setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
                fetchCollections();
            }
        } catch {
            // Silencieux
        }
    };

    const handleRenameCollection = async (oldName: string) => {
        if (!session?.accessToken || !renameValue.trim()) return;
        setCollectionLoading(true);
        try {
            const res = await fetch("/api/bookmarks/collections", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ action: "rename", oldName, newName: renameValue.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                if (activeCollection === oldName) setActiveCollection(renameValue.trim());
                fetchCollections();
                fetchBookmarks();
            }
        } catch {
            // Silencieux
        } finally {
            setCollectionLoading(false);
            setRenamingCollection(null);
            setRenameValue("");
        }
    };

    const handleDeleteCollection = async (name: string) => {
        if (!session?.accessToken) return;
        setCollectionLoading(true);
        try {
            const res = await fetch("/api/bookmarks/collections", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ action: "delete", name }),
            });
            const data = await res.json();
            if (data.success) {
                if (activeCollection === name) setActiveCollection("");
                fetchCollections();
                fetchBookmarks();
            }
        } catch {
            // Silencieux
        } finally {
            setCollectionLoading(false);
            setDeletingCollection(null);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page }));
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
                    <FiBookmark size={48} className="mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Connectez-vous</h2>
                    <p className="text-gray-500 mb-4">Connectez-vous pour acceder a vos fiches favorites.</p>
                    <Link href="/connexion">
                        <Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-6">
                            Se connecter
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const totalBookmarks = collections.reduce((sum, c) => sum + c.count, 0);

    const typeFilters: { value: BookmarkContentType | ""; label: string }[] = [
        { value: "", label: "Tous" },
        { value: "fiche", label: "Fiches" },
        { value: "forum", label: "Forum" },
        { value: "cours", label: "Cours" },
        { value: "exercise", label: "Exercices" },
    ];

    const SkeletonCard = () => (
        <div className="flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
            <div className="h-24 bg-gray-200"></div>
            <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div
                className="pt-14 pb-10 px-6 rounded-b-[2rem] shadow-lg mb-8"
                style={{
                    backgroundImage: `linear-gradient(135deg, #FF8C42 0%, #FF5E78 50%, #FF4B6E 100%), url(/noise.webp)`,
                    backgroundSize: "cover, 2%",
                    backgroundBlendMode: "overlay",
                }}
            >
                <div className="max-w-7xl mx-auto">
                    <Link href="/fiches" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                        <FiArrowLeft size={18} />
                        <span>Retour aux fiches</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-white">Mes favoris</h1>
                    <p className="text-white/80 mt-2 text-lg">
                        {totalBookmarks} élément{totalBookmarks > 1 ? "s" : ""} sauvegardé{totalBookmarks > 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-12">
                {/* Filtres par type */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {typeFilters.map((t) => (
                        <button
                            key={t.value || "all"}
                            onClick={() => { setActiveType(t.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeType === t.value
                                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-sm"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Filtres par collection + bouton gérer */}
                {collections.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <button
                            onClick={() => { setActiveCollection(""); setPagination(p => ({ ...p, page: 1 })); }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeCollection === ""
                                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-sm"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                            }`}
                        >
                            Toutes ({totalBookmarks})
                        </button>
                        {collections.map((col) => (
                            <button
                                key={col.name}
                                onClick={() => { setActiveCollection(col.name); setPagination(p => ({ ...p, page: 1 })); }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeCollection === col.name
                                        ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-sm"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                                }`}
                            >
                                {col.name} ({col.count})
                            </button>
                        ))}

                        <button
                            onClick={() => setShowCollectionManager(!showCollectionManager)}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                                showCollectionManager
                                    ? "bg-gray-800 text-white"
                                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                            }`}
                        >
                            <FolderCog className="w-4 h-4" />
                            Gérer
                        </button>
                    </div>
                )}

                {/* Panneau de gestion des collections */}
                {showCollectionManager && collections.length > 0 && (
                    <div className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800 text-sm">Gérer les collections</h3>
                            <button onClick={() => setShowCollectionManager(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {collections.map((col) => (
                                <div key={col.name} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                                    {renamingCollection === col.name ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleRenameCollection(col.name)}
                                                maxLength={50}
                                                autoFocus
                                                className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                                            />
                                            <button
                                                onClick={() => handleRenameCollection(col.name)}
                                                disabled={collectionLoading || !renameValue.trim()}
                                                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setRenamingCollection(null); setRenameValue(""); }}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : deletingCollection === col.name ? (
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-sm text-red-600">
                                                Supprimer &quot;{col.name}&quot; ? Les éléments iront dans &quot;Mes favoris&quot;.
                                            </span>
                                            <button
                                                onClick={() => handleDeleteCollection(col.name)}
                                                disabled={collectionLoading}
                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                            >
                                                Confirmer
                                            </button>
                                            <button
                                                onClick={() => setDeletingCollection(null)}
                                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">{col.name}</span>
                                                <span className="text-xs text-gray-400">{col.count} élément{col.count > 1 ? "s" : ""}</span>
                                            </div>
                                            {col.name !== "Mes favoris" && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => { setRenamingCollection(col.name); setRenameValue(col.name); }}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
                                                        title="Renommer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingCollection(col.name)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grille */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20">
                        <FiBookmark size={56} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">Aucun favori</h3>
                        <p className="text-gray-500 mb-6">Sauvegardez des fiches, questions, cours ou exercices pour les retrouver ici.</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link href="/fiches"><Button variant="outline" className="rounded-full">Fiches</Button></Link>
                            <Link href="/forum"><Button variant="outline" className="rounded-full">Forum</Button></Link>
                            <Link href="/cours"><Button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full">Cours</Button></Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((item) => {
                            const gradient = subjectGradients[item.subject || ""] || "from-gray-500 to-gray-400";
                            const isFiche = item.contentType === "fiche";
                            const isForum = item.contentType === "forum";
                            const isCours = item.contentType === "cours";
                            const isExercise = item.contentType === "exercise";
                            return (
                                <div
                                    key={item.bookmarkId}
                                    className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                                >
                                    {/* En-tete colore */}
                                    <div className={`relative ${isCours && item.image ? "" : isExercise ? "bg-gradient-to-r from-violet-500 to-purple-500" : `bg-gradient-to-r ${gradient}`} p-4 pb-6 min-h-[80px]`}>
                                        {isCours && item.image ? (
                                            <div className="absolute inset-0">
                                                <Image src={typeof item.image === "string" ? item.image : (item.image as any)?.url || ""} alt="" fill className="object-cover opacity-80" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            </div>
                                        ) : null}
                                        <div className="relative z-10">
                                            {isExercise ? (
                                                <Dumbbell className="w-6 h-6 text-white/90" />
                                            ) : (
                                                <SubjectIcon subject={item.subject || "Autre"} size={24} className="text-white/90" />
                                            )}

                                            <button
                                                onClick={() => handleRemoveBookmark(item)}
                                                className="absolute top-0 right-0 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                                                title="Retirer des favoris"
                                            >
                                                <FaBookmark size={14} className="text-orange-500" />
                                            </button>

                                            {isFiche && item.status && item.status !== "Non Certifiée" && (
                                                <div className="absolute top-0 right-12">
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Image
                                                                src={`/badge/${item.status}.svg`}
                                                                alt={`Statut: ${item.status}`}
                                                                width={28}
                                                                height={28}
                                                                className="drop-shadow-md cursor-pointer"
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="flex items-center gap-2">
                                                                <MdInfoOutline size={16} className="text-blue-500" />
                                                                <span>Fiche <strong>{item.status}</strong></span>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {(item.level || item.classLevel) && (
                                                    <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-0.5 rounded-full">
                                                        {item.level || item.classLevel}
                                                    </Badge>
                                                )}
                                                {item.subject && (
                                                    <Badge className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-0.5 rounded-full">
                                                        {item.subject}
                                                    </Badge>
                                                )}
                                                {isForum && item.points !== undefined && (
                                                    <Badge className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                                        {item.points} pts
                                                    </Badge>
                                                )}
                                                {isExercise && item.difficulty && (
                                                    <Badge className="bg-white/90 backdrop-blur-sm text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                                        {item.difficulty}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1 p-4 flex flex-col">
                                        <Link href={item.href} className="flex-1">
                                            <h2 className="text-base font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                                                {item.title}
                                            </h2>
                                            {item.content && (
                                                <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                                                    {item.content}
                                                </p>
                                            )}
                                        </Link>

                                        {item.authors && (
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <Link href={`/compte/${item.authors._id}`} className="flex items-center gap-2 min-w-0">
                                                    <ProfileAvatar
                                                        username={item.authors.username || "Inconnu"}
                                                        points={item.authors.points || 0}
                                                        userId={item.authors._id}
                                                        size="small"
                                                    />
                                                    <span className="text-xs text-gray-600 truncate">
                                                        {item.authors.username || "Inconnu"}
                                                    </span>
                                                </Link>
                                                {isFiche && (
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                                                        <div className="flex items-center gap-1">
                                                            <PiFireSimpleFill className="text-orange-400" size={14} />
                                                            <span>{item.likes ?? 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <MdInsertComment className="text-blue-400" size={14} />
                                                            <span>{item.comments ?? 0}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {items.length > 0 && pagination.totalPages > 1 && (
                    <div className="mt-10">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={pagination.page > 1 ? "#" : undefined}
                                        onClick={pagination.page > 1 ? () => handlePageChange(pagination.page - 1) : undefined}
                                        className={pagination.page === 1 ? "opacity-50 pointer-events-none" : ""}
                                    />
                                </PaginationItem>
                                {[...Array(pagination.totalPages)].map((_, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            href="#"
                                            isActive={index + 1 === pagination.page}
                                            onClick={() => handlePageChange(index + 1)}
                                            className={index + 1 === pagination.page
                                                ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl"
                                                : "rounded-xl"}
                                        >
                                            {index + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href={pagination.page < pagination.totalPages ? "#" : undefined}
                                        onClick={pagination.page < pagination.totalPages ? () => handlePageChange(pagination.page + 1) : undefined}
                                        className={pagination.page === pagination.totalPages ? "opacity-50 pointer-events-none" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    );
}
