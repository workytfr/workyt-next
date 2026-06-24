"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    closestCorners, type DragStartEvent, type DragOverEvent, type DragEndEvent,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, KanbanSquare, Loader2, Search, X, Archive, RefreshCw, Sparkles } from "lucide-react";
import {
    BOARDS, COLUMNS, getAccessibleBoards, PRIORITIES, LABEL_COLORS, WIP_LIMITS,
    boardIsAuto, type ColumnId,
} from "@/lib/kanban";
import SortableCard from "./_components/SortableCard";
import BoardLegend from "./_components/BoardLegend";
import CardModal, { type KanbanCardData, type KanbanMember } from "./_components/CardModal";

type ColumnsState = Record<ColumnId, KanbanCardData[]>;

function emptyColumns(): ColumnsState {
    return COLUMNS.reduce((acc, c) => ({ ...acc, [c.id]: [] }), {} as ColumnsState);
}

// ─── Colonne droppable ─────────────────────────────────────────────────────────

function Column({
    id, label, color, cards, totalCount, wipLimit, onAdd, onCardClick,
}: {
    id: ColumnId;
    label: string;
    color: string;
    cards: KanbanCardData[];
    totalCount: number;
    wipLimit?: number;
    onAdd: () => void;
    onCardClick: (card: KanbanCardData) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });
    const overLimit = wipLimit !== undefined && totalCount > wipLimit;

    return (
        <div className="flex flex-col w-full min-w-[260px] bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span
                        className={`text-xs rounded-full px-1.5 ${
                            overLimit ? "bg-amber-100 text-amber-700 font-medium" : "text-gray-400 bg-gray-200/60"
                        }`}
                        title={wipLimit !== undefined ? `Limite conseillée : ${wipLimit}` : undefined}
                    >
                        {totalCount}{wipLimit !== undefined ? `/${wipLimit}` : ""}
                    </span>
                </div>
                <button onClick={onAdd} className="p-1 text-gray-400 hover:text-purple-600 transition-colors" title="Ajouter une carte">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 px-2.5 pb-2.5 space-y-2 min-h-[120px] rounded-b-2xl transition-colors ${
                    isOver ? "bg-purple-50/60" : ""
                }`}
            >
                <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <SortableCard key={card._id} card={card} onClick={() => onCardClick(card)} />
                    ))}
                </SortableContext>

                {cards.length === 0 && (
                    <button
                        onClick={onAdd}
                        className="w-full py-3 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                    >
                        + Ajouter une carte
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function KanbanPage() {
    const { data: session, status } = useSession();
    const role = (session?.user as any)?.role as string | undefined;

    const accessible = useMemo(() => getAccessibleBoards(role), [role]);
    const [board, setBoard] = useState<string>("");
    const [columns, setColumns] = useState<ColumnsState>(emptyColumns());
    const [members, setMembers] = useState<KanbanMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<KanbanCardData | null>(null);
    const [createColumn, setCreateColumn] = useState<ColumnId>("todo");

    // Filtres
    const [search, setSearch] = useState("");
    const [fPriority, setFPriority] = useState("");
    const [fLabel, setFLabel] = useState("");
    const [onlyMine, setOnlyMine] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    const myId = (session?.user as any)?.id as string | undefined;
    const hasFilters = !!(search || fPriority || fLabel || onlyMine);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    // Board par défaut = premier accessible
    useEffect(() => {
        if (accessible.length > 0 && !board) setBoard(accessible[0]);
    }, [accessible, board]);

    // Chargement des cartes + membres du board
    useEffect(() => {
        if (!board) return;
        let cancelled = false;
        setLoading(true);

        const cardsUrl = `/api/kanban/cards?board=${encodeURIComponent(board)}${showArchived ? "&archived=1" : ""}`;
        Promise.all([
            fetch(cardsUrl).then((r) => r.json()),
            fetch(`/api/kanban/members?board=${encodeURIComponent(board)}`).then((r) => r.json()),
        ])
            .then(([cardsData, membersData]) => {
                if (cancelled) return;
                const next = emptyColumns();
                for (const card of (cardsData.cards || []) as KanbanCardData[]) {
                    const col = (card.column as ColumnId) in next ? (card.column as ColumnId) : "todo";
                    next[col].push(card);
                }
                setColumns(next);
                setMembers(membersData.members || []);
            })
            .finally(() => !cancelled && setLoading(false));

        return () => { cancelled = true; };
    }, [board, showArchived, reloadKey]);

    // Auto-création des cartes (évaluations à corriger, questions forum, cours à vérifier…)
    const syncAndReload = useCallback(async (silent: boolean) => {
        if (!board || !boardIsAuto(board)) return;
        setSyncing(true);
        try {
            const res = await fetch("/api/kanban/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ board }),
            });
            const data = await res.json();
            if (!silent && res.ok) {
                setSyncMsg(`${data.created || 0} carte(s) créée(s) · ${data.resolved || 0} terminée(s)`);
                setTimeout(() => setSyncMsg(""), 4000);
            }
            setReloadKey((k) => k + 1);
        } catch {
            /* sync silencieuse : on ignore les erreurs réseau */
        } finally {
            setSyncing(false);
        }
    }, [board]);

    // Synchronisation auto à l'ouverture d'un board concerné
    useEffect(() => {
        if (board && boardIsAuto(board)) syncAndReload(true);
    }, [board, syncAndReload]);

    // Application des filtres (vue dérivée, sans toucher à l'état source)
    const matchesFilters = (c: KanbanCardData): boolean => {
        if (fPriority && c.priority !== fPriority) return false;
        if (fLabel && !(c.labels || []).includes(fLabel)) return false;
        if (onlyMine && !(c.assignees || []).some((a) => a._id === myId)) return false;
        if (search) {
            const q = search.toLowerCase();
            const inText =
                c.title.toLowerCase().includes(q) ||
                (c.description || "").toLowerCase().includes(q) ||
                (c.link?.label || "").toLowerCase().includes(q);
            if (!inText) return false;
        }
        return true;
    };

    const displayColumns = useMemo(() => {
        const out = emptyColumns();
        for (const col of COLUMNS) out[col.id] = columns[col.id].filter(matchesFilters);
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns, search, fPriority, fLabel, onlyMine, myId]);

    const findContainer = (id: string): ColumnId | null => {
        if (id in columns) return id as ColumnId;
        for (const col of COLUMNS) {
            if (columns[col.id].some((c) => c._id === id)) return col.id;
        }
        return null;
    };

    const activeCard = activeId
        ? Object.values(columns).flat().find((c) => c._id === activeId) || null
        : null;

    const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

    const handleDragOver = (e: DragOverEvent) => {
        const { active, over } = e;
        if (!over) return;
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over.id as string);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setColumns((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex((c) => c._id === active.id);
            if (activeIndex === -1) return prev;
            const moved = activeItems[activeIndex];

            const overIndex = overItems.findIndex((c) => c._id === over.id);
            const insertAt = overIndex === -1 ? overItems.length : overIndex;

            return {
                ...prev,
                [activeContainer]: activeItems.filter((c) => c._id !== active.id),
                [overContainer]: [
                    ...overItems.slice(0, insertAt),
                    { ...moved, column: overContainer },
                    ...overItems.slice(insertAt),
                ],
            };
        });
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveId(null);
        if (!over) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over.id as string);
        if (!activeContainer || !overContainer) return;

        let nextColumns = columns;
        if (activeContainer === overContainer) {
            const items = columns[activeContainer];
            const oldIndex = items.findIndex((c) => c._id === active.id);
            const newIndex = items.findIndex((c) => c._id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                nextColumns = { ...columns, [activeContainer]: arrayMove(items, oldIndex, newIndex) };
                setColumns(nextColumns);
            }
        }

        // Persistance : recalcule l'ordre des colonnes touchées
        const touched = new Set([activeContainer, overContainer]);
        const moves: { id: string; column: string; order: number }[] = [];
        for (const col of touched) {
            nextColumns[col].forEach((c, idx) => moves.push({ id: c._id, column: col, order: idx }));
        }
        fetch("/api/kanban/cards", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board, moves }),
        }).catch(() => {});
    };

    // ─── Mutations carte ─────────────────────────────────────────────────────────

    const openCreate = (col: ColumnId) => {
        setEditing(null);
        setCreateColumn(col);
        setModalOpen(true);
    };

    const openEdit = (card: KanbanCardData) => {
        setEditing(card);
        setModalOpen(true);
    };

    const handleSaved = (card: KanbanCardData) => {
        setColumns((prev) => {
            const next = emptyColumns();
            // retire l'ancienne version partout
            for (const col of COLUMNS) {
                next[col.id] = prev[col.id].filter((c) => c._id !== card._id);
            }
            const col = (card.column as ColumnId) in next ? (card.column as ColumnId) : "todo";
            next[col] = [...next[col], card];
            return next;
        });
    };

    const handleDeleted = (id: string) => {
        setColumns((prev) => {
            const next = emptyColumns();
            for (const col of COLUMNS) next[col.id] = prev[col.id].filter((c) => c._id !== id);
            return next;
        });
    };

    // ─── Rendu ───────────────────────────────────────────────────────────────────

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (accessible.length === 0) {
        return (
            <div className="max-w-md mx-auto text-center py-32 px-6">
                <KanbanSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucun tableau disponible</h2>
                <p className="text-gray-500">Votre rôle ne dispose pas encore d&apos;un tableau Kanban d&apos;équipe.</p>
            </div>
        );
    }

    const boardInfo = BOARDS.find((b) => b.id === board);

    return (
        <div className="px-4 sm:px-6 lg:px-8 pb-12">
            {/* En-tête */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <KanbanSquare className="w-6 h-6 text-purple-500" />
                        <h1 className="text-2xl font-bold text-gray-800">Kanban d&apos;équipe</h1>
                    </div>
                    {boardInfo && <p className="text-sm text-gray-400 mt-1">{boardInfo.description}</p>}
                </div>

                <div className="flex items-center gap-3">
                    {/* Sélecteur de board (Admin = plusieurs) */}
                    {accessible.length > 1 && (
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                            {accessible.map((bid) => {
                                const info = BOARDS.find((b) => b.id === bid);
                                const on = bid === board;
                                return (
                                    <button
                                        key={bid}
                                        onClick={() => setBoard(bid)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            on ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {info?.label || bid}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {boardIsAuto(board) && (
                        <button
                            onClick={() => syncAndReload(false)}
                            disabled={syncing}
                            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 rounded-xl px-3 py-2 text-sm font-medium hover:border-gray-300 disabled:opacity-60 transition-all"
                            title="Générer les cartes à partir du travail en attente"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                            Synchroniser
                        </button>
                    )}
                    <button
                        onClick={() => openCreate("todo")}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvelle carte
                    </button>
                </div>
            </div>

            {syncMsg && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">
                    <Sparkles className="w-4 h-4" />
                    {syncMsg}
                </div>
            )}

            {/* Explication de l'organisation */}
            <BoardLegend />

            {/* Barre de filtres */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une carte…"
                        className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                </div>

                <select
                    value={fPriority}
                    onChange={(e) => setFPriority(e.target.value)}
                    className="text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                    <option value="">Toutes priorités</option>
                    {PRIORITIES.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                </select>

                <select
                    value={fLabel}
                    onChange={(e) => setFLabel(e.target.value)}
                    className="text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                    <option value="">Toutes étiquettes</option>
                    {LABEL_COLORS.map((l) => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                </select>

                <button
                    onClick={() => setOnlyMine((v) => !v)}
                    className={`text-sm rounded-xl border px-3 py-2 font-medium transition-all ${
                        onlyMine
                            ? "bg-purple-50 border-purple-300 text-purple-700"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                >
                    Mes cartes
                </button>

                <button
                    onClick={() => setShowArchived((v) => !v)}
                    className={`inline-flex items-center gap-1.5 text-sm rounded-xl border px-3 py-2 font-medium transition-all ${
                        showArchived
                            ? "bg-gray-800 border-gray-800 text-white"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                >
                    <Archive className="w-4 h-4" />
                    {showArchived ? "Archivées" : "Actives"}
                </button>

                {hasFilters && (
                    <button
                        onClick={() => { setSearch(""); setFPriority(""); setFLabel(""); setOnlyMine(false); }}
                        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-3.5 h-3.5" /> Réinitialiser
                    </button>
                )}
            </div>

            {showArchived && (
                <div className="mb-4 px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-500 flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5" />
                    Vue des cartes archivées. Ouvrez une carte pour la désarchiver.
                </div>
            )}

            {/* Board */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {COLUMNS.map((col) => (
                            <Column
                                key={col.id}
                                id={col.id}
                                label={col.label}
                                color={col.color}
                                cards={displayColumns[col.id]}
                                totalCount={columns[col.id].length}
                                wipLimit={showArchived ? undefined : WIP_LIMITS[col.id]}
                                onAdd={() => openCreate(col.id)}
                                onCardClick={openEdit}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeCard ? <SortableCard card={activeCard} onClick={() => {}} /> : null}
                    </DragOverlay>
                </DndContext>
            )}

            <CardModal
                open={modalOpen}
                board={board}
                members={members}
                initial={editing}
                defaultColumn={createColumn}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
            />
        </div>
    );
}
