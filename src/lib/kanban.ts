/**
 * Configuration partagée du Kanban d'équipe.
 *
 * Un board par rôle staff. L'Admin a accès à tous les boards ;
 * les autres rôles n'accèdent qu'au board correspondant à leur rôle.
 */

export type BoardId = 'Rédacteur' | 'Correcteur' | 'Helpeur' | 'Modérateur' | 'Admin';

export const BOARDS: { id: BoardId; label: string; color: string; description: string }[] = [
    { id: 'Rédacteur', label: 'Rédacteurs', color: '#3b82f6', description: 'Création et édition du contenu pédagogique' },
    { id: 'Correcteur', label: 'Correcteurs', color: '#8b5cf6', description: 'Correction des évaluations et révision du contenu' },
    { id: 'Helpeur', label: 'Helpeurs', color: '#f59e0b', description: "Aide sur le forum et corrections" },
    { id: 'Modérateur', label: 'Modérateurs', color: '#10b981', description: 'Modération du forum et des commentaires' },
    { id: 'Admin', label: 'Admins', color: '#ef4444', description: 'Missions et organisation de la plateforme' },
];

export const BOARD_IDS = BOARDS.map((b) => b.id);

export type ColumnId = 'todo' | 'in_progress' | 'review' | 'done';

export const COLUMNS: { id: ColumnId; label: string; color: string }[] = [
    { id: 'todo', label: 'À faire', color: '#6b7280' },
    { id: 'in_progress', label: 'En cours', color: '#3b82f6' },
    { id: 'review', label: 'En revue', color: '#f59e0b' },
    { id: 'done', label: 'Terminé', color: '#10b981' },
];

export const COLUMN_IDS = COLUMNS.map((c) => c.id);

export type Priority = 'low' | 'medium' | 'high';

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
    { id: 'low', label: 'Basse', color: '#9ca3af' },
    { id: 'medium', label: 'Moyenne', color: '#f59e0b' },
    { id: 'high', label: 'Haute', color: '#ef4444' },
];

/** Palette d'étiquettes (labels) disponibles. */
export const LABEL_COLORS: { id: string; label: string; color: string; bg: string }[] = [
    { id: 'urgent', label: 'Urgent', color: '#dc2626', bg: '#fee2e2' },
    { id: 'bug', label: 'Bug', color: '#ea580c', bg: '#ffedd5' },
    { id: 'idee', label: 'Idée', color: '#ca8a04', bg: '#fef9c3' },
    { id: 'contenu', label: 'Contenu', color: '#2563eb', bg: '#dbeafe' },
    { id: 'relecture', label: 'Relecture', color: '#7c3aed', bg: '#ede9fe' },
    { id: 'bloque', label: 'Bloqué', color: '#475569', bg: '#e2e8f0' },
    { id: 'admin', label: 'Admin', color: '#0891b2', bg: '#cffafe' },
];

/** Limite WIP indicative (soft) par colonne. */
export const WIP_LIMITS: Partial<Record<ColumnId, number>> = {
    in_progress: 5,
    review: 5,
};

/**
 * Boards alimentés par l'auto-création de cartes (doit rester synchronisé avec
 * les clés de SOURCES dans lib/kanbanSync.ts). Déclaré ici car ce module est
 * importable côté client, contrairement à kanbanSync (qui touche la base).
 */
export const AUTO_BOARDS: BoardId[] = ['Correcteur', 'Helpeur', 'Modérateur'];

export function boardIsAuto(board: string): boolean {
    return AUTO_BOARDS.includes(board as BoardId);
}

/** Émotions de Foxy utilisées pour narrer l'activité des cartes. */
export const FOXY_EMOTIONS = ['joyeux', 'surpris', 'clin', 'amoureux', 'endormi'] as const;

export function randomFoxyEmotion(): string {
    return FOXY_EMOTIONS[Math.floor(Math.random() * FOXY_EMOTIONS.length)];
}

export type LinkType = 'none' | 'course' | 'forum' | 'evaluation';

export const LINK_TYPES: { id: LinkType; label: string }[] = [
    { id: 'none', label: 'Aucune' },
    { id: 'course', label: 'Cours' },
    { id: 'forum', label: 'Question forum' },
    { id: 'evaluation', label: 'Évaluation' },
];

/** Boards auxquels un rôle a accès. Admin = tous. */
export function getAccessibleBoards(role?: string | null): BoardId[] {
    if (!role) return [];
    if (role === 'Admin') return BOARD_IDS as BoardId[];
    return BOARD_IDS.includes(role as BoardId) ? [role as BoardId] : [];
}

export function canAccessBoard(role: string | null | undefined, board: string): boolean {
    return getAccessibleBoards(role).includes(board as BoardId);
}

export function isValidBoard(board: string): board is BoardId {
    return BOARD_IDS.includes(board as BoardId);
}

export function isValidColumn(col: string): col is ColumnId {
    return COLUMN_IDS.includes(col as ColumnId);
}
