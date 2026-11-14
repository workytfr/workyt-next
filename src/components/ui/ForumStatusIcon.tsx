import { ForumAttenteIcon, ForumMeilleureIcon, ForumResolueIcon, ForumValideeIcon, type WorkytIcon } from "workyt-icons/react";

/**
 * Icônes de validation du forum, tirées du paquet workyt-icons.
 * Elles prennent la couleur du texte (currentColor).
 */

export type ForumStatusKind = "validee" | "meilleure" | "attente" | "resolue";

const ICONS: Record<ForumStatusKind, WorkytIcon> = {
    // Réponse validée par l'équipe : deux feuilles en coche, une étoile éclose
    validee: ForumValideeIcon,
    // Meilleure réponse choisie par l'auteur : couronne de trois feuilles
    meilleure: ForumMeilleureIcon,
    // Question en attente : un sablier
    attente: ForumAttenteIcon,
    // Question résolue : la bulle porte la coche
    resolue: ForumResolueIcon,
};

export function ForumStatusIcon({ kind, className = "h-4 w-4" }: { kind: ForumStatusKind; className?: string }) {
    const Icon = ICONS[kind];
    return <Icon className={className} />;
}

/** Statut de question (modèle) → icône */
export const QUESTION_STATUS_ICON: Record<string, ForumStatusKind> = {
    "Non validée": "attente",
    "Validée": "validee",
    "Résolue": "resolue",
};
