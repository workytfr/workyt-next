"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Flame,
    MoreHorizontal,
    Pause,
    Play,
    LogOut,
    Flag,
    CheckCircle2,
    Clock,
    Target,
    BookOpen,
    LineChart,
    NotebookPen,
    MessagesSquare,
    HandHeart,
    AlertCircle,
    Lock,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportModal from "@/components/ReportModal";
import { useThreadRealtime } from "@/hooks/useThreadRealtime";
import { ANNOUNCED_DELAY_HOURS, FORMAT_LABELS, GOAL_TYPE_LABELS, OUTCOME_LABELS } from "@/lib/mentorship/config";
import { api, ApiError, openAuth, formatDate, daysSince, type Message, type MentorshipDetail } from "../../_lib/client";
import { Eyebrow, StatusPill, Initial, Spinner, Card } from "../ui";
import Conversation from "./Conversation";
import PlanPanel from "./PlanPanel";
import ResourcesPanel from "./ResourcesPanel";
import ProgressPanel from "./ProgressPanel";
import NotesPanel from "./NotesPanel";
import ActionDialog, { type ActionKind } from "./Dialogs";

type Tab = "chat" | "plan" | "resources" | "progress" | "notes";

export default function SuiviWorkspace({ id }: { id: string }) {
    const { data: session, status: sessionStatus } = useSession();
    const myId = (session?.user as { id?: string } | undefined)?.id || "";

    const [detail, setDetail] = useState<MentorshipDetail | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<{ status: number; message: string } | null>(null);
    const [tab, setTab] = useState<Tab>("plan");
    const [mobileTab, setMobileTab] = useState<Tab>("chat");
    const [dialog, setDialog] = useState<ActionKind>(null);
    const lastAt = useRef<string | null>(null);

    const loadDetail = useCallback(async () => {
        try {
            setDetail(await api<MentorshipDetail>(`/api/suivi/${id}`));
            setError(null);
        } catch (err) {
            setError({ status: err instanceof ApiError ? err.status : 500, message: err instanceof Error ? err.message : "Erreur" });
        }
    }, [id]);

    const loadMessages = useCallback(async () => {
        try {
            const since = lastAt.current ? `?since=${encodeURIComponent(lastAt.current)}` : "";
            const fresh = await api<Message[]>(`/api/suivi/${id}/messages${since}`);
            if (!fresh.length) return;
            lastAt.current = fresh[fresh.length - 1].createdAt;
            setMessages((prev) => {
                const seen = new Set(prev.map((m) => m.id));
                return [...prev, ...fresh.filter((m) => !seen.has(m.id))];
            });
        } catch {
            /* le candidat n'a pas accès au fil : normal */
        }
    }, [id]);

    const refresh = useCallback(async () => {
        await loadDetail();
        await loadMessages();
    }, [loadDetail, loadMessages]);

    // Premier chargement : le suivi, puis son fil
    useEffect(() => {
        if (sessionStatus !== "authenticated") return;
        api<MentorshipDetail>(`/api/suivi/${id}`)
            .then((d) => {
                setDetail(d);
                return loadMessages();
            })
            .catch((err) =>
                setError({ status: err instanceof ApiError ? err.status : 500, message: err instanceof Error ? err.message : "Erreur" })
            );
    }, [sessionStatus, id, loadMessages]);

    // Temps réel : la salle secrète du suivi ne signale que « du nouveau »
    const room = detail?.roomKey ? `mentorship:${detail.roomKey}` : undefined;
    const { typingUsers, startTyping, stopTyping, presentMembers } = useThreadRealtime(room, refresh);

    // Filet de sécurité si le temps réel est indisponible : relève toutes les 30 s
    useEffect(() => {
        if (!detail || detail.viewer === "candidate") return;
        const t = setInterval(() => {
            if (document.visibilityState === "visible") refresh();
        }, 30_000);
        return () => clearInterval(t);
    }, [detail, refresh]);

    // ── États de chargement / accès ──
    if (sessionStatus === "unauthenticated") {
        return (
            <Shell>
                <Card className="mx-auto max-w-md p-8 text-center">
                    <Lock className="mx-auto h-6 w-6 text-[rgba(26,21,18,0.4)]" />
                    <p className="mt-3 font-semibold">Ce suivi est privé</p>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">Connecte-toi pour y accéder.</p>
                    <button type="button" onClick={openAuth} className="wk-btn-ink mt-6">Connexion</button>
                </Card>
            </Shell>
        );
    }
    if (error) {
        return (
            <Shell>
                <Card className="mx-auto max-w-md p-8 text-center">
                    <AlertCircle className="mx-auto h-6 w-6 text-[rgba(26,21,18,0.4)]" />
                    <p className="mt-3 font-semibold">{error.status === 404 ? "Suivi introuvable" : "Impossible de charger le suivi"}</p>
                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                        {error.status === 404 ? "Il n'existe pas, ou tu n'y as pas accès." : error.message}
                    </p>
                    <Link href="/suivi" className="wk-btn-ink mt-6">Retour</Link>
                </Card>
            </Shell>
        );
    }
    if (!detail) {
        return (
            <Shell>
                <div className="flex justify-center py-24">
                    <Spinner className="h-7 w-7" />
                </div>
            </Shell>
        );
    }
    if (detail.viewer === "candidate") {
        return (
            <Shell>
                <CandidateView detail={detail} onTaken={refresh} />
            </Shell>
        );
    }

    const staff = detail.viewer === "mentor" || detail.viewer === "moderator";
    const isOpen = detail.status === "active" || detail.status === "paused";
    const other = detail.viewer === "student" ? detail.mentor : detail.student;
    const otherOnline = !!other && presentMembers.some((p) => p.userId === other.id);

    const sideTabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: "plan", label: "Plan", icon: Target },
        { id: "resources", label: "Ressources", icon: BookOpen },
        ...(staff
            ? [
                  { id: "progress" as Tab, label: "Progression", icon: LineChart },
                  { id: "notes" as Tab, label: "Notes", icon: NotebookPen },
              ]
            : []),
    ];

    const panel = (t: Tab) => {
        if (t === "plan") return <PlanPanel detail={detail} onChange={refresh} />;
        if (t === "resources") return <ResourcesPanel detail={detail} onChange={refresh} />;
        if (t === "progress") return <ProgressPanel mentorshipId={detail.id} studentName={detail.student?.username || "l'élève"} />;
        if (t === "notes") return <NotesPanel detail={detail} />;
        return null;
    };

    const openToDo = (detail.assignments || []).filter((a) => !a.doneAt).length;

    return (
        <Shell>
            {/* ─── En-tête ─── */}
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <Link
                        href={staff ? "/dashboard/suivis" : "/suivi"}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(26,21,18,0.55)] hover:text-[var(--wk-ink)]"
                    >
                        <ArrowLeft className="h-4 w-4" /> {staff ? "Mes suivis" : "Mon espace suivi"}
                    </Link>
                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                        <Eyebrow>{detail.level} · {FORMAT_LABELS[detail.format]?.label}</Eyebrow>
                        <StatusPill status={detail.status} />
                        {detail.viewer === "moderator" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--wk-ink)] px-2.5 py-0.5 text-xs font-semibold text-white">
                                <ShieldCheck className="h-3.5 w-3.5" /> Vue modération
                            </span>
                        )}
                    </div>
                    <h1 className="font-serif-display mt-2 text-4xl leading-none sm:text-5xl">{detail.subject}</h1>
                    <p className="mt-2 text-sm text-[rgba(26,21,18,0.6)]">{GOAL_TYPE_LABELS[detail.goalType]}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {other && (
                        <span className="wk-chip !py-1.5 !pl-1.5">
                            <span className="relative">
                                <Initial name={other.username} tone="orange" size={24} />
                                {otherOnline && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />}
                            </span>
                            {other.username}
                            <span className="font-normal text-[rgba(26,21,18,0.5)]">
                                {detail.viewer === "student" ? "· bénévole" : "· élève"}
                            </span>
                        </span>
                    )}
                    {(detail.duoStreak?.current || 0) > 0 && (
                        <span className="wk-chip !py-1.5" title={`Record : ${detail.duoStreak?.best} semaines`}>
                            <Flame className="h-4 w-4 text-[var(--wk-accent)]" />
                            Série du binôme : {detail.duoStreak?.current} sem.
                        </span>
                    )}

                    <ReportModal
                        contentId={detail.id}
                        contentType="mentorship"
                        trigger={
                            <button type="button" className="wk-chip !py-1.5 hover:border-red-300 hover:text-red-600" aria-label="Signaler ce suivi">
                                <Flag className="h-3.5 w-3.5" /> Signaler
                            </button>
                        }
                    />

                    {(isOpen || (detail.status === "pending" && detail.viewer === "student")) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="wk-chip !py-1.5" aria-label="Actions du suivi">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                                {detail.status === "pending" && (
                                    <DropdownMenuItem onClick={() => setDialog("cancel")} className="text-red-600">
                                        <XCircle className="mr-2 h-4 w-4" /> Annuler ma demande
                                    </DropdownMenuItem>
                                )}
                                {staff && detail.status === "active" && (
                                    <DropdownMenuItem onClick={() => setDialog("pause")}>
                                        <Pause className="mr-2 h-4 w-4" /> Mettre en pause
                                    </DropdownMenuItem>
                                )}
                                {staff && detail.status === "paused" && (
                                    <DropdownMenuItem onClick={() => setDialog("resume")}>
                                        <Play className="mr-2 h-4 w-4" /> Reprendre
                                    </DropdownMenuItem>
                                )}
                                {staff && isOpen && (
                                    <DropdownMenuItem onClick={() => setDialog("release")}>
                                        <HandHeart className="mr-2 h-4 w-4" /> Passer la main
                                    </DropdownMenuItem>
                                )}
                                {staff && isOpen && (
                                    // Le bénévole sèche ? Il pose la question au forum, sans nommer l'élève
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/forum/creer?subject=${encodeURIComponent(detail.subject)}&classLevel=${encodeURIComponent(detail.level)}`}
                                            target="_blank"
                                        >
                                            <MessagesSquare className="mr-2 h-4 w-4" /> Demander à la communauté
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {isOpen && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setDialog("close")} className={staff ? "" : "text-red-600"}>
                                            {staff ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <LogOut className="mr-2 h-4 w-4" />}
                                            {staff ? "Terminer le suivi" : "Arrêter le suivi"}
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* ─── Bandeaux d'état ─── */}
            <div className="mt-6 space-y-3">
                {detail.status === "pending" && (
                    <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                        <div>
                            <p className="font-semibold text-amber-900">
                                {detail.matchedAt ? "Un nouveau bénévole va reprendre ton suivi." : "Ta demande est dans la file d'attente."}
                            </p>
                            <p className="mt-0.5 text-amber-900/75">
                                Un bénévole te répond en général sous {ANNOUNCED_DELAY_HOURS} h — tu recevras une notification. En attendant,
                                tu peux ajouter des précisions ci-dessous : il les lira en premier.
                            </p>
                        </div>
                    </div>
                )}
                {detail.status === "paused" && (
                    <div className="flex items-center gap-3 rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                        <Pause className="h-5 w-5 shrink-0" />
                        Suivi en pause depuis le {formatDate(detail.pausedAt)}. Les messages restent possibles.
                    </div>
                )}
                {detail.status === "closed" && detail.closure && <ClosureBanner detail={detail} onChange={refresh} />}
                {detail.status === "cancelled" && (
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.1)] bg-white p-4 text-sm text-[rgba(26,21,18,0.65)]">
                        Cette demande a été annulée.{" "}
                        {detail.viewer === "student" && (
                            <Link href="/suivi#demande" className="font-semibold text-[var(--wk-accent)]">Refaire une demande</Link>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Onglets mobiles ─── */}
            <div className="mt-6 flex gap-1 overflow-x-auto rounded-full border border-[rgba(26,21,18,0.08)] bg-white p-1 lg:hidden" role="tablist">
                {[{ id: "chat" as Tab, label: "Conversation", icon: MessagesSquare }, ...sideTabs].map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={mobileTab === t.id}
                        onClick={() => setMobileTab(t.id)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                            mobileTab === t.id ? "bg-[var(--wk-ink)] text-white" : "text-[rgba(26,21,18,0.6)]"
                        }`}
                    >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                        {t.id === "resources" && openToDo > 0 && (
                            <span className="rounded-full bg-[var(--wk-accent)] px-1.5 text-[10px] text-white">{openToDo}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ─── Espace de travail ─── */}
            <div className="mt-4 grid grid-cols-1 gap-5 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_400px]">
                <section
                    className={`${mobileTab === "chat" ? "flex" : "hidden"} h-[72vh] min-h-[480px] flex-col overflow-hidden rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white lg:flex lg:h-[calc(100vh-15rem)] lg:min-h-[560px]`}
                    aria-label="Conversation"
                >
                    <Conversation
                        detail={detail}
                        messages={messages}
                        myId={myId}
                        typingUsers={typingUsers}
                        startTyping={startTyping}
                        stopTyping={stopTyping}
                        onSent={refresh}
                    />
                </section>

                <aside className={`${mobileTab === "chat" ? "hidden" : "block"} lg:block`}>
                    <div className="mb-3 hidden gap-1 rounded-full border border-[rgba(26,21,18,0.08)] bg-white p-1 lg:flex" role="tablist">
                        {sideTabs.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-semibold transition ${
                                    tab === t.id ? "bg-[var(--wk-ink)] text-white" : "text-[rgba(26,21,18,0.6)] hover:text-[var(--wk-ink)]"
                                }`}
                            >
                                <t.icon className="h-3.5 w-3.5" />
                                {t.label}
                                {t.id === "resources" && openToDo > 0 && (
                                    <span className="rounded-full bg-[var(--wk-accent)] px-1.5 text-[10px] text-white">{openToDo}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 lg:max-h-[calc(100vh-18rem)] lg:overflow-y-auto">
                        {/* Mobile : l'onglet choisi ; bureau : l'onglet latéral */}
                        <div className="lg:hidden">{mobileTab !== "chat" && panel(mobileTab)}</div>
                        <div className="hidden lg:block">{panel(tab)}</div>
                    </div>

                    {detail.viewer === "student" && detail.mentor?.bio && (
                        <div className="mt-4 rounded-3xl bg-[var(--wk-paper-2)] p-5 text-sm">
                            <div className="flex items-center gap-2.5">
                                <Initial name={detail.mentor.username} tone="orange" size={32} />
                                <div>
                                    <div className="font-semibold">{detail.mentor.username}</div>
                                    <div className="text-xs text-[rgba(26,21,18,0.55)]">Ton bénévole depuis le {formatDate(detail.matchedAt)}</div>
                                </div>
                            </div>
                            <p className="mt-3 leading-relaxed text-[rgba(26,21,18,0.75)]">{detail.mentor.bio}</p>
                        </div>
                    )}
                </aside>
            </div>

            <ActionDialog kind={dialog} detail={detail} onClose={() => setDialog(null)} onDone={refresh} />
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <div className="mx-auto max-w-[1300px] px-4 pb-16 pt-8 sm:px-6">{children}</div>
        </div>
    );
}

/* ─── Bilan de fin de suivi ─── */

function ClosureBanner({ detail, onChange }: { detail: MentorshipDetail; onChange: () => void }) {
    const c = detail.closure!;
    const [busy, setBusy] = useState(false);
    const success = c.outcome === "goal_reached";

    const give = async (feedback: string) => {
        setBusy(true);
        try {
            await api(`/api/suivi/${detail.id}`, { method: "PATCH", json: { action: "feedback", feedback } });
            onChange();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={`rounded-3xl border p-5 ${success ? "border-emerald-200 bg-emerald-50" : "border-[rgba(26,21,18,0.1)] bg-white"}`}>
            <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className={`h-5 w-5 ${success ? "text-emerald-600" : "text-[rgba(26,21,18,0.5)]"}`} />
                Suivi terminé le {formatDate(detail.closedAt)}
                {!c.byStudent && <span className="font-normal text-[rgba(26,21,18,0.6)]">· {OUTCOME_LABELS[c.outcome]}</span>}
            </div>
            {c.summary && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[rgba(26,21,18,0.8)]">{c.summary}</p>}
            {detail.viewer === "student" && !c.studentFeedback && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="mr-1 font-semibold">Ce suivi t&apos;a-t-il aidé ?</span>
                    {[
                        ["helpful", "Oui"],
                        ["neutral", "Un peu"],
                        ["not_helpful", "Pas vraiment"],
                    ].map(([k, l]) => (
                        <button key={k} type="button" disabled={busy} onClick={() => give(k)} className="wk-chip hover:border-[var(--wk-ink)]">
                            {l}
                        </button>
                    ))}
                </div>
            )}
            {detail.viewer === "student" && (
                <Link href="/suivi#demande" className="mt-4 inline-block text-sm font-semibold text-[var(--wk-accent)]">
                    Refaire une demande
                </Link>
            )}
        </div>
    );
}

/* ─── Un bénévole consulte une demande en file ─── */

function CandidateView({ detail, onTaken }: { detail: MentorshipDetail; onTaken: () => void }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const p = detail.myMentorProfile;
    const full = !!p && p.activeCount >= p.maxActive;
    const waited = daysSince(detail.createdAt);

    const take = async () => {
        setBusy(true);
        setError(null);
        try {
            await api(`/api/suivi/${detail.id}`, { method: "PATCH", json: { action: "take" } });
            onTaken();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Impossible de prendre la demande.");
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <Link href="/dashboard/suivis" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgba(26,21,18,0.55)] hover:text-[var(--wk-ink)]">
                <ArrowLeft className="h-4 w-4" /> File d&apos;attente
            </Link>
            <Card className="mt-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                    <Eyebrow>Demande de suivi</Eyebrow>
                    {detail.resumed && <span className="wk-chip !border-[var(--wk-accent)] text-[var(--wk-accent)]">Reprise après relais</span>}
                </div>
                <h1 className="font-serif-display mt-3 text-4xl leading-none">{detail.subject}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="wk-chip">{detail.level}</span>
                    <span className="wk-chip">{FORMAT_LABELS[detail.format]?.label}</span>
                    <span className="wk-chip">{GOAL_TYPE_LABELS[detail.goalType]}</span>
                    <span className="wk-chip">
                        <Clock className="h-3.5 w-3.5" /> {waited === 0 ? "aujourd'hui" : `il y a ${waited} j`}
                    </span>
                </div>

                <div className="mt-6 rounded-2xl bg-[var(--wk-paper)] p-4">
                    <div className="text-xs font-semibold text-[rgba(26,21,18,0.55)]">{detail.student?.username} écrit :</div>
                    <p className="mt-1.5 whitespace-pre-line leading-relaxed">{detail.need}</p>
                    {detail.availability && <p className="mt-2 text-sm text-[rgba(26,21,18,0.6)]">Disponibilités : {detail.availability}</p>}
                </div>

                {detail.handoffNote && (
                    <div className="mt-4 rounded-2xl border border-[rgba(26,21,18,0.1)] p-4 text-sm">
                        <div className="text-xs font-semibold text-[rgba(26,21,18,0.55)]">Mot du bénévole précédent</div>
                        <p className="mt-1 whitespace-pre-line">{detail.handoffNote}</p>
                    </div>
                )}

                {!p?.charterAccepted ? (
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        Avant de prendre un premier suivi, lis et accepte la charte du bénévole.{" "}
                        <Link href="/dashboard/suivis?tab=profil" className="font-semibold underline">Accepter la charte</Link>
                    </div>
                ) : full ? (
                    <div className="mt-6 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-[var(--wk-paper)] p-4 text-sm">
                        Tu accompagnes déjà {p.activeCount} élève{p.activeCount > 1 ? "s" : ""} (ton maximum : {p.maxActive}). Prendre soin de
                        toi, c&apos;est aussi prendre soin d&apos;eux.
                    </div>
                ) : p?.status === "paused" ? (
                    <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                        Tu es en pause. Repasse « disponible » dans ton profil pour prendre des demandes.
                    </div>
                ) : (
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-[rgba(26,21,18,0.6)]">
                            Tu t&apos;engages à répondre sous 3 jours. Tu pourras passer la main à tout moment.
                        </p>
                        <button type="button" onClick={take} disabled={busy} className="wk-btn-orange justify-center">
                            {busy && <Spinner className="h-4 w-4 !border-white/40 !border-t-white" />}
                            Prendre cette demande
                        </button>
                    </div>
                )}
                {error && <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </Card>
        </div>
    );
}
