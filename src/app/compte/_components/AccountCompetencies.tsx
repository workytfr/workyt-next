"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Target,
    ChevronDown,
    CheckCircle2,
    Clock,
    XCircle,
    Circle,
    BookOpen,
    ArrowRight,
} from "lucide-react";

interface SkillProgress {
    skillId: string;
    description: string;
    difficulty: number;
    status: "not_started" | "in_progress" | "failed" | "mastered";
    bestScore: number;
    lastScore: number;
    nextReview: string | null;
}

interface ChapterData {
    nodeId: string;
    theme: string;
    chapter: string;
    skills: SkillProgress[];
    stats: {
        total: number;
        mastered: number;
        inProgress: number;
        failed: number;
        notStarted: number;
        completionPercent: number;
    };
}

interface SubjectData {
    subject: string;
    globalStats: {
        totalSkills: number;
        mastered: number;
        inProgress: number;
        failed: number;
        notStarted: number;
        completionPercent: number;
    };
    themes: Record<string, ChapterData[]>;
}

const STATUS_CONFIG = {
    mastered: { label: "Maîtrisées", color: "text-emerald-600", chip: "bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
    in_progress: { label: "En cours", color: "text-[#c27a00]", chip: "bg-[#fff4e0] text-[#9a5d00]", icon: Clock },
    failed: { label: "À revoir", color: "text-red-500", chip: "bg-red-50 text-red-700", icon: XCircle },
    not_started: { label: "Non commencées", color: "text-[rgba(26,21,18,0.3)]", chip: "bg-[var(--wk-paper-2)] text-[rgba(26,21,18,0.6)]", icon: Circle },
};

const DIFFICULTY_LABELS = ["", "Facile", "Moyen", "Intermédiaire", "Avancé", "Expert"];

export default function AccountCompetencies() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
    const [hasProfile, setHasProfile] = useState(false);

    useEffect(() => {
        if (!session?.accessToken) return;

        const authHeaders = { Authorization: `Bearer ${session.accessToken}` };

        async function fetchData() {
            try {
                // 1. Récupérer le profil scolaire pour connaître les matières
                const profileRes = await fetch("/api/student-profile", { headers: authHeaders });
                if (!profileRes.ok) { setLoading(false); return; }
                const profileData = await profileRes.json();

                if (!profileData.exists || !profileData.profile) {
                    setLoading(false);
                    return;
                }

                setHasProfile(true);
                const profile = profileData.profile;

                // Déterminer les matières à charger selon le profil
                let subjectsToFetch: string[] = [];
                if (profile.specialities?.length) {
                    subjectsToFetch = profile.specialities as string[];
                } else if (profile.track) {
                    // En supérieur, extraire la matière du track (ex: "licence-informatique" → "informatique", "bts-sio" → "informatique")
                    const trackToSubject: Record<string, string> = {
                        "licence-informatique": "informatique",
                        "master-informatique": "informatique",
                        "master-data-science": "informatique",
                        "master-intelligence-artificielle": "informatique",
                        "master-cybersecurite": "informatique",
                        "master-genie-logiciel": "informatique",
                        "bts-sio": "informatique",
                        "bts-ciel": "informatique",
                        "bts-sn": "informatique",
                        "licence-mathematiques": "mathematiques",
                        "master-mathematiques": "mathematiques",
                        "licence-physique": "physique-chimie",
                        "master-physique": "physique-chimie",
                    };
                    const mapped = trackToSubject[profile.track];
                    if (mapped) subjectsToFetch = [mapped];
                }
                if (subjectsToFetch.length === 0) {
                    subjectsToFetch = ["mathematiques"];
                }

                // 2. Charger les compétences pour chaque matière
                // Ne pas filtrer par level — le cycle suffit pour scoper les compétences.
                // Un élève de 3ème doit voir toutes les compétences du cycle 4 (5ème-3ème).
                const results: SubjectData[] = [];
                for (const subject of subjectsToFetch) {
                    try {
                        const params = new URLSearchParams({ subject });
                        if (profile.cycle) params.set("cycle", profile.cycle);

                        const res = await fetch(`/api/competencies?${params}`, { headers: authHeaders });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.globalStats?.totalSkills > 0) {
                                results.push({
                                    subject: data.subject,
                                    globalStats: data.globalStats,
                                    themes: data.themes,
                                });
                            }
                        }
                    } catch { /* skip subject */ }
                }

                setSubjects(results);
                if (results.length > 0) {
                    setExpandedSubject(results[0].subject);
                }
            } catch (err) {
                console.error("Erreur chargement compétences:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [session?.accessToken]);

    const toggleTheme = (key: string) => {
        setExpandedThemes(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const formatSubject = (s: string) => {
        return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
    };

    const header = (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif-display flex items-center gap-2.5 text-2xl">
                <Target className="h-5 w-5 text-[var(--wk-accent)]" /> Mes compétences
            </h2>
            {subjects.length > 0 && (
                <Link href="/progression" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--wk-accent)] hover:underline">
                    Voir ma progression <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            )}
        </div>
    );

    const shell = (children: React.ReactNode) => (
        <section className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 sm:p-6">
            {header}
            {children}
        </section>
    );

    if (loading) {
        return shell(
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[0, 1].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--wk-paper-2)]" />)}
            </div>
        );
    }

    if (!hasProfile || subjects.length === 0) {
        return shell(
            <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-[var(--wk-paper)] px-6 py-8 text-center">
                <Target className="h-8 w-8 text-[rgba(26,21,18,0.3)]" />
                <p className="max-w-[40ch] text-sm text-[rgba(26,21,18,0.65)]">
                    {hasProfile
                        ? "Aucune compétence trouvée pour ton profil scolaire."
                        : "Renseigne ton profil scolaire pour suivre les compétences de ton programme."}
                </p>
                {!hasProfile && (
                    <button type="button" onClick={() => router.push("/compte/profil-scolaire")} className="wk-btn-orange !py-2 text-sm">
                        Configurer mon profil <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }

    const openSubject = subjects.find(s => s.subject === expandedSubject);

    return shell(
        <>
            {/* Matières */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {subjects.map(({ subject, globalStats }) => {
                    const isOpen = expandedSubject === subject;
                    return (
                        <button
                            key={subject}
                            type="button"
                            onClick={() => setExpandedSubject(isOpen ? null : subject)}
                            aria-expanded={isOpen}
                            className={`rounded-2xl border p-4 text-left transition ${
                                isOpen
                                    ? "border-[var(--wk-ink)] bg-[var(--wk-paper)]"
                                    : "border-[rgba(26,21,18,0.1)] bg-white hover:border-[rgba(26,21,18,0.25)]"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,106,26,0.12)]">
                                    <BookOpen className="h-4 w-4 text-[#c24a0a]" />
                                </span>
                                <span className="min-w-0 flex-1 truncate font-semibold text-[var(--wk-ink)]">{formatSubject(subject)}</span>
                                <span className="font-serif-display text-xl leading-none">{globalStats.completionPercent}%</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)]">
                                <div className="h-full rounded-full bg-[var(--wk-accent-4)]" style={{ width: `${globalStats.completionPercent}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-[rgba(26,21,18,0.55)]">
                                {globalStats.mastered} maîtrisée{globalStats.mastered > 1 ? "s" : ""} sur {globalStats.totalSkills}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Détail de la matière ouverte */}
            {openSubject && (
                <div className="mt-5 border-t border-[rgba(26,21,18,0.06)] pt-5">
                    <div className="flex flex-wrap gap-1.5">
                        {(["mastered", "in_progress", "failed", "not_started"] as const).map(key => {
                            const cfg = STATUS_CONFIG[key];
                            const value = {
                                mastered: openSubject.globalStats.mastered,
                                in_progress: openSubject.globalStats.inProgress,
                                failed: openSubject.globalStats.failed,
                                not_started: openSubject.globalStats.notStarted,
                            }[key];
                            if (key === "failed" && value === 0) return null;
                            return (
                                <span key={key} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.chip}`}>
                                    {React.createElement(cfg.icon, { className: "h-3.5 w-3.5" })}
                                    {value} {cfg.label.toLowerCase()}
                                </span>
                            );
                        })}
                    </div>

                    <div className="mt-4 space-y-2">
                        {Object.entries(openSubject.themes).map(([themeName, chapters]) => {
                            const themeKey = `${openSubject.subject}-${themeName}`;
                            const themeOpen = expandedThemes.has(themeKey);
                            const themeMastered = chapters.reduce((acc, ch) => acc + ch.stats.mastered, 0);
                            const themeTotal = chapters.reduce((acc, ch) => acc + ch.stats.total, 0);
                            const pct = themeTotal > 0 ? (themeMastered / themeTotal) * 100 : 0;

                            return (
                                <div key={themeKey} className="overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.08)]">
                                    <button
                                        type="button"
                                        onClick={() => toggleTheme(themeKey)}
                                        aria-expanded={themeOpen}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--wk-paper)]"
                                    >
                                        <ChevronDown className={`h-4 w-4 shrink-0 text-[rgba(26,21,18,0.4)] transition-transform ${themeOpen ? "" : "-rotate-90"}`} />
                                        <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--wk-ink)]">{themeName}</span>
                                        <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-[rgba(26,21,18,0.08)] sm:block">
                                            <span className="block h-full rounded-full bg-[var(--wk-accent-4)]" style={{ width: `${pct}%` }} />
                                        </span>
                                        <span className="w-12 text-right text-xs tabular-nums text-[rgba(26,21,18,0.55)]">{themeMastered}/{themeTotal}</span>
                                    </button>

                                    {themeOpen && (
                                        <ul className="divide-y divide-[rgba(26,21,18,0.06)] border-t border-[rgba(26,21,18,0.06)]">
                                            {chapters.flatMap((ch) =>
                                                ch.skills.map((skill) => {
                                                    const config = STATUS_CONFIG[skill.status];
                                                    const isRevisionDue =
                                                        skill.nextReview &&
                                                        new Date(skill.nextReview) <= new Date() &&
                                                        skill.status !== "mastered";

                                                    return (
                                                        <li key={skill.skillId} className="flex items-start gap-3 px-4 py-3">
                                                            {React.createElement(config.icon, { className: `mt-0.5 h-4 w-4 shrink-0 ${config.color}`, "aria-label": config.label })}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm leading-snug text-[var(--wk-ink)]">{skill.description}</p>
                                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                                    <span className="font-mono-ui text-[10px] text-[rgba(26,21,18,0.45)]">{skill.skillId}</span>
                                                                    {skill.difficulty > 0 && (
                                                                        <span className="rounded-full bg-[var(--wk-paper-2)] px-2 py-0.5 text-[10px] font-semibold text-[rgba(26,21,18,0.65)]">
                                                                            {DIFFICULTY_LABELS[skill.difficulty]}
                                                                        </span>
                                                                    )}
                                                                    {isRevisionDue && (
                                                                        <span className="rounded-full bg-[#fff4e0] px-2 py-0.5 text-[10px] font-semibold text-[#9a5d00]">À réviser</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {skill.bestScore > 0 && (
                                                                <span className={`shrink-0 text-sm font-semibold tabular-nums ${
                                                                    skill.bestScore >= 80 ? "text-emerald-700" :
                                                                    skill.bestScore >= 60 ? "text-[#9a5d00]" : "text-red-600"
                                                                }`}>
                                                                    {skill.bestScore}%
                                                                </span>
                                                            )}
                                                        </li>
                                                    );
                                                })
                                            )}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
