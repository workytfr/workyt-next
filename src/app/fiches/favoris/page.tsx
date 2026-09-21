"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/Pagination";
import { FiBookmark, FiArrowLeft } from "react-icons/fi";
import { FaBookmark } from "react-icons/fa";
import { Pencil, Trash2, X, Check, FolderCog, Dumbbell, Flame, MessageCircle } from "lucide-react";
import { SubjectLabel, LevelChip } from "@/components/wk/primitives";
import { FicheStatusChip, ficheExcerpt, ficheStatusTint } from "@/app/fiches/_components/ficheUi";
import ProfileAvatar from "@/components/ui/profile";

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
            <div className="flex min-h-screen items-center justify-center bg-[var(--wk-paper)] px-4">
                <div className="max-w-md rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-8 text-center">
                    <FiBookmark size={40} className="mx-auto mb-4 text-[rgba(26,21,18,0.3)]" />
                    <h2 className="font-serif-display mb-2 text-3xl">Connecte-toi</h2>
                    <p className="mb-6 text-sm text-[rgba(26,21,18,0.6)]">Connecte-toi pour retrouver tes fiches, questions, cours et exercices favoris.</p>
                    <button type="button" onClick={() => window.dispatchEvent(new Event("workyt:open-auth"))} className="wk-btn-ink">
                        Se connecter
                    </button>
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
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            {/* En-tête */}
            <header className="relative mb-8 overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 lg:px-10">
                    <Link href="/fiches" className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(26,21,18,0.55)] transition-colors hover:text-[var(--wk-ink)]">
                        <FiArrowLeft size={16} />
                        <span>Retour aux fiches</span>
                    </Link>
                    <h1 className="font-serif-display mt-6 text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[0.95]">
                        Mes favoris<span className="text-[var(--wk-accent)]">.</span>
                    </h1>
                    <p className="mt-4 text-lg text-[rgba(26,21,18,0.65)]">
                        {totalBookmarks} élément{totalBookmarks > 1 ? "s" : ""} sauvegardé{totalBookmarks > 1 ? "s" : ""}
                    </p>
                </div>
            </header>

            <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-10">
                {/* Filtres par type */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {typeFilters.map((t) => (
                        <button
                            key={t.value || "all"}
                            onClick={() => { setActiveType(t.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeType === t.value
                                    ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-[rgba(26,21,18,0.3)]"
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
                                    ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-[rgba(26,21,18,0.3)]"
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
                                        ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-[rgba(26,21,18,0.3)]"
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
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
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
                            <Link href="/cours"><Button className="bg-[var(--wk-ink)] text-[var(--wk-paper)] rounded-full">Cours</Button></Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((item) => {
                            const isFiche = item.contentType === "fiche";
                            const isForum = item.contentType === "forum";
                            const isCours = item.contentType === "cours";
                            const isExercise = item.contentType === "exercise";
                            const typeLabel = isFiche ? "Fiche" : isForum ? "Question" : isCours ? "Cours" : "Exercice";
                            const level = item.level || item.classLevel;
                            const excerpt = ficheExcerpt(item.content, 160);
                            const image = isCours && item.image ? (typeof item.image === "string" ? item.image : (item.image as any)?.url || "") : "";
                            return (
                                <article
                                    key={item.bookmarkId}
                                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)]"
                                    style={isFiche ? ficheStatusTint(item.status) : undefined}
                                >
                                    {image && (
                                        <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[var(--wk-paper-2)]">
                                            <Image src={image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                                        </div>
                                    )}
                                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                                        <div className="flex items-center gap-2">
                                            {item.subject ? (
                                                <SubjectLabel subject={item.subject} className="min-w-0" />
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--wk-accent)]">
                                                    {isExercise && <Dumbbell className="h-3.5 w-3.5" />}
                                                    {typeLabel}
                                                </span>
                                            )}
                                            {level && <LevelChip level={level} />}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBookmark(item)}
                                                className="relative z-10 ml-auto rounded-full p-1.5 transition hover:bg-[var(--wk-paper-2)]"
                                                title="Retirer des favoris"
                                                aria-label="Retirer des favoris"
                                            >
                                                <FaBookmark size={14} className="text-[var(--wk-accent)]" />
                                            </button>
                                        </div>

                                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                            <span className="rounded-full border border-[rgba(26,21,18,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[rgba(26,21,18,0.65)]">{typeLabel}</span>
                                            {isFiche && <FicheStatusChip status={item.status} />}
                                            {isForum && item.points !== undefined && (
                                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{item.points} pts</span>
                                            )}
                                            {isExercise && item.difficulty && (
                                                <span className="rounded-full bg-[var(--wk-paper-2)] px-2 py-0.5 text-[11px] font-semibold text-[rgba(26,21,18,0.7)]">{item.difficulty}</span>
                                            )}
                                        </div>

                                        <h2 className="font-serif-display mt-3 text-[1.3rem] leading-[1.15] text-[var(--wk-ink)] line-clamp-2">
                                            <Link href={item.href} className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none">
                                                {item.title}
                                            </Link>
                                        </h2>
                                        {excerpt && <p className="mt-2 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3">{excerpt}</p>}

                                        {item.authors && (
                                            <div className="mt-auto flex items-center justify-between gap-2 border-t border-[rgba(26,21,18,0.06)] pt-4">
                                                <Link href={`/compte/${item.authors._id}`} className="relative z-10 flex min-w-0 items-center gap-2">
                                                    <ProfileAvatar
                                                        username={item.authors.username || "Inconnu"}
                                                        points={item.authors.points || 0}
                                                        userId={item.authors._id}
                                                        size="small"
                                                    />
                                                    <span className="truncate text-xs font-semibold text-[rgba(26,21,18,0.7)]">{item.authors.username || "Inconnu"}</span>
                                                </Link>
                                                {isFiche && (
                                                    <div className="flex shrink-0 items-center gap-3 text-xs text-[rgba(26,21,18,0.6)]">
                                                        <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4 text-[var(--wk-accent)]" /> {item.likes ?? 0}</span>
                                                        <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {item.comments ?? 0}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </article>
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
                                                ? "bg-[var(--wk-ink)] text-[var(--wk-paper)] rounded-xl"
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
