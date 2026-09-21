import React from "react";
import Link from "next/link";
import { ArrowUpRight, HeartHandshake, MessagesSquare } from "lucide-react";
import { PAGE_CONTAINER, Eyebrow, SubjectLabel } from "@/components/wk/primitives";

/**
 * Kit visuel propre au forum (statuts, portes d'entrée, encart suivi). Les
 * briques génériques (conteneur, surtitre, matière) viennent de
 * `@/components/wk/primitives`, partagées avec les pages de cours.
 * Aucun hook ici : utilisable en composant serveur (hubs SEO) comme client.
 */

export const FORUM_CONTAINER = PAGE_CONTAINER;
export { Eyebrow, SubjectLabel };

/* ─── Statuts ─── */

export const STATUS_META: Record<string, { label: string; dot: string; chip: string }> = {
    "Non validée": { label: "En attente", dot: "bg-amber-400", chip: "bg-amber-50 text-amber-800 border-amber-200" },
    "Validée": { label: "Validée", dot: "bg-[#6ec1e4]", chip: "bg-[#eaf6fb] text-[#2f86b3] border-[#bfe3f2]" },
    "Résolue": { label: "Résolue", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-800 border-emerald-200" },
};

export function StatusChip({ status, className = "" }: { status?: string; className?: string }) {
    const s = STATUS_META[status || "Non validée"] || STATUS_META["Non validée"];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.chip} ${className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

/* ─── Texte ─── */

/**
 * Extrait lisible d'un contenu markdown de question : sans images, sans
 * syntaxe, mentions `@[user:id]` réduites. Pour les aperçus de cartes.
 */
export function plainExcerpt(markdown: string | undefined, max = 220): string {
    if (!markdown) return "";
    const text = markdown
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/@\[user:[^\]]+\]/g, "@…")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#>*_`~|]/g, "")
        .replace(/\$\$?/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function relativeTime(iso: string | Date): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `il y a ${d} j`;
    if (d < 30) return `il y a ${Math.floor(d / 7)} sem.`;
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Les deux portes d'entrée : communauté ou accompagnement ─── */

/**
 * Le choix que le forum propose partout : une question ponctuelle à la
 * communauté, ou un accompagnement personnalisé par un bénévole (le suivi).
 * `subject` / `level` pré-remplissent les deux formulaires.
 */
export function EntryChoice({
    subject,
    level,
    layout = "stack",
    askHref,
    onAsk,
}: {
    subject?: string;
    level?: string;
    layout?: "stack" | "row";
    /** Lien de création de question ; absent → `onAsk` (ex. ouvrir la connexion) */
    askHref?: string;
    onAsk?: () => void;
}) {
    const qs = new URLSearchParams();
    if (subject) qs.set("subject", subject);
    if (level) qs.set("level", level);
    const suiviHref = `/suivi${qs.toString() ? `?${qs}` : ""}#demande`;

    const askInner = (
        <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <MessagesSquare className="h-5 w-5 text-[var(--wk-accent-2)]" />
            </span>
            <span className="min-w-0 flex-1 text-left">
                <span className="block font-semibold">Poser une question</span>
                <span className="block text-sm text-white/65">La communauté répond, souvent en quelques heures.</span>
            </span>
            <ArrowUpRight className="h-5 w-5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </>
    );
    const askClass =
        "group flex w-full items-center gap-4 rounded-3xl bg-[var(--wk-ink)] p-4 text-[var(--wk-paper)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(26,21,18,0.2)] sm:p-5";

    return (
        <div className={layout === "row" ? "grid grid-cols-1 gap-3 md:grid-cols-2" : "grid gap-3"}>
            {askHref ? (
                <Link href={askHref} className={askClass}>{askInner}</Link>
            ) : (
                <button type="button" onClick={onAsk} className={askClass}>{askInner}</button>
            )}
            <Link
                href={suiviHref}
                className="group flex items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.1)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--wk-accent)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.08)] sm:p-5"
            >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--wk-accent)] text-white">
                    <HeartHandshake className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold text-[var(--wk-ink)]">
                        Être accompagné
                        <span className="rounded-full bg-[rgba(255,106,26,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c24a0a]">
                            Nouveau
                        </span>
                    </span>
                    <span className="block text-sm text-[rgba(26,21,18,0.6)]">Un bénévole te suit quelques semaines, rien que pour toi.</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--wk-ink)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
        </div>
    );
}

/* ─── Encart « suivi » glissé dans la grille de questions ─── */

export function SuiviPromoCard({ subject, level, wide = false }: { subject?: string; level?: string; wide?: boolean }) {
    const qs = new URLSearchParams();
    if (subject) qs.set("subject", subject);
    if (level) qs.set("level", level);
    const href = `/suivi${qs.toString() ? `?${qs}` : ""}#demande`;

    // Bandeau pleine largeur, glissé entre deux rangées de questions
    if (wide) {
        return (
            <Link
                href={href}
                className="wk-grain group relative col-span-full flex flex-col gap-5 overflow-hidden rounded-3xl bg-[var(--wk-accent)] p-6 text-white transition hover:shadow-[0_20px_50px_rgba(255,106,26,0.3)] sm:flex-row sm:items-center sm:p-8"
            >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <HeartHandshake className="h-7 w-7" />
                </span>
                <span className="flex-1">
                    <span className="font-mono-ui block text-[11px] uppercase tracking-[0.18em] text-white/75">Suivi personnalisé</span>
                    <span className="font-serif-display mt-1 block text-3xl leading-[0.95]">
                        Tu bloques <span className="italic">souvent</span> ? Un bénévole peut te suivre.
                    </span>
                    <span className="mt-2 block max-w-[70ch] text-sm leading-relaxed text-white/85">
                        Un plan, des exercices choisis pour toi et quelqu&apos;un qui suit tes progrès pendant quelques semaines. Gratuit.
                    </span>
                </span>
                <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--wk-ink)]">
                    Demander un suivi
                    <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
            </Link>
        );
    }

    return (
        <Link
            href={`/suivi${qs.toString() ? `?${qs}` : ""}#demande`}
            className="wk-grain group relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-3xl bg-[var(--wk-accent)] p-6 text-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(255,106,26,0.35)]"
        >
            <div>
                <div className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/75">Suivi personnalisé</div>
                <h3 className="font-serif-display mt-3 text-3xl leading-[0.95]">
                    Tu bloques <span className="italic">souvent</span> ?
                </h3>
                <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-white/85">
                    Un bénévole de l&apos;association t&apos;accompagne : un plan, des exercices choisis pour toi, et quelqu&apos;un qui suit tes progrès. Gratuit.
                </p>
            </div>
            <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--wk-ink)]">
                Demander un suivi
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
        </Link>
    );
}
