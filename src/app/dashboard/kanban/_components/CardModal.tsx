"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/Label";
import {
    X, Trash2, Loader2, Link2, Search, BookOpen, MessageCircleQuestion,
    FileCheck, Check, Plus, Archive, ArchiveRestore, Square, CheckSquare, Tag,
    Send, MessageSquare,
} from "lucide-react";
import { PRIORITIES, LINK_TYPES, LABEL_COLORS, type LinkType } from "@/lib/kanban";
import RichTextEditorClientWrapper from "@/components/ui/RichTextEditorClientWrapper";
import Mascot from "@/components/ui/Mascot";
import type { Emotion } from "@/data/mascots";
import KanbanAvatar from "./KanbanAvatar";
import ChecklistRing from "./ChecklistRing";

export interface KanbanMember {
    _id: string;
    username: string;
    image?: string;
    role?: string;
}

export interface KanbanChecklistItem {
    text: string;
    done: boolean;
}

export interface KanbanComment {
    _id?: string;
    kind: "comment" | "activity";
    author?: KanbanMember | string;
    text: string;
    foxy?: string;
    createdAt: string;
}

export interface KanbanCardData {
    _id: string;
    board: string;
    column: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    labels: string[];
    checklist: KanbanChecklistItem[];
    assignees: KanbanMember[];
    link: { type: LinkType; refId?: string; label?: string; url?: string };
    dueDate?: string;
    archived?: boolean;
    source?: { kind: string; refId?: string };
    comments?: KanbanComment[];
    createdBy?: KanbanMember;
}

interface CardModalProps {
    open: boolean;
    board: string;
    members: KanbanMember[];
    initial: KanbanCardData | null;   // null = création
    defaultColumn?: string;
    onClose: () => void;
    onSaved: (card: KanbanCardData) => void;
    onDeleted: (id: string) => void;
}

const LINK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    course: BookOpen,
    forum: MessageCircleQuestion,
    evaluation: FileCheck,
};

export default function CardModal({
    open, board, members, initial, defaultColumn, onClose, onSaved, onDeleted,
}: CardModalProps) {
    const isEdit = !!initial;
    const { data: session } = useSession();
    const myId = (session?.user as any)?.id as string | undefined;
    const myRole = (session?.user as any)?.role as string | undefined;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [labels, setLabels] = useState<string[]>([]);
    const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
    const [newItem, setNewItem] = useState("");
    const [assignees, setAssignees] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState("");
    const [linkType, setLinkType] = useState<LinkType>("none");
    const [link, setLink] = useState<KanbanCardData["link"]>({ type: "none" });
    const [linkQuery, setLinkQuery] = useState("");
    const [linkResults, setLinkResults] = useState<{ id: string; label: string; url: string }[]>([]);
    const [searching, setSearching] = useState(false);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    // Fil d'activité + commentaires
    const [feed, setFeed] = useState<KanbanComment[]>([]);
    const [feedLoading, setFeedLoading] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [posting, setPosting] = useState(false);

    // Initialisation à l'ouverture
    useEffect(() => {
        if (!open) return;
        setError("");
        setLinkQuery("");
        setLinkResults([]);
        setNewItem("");
        if (initial) {
            setTitle(initial.title);
            setDescription(initial.description || "");
            setPriority(initial.priority);
            setLabels(initial.labels || []);
            setChecklist(initial.checklist ? initial.checklist.map((c) => ({ ...c })) : []);
            setAssignees(initial.assignees.map((a) => a._id));
            setDueDate(initial.dueDate ? initial.dueDate.slice(0, 10) : "");
            setLinkType(initial.link?.type || "none");
            setLink(initial.link || { type: "none" });
        } else {
            setTitle("");
            setDescription("");
            setPriority("medium");
            setLabels([]);
            setChecklist([]);
            setAssignees([]);
            setDueDate("");
            setLinkType("none");
            setLink({ type: "none" });
        }
    }, [open, initial]);

    // Chargement du fil (commentaires + activité) en mode édition
    useEffect(() => {
        if (!open) return;
        setFeed([]);
        setCommentText("");
        if (!initial) return;
        let cancelled = false;
        setFeedLoading(true);
        fetch(`/api/kanban/cards/${initial._id}`)
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled && data.card?.comments) setFeed(data.card.comments);
            })
            .finally(() => !cancelled && setFeedLoading(false));
        return () => { cancelled = true; };
    }, [open, initial]);

    // Recherche d'entités liables (debounce)
    useEffect(() => {
        if (!open || linkType === "none") return;
        const handle = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `/api/kanban/link-search?type=${linkType}&q=${encodeURIComponent(linkQuery)}`
                );
                const data = await res.json();
                setLinkResults(data.results || []);
            } catch {
                setLinkResults([]);
            } finally {
                setSearching(false);
            }
        }, 250);
        return () => clearTimeout(handle);
    }, [open, linkType, linkQuery]);

    if (!open) return null;

    const toggleAssignee = (id: string) => {
        setAssignees((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
    };

    const toggleLabel = (id: string) => {
        setLabels((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
    };

    const addChecklistItem = () => {
        const t = newItem.trim();
        if (!t) return;
        setChecklist((prev) => [...prev, { text: t, done: false }]);
        setNewItem("");
    };

    const toggleChecklistItem = (idx: number) => {
        setChecklist((prev) => prev.map((it, i) => (i === idx ? { ...it, done: !it.done } : it)));
    };

    const removeChecklistItem = (idx: number) => {
        setChecklist((prev) => prev.filter((_, i) => i !== idx));
    };

    const doneCount = checklist.filter((c) => c.done).length;

    const postComment = async () => {
        const t = commentText.trim();
        if (!t || !initial || posting) return;
        setPosting(true);
        try {
            const res = await fetch(`/api/kanban/cards/${initial._id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: t }),
            });
            const data = await res.json();
            if (res.ok && data.comment) {
                setFeed((prev) => [...prev, data.comment]);
                setCommentText("");
            }
        } catch {
            /* ignore */
        } finally {
            setPosting(false);
        }
    };

    const deleteComment = async (commentId?: string) => {
        if (!commentId || !initial) return;
        try {
            const res = await fetch(`/api/kanban/cards/${initial._id}/comments/${commentId}`, { method: "DELETE" });
            if (res.ok) setFeed((prev) => prev.filter((c) => c._id !== commentId));
        } catch {
            /* ignore */
        }
    };

    const fmtTime = (iso: string) =>
        new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    const chooseLink = (r: { id: string; label: string; url: string }) => {
        setLink({ type: linkType, refId: r.id, label: r.label, url: r.url });
    };

    const handleLinkTypeChange = (t: LinkType) => {
        setLinkType(t);
        setLinkResults([]);
        setLinkQuery("");
        if (t === "none") setLink({ type: "none" });
        else setLink({ type: t }); // pas encore de cible choisie
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Le titre est requis.");
            return;
        }
        setSaving(true);
        setError("");

        const payload: any = {
            board,
            title: title.trim(),
            description,
            priority,
            labels,
            checklist,
            assignees,
            dueDate: dueDate || null,
            link: linkType === "none" ? { type: "none" } : link,
        };
        if (!isEdit && defaultColumn) payload.column = defaultColumn;

        try {
            const res = await fetch(
                isEdit ? `/api/kanban/cards/${initial!._id}` : "/api/kanban/cards",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Erreur lors de l'enregistrement.");
                return;
            }
            onSaved(data.card);
            onClose();
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        if (!isEdit) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/kanban/cards/${initial!._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ archived: !initial!.archived }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Erreur lors de l'archivage.");
                return;
            }
            // Une carte (dé)archivée quitte/rejoint la vue courante : on la retire localement
            onDeleted(initial!._id);
            onClose();
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEdit || !confirm("Supprimer définitivement cette carte ?")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/kanban/cards/${initial!._id}`, { method: "DELETE" });
            if (res.ok) {
                onDeleted(initial!._id);
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || "Erreur lors de la suppression.");
            }
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {isEdit ? "Modifier la carte" : "Nouvelle carte"}
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="card-title">Titre</Label>
                        <Input
                            id="card-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ex: Corriger les évaluations de maths"
                            autoFocus
                        />
                    </div>

                    <div>
                        <Label>Description</Label>
                        <div className="mt-1">
                            <RichTextEditorClientWrapper content={description} onChange={setDescription} hideImage />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Priorité</Label>
                            <div className="flex gap-1.5 mt-1">
                                {PRIORITIES.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPriority(p.id)}
                                        className={`flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                            priority === p.id
                                                ? "text-white border-transparent shadow-sm"
                                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                                        }`}
                                        style={priority === p.id ? { backgroundColor: p.color } : undefined}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="card-due">Échéance</Label>
                            <Input
                                id="card-due"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Étiquettes */}
                    <div>
                        <Label className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Étiquettes
                        </Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {LABEL_COLORS.map((l) => {
                                const on = labels.includes(l.id);
                                return (
                                    <button
                                        key={l.id}
                                        type="button"
                                        onClick={() => toggleLabel(l.id)}
                                        className="px-2.5 py-1 rounded-lg border text-xs font-medium transition-all"
                                        style={
                                            on
                                                ? { backgroundColor: l.bg, color: l.color, borderColor: l.color }
                                                : { backgroundColor: "#fff", color: "#9ca3af", borderColor: "#e5e7eb" }
                                        }
                                    >
                                        {l.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Checklist / sous-tâches */}
                    <div>
                        <Label className="flex items-center justify-between">
                            <span>Sous-tâches</span>
                            {checklist.length > 0 && (
                                <ChecklistRing done={doneCount} total={checklist.length} size={24} />
                            )}
                        </Label>
                        {checklist.length > 0 && (
                            <div className="mt-1 space-y-1">
                                {checklist.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 group">
                                        <button
                                            type="button"
                                            onClick={() => toggleChecklistItem(idx)}
                                            className="text-gray-400 hover:text-purple-600"
                                        >
                                            {item.done ? (
                                                <CheckSquare className="w-4 h-4 text-purple-600" />
                                            ) : (
                                                <Square className="w-4 h-4" />
                                            )}
                                        </button>
                                        <span className={`flex-1 text-sm ${item.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                                            {item.text}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeChecklistItem(idx)}
                                            className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2 mt-1.5">
                            <Input
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addChecklistItem();
                                    }
                                }}
                                placeholder="Ajouter une sous-tâche…"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" onClick={addChecklistItem} className="rounded-xl px-3">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Assignation */}
                    <div>
                        <Label>Assigné·e·s</Label>
                        {members.length === 0 ? (
                            <p className="text-xs text-gray-400 mt-1">Aucun membre dans cette équipe.</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {members.map((m) => {
                                    const on = assignees.includes(m._id);
                                    return (
                                        <button
                                            key={m._id}
                                            type="button"
                                            onClick={() => toggleAssignee(m._id)}
                                            className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-xs transition-all ${
                                                on
                                                    ? "bg-purple-50 border-purple-300 text-purple-700"
                                                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                                            }`}
                                        >
                                            <KanbanAvatar userId={m._id} username={m.username} size={20} />
                                            {on && <Check className="w-3 h-3" />}
                                            {m.username}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Liaison */}
                    <div>
                        <Label className="flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" /> Lier à
                        </Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {LINK_TYPES.map((lt) => (
                                <button
                                    key={lt.id}
                                    type="button"
                                    onClick={() => handleLinkTypeChange(lt.id)}
                                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                                        linkType === lt.id
                                            ? "bg-gray-800 text-white border-gray-800"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    {lt.label}
                                </button>
                            ))}
                        </div>

                        {linkType !== "none" && (
                            <div className="mt-2">
                                {link.refId && link.label && (
                                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                                        {(() => {
                                            const Icon = LINK_ICONS[linkType] || Link2;
                                            return <Icon className="w-4 h-4 flex-shrink-0" />;
                                        })()}
                                        <span className="flex-1 truncate">{link.label}</span>
                                        <button
                                            onClick={() => setLink({ type: linkType })}
                                            className="text-purple-400 hover:text-purple-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <Input
                                        value={linkQuery}
                                        onChange={(e) => setLinkQuery(e.target.value)}
                                        placeholder="Rechercher…"
                                        className="pl-8"
                                    />
                                </div>
                                {searching && (
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Recherche…
                                    </p>
                                )}
                                {!searching && linkResults.length > 0 && (
                                    <div className="mt-1 border border-gray-100 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
                                        {linkResults.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => chooseLink(r)}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 truncate"
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Fil d'activité + commentaires (édition uniquement) */}
                    {isEdit && (
                        <div className="pt-2 border-t border-gray-100">
                            <Label className="flex items-center gap-1.5 mb-2">
                                <MessageSquare className="w-3.5 h-3.5" /> Activité & commentaires
                            </Label>

                            {feedLoading ? (
                                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                    {feed.length === 0 && (
                                        <p className="text-xs text-gray-400">Aucune activité pour le moment.</p>
                                    )}
                                    {feed.map((c, idx) => {
                                        if (c.kind === "activity") {
                                            return (
                                                <div key={c._id || idx} className="flex items-center gap-1">
                                                    <Mascot
                                                        name="foxy"
                                                        emotion={(c.foxy as Emotion) || "joyeux"}
                                                        message={c.text}
                                                        size="sm"
                                                        float={false}
                                                    />
                                                    <span className="text-[10px] text-gray-300 flex-shrink-0">{fmtTime(c.createdAt)}</span>
                                                </div>
                                            );
                                        }
                                        const author = typeof c.author === "object" ? c.author : null;
                                        const canDelete = (author && author._id === myId) || myRole === "Admin";
                                        return (
                                            <div key={c._id || idx} className="flex items-start gap-2 group">
                                                {author ? (
                                                    <KanbanAvatar userId={author._id} username={author.username} size={28} />
                                                ) : (
                                                    <span className="w-7 h-7 rounded-full bg-gray-100" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-700">{author?.username || "Membre"}</span>
                                                        <span className="text-[10px] text-gray-400">{fmtTime(c.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{c.text}</p>
                                                </div>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => deleteComment(c._id)}
                                                        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex gap-2 mt-3">
                                <Input
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            postComment();
                                        }
                                    }}
                                    placeholder="Écrire un commentaire…"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    onClick={postComment}
                                    disabled={posting || !commentText.trim()}
                                    className="bg-purple-500 text-white rounded-xl px-3"
                                >
                                    {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
                    {isEdit ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleArchive}
                                disabled={saving}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                                {initial!.archived ? (
                                    <><ArchiveRestore className="w-4 h-4" /> Désarchiver</>
                                ) : (
                                    <><Archive className="w-4 h-4" /> Archiver</>
                                )}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Supprimer
                            </button>
                        </div>
                    ) : (
                        <span />
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="rounded-xl">
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !title.trim()}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl px-5 gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {isEdit ? "Enregistrer" : "Créer"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
