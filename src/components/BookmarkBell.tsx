"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bookmark, ChevronLeft, ChevronRight, FileText, MessageSquare, BookOpen, Dumbbell } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface BookmarkItem {
    bookmarkId: string;
    contentType: "fiche" | "forum" | "cours" | "exercise";
    refId: string;
    id: string;
    title: string;
    content?: string;
    subject?: string;
    href: string;
    bookmarkedAt: string;
}

interface BookmarkResponse {
    data: BookmarkItem[];
    pagination: { page: number; totalPages: number; total: number };
}

const ITEMS_PER_PAGE = 8;

export default function BookmarkBell() {
    const { data: session } = useSession();
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const fetchCount = useCallback(async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch("/api/bookmarks/count", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.success) setTotalCount(data.count);
        } catch {
            // Silencieux
        }
    }, [session?.accessToken]);

    const fetchBookmarks = useCallback(async (pageNum: number = 1) => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/bookmarks?page=${pageNum}&limit=${ITEMS_PER_PAGE}`,
                { headers: { Authorization: `Bearer ${session.accessToken}` } }
            );
            const data: { success: boolean; data: BookmarkItem[]; pagination: BookmarkResponse["pagination"] } = await res.json();
            if (data.success) {
                setBookmarks(data.data);
                setTotalPages(data.pagination.totalPages);
                setPage(data.pagination.page);
            }
        } catch {
            setBookmarks([]);
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    useEffect(() => {
        if (session?.accessToken) {
            fetchCount();
        }
    }, [session?.accessToken, fetchCount]);

    const handleOpen = () => {
        if (!isOpen) {
            if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                setPanelPos({
                    top: rect.bottom + 8,
                    right: window.innerWidth - rect.right,
                });
            }
            fetchBookmarks(1);
            fetchCount();
        }
        setIsOpen(!isOpen);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchBookmarks(newPage);
        }
    };

    const getIcon = (type: BookmarkItem["contentType"]) => {
        switch (type) {
            case "fiche":
                return <FileText className="w-4 h-4 text-orange-500" />;
            case "forum":
                return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case "cours":
                return <BookOpen className="w-4 h-4 text-green-500" />;
            case "exercise":
                return <Dumbbell className="w-4 h-4 text-purple-500" />;
            default:
                return <Bookmark className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: BookmarkItem["contentType"]) => {
        switch (type) {
            case "fiche": return "Fiche";
            case "forum": return "Question";
            case "cours": return "Cours";
            case "exercise": return "Exercice";
            default: return "";
        }
    };

    if (!session) return null;

    return (
        <div ref={bellRef}>
            <Button
                ref={btnRef}
                variant="ghost"
                size="sm"
                className="relative"
                onClick={handleOpen}
            >
                <Bookmark className="h-5 w-5" />
                {totalCount > 0 && (
                    <Badge
                        variant="secondary"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-100 text-orange-600"
                    >
                        {totalCount > 99 ? "99+" : totalCount}
                    </Badge>
                )}
            </Button>

            {isOpen && (
                <div
                    className="fixed w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-[200]"
                    style={{ top: panelPos.top, right: panelPos.right }}
                >
                    <div className="flex items-center justify-between p-3 border-b border-gray-100">
                        <h3 className="font-semibold text-sm">Mes favoris</h3>
                        <Link
                            href="/fiches/favoris"
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                            Voir tout
                        </Link>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                Chargement...
                            </div>
                        ) : bookmarks.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                Aucun élément sauvegardé
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {bookmarks.map((item) => (
                                    <Link
                                        key={item.bookmarkId}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className="block p-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getIcon(item.contentType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-medium text-gray-400 uppercase">
                                                        {getTypeLabel(item.contentType)}
                                                    </span>
                                                    {item.subject && (
                                                        <span className="text-[10px] text-gray-400">• {item.subject}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {item.title}
                                                </p>
                                                {item.content && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                        {item.content}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {formatDistanceToNow(new Date(item.bookmarkedAt), {
                                                        addSuffix: true,
                                                        locale: fr,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-2 border-t border-gray-100">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-gray-500">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
