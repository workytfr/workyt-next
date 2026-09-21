import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, MessageCircle, FileText, ArrowUpRight, HeartHandshake } from "lucide-react";
import { SubjectLabel, LevelChip } from "@/components/wk/primitives";
import { buildIdSlug } from "@/utils/slugify";

/**
 * Briques des fiches de révision, sans hook : utilisables dans la liste
 * (client) comme dans les pages matière / niveau (serveur, ISR).
 */

/** Statuts de relecture d'une fiche. « Non Certifiée » n'affiche rien. */
const STATUS_STYLE: Record<string, string> = {
    "Certifiée": "bg-[#eaf6fb] text-[#2f86b3] border-[#bfe3f2]",
    "Vérifiée": "bg-emerald-50 text-emerald-800 border-emerald-200",
};

/**
 * Léger dégradé selon le statut : bleu pour « Certifiée », vert pour
 * « Vérifiée ». Il part du haut de la carte et s'efface vers le blanc ; une
 * fiche sans statut reste blanche. À poser en `style` sur la carte.
 */
const STATUS_TINT: Record<string, string> = {
    "Certifiée": "linear-gradient(180deg, rgba(110, 193, 228, 0.22) 0%, rgba(110, 193, 228, 0.07) 38%, #ffffff 72%)",
    "Vérifiée": "linear-gradient(180deg, rgba(126, 217, 87, 0.24) 0%, rgba(126, 217, 87, 0.08) 38%, #ffffff 72%)",
};

export function ficheStatusTint(status?: string): React.CSSProperties | undefined {
    return status && STATUS_TINT[status] ? { backgroundImage: STATUS_TINT[status] } : undefined;
}

export function FicheStatusChip({ status, className = "" }: { status?: string; className?: string }) {
    if (!status || !STATUS_STYLE[status]) return null;
    return (
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border py-0.5 pl-1 pr-2.5 text-[11px] font-semibold ${STATUS_STYLE[status]} ${className}`}>
            <Image src={`/badge/${status}.svg`} alt="" width={16} height={16} className="h-4 w-4" />
            {status}
        </span>
    );
}

/** Aperçu texte d'une fiche (contenu markdown ou HTML) */
export function ficheExcerpt(content: string | undefined, max = 180): string {
    if (!content) return "";
    const text = content
        .replace(/<[^>]*>/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#>*_`~|]/g, "")
        .replace(/\$\$?/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export interface FicheTileData {
    id: string;
    title: string;
    slug?: string;
    subject?: string;
    level?: string;
    status?: string;
    content?: string;
    likes?: number;
    comments?: number;
    date?: string | Date;
}

/**
 * Une fiche en carte. Lien « étiré » sur le titre : toute la carte est
 * cliquable. `author` (avatar client) est passé en élément déjà rendu pour
 * que ce composant reste utilisable côté serveur.
 */
export function FicheTile({ f, author, showSubject = true }: { f: FicheTileData; author?: React.ReactNode; showSubject?: boolean }) {
    const href = `/fiches/${buildIdSlug(f.id, f.slug || f.title)}`;
    const excerpt = ficheExcerpt(f.content);

    return (
        <article
            className="group relative flex h-full min-w-0 flex-col rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.09)] sm:p-6"
            style={ficheStatusTint(f.status)}
        >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                {showSubject && f.subject ? (
                    <SubjectLabel subject={f.subject} className="min-w-0" />
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--wk-accent)]">
                        <FileText className="h-3.5 w-3.5" /> Fiche
                    </span>
                )}
                {f.level && <LevelChip level={f.level} />}
                <FicheStatusChip status={f.status} className="ml-auto" />
            </div>

            <h2 className="font-serif-display mt-4 text-[1.35rem] leading-[1.15] text-[var(--wk-ink)] line-clamp-2 [overflow-wrap:anywhere]">
                <Link
                    href={href}
                    className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--wk-accent)]"
                >
                    {f.title}
                </Link>
            </h2>

            {excerpt && <p className="mt-2.5 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3 [overflow-wrap:anywhere]">{excerpt}</p>}

            <div className="mt-auto flex items-center gap-2.5 border-t border-[rgba(26,21,18,0.06)] pt-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {author ?? (
                        f.date && (
                            <span className="text-xs text-[rgba(26,21,18,0.5)]">
                                {new Date(f.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                        )
                    )}
                </div>
                {typeof f.likes === "number" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[rgba(26,21,18,0.6)]" title={`${f.likes} j'aime`}>
                        <Flame className="h-4 w-4 text-[var(--wk-accent)]" /> {f.likes}
                    </span>
                )}
                {typeof f.comments === "number" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[rgba(26,21,18,0.6)]" title={`${f.comments} commentaire(s)`}>
                        <MessageCircle className="h-4 w-4" /> {f.comments}
                    </span>
                )}
                <ArrowUpRight className="h-4 w-4 text-[rgba(26,21,18,0.35)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--wk-accent)]" />
            </div>
        </article>
    );
}

/**
 * Les deux actions de l'en-tête des pages fiches : déposer une fiche, ou se
 * faire accompagner (suivi). Liens uniquement : utilisable côté serveur.
 */
export function FicheActions({ subject, level }: { subject?: string; level?: string }) {
    const qs = new URLSearchParams();
    if (subject) qs.set("subject", subject);
    if (level) qs.set("level", level);
    return (
        <div className="grid gap-3">
            <Link
                href="/fiches/creer"
                className="group flex items-center gap-4 rounded-3xl bg-[var(--wk-ink)] p-4 text-[var(--wk-paper)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(26,21,18,0.2)] sm:p-5"
            >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <FileText className="h-5 w-5 text-[var(--wk-accent-2)]" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-semibold">Déposer une fiche</span>
                    <span className="block text-sm text-white/65">Partage tes synthèses et gagne des points.</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
                href={`/suivi${qs.toString() ? `?${qs}` : ""}#demande`}
                className="group flex items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.1)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--wk-accent)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.08)] sm:p-5"
            >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-accent)] text-white">
                    <HeartHandshake className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--wk-ink)]">Réviser avec un bénévole</span>
                    <span className="block text-sm text-[rgba(26,21,18,0.6)]">Un suivi pour préparer ton examen, rien que pour toi.</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--wk-ink)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
        </div>
    );
}
