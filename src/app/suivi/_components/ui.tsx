"use client";

import React from "react";
import {
    BookOpen,
    FileText,
    Dumbbell,
    CircleHelp,
    ClipboardCheck,
    GraduationCap,
    type LucideIcon,
} from "lucide-react";
import type { Kind, Status } from "../_lib/client";

/** Surtitre à la manière de la page d'accueil : trait + libellé en capitales */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`font-mono-ui inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.6)] ${className}`}
        >
            <span className="inline-block w-8 border-t border-[rgba(26,21,18,0.3)]" />
            {children}
        </div>
    );
}

const STATUS_STYLE: Record<Status, { label: string; className: string; dot: string }> = {
    pending: { label: "En attente", className: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
    active: { label: "En cours", className: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    paused: { label: "En pause", className: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-400" },
    closed: { label: "Terminé", className: "bg-stone-100 text-stone-600 border-stone-200", dot: "bg-stone-400" },
    cancelled: { label: "Annulé", className: "bg-stone-100 text-stone-500 border-stone-200", dot: "bg-stone-300" },
};

export function StatusPill({ status }: { status: Status }) {
    const s = STATUS_STYLE[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

export const KIND_META: Record<Kind, { label: string; icon: LucideIcon; color: string }> = {
    course: { label: "Cours", icon: BookOpen, color: "#ff6a1a" },
    lesson: { label: "Leçon", icon: GraduationCap, color: "#e8590c" },
    exercise: { label: "Exercice", icon: Dumbbell, color: "#6ec1e4" },
    quiz: { label: "Quiz", icon: CircleHelp, color: "#9b6ef3" },
    fiche: { label: "Fiche", icon: FileText, color: "#5fb83c" },
    evaluation: { label: "Évaluation", icon: ClipboardCheck, color: "#e0a526" },
};

export function KindBadge({ kind, className = "" }: { kind: Kind; className?: string }) {
    const meta = KIND_META[kind];
    const Icon = meta.icon;
    return (
        <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${className}`}
            style={{ background: `${meta.color}1a`, color: meta.color }}
            aria-hidden="true"
        >
            <Icon className="h-4 w-4" />
        </span>
    );
}

/** Pastille ronde avec l'initiale, pour les listes (évite de charger un avatar par ligne) */
export function Initial({ name, tone = "ink", size = 32 }: { name: string; tone?: "ink" | "orange" | "paper"; size?: number }) {
    const tones = {
        ink: "bg-[var(--wk-ink)] text-[var(--wk-paper)]",
        orange: "bg-[var(--wk-accent)] text-white",
        paper: "bg-[var(--wk-paper-2)] text-[var(--wk-ink)] border border-[rgba(26,21,18,0.1)]",
    };
    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ${tones[tone]}`}
            style={{ width: size, height: size, fontSize: size * 0.42 }}
            aria-hidden="true"
        >
            {(name || "?").charAt(0)}
        </span>
    );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white ${className}`}>{children}</div>
    );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <span
            className={`inline-block animate-spin rounded-full border-2 border-[rgba(26,21,18,0.15)] border-t-[var(--wk-accent)] ${className}`}
            role="status"
            aria-label="Chargement"
        />
    );
}
