import React from "react";
import Link from "next/link";
import { SubjectLabel, LevelChip } from "./primitives";

/**
 * Carte de contenu commune aux grilles du site (questions du forum, fiches de
 * révision) : même coque, même en-tête, même pied. Sans hook, donc utilisable
 * côté serveur ; les parties interactives (avatar, favori) sont passées déjà
 * rendues.
 *
 * Toute la carte est cliquable grâce à un lien « étiré » sur le titre (un vrai
 * <a>, accessible au clavier) ; les boutons du pied passent au-dessus.
 */
export default function ContentCard({
    href,
    title,
    subject,
    kindLabel,
    level,
    status,
    excerpt,
    children,
    avatar,
    authorName,
    meta,
    stats,
    action,
    style,
}: {
    href: string;
    title: string;
    subject?: string;
    /** Affiché à la place de la matière quand elle est implicite (page d'une matière) */
    kindLabel?: React.ReactNode;
    level?: string;
    /** Pastille de statut, alignée à droite de l'en-tête */
    status?: React.ReactNode;
    excerpt?: string;
    /** Mentions supplémentaires sous l'extrait */
    children?: React.ReactNode;
    avatar?: React.ReactNode;
    authorName?: React.ReactNode;
    /** Sous le nom (ou seul, sans auteur) : la date */
    meta?: string;
    stats?: React.ReactNode;
    action?: React.ReactNode;
    /** Fond particulier (ex. : léger dégradé selon le statut d'une fiche) */
    style?: React.CSSProperties;
}) {
    return (
        <article className="group relative flex h-full min-w-0 flex-col rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)] sm:p-6" style={style}>
            {/* Matière · niveau · statut : une seule ligne, la matière se tronque */}
            <div className="flex min-w-0 items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    {subject ? <SubjectLabel subject={subject} className="min-w-0" /> : kindLabel}
                    {level && <LevelChip level={level} />}
                </div>
                {status && <div className="shrink-0">{status}</div>}
            </div>

            <h2 className="font-serif-display mt-4 text-[1.35rem] leading-[1.15] text-[var(--wk-ink)] line-clamp-3 [overflow-wrap:anywhere]">
                <Link
                    href={href}
                    className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--wk-accent)]"
                >
                    {title}
                </Link>
            </h2>

            {excerpt && <p className="mt-2.5 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3 [overflow-wrap:anywhere]">{excerpt}</p>}

            {children}

            {/* Auteur · date · compteurs · action */}
            <div className="mt-auto flex items-center gap-2.5 border-t border-[rgba(26,21,18,0.06)] pt-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {avatar}
                    {(authorName || meta) && (
                        <div className="min-w-0 leading-tight">
                            {authorName && <div className="flex min-w-0 items-center gap-1.5">{authorName}</div>}
                            {meta && <span className={`block text-xs text-[rgba(26,21,18,0.5)] ${authorName ? "mt-0.5" : ""}`}>{meta}</span>}
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-[rgba(26,21,18,0.6)]">
                    {stats}
                    {action && <div className="relative z-10">{action}</div>}
                </div>
            </div>
        </article>
    );
}
