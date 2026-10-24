"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import TimeAgo from "@/components/ui/TimeAgo";
import ReportModal from "@/components/ReportModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Loader2, Crown, Pin, PinOff, Pencil, Flag, ThumbsUp, Reply } from "lucide-react";
import { COMMENT_KIND_OPTIONS, type CommentDTO } from "@/lib/comments";
import CommentContent from "./CommentContent";
import CommentForm, { AutoTextarea, DraftStatus, useCommentDraft } from "./CommentForm";

/** Ouvre la fenêtre de connexion de la navbar */
const openAuth = () => window.dispatchEvent(new Event("workyt:open-auth"));

const KIND_STYLES: Record<string, string> = {
    question: "bg-[rgba(110,193,228,0.18)] text-[#1f6f8f]",
    erreur: "bg-[rgba(220,38,38,0.08)] text-red-700",
    merci: "bg-[rgba(126,217,87,0.2)] text-[#3a7a1f]",
};

interface CommentItemProps {
    comment: CommentDTO;
    revisionId: string;
    ficheAuthorId?: string;
    isReply?: boolean;
    canPin?: boolean;
    /** Commentaire à mettre en évidence (lien direct, commentaire tout juste posté) */
    highlightId?: string | null;
    /** Met à jour ce commentaire (ou une réponse) dans la liste */
    onUpdate: (id: string, patch: Partial<CommentDTO>) => void;
    onDeleted: (comment: CommentDTO) => void;
    onPinChange?: (id: string, pinned: boolean) => void;
    onReplyPosted?: (reply: CommentDTO) => void;
    /** Réponse à une réponse : on ouvre le formulaire du fil, avec la mention */
    onReplyTo?: (username: string) => void;
}

export default function CommentItem({
    comment,
    revisionId,
    ficheAuthorId,
    isReply = false,
    canPin = false,
    highlightId = null,
    onUpdate,
    onDeleted,
    onPinChange,
    onReplyPosted,
    onReplyTo,
}: CommentItemProps) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken as string | undefined;
    const currentUserId = (session?.user as any)?.id as string | undefined;
    const isOwn = !!currentUserId && currentUserId === comment.userId;
    const isFicheAuthor = !!ficheAuthorId && comment.userId === ficheAuthorId;
    const highlighted = !!highlightId && highlightId === comment.id;

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const edit = useCommentDraft(comment.content);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [liking, setLiking] = useState(false);
    const [reply, setReply] = useState<{ open: boolean; prefill: string; key: number }>({ open: false, prefill: "", key: 0 });

    const kind = COMMENT_KIND_OPTIONS.find((k) => k.value === comment.kind);
    const showKind = !isReply && comment.kind !== "avis" && kind;
    const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` };

    const openReply = (username?: string) => {
        if (!session) return openAuth();
        setReply((r) => ({ open: true, prefill: username ? `@${username} ` : "", key: r.key + 1 }));
    };

    const toggleLike = async () => {
        if (!session) return openAuth();
        if (isOwn || liking) return;
        const prev = { liked: comment.liked, likes: comment.likes };
        // Optimiste : on met à jour tout de suite, on corrige avec la réponse
        onUpdate(comment.id, { liked: !prev.liked, likes: prev.likes + (prev.liked ? -1 : 1) });
        setLiking(true);
        try {
            const res = await fetch(`/api/comment/${comment.id}/like`, { method: "POST", headers: authHeaders });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Action impossible.");
            onUpdate(comment.id, { liked: data.liked, likes: data.likes });
        } catch (err: any) {
            onUpdate(comment.id, prev);
            toast.error(err.message);
        } finally {
            setLiking(false);
        }
    };

    const saveEdit = async () => {
        if (!edit.valid || saving) return;
        setSaving(true);
        setEditError(null);
        try {
            const res = await fetch(`/api/comment/${comment.id}`, {
                method: "PATCH",
                headers: authHeaders,
                body: JSON.stringify({ content: edit.trimmed }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Modification impossible.");
            onUpdate(comment.id, { content: data.content, editedAt: data.editedAt });
            setEditing(false);
        } catch (err: any) {
            setEditError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePin = async () => {
        const pinned = !comment.pinned;
        try {
            const res = await fetch(`/api/comment/${comment.id}`, {
                method: "PATCH",
                headers: authHeaders,
                body: JSON.stringify({ pinned }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Action impossible.");
            onPinChange?.(comment.id, pinned);
            toast.success(pinned ? "Commentaire épinglé en haut de la discussion" : "Commentaire désépinglé");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/comment/${comment.id}`, { method: "DELETE", headers: authHeaders });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Suppression impossible.");
            onDeleted(comment);
        } catch (err: any) {
            toast.error(err.message);
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    // Le serveur revérifie le délai de modification à l'enregistrement
    const canEditNow = comment.canEdit;
    const canReport = !!session && !isOwn;
    const hasMenu = canEditNow || (canPin && !isReply) || canReport || comment.canDelete;

    return (
        <div
            id={`comment-${comment.id}`}
            className={`scroll-mt-28 ${isReply ? "pt-4" : "py-5"} ${
                highlighted ? "rounded-2xl bg-[rgba(255,106,26,0.06)] px-3 -mx-3 transition-colors" : ""
            }`}
        >
            {!isReply && comment.pinned && (
                <p className="mb-2 ml-[52px] inline-flex items-center gap-1.5 text-xs font-medium text-[var(--wk-accent)]">
                    <Pin size={12} /> Épinglé par l&apos;auteur de la fiche
                </p>
            )}

            <div className="flex gap-3">
                <Link href={`/compte/${comment.userId}`} className="shrink-0">
                    <ProfileAvatar username={comment.username} showPoints={false} userId={comment.userId ?? undefined} size={isReply ? "small" : "medium"} />
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`/compte/${comment.userId}`}>
                            <UsernameDisplay
                                username={comment.username}
                                userId={comment.userId ?? undefined}
                                className="cursor-pointer text-sm font-semibold hover:underline"
                            />
                        </Link>

                        {isFicheAuthor && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,106,26,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c2410c]">
                                <Crown size={10} /> Auteur
                            </span>
                        )}

                        {showKind && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_STYLES[comment.kind] ?? ""}`}>
                                <span aria-hidden>{kind.emoji}</span> {kind.label}
                            </span>
                        )}

                        <span className="text-xs text-[rgba(26,21,18,0.45)]">
                            <TimeAgo date={comment.createdAt} />
                            {comment.editedAt && <span title={new Date(comment.editedAt).toLocaleString("fr-FR")}> · modifié</span>}
                        </span>

                        {hasMenu && (
                            <div className="ml-auto">
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[rgba(26,21,18,0.4)] transition hover:bg-[rgba(26,21,18,0.06)] hover:text-[var(--wk-ink)]"
                                            aria-label="Options du commentaire"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-[190px]">
                                        {canEditNow && (
                                            <DropdownMenuItem onSelect={() => { edit.setContent(comment.content); setEditing(true); }}>
                                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                                            </DropdownMenuItem>
                                        )}
                                        {canPin && !isReply && (
                                            <DropdownMenuItem onSelect={togglePin}>
                                                {comment.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                                {comment.pinned ? "Désépingler" : "Épingler en haut"}
                                            </DropdownMenuItem>
                                        )}
                                        {canReport && (
                                            <DropdownMenuItem onSelect={() => setReportOpen(true)}>
                                                <Flag className="mr-2 h-4 w-4" /> Signaler
                                            </DropdownMenuItem>
                                        )}
                                        {comment.canDelete && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    {editing ? (
                        <div className="mt-2 space-y-2">
                            <AutoTextarea
                                value={edit.content}
                                onChange={edit.setContent}
                                onSubmitShortcut={() => void saveEdit()}
                                autoFocus
                                aria-label="Modifier le commentaire"
                            />
                            <div className="flex items-center justify-between gap-3">
                                <DraftStatus length={edit.content.length} tooLong={edit.tooLong} tooShort={edit.tooShort} error={editError} />
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setEditing(false); setEditError(null); }}
                                        className="rounded-full px-3 py-1.5 text-sm text-[rgba(26,21,18,0.6)] hover:bg-[rgba(26,21,18,0.05)]"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void saveEdit()}
                                        disabled={!edit.valid || saving}
                                        className="wk-btn-ink !py-1.5 text-sm disabled:opacity-40"
                                    >
                                        {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-1">
                            <CommentContent content={comment.content} />
                        </div>
                    )}

                    {confirmDelete && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm">
                            <span className="flex-1 text-red-800">
                                {!isReply && (comment.replies?.length ?? 0) > 0
                                    ? "Supprimer ce commentaire et ses réponses ?"
                                    : "Supprimer ce commentaire ?"}
                            </span>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting && <Loader2 size={12} className="animate-spin" />} Supprimer
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                disabled={deleting}
                                className="rounded-full px-3 py-1 text-xs text-red-800 hover:bg-red-100"
                            >
                                Annuler
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    {!editing && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                            <button
                                type="button"
                                onClick={toggleLike}
                                disabled={isOwn}
                                aria-pressed={comment.liked}
                                title={isOwn ? "Les autres peuvent marquer ton commentaire comme utile" : "Ce commentaire m'a aidé"}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition ${
                                    comment.liked
                                        ? "bg-[rgba(255,106,26,0.12)] text-[#c2410c]"
                                        : "text-[rgba(26,21,18,0.55)] hover:bg-[rgba(26,21,18,0.05)] disabled:hover:bg-transparent"
                                }`}
                            >
                                <ThumbsUp size={13} className={comment.liked ? "fill-current" : ""} />
                                Utile{comment.likes > 0 && <span className="tabular-nums">· {comment.likes}</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => (isReply ? onReplyTo?.(comment.username) : openReply())}
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[rgba(26,21,18,0.55)] transition hover:bg-[rgba(26,21,18,0.05)]"
                            >
                                <Reply size={13} /> Répondre
                            </button>
                        </div>
                    )}

                    {/* Réponses (un seul niveau) */}
                    {!isReply && ((comment.replies?.length ?? 0) > 0 || reply.open) && (
                        <div className="mt-1 border-l-2 border-[rgba(26,21,18,0.07)] pl-4">
                            {comment.replies?.map((r) => (
                                <CommentItem
                                    key={r.id}
                                    comment={r}
                                    revisionId={revisionId}
                                    ficheAuthorId={ficheAuthorId}
                                    isReply
                                    highlightId={highlightId}
                                    onUpdate={onUpdate}
                                    onDeleted={onDeleted}
                                    onReplyTo={openReply}
                                />
                            ))}
                            {reply.open && (
                                <div className="pt-4">
                                    <CommentForm
                                        key={reply.key}
                                        revisionId={revisionId}
                                        parentId={comment.id}
                                        initialContent={reply.prefill}
                                        autoFocus
                                        onCancel={() => setReply((r) => ({ ...r, open: false }))}
                                        onPosted={(posted) => {
                                            onReplyPosted?.(posted);
                                            setReply((r) => ({ ...r, open: false }));
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {canReport && (
                <ReportModal contentId={comment.id} contentType="fiche_comment" open={reportOpen} onOpenChange={setReportOpen} />
            )}
        </div>
    );
}
