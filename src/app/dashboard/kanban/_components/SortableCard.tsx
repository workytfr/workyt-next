"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    BookOpen, MessageCircleQuestion, FileCheck, CalendarClock, ExternalLink,
    Sparkles, MessageSquare,
} from "lucide-react";
import { PRIORITIES, LABEL_COLORS } from "@/lib/kanban";
import KanbanAvatar from "./KanbanAvatar";
import ChecklistRing from "./ChecklistRing";
import type { KanbanCardData } from "./CardModal";

/** Retire les balises HTML pour un aperçu texte de la description (TipTap). */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

const LINK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    course: BookOpen,
    forum: MessageCircleQuestion,
    evaluation: FileCheck,
};

const LINK_LABELS: Record<string, string> = {
    course: "Cours",
    forum: "Forum",
    evaluation: "Évaluation",
};

interface Props {
    card: KanbanCardData;
    onClick: () => void;
}

export default function SortableCard({ card, onClick }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: card._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const prio = PRIORITIES.find((p) => p.id === card.priority);
    const cardLabels = (card.labels || [])
        .map((id) => LABEL_COLORS.find((l) => l.id === id))
        .filter(Boolean) as typeof LABEL_COLORS;
    const checklist = card.checklist || [];
    const checkDone = checklist.filter((c) => c.done).length;
    const isAuto = !!card.source && card.source.kind !== "manual";
    const commentCount = (card.comments || []).filter((c) => c.kind === "comment").length;
    const descPreview = card.description ? stripHtml(card.description) : "";
    const LinkIcon = card.link?.type && card.link.type !== "none" ? LINK_ICONS[card.link.type] : null;
    const overdue =
        card.dueDate && card.column !== "done" && new Date(card.dueDate) < new Date(new Date().toDateString());

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="group bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-gray-300 cursor-grab active:cursor-grabbing transition-all"
        >
            {/* Étiquettes */}
            {cardLabels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                    {cardLabels.map((l) => (
                        <span
                            key={l.id}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: l.bg, color: l.color }}
                        >
                            {l.label}
                        </span>
                    ))}
                </div>
            )}

            {/* Priorité + lien */}
            <div className="flex items-center gap-1.5 mb-1.5">
                {prio && (
                    <span
                        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: prio.color }}
                        title={`Priorité ${prio.label.toLowerCase()}`}
                    />
                )}
                {LinkIcon && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                        <LinkIcon className="w-3 h-3" />
                        {LINK_LABELS[card.link.type]}
                    </span>
                )}
                {checklist.length > 0 && (
                    <ChecklistRing done={checkDone} total={checklist.length} size={20} />
                )}
                {commentCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500" title="Commentaires">
                        <MessageSquare className="w-3 h-3" />
                        {commentCount}
                    </span>
                )}
                {isAuto && (
                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-auto"
                        title="Carte générée automatiquement"
                    >
                        <Sparkles className="w-3 h-3" />
                        Auto
                    </span>
                )}
            </div>

            <p className="text-sm font-medium text-gray-800 leading-snug">{card.title}</p>

            {descPreview && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{descPreview}</p>
            )}

            {/* Lien cible cliquable */}
            {card.link?.url && card.link.type !== "none" && (
                <a
                    href={card.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-2 text-[11px] text-purple-500 hover:text-purple-700 truncate max-w-full"
                >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{card.link.label || "Ouvrir"}</span>
                </a>
            )}

            {/* Footer : échéance + assignés */}
            {(card.dueDate || card.assignees.length > 0) && (
                <div className="flex items-center justify-between mt-2.5">
                    {card.dueDate ? (
                        <span
                            className={`inline-flex items-center gap-1 text-[11px] ${
                                overdue ? "text-red-500 font-medium" : "text-gray-400"
                            }`}
                        >
                            <CalendarClock className="w-3 h-3" />
                            {new Date(card.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                    ) : (
                        <span />
                    )}
                    <div className="flex -space-x-1.5">
                        {card.assignees.slice(0, 3).map((a) => (
                            <a
                                key={a._id}
                                href={`/compte/${a._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Voir le profil de ${a.username}`}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="hover:z-10 hover:scale-110 transition-transform"
                            >
                                <KanbanAvatar userId={a._id} username={a.username} size={24} />
                            </a>
                        ))}
                        {card.assignees.length > 3 && (
                            <span className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 text-gray-500 text-[9px] font-semibold flex items-center justify-center">
                                +{card.assignees.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
