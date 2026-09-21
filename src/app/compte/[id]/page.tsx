"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Crown,
    Gift,
    Activity,
    Settings,
    FileText,
    HelpCircle,
    MessageCircle,
    Mail,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Pencil,
    ThumbsUp,
} from "lucide-react";
import ProfileAvatar from "@/components/ui/profile";
import UserRank from "@/components/ui/UserRank";
import BadgeDisplay from "@/components/ui/BadgeDisplay";
import ContributionGraph from "@/components/ui/ContributionGraph";
import ProfileFriends from "@/components/friends/ProfileFriends";
import { Toast } from "@/components/ui/UseToast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { calculateUserRank } from "@/lib/rankSystem";
import { useRankUp } from "@/hooks/useRankUp";
import { FlameIcon, getFlameLevel } from "@/components/ui/StreakIndicator";
import useSWR from "swr";
import { buildIdSlug } from "@/utils/slugify";
import AccountCompetencies from "../_components/AccountCompetencies";
import { PAGE_CONTAINER, Eyebrow, SubjectLabel, LevelChip } from "@/components/wk/primitives";
import { StatusChip, plainExcerpt, relativeTime } from "@/app/forum/_components/forumUi";
import { FicheTile } from "@/app/fiches/_components/ficheUi";

export default function UserAccountPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session } = useSession();
    const router = useRouter();

    const [id, setId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [revisions, setRevisions] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalRevisions: 0,
        totalQuestions: 0,
        totalAnswers: 0,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        bio: "",
        badges: [],
        points: 0,
        image: "",
    });

    // Récupérer les gems (seulement si c'est le profil de l'utilisateur connecté)
    const fetcher = (url: string) => fetch(url).then(res => res.json()).catch(() => null);
    const { data: gemData } = useSWR(
        id && session?.user?.id === id ? '/api/gems/balance' : null,
        fetcher,
        {
            refreshInterval: 60000,
            revalidateOnFocus: false,
        }
    );

    const gems = gemData?.success && gemData?.data?.user?.id === id
        ? gemData.data.gems.balance || 0
        : 0;

    // Récupérer le streak
    const { data: streakData } = useSWR(
        id ? `/api/streak` : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    const currentStreak = streakData?.success ? streakData.data.currentStreak || 0 : 0;

    // Newsletter preferences
    const [newsletterPrefs, setNewsletterPrefs] = useState<{ hebdo: boolean; classique: boolean } | null>(null);
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    /** Le consentement a-t-il deja ete recueilli pour ce compte ? */
    const [consentDonne, setConsentDonne] = useState(true);
    /** Abonnement demande, en attente de la declaration des 15 ans */
    const [attenteAge, setAttenteAge] = useState<'hebdo' | 'classique' | null>(null);
    const [ageCoche, setAgeCoche] = useState(false);

    useEffect(() => {
        if (!id || !session?.user?.id) return;
        if (session.user.id !== id && session.user.role !== 'Admin') return;
        fetch('/api/newsletter/preferences')
            .then(res => res.json())
            .then(data => {
                setConsentDonne(!!data.consentDonne);
                if (data.newsletterPreferences) {
                    setNewsletterPrefs(data.newsletterPreferences);
                } else if (typeof data.newsletterOptIn === 'boolean') {
                    setNewsletterPrefs({ hebdo: data.newsletterOptIn, classique: data.newsletterOptIn });
                }
            })
            .catch(() => {});
    }, [id, session?.user?.id]);

    const envoyerPref = async (type: 'hebdo' | 'classique', newValue: boolean, ageDeclare?: boolean) => {
        setNewsletterLoading(true);
        try {
            const res = await fetch('/api/newsletter/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newsletterPreferences: { [type]: newValue },
                    ...(ageDeclare ? { ageDeclare: true } : {}),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setNewsletterPrefs(data.newsletterPreferences);
                if (ageDeclare) setConsentDonne(true);
                setAttenteAge(null);
                setAgeCoche(false);
                Toast({
                    title: newValue ? "Newsletter activee" : "Newsletter desactivee",
                });
            } else {
                Toast({ title: data.error || "Erreur", variant: "destructive" });
            }
        } catch {
            Toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setNewsletterLoading(false);
        }
    };

    const toggleNewsletterPref = async (type: 'hebdo' | 'classique') => {
        if (!newsletterPrefs) return;
        const newValue = !newsletterPrefs[type];

        // S'abonner sans consentement enregistre : on demande d'abord la
        // declaration des 15 ans. Se desabonner ne demande jamais rien.
        if (newValue && !consentDonne) {
            setAttenteAge(type);
            return;
        }
        await envoyerPref(type, newValue);
    };

    // Fonction pour formater les points
    const formatPoints = (points: number): string => {
        if (points < 1000) return points.toString();
        if (points < 1000000) return Math.floor(points / 1000) + "K";
        return Math.floor(points / 1000000) + "M";
    };

    const userRank = calculateUserRank(formData.points);
    useRankUp(formData.points);

    // Resolve params promise
    useEffect(() => {
        async function resolveParams() {
            const resolvedParams = await params;
            setId(resolvedParams.id);
        }
        resolveParams();
    }, [params]);

    useEffect(() => {
        if (!id) return; // Wait for id to be resolved

        async function fetchUser() {
            try {
                setLoading(true);
                const res = await fetch(`/api/user/${id}?page=${pagination.page}&limit=5`);
                const data = await res.json();
                if (res.ok) {
                    setUser(data.data.user);
                    setRevisions(data.data.revisions);
                    setQuestions(data.data.questions);
                    setAnswers(data.data.answers);
                    setPagination({
                        page: data.data.pagination.currentPage,
                        totalPages: data.data.pagination.totalPages,
                        totalRevisions: data.data.pagination.totalRevisions ?? 0,
                        totalQuestions: data.data.pagination.totalQuestions ?? 0,
                        totalAnswers: data.data.pagination.totalAnswers ?? 0,
                    });
                    setFormData({
                        name: data.data.user.name,
                        username: data.data.user.username,
                        bio: data.data.user.bio || "",
                        badges: data.data.user.badges || [],
                        points: data.data.user.points || 0,
                        image: data.data.user.image || "",
                    });
                } else {
                    Toast({
                        title: "Erreur",
                        variant: "destructive",
                    });
                    router.push("/");
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
                Toast({
                    title: "Erreur",
                    variant: "destructive",
                });
                router.push("/");
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [id, pagination.page, router]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page: newPage }));
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: user.name,
            username: user.username,
            bio: user.bio || "",
            badges: user.badges || [],
            points: user.points || 0,
            image: user.image || "",
        });
    };

    const handleSave = async () => {
        if (!id) return;

        try {
            const res = await fetch(`/api/user/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                Toast({ title: "Profil mis à jour" });
                setUser(data.data);
                setIsEditing(false);
            } else {
                Toast({ title: "Enregistrement impossible", content: data.error, variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to save user:", error);
            Toast({
                title: "Enregistrement impossible",
                content: "Impossible d'enregistrer le profil.",
                variant: "destructive",
            });
        }
    };

    const isOwner = session?.user?.id === id;
    const isAdmin = session?.user?.role === "Admin";


    if (loading || !id) {
        return (
            <div className="min-h-screen bg-[var(--wk-paper)]">
                <div className={`${PAGE_CONTAINER} py-10`}>
                    <div className="flex items-center gap-5">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-64 rounded-2xl" />
                            <Skeleton className="h-4 w-40 rounded-full" />
                        </div>
                    </div>
                    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <Skeleton className="h-[420px] rounded-3xl" />
                        <Skeleton className="h-[420px] rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    const card = "rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white";
    const cardTitle = "font-serif-display flex items-center gap-2.5 text-2xl";
    const flameLevel = getFlameLevel(currentStreak);
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        : null;

    const stats = [
        { icon: FileText, value: pagination.totalRevisions, label: "fiches créées", color: "text-[var(--wk-accent)]" },
        { icon: HelpCircle, value: pagination.totalQuestions, label: "questions posées", color: "text-[#2f86b3]" },
        { icon: MessageCircle, value: pagination.totalAnswers, label: "réponses données", color: "text-emerald-600" },
        { icon: Gift, value: formData.badges?.length || 0, label: "badges gagnés", color: "text-[#9b6ef3]" },
    ];

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            {/* ─── En-tête ─── */}
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className={`${PAGE_CONTAINER} relative pb-10 pt-10 md:pb-14 md:pt-14`}>
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            <div className="shrink-0">
                                <ProfileAvatar username={formData.username} size="large" userId={id} role={user?.role} points={formData.points} />
                            </div>
                            <div className="min-w-0">
                                <Eyebrow>{isOwner ? "Mon profil" : "Profil"}</Eyebrow>
                                <h1 className="font-serif-display mt-3 break-words text-[clamp(2.2rem,5vw,3.75rem)] leading-[0.95]">
                                    {formData.username}
                                    <span className="text-[var(--wk-accent)]">.</span>
                                </h1>
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                                        style={{ backgroundColor: `${userRank.color}18`, color: userRank.color, border: `1px solid ${userRank.color}30` }}
                                    >
                                        {userRank.badge} {userRank.name} · Niv. {userRank.level}
                                    </span>
                                    {memberSince && (
                                        <span className="inline-flex items-center gap-1.5 text-sm text-[rgba(26,21,18,0.55)]">
                                            <CalendarDays className="h-4 w-4" /> Membre depuis {memberSince}
                                        </span>
                                    )}
                                </div>
                                {formData.bio && (
                                    <p className="mt-4 max-w-[60ch] leading-relaxed text-[rgba(26,21,18,0.68)]">{formData.bio}</p>
                                )}
                            </div>
                        </div>

                        {/* Chiffres clés */}
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <span className="wk-chip !px-3.5 !py-2 text-sm" title="Points">
                                <Image src="/badge/points.png" alt="" width={16} height={16} className="object-contain" />
                                {formatPoints(formData.points)} pts
                            </span>
                            {isOwner && (
                                <span className="wk-chip !px-3.5 !py-2 text-sm" title="Gemmes">
                                    <Image src="/badge/diamond.png" alt="" width={16} height={16} className="object-contain" />
                                    {gems}
                                </span>
                            )}
                            <span className="wk-chip !px-3.5 !py-2 text-sm" title="Série de jours d'activité">
                                <FlameIcon level={flameLevel} size={16} />
                                {currentStreak} j
                            </span>
                            {id && formData.username && <ProfileFriends userId={id} username={formData.username} variant="pill" />}
                            {(isOwner || isAdmin) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(true);
                                        document.getElementById("parametres")?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    className="wk-btn-ink !py-2 text-sm"
                                >
                                    <Pencil className="h-4 w-4" /> Modifier le profil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
                    {/* ─── Colonne principale ─── */}
                    <main className="min-w-0 space-y-6">
                        {/* Activité */}
                        <section className={`${card} p-5 sm:p-6`}>
                            <h2 className={cardTitle}>
                                <Activity className="h-5 w-5 text-[var(--wk-accent)]" /> Activité
                            </h2>
                            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {stats.map((s) => (
                                    <div key={s.label} className="rounded-2xl bg-[var(--wk-paper)] p-4">
                                        <s.icon className={`h-5 w-5 ${s.color}`} />
                                        <p className="font-serif-display mt-2 text-3xl leading-none">{s.value}</p>
                                        <p className="mt-1 text-xs text-[rgba(26,21,18,0.55)]">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5">
                                <ContributionGraph userId={id} />
                            </div>
                        </section>

                        {/* Compétences — uniquement visibles par le propriétaire */}
                        {isOwner && <AccountCompetencies />}

                        {/* Fiches */}
                        <section>
                            <h2 className={`${cardTitle} mb-4`}>
                                <FileText className="h-5 w-5 text-[var(--wk-accent)]" /> Fiches de révision
                                <span className="text-base text-[rgba(26,21,18,0.45)]">({pagination.totalRevisions})</span>
                            </h2>
                            {revisions.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {revisions.map((f) => (
                                        <FicheTile
                                            key={f._id}
                                            f={{
                                                id: String(f._id),
                                                title: f.title,
                                                subject: f.subject,
                                                level: f.level,
                                                status: f.status,
                                                content: f.content,
                                                likes: f.likes,
                                                comments: f.comments,
                                                date: f.createdAt,
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty icon={FileText} text={isOwner ? "Tu n'as pas encore publié de fiche." : "Aucune fiche publiée."} href={isOwner ? "/fiches/creer" : undefined} cta="Déposer une fiche" />
                            )}
                        </section>

                        {/* Questions */}
                        <section>
                            <h2 className={`${cardTitle} mb-4`}>
                                <HelpCircle className="h-5 w-5 text-[#2f86b3]" /> Questions posées
                                <span className="text-base text-[rgba(26,21,18,0.45)]">({pagination.totalQuestions})</span>
                            </h2>
                            {questions.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {questions.map((q) => (
                                        <Link
                                            key={q._id}
                                            href={`/forum/${buildIdSlug(q._id, q.title)}`}
                                            className={`${card} group flex min-w-0 flex-col p-5 transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_12px_32px_rgba(26,21,18,0.07)]`}
                                        >
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                                {q.subject && <SubjectLabel subject={q.subject} className="min-w-0" />}
                                                {q.classLevel && <LevelChip level={q.classLevel} />}
                                                <StatusChip status={q.status} className="ml-auto" />
                                            </div>
                                            <h3 className="font-serif-display mt-3 text-xl leading-snug line-clamp-2 [overflow-wrap:anywhere] group-hover:text-[#c24a0a]">{q.title}</h3>
                                            <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[rgba(26,21,18,0.55)]">
                                                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {q.answersCount ?? 0} réponse{(q.answersCount ?? 0) > 1 ? "s" : ""}</span>
                                                <span className="ml-auto">{relativeTime(q.createdAt)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <Empty icon={HelpCircle} text="Aucune question posée." />
                            )}
                        </section>

                        {/* Réponses */}
                        <section>
                            <h2 className={`${cardTitle} mb-4`}>
                                <MessageCircle className="h-5 w-5 text-emerald-600" /> Réponses données
                                <span className="text-base text-[rgba(26,21,18,0.45)]">({pagination.totalAnswers})</span>
                            </h2>
                            {answers.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {answers.map((a) => (
                                        <Link
                                            key={a._id}
                                            href={`/forum/${buildIdSlug(a.question?._id || "", a.question?.title || "")}`}
                                            className={`${card} group flex min-w-0 flex-col p-5 transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_12px_32px_rgba(26,21,18,0.07)]`}
                                        >
                                            <span className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">En réponse à</span>
                                            <h3 className="mt-1 font-semibold leading-snug line-clamp-2 [overflow-wrap:anywhere] group-hover:text-[#c24a0a]">{a.question?.title || "Question supprimée"}</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-[rgba(26,21,18,0.62)] line-clamp-3 [overflow-wrap:anywhere]">{plainExcerpt(a.content, 160)}</p>
                                            <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[rgba(26,21,18,0.55)]">
                                                {typeof a.likes === "number" && (
                                                    <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {a.likes}</span>
                                                )}
                                                {a.status === "Meilleure Réponse" && <span className="font-semibold text-emerald-700">Meilleure réponse</span>}
                                                {a.status === "Validée" && <span className="font-semibold text-[#2f86b3]">Validée</span>}
                                                <span className="ml-auto">{relativeTime(a.createdAt)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <Empty icon={MessageCircle} text="Aucune réponse donnée." />
                            )}
                        </section>

                        {/* Pagination commune aux fiches, questions et réponses */}
                        {pagination.totalPages > 1 && (
                            <nav className="flex items-center justify-center gap-1 border-t border-[rgba(26,21,18,0.08)] pt-6" aria-label="Pagination">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Précédent</span>
                                </button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-[rgba(26,21,18,0.3)]">…</span>}
                                            <button
                                                type="button"
                                                onClick={() => handlePageChange(p)}
                                                aria-current={pagination.page === p ? "page" : undefined}
                                                className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                                                    pagination.page === p ? "bg-[var(--wk-ink)] text-[var(--wk-paper)]" : "hover:bg-white"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span className="hidden sm:inline">Suivant</span> <ChevronRight className="h-4 w-4" />
                                </button>
                            </nav>
                        )}
                    </main>

                    {/* ─── Colonne latérale ─── */}
                    <aside className="min-w-0 space-y-6">
                        <section className={`${card} p-5 sm:p-6`}>
                            <h2 className={cardTitle}>
                                <Crown className="h-5 w-5 text-[var(--wk-accent)]" /> Progression
                            </h2>
                            <div className="mt-4">
                                <UserRank points={formData.points} />
                            </div>
                        </section>

                        <section className={`${card} p-5 sm:p-6`}>
                            <h2 className={cardTitle}>
                                <Gift className="h-5 w-5 text-[var(--wk-accent)]" /> Badges
                            </h2>
                            <div className="mt-4">
                                <BadgeDisplay userId={id} />
                            </div>
                        </section>

                        {id && formData.username && <ProfileFriends userId={id} username={formData.username} />}

                        {/* Paramètres — propriétaire ou administrateur */}
                        {(isOwner || isAdmin) && (
                            <section id="parametres" className={`${card} scroll-mt-24 p-5 sm:p-6`}>
                                <h2 className={cardTitle}>
                                    <Settings className="h-5 w-5 text-[var(--wk-accent)]" /> Paramètres
                                </h2>
                                <div className="mt-5 space-y-4">
                                    <Field label="Nom" id="name">
                                        <input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            disabled={!isEditing}
                                            className={fieldClass}
                                        />
                                    </Field>
                                    <Field label="Nom d'utilisateur" id="username">
                                        <input
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            disabled={!isEditing}
                                            className={fieldClass}
                                        />
                                    </Field>
                                    <Field label="Bio" id="bio">
                                        <textarea
                                            id="bio"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            disabled={!isEditing}
                                            rows={3}
                                            className={`${fieldClass} resize-y`}
                                        />
                                    </Field>

                                    <div className="flex justify-end gap-2">
                                        {isEditing ? (
                                            <>
                                                <button type="button" onClick={handleCancel} className="wk-btn-ghost !py-2 text-sm">Annuler</button>
                                                <button type="button" onClick={handleSave} className="wk-btn-orange !py-2 text-sm">Enregistrer</button>
                                            </>
                                        ) : (
                                            <button type="button" onClick={() => setIsEditing(true)} className="wk-btn-ink !py-2 text-sm">
                                                <Pencil className="h-4 w-4" /> Modifier
                                            </button>
                                        )}
                                    </div>

                                    {/* Newsletter */}
                                    {newsletterPrefs !== null && (
                                        <div className="space-y-2 border-t border-[rgba(26,21,18,0.06)] pt-5">
                                            <p className="flex items-center gap-2 text-sm font-semibold">
                                                <Mail className="h-4 w-4 text-[var(--wk-accent)]" /> Newsletter
                                            </p>
                                            <Toggle
                                                label="Newsletter hebdomadaire"
                                                hint="Le récap de ton activité et du nouveau contenu, chaque semaine"
                                                checked={newsletterPrefs.hebdo}
                                                disabled={newsletterLoading}
                                                onToggle={() => toggleNewsletterPref("hebdo")}
                                            />
                                            <Toggle
                                                label="Newsletters classiques"
                                                hint="Annonces, nouveautés et actualités de Workyt"
                                                checked={newsletterPrefs.classique}
                                                disabled={newsletterLoading}
                                                onToggle={() => toggleNewsletterPref("classique")}
                                            />

                                            {/* Déclaration des 15 ans — demandée UNE fois, au moment
                                                de s'abonner, jamais à l'inscription au site. C'est le
                                                seul traitement fondé sur le consentement, donc le seul
                                                où l'âge compte. */}
                                            {attenteAge && (
                                                <div className="space-y-3 rounded-2xl border border-[rgba(255,106,26,0.3)] bg-[rgba(255,106,26,0.05)] p-4">
                                                    <p className="text-sm text-[rgba(26,21,18,0.75)]">
                                                        La newsletter repose sur ton consentement. En France, la majorité numérique est fixée à
                                                        15 ans : en dessous, un parent doit faire la demande à{" "}
                                                        <a href="mailto:admin@workyt.fr" className="font-semibold text-[#c24a0a] underline">admin@workyt.fr</a>.
                                                    </p>
                                                    <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold">
                                                        <input
                                                            type="checkbox"
                                                            checked={ageCoche}
                                                            onChange={(e) => setAgeCoche(e.target.checked)}
                                                            className="mt-0.5 h-4 w-4 accent-[#ff6a1a]"
                                                        />
                                                        Je déclare avoir 15 ans ou plus.
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => envoyerPref(attenteAge, true, true)}
                                                            disabled={!ageCoche || newsletterLoading}
                                                            className="wk-btn-orange !py-2 text-sm disabled:opacity-50"
                                                        >
                                                            Confirmer mon inscription
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setAttenteAge(null); setAgeCoche(false); }}
                                                            className="wk-btn-ghost !py-2 text-sm"
                                                        >
                                                            Annuler
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}

const fieldClass =
    "w-full rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--wk-accent)] focus:ring-4 focus:ring-[rgba(255,106,26,0.12)] disabled:bg-[var(--wk-paper)] disabled:text-[rgba(26,21,18,0.7)]";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>
            {children}
        </div>
    );
}

function Toggle({ label, hint, checked, disabled, onToggle }: { label: string; hint: string; checked: boolean; disabled: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--wk-paper)] p-4">
            <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-[rgba(26,21,18,0.55)]">{hint}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={onToggle}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    checked ? "bg-[var(--wk-accent)]" : "bg-[rgba(26,21,18,0.2)]"
                } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
            </button>
        </div>
    );
}

function Empty({
    icon: Icon,
    text,
    href,
    cta,
}: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
    href?: string;
    cta?: string;
}) {
    return (
        <div className="rounded-3xl border border-dashed border-[rgba(26,21,18,0.18)] bg-white/60 px-6 py-10 text-center">
            <Icon className="mx-auto h-7 w-7 text-[rgba(26,21,18,0.3)]" />
            <p className="mt-3 text-sm text-[rgba(26,21,18,0.6)]">{text}</p>
            {href && cta && (
                <Link href={href} className="mt-4 inline-block text-sm font-semibold text-[var(--wk-accent)] hover:underline">
                    {cta}
                </Link>
            )}
        </div>
    );
}
