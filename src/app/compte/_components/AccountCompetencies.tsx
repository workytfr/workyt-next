"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Target,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Clock,
    XCircle,
    Circle,
    Loader2,
    BookOpen,
    ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

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
    mastered: { label: "Maîtrisé", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
    in_progress: { label: "En cours", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
    failed: { label: "À revoir", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
    not_started: { label: "Non commencé", color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-200", icon: Circle },
};

const DIFFICULTY_LABELS = ["", "Facile", "Moyen", "Intermédiaire", "Avancé", "Expert"];
const DIFFICULTY_COLORS = ["", "text-green-600 bg-green-50", "text-blue-600 bg-blue-50", "text-yellow-600 bg-yellow-50", "text-orange-600 bg-orange-50", "text-red-600 bg-red-50"];

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

    if (loading) {
        return (
            <Card className="border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-400" />
                        Mes Compétences
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    if (!hasProfile) {
        return (
            <Card className="border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-400" />
                        Mes Compétences
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-4">
                        <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-3">
                            Configurez votre profil scolaire pour suivre vos compétences.
                        </p>
                        <button
                            onClick={() => router.push("/compte/profil-scolaire")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            Configurer mon profil
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (subjects.length === 0) {
        return (
            <Card className="border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-400" />
                        Mes Compétences
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-4">
                        <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                            Aucune compétence trouvée pour votre profil.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

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

    return (
        <Card className="border border-gray-200 rounded-2xl shadow-sm">
            <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-400" />
                        Mes Compétences
                    </CardTitle>
                    <button
                        onClick={() => router.push("/progression")}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                        Voir tout
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
                {subjects.map((subjectData) => {
                    const { subject, globalStats, themes } = subjectData;
                    const isOpen = expandedSubject === subject;

                    return (
                        <div key={subject}>
                            {/* Matière header */}
                            <button
                                onClick={() => setExpandedSubject(isOpen ? null : subject)}
                                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                            >
                                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-4.5 h-4.5 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">
                                        {formatSubject(subject)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {globalStats.mastered}/{globalStats.totalSkills} maîtrisées &middot; {globalStats.completionPercent}%
                                    </p>
                                </div>
                                {/* Mini progress bar */}
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                    <div
                                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                        style={{ width: `${globalStats.completionPercent}%` }}
                                    />
                                </div>
                                {isOpen ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                            </button>

                            {/* Thèmes et compétences */}
                            {isOpen && (
                                <div className="mt-3 space-y-2 pl-1">
                                    {/* Stats badges */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                            <CheckCircle2 className="w-3 h-3" /> {globalStats.mastered}
                                        </span>
                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                                            <Clock className="w-3 h-3" /> {globalStats.inProgress}
                                        </span>
                                        {globalStats.failed > 0 && (
                                            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                                                <XCircle className="w-3 h-3" /> {globalStats.failed}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full">
                                            <Circle className="w-3 h-3" /> {globalStats.notStarted}
                                        </span>
                                    </div>

                                    {/* Thèmes */}
                                    {Object.entries(themes).map(([themeName, chapters]) => {
                                        const themeKey = `${subject}-${themeName}`;
                                        const themeOpen = expandedThemes.has(themeKey);
                                        const themeMastered = chapters.reduce((acc, ch) => acc + ch.stats.mastered, 0);
                                        const themeTotal = chapters.reduce((acc, ch) => acc + ch.stats.total, 0);

                                        return (
                                            <div key={themeKey} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => toggleTheme(themeKey)}
                                                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    {themeOpen ? (
                                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    )}
                                                    <span className="text-sm font-medium text-gray-800 flex-1">{themeName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-400 rounded-full"
                                                                style={{ width: `${themeTotal > 0 ? (themeMastered / themeTotal) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-400 tabular-nums">{themeMastered}/{themeTotal}</span>
                                                    </div>
                                                </button>

                                                {themeOpen && (
                                                    <div className="px-4 pb-3 space-y-1.5">
                                                        {chapters.flatMap((ch) =>
                                                            ch.skills.map((skill) => {
                                                                const config = STATUS_CONFIG[skill.status];
                                                                const Icon = config.icon;
                                                                const isRevisionDue =
                                                                    skill.nextReview &&
                                                                    new Date(skill.nextReview) <= new Date() &&
                                                                    skill.status !== "mastered";

                                                                return (
                                                                    <div
                                                                        key={skill.skillId}
                                                                        className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${config.bg} ${config.border}`}
                                                                    >
                                                                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.color}`} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                                <span className="font-mono text-[11px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-medium">
                                                                                    {skill.skillId}
                                                                                </span>
                                                                                {skill.difficulty > 0 && (
                                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_COLORS[skill.difficulty] || ""}`}>
                                                                                        {DIFFICULTY_LABELS[skill.difficulty]}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-gray-800 leading-snug">{skill.description}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            {isRevisionDue && (
                                                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                                                                    Révision
                                                                                </span>
                                                                            )}
                                                                            {skill.bestScore > 0 && (
                                                                                <span className={`text-xs font-semibold ${
                                                                                    skill.bestScore >= 80 ? "text-emerald-600" :
                                                                                    skill.bestScore >= 60 ? "text-amber-600" : "text-red-500"
                                                                                }`}>
                                                                                    {skill.bestScore}%
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
