"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { FiBookmark } from "react-icons/fi";
import { FaBookmark } from "react-icons/fa";
import { FolderPlus, Check } from "lucide-react";

const NAVBAR_HEIGHT = 70;

type BookmarkType = "fiche" | "forum" | "cours" | "exercise";

interface BookmarkButtonProps {
    revisionId?: string;
    questionId?: string;
    courseId?: string;
    exerciseId?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

interface Collection {
    name: string;
    count: number;
}

function getCheckParam(props: BookmarkButtonProps): string {
    if (props.revisionId) return `revisionId=${props.revisionId}`;
    if (props.questionId) return `questionId=${props.questionId}`;
    if (props.courseId) return `courseId=${props.courseId}`;
    if (props.exerciseId) return `exerciseId=${props.exerciseId}`;
    return "";
}

function getBody(props: BookmarkButtonProps, collection?: string): Record<string, string> {
    const body: Record<string, string> = {};
    if (props.revisionId) body.revisionId = props.revisionId;
    if (props.questionId) body.questionId = props.questionId;
    if (props.courseId) body.courseId = props.courseId;
    if (props.exerciseId) body.exerciseId = props.exerciseId;
    if (collection) body.collection = collection;
    return body;
}

export default function BookmarkButton({
    revisionId,
    questionId,
    courseId,
    exerciseId,
    size = "md",
    className = "",
}: BookmarkButtonProps) {
    const { data: session } = useSession();
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState("Mes favoris");
    const [newCollectionName, setNewCollectionName] = useState("");
    const [creatingNew, setCreatingNew] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const refId = revisionId || questionId || courseId || exerciseId;

    // Recalculer la position au scroll/resize quand le popover est ouvert
    useEffect(() => {
        if (!showPopover || !buttonRef.current || typeof window === "undefined") return;
        const updatePosition = () => {
            if (!buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            const popoverHeight = creatingNew ? 320 : 280;
            const gap = 8;
            const showAbove = rect.top >= popoverHeight + gap + NAVBAR_HEIGHT;
            setPopoverStyle({
                position: "fixed",
                right: window.innerWidth - rect.right,
                width: 224,
                ...(showAbove
                    ? { bottom: window.innerHeight - rect.top + gap }
                    : { top: rect.bottom + gap }),
                zIndex: 9999,
            });
        };
        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [showPopover, creatingNew, collections.length]);
    const checkParam = getCheckParam({ revisionId, questionId, courseId, exerciseId });

    const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

    useEffect(() => {
        if (!session?.accessToken || !refId) return;
        const checkBookmark = async () => {
            try {
                const res = await fetch(`/api/bookmarks/check?${checkParam}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                const data = await res.json();
                if (data.success) {
                    setBookmarked(data.bookmarked);
                    if (data.collection) setSelectedCollection(data.collection);
                }
            } catch {
                // Silencieux
            }
        };
        checkBookmark();
    }, [refId, session?.accessToken, checkParam]);

    // Fermer le popover au clic extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inButton = buttonRef.current?.contains(target);
            const inPopover = popoverRef.current?.contains(target);
            if (!inButton && !inPopover) {
                setShowPopover(false);
                setCreatingNew(false);
                setNewCollectionName("");
            }
        };
        if (showPopover) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPopover]);

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

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session?.accessToken || !refId) return;

        // Si déjà bookmarké, toggle direct (retirer)
        if (bookmarked) {
            if (loading) return;
            setLoading(true);
            const previousState = bookmarked;
            setBookmarked(false);
            try {
                const res = await fetch("/api/bookmarks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify(getBody({ revisionId, questionId, courseId, exerciseId })),
                });
                const data = await res.json();
                if (!data.success) setBookmarked(previousState);
            } catch {
                setBookmarked(previousState);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Pas encore bookmarké → afficher le popover de collection
        fetchCollections();
        if (buttonRef.current && typeof window !== "undefined") {
            const rect = buttonRef.current.getBoundingClientRect();
            const popoverHeight = 280;
            const gap = 8;
            const showAbove = rect.top >= popoverHeight + gap + NAVBAR_HEIGHT;
            setPopoverStyle({
                position: "fixed",
                right: window.innerWidth - rect.right,
                width: 224,
                ...(showAbove
                    ? { bottom: window.innerHeight - rect.top + gap }
                    : { top: rect.bottom + gap }),
                zIndex: 9999,
            });
        }
        setShowPopover(true);
    };

    const handleSaveBookmark = async (collectionName: string) => {
        if (!session?.accessToken || !refId || loading) return;

        setLoading(true);
        try {
            const res = await fetch("/api/bookmarks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(getBody({ revisionId, questionId, courseId, exerciseId }, collectionName)),
            });
            const data = await res.json();
            if (data.success) {
                setBookmarked(true);
                setSelectedCollection(collectionName);
            }
        } catch {
            // Silencieux
        } finally {
            setLoading(false);
            setShowPopover(false);
            setCreatingNew(false);
            setNewCollectionName("");
        }
    };

    const handleCreateAndSave = () => {
        const name = newCollectionName.trim();
        if (name.length > 0 && name.length <= 50) {
            handleSaveBookmark(name);
        }
    };

    if (!session) return null;

    const popoverContent = showPopover && (
        <div
            ref={popoverRef}
            style={popoverStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600">Sauvegarder dans</p>
            </div>

            <div className="max-h-40 overflow-y-auto">
                <button
                    onClick={() => handleSaveBookmark("Mes favoris")}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between"
                >
                    <span>Mes favoris</span>
                    {selectedCollection === "Mes favoris" && <Check className="w-3.5 h-3.5 text-orange-500" />}
                </button>
                {collections
                    .filter((c) => c.name !== "Mes favoris")
                    .map((col) => (
                        <button
                            key={col.name}
                            onClick={() => handleSaveBookmark(col.name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between"
                        >
                            <span className="truncate">{col.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{col.count}</span>
                        </button>
                    ))}
            </div>

            <div className="border-t border-gray-100">
                {creatingNew ? (
                    <div className="p-2 flex gap-1.5">
                        <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateAndSave()}
                            placeholder="Nom..."
                            maxLength={50}
                            autoFocus
                            className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 min-w-0"
                        />
                        <button
                            onClick={handleCreateAndSave}
                            disabled={newCollectionName.trim().length === 0}
                            className="px-2 py-1 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors shrink-0"
                        >
                            OK
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setCreatingNew(true)}
                        className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-2"
                    >
                        <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                        Nouvelle collection
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className="relative">
                <button
                    ref={buttonRef}
                    onClick={handleClick}
                    disabled={loading}
                    className={`transition-all duration-200 ${loading ? "opacity-50" : "hover:scale-110"} ${className}`}
                    title={bookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                    {bookmarked ? (
                        <FaBookmark size={iconSize} className="text-orange-500" />
                    ) : (
                        <FiBookmark size={iconSize} className="text-gray-400 hover:text-orange-400" />
                    )}
                </button>
            </div>
            {typeof document !== "undefined" && showPopover &&
                createPortal(popoverContent, document.body)}
        </>
    );
}
