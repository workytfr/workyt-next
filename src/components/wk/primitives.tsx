import React from "react";
import { getSubjectIconComponent } from "@/data/educationData";

/**
 * Briques visuelles communes aux pages « catalogue » du site (forum, cours…),
 * reprises de la page d'accueil 2026 : papier `--wk-paper`, encre `--wk-ink`,
 * orange `--wk-accent`, titres Funnel Display, surtitres en capitales.
 * Aucun hook : utilisables en composant serveur comme client.
 */

/** Largeur des pages catalogue : pleine largeur utile, sans vide sur les côtés */
export const PAGE_CONTAINER = "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10";

/** Surtitre : trait + libellé en capitales espacées */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)] ${className}`}>
            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
            {children}
        </div>
    );
}

/** Matière avec son icône, en orange */
export function SubjectLabel({ subject, className = "" }: { subject: string; className?: string }) {
    return (
        <span className={`inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--wk-accent)] ${className}`}>
            {/* createElement : l'icône vient d'une table de correspondance, elle n'est pas définie pendant le rendu */}
            {React.createElement(getSubjectIconComponent(subject), { className: "h-3.5 w-3.5 shrink-0" })}
            <span className="truncate">{subject}</span>
        </span>
    );
}

/** Pastille de niveau */
export function LevelChip({ level, className = "" }: { level: string; className?: string }) {
    return (
        <span className={`shrink-0 rounded-full bg-[var(--wk-paper-2)] px-2 py-0.5 text-[11px] font-semibold text-[rgba(26,21,18,0.7)] ${className}`}>
            {level}
        </span>
    );
}
