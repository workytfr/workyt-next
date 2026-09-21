"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Inbox, HeartHandshake, Clock, Users, AlertTriangle, ShieldAlert, Flag, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MENTOR_REMINDER_DAYS, MENTOR_TIMEOUT_DAYS } from "@/lib/mentorship/config";
import { api, ApiError, daysSince, formatDate, type MentorshipSummary, type PublicUser } from "@/app/suivi/_lib/client";
import type { Engagement } from "./ProfileTab";

interface MentorRow {
    user: PublicUser;
    status: "available" | "paused";
    maxActive: number;
    activeCount: number;
    subjects: string[];
    levels: string[];
    charterAccepted: boolean;
    charterAcceptedAt: string | null;
}

interface AdminData {
    stats: {
        pending: number;
        active: number;
        paused: number;
        closedLast30: number;
        goalReachedLast30: number;
        matchedLast30: number;
        avgWaitHours: number | null;
        mentorsReady: number;
        mentorsAvailable: number;
        freeSeats: number;
        openReports: number;
    };
    queue: MentorshipSummary[];
    open: (MentorshipSummary & { waitingForMentorDays: number })[];
    mentors: MentorRow[];
    blocked: { id: string; mentorshipId: string; author: PublicUser | null; authorRole: string; text: string; reasons: string[]; createdAt: string }[];
}

/**
 * Le pilotage du dispositif. La question qui compte n'est pas technique :
 * y a-t-il assez de bénévoles pour la demande ? Les chiffres du haut y
 * répondent en un coup d'œil (demandes en attente vs places libres).
 */
export default function AdminTab() {
    const [data, setData] = useState<AdminData | null>(null);
    const [engagementOf, setEngagementOf] = useState<{ user: PublicUser; engagement: Engagement } | null>(null);

    const load = useCallback(async () => {
        try {
            setData(await api<AdminData>("/api/suivi/admin"));
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Pilotage indisponible");
        }
    }, []);

    useEffect(() => {
        api<AdminData>("/api/suivi/admin")
            .then(setData)
            .catch((err) => toast.error(err instanceof ApiError ? err.message : "Pilotage indisponible"));
    }, []);

    const assign = async (mentorshipId: string, mentorId: string) => {
        if (!mentorId) return;
        try {
            await api(`/api/suivi/${mentorshipId}`, { method: "PATCH", json: { action: "assign", mentorId } });
            toast.success("Suivi attribué");
            load();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Attribution impossible");
        }
    };

    const showEngagement = async (user: PublicUser) => {
        try {
            const d = await api<{ engagement: Engagement }>(`/api/suivi/mentor?userId=${user.id}`);
            setEngagementOf({ user, engagement: d.engagement });
        } catch {
            toast.error("Engagement indisponible");
        }
    };

    if (!data) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-accent)]" />
            </div>
        );
    }

    const { stats } = data;
    const ready = data.mentors.filter((m) => m.charterAccepted && m.status === "available" && m.activeCount < m.maxActive);
    const tension = stats.pending > stats.freeSeats;

    return (
        <div className="space-y-8">
            {/* ─── Chiffres ─── */}
            <div className="dash-stat-grid">
                <StatCard icon={Inbox} tone={tension ? "warning" : "primary"} value={stats.pending} label="demandes en attente" hint={`${stats.freeSeats} place${stats.freeSeats > 1 ? "s" : ""} libre${stats.freeSeats > 1 ? "s" : ""} chez les bénévoles`} />
                <StatCard icon={HeartHandshake} tone="success" value={stats.active} label="suivis en cours" hint={`${stats.paused} en pause`} />
                <StatCard icon={Clock} tone="info" value={stats.avgWaitHours === null ? "—" : `${stats.avgWaitHours} h`} label="attente moyenne (30 j)" hint={`${stats.matchedLast30} prises en charge`} />
                <StatCard icon={Users} tone="primary" value={stats.mentorsReady} label="bénévoles (charte signée)" hint={`${stats.mentorsAvailable} disponibles`} />
            </div>

            {tension && (
                <div className="dash-card flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Plus de demandes que de places libres. Le levier n&apos;est pas technique : il faut recruter ou mobiliser des bénévoles.
                </div>
            )}
            {stats.openReports > 0 && (
                <Link href="/dashboard/moderation" className="dash-card flex items-center gap-3 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                    <Flag className="h-4 w-4" /> {stats.openReports} signalement{stats.openReports > 1 ? "s" : ""} de suivi à traiter
                </Link>
            )}

            {/* ─── File ─── */}
            <section>
                <h2 className="mb-3 text-sm font-semibold text-[var(--dash-text-secondary)]">File d&apos;attente</h2>
                {data.queue.length === 0 ? (
                    <p className="text-sm text-[var(--dash-text-tertiary)]">Aucune demande en attente.</p>
                ) : (
                    <div className="dash-table-container">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Élève</th>
                                    <th>Matière</th>
                                    <th>Attente</th>
                                    <th>Attribuer à</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.queue.map((m) => {
                                    const d = daysSince(m.createdAt) || 0;
                                    const candidates = ready.filter(
                                        (r) => r.user.id !== m.student?.id && (!r.subjects.length || r.subjects.includes(m.subject))
                                    );
                                    return (
                                        <tr key={m.id}>
                                            <td>
                                                <Link href={`/suivi/${m.id}`} className="font-medium hover:text-[var(--dash-accent)]">{m.student?.username}</Link>
                                                {m.resumed && <span className="dash-badge dash-badge-primary ml-2">Reprise</span>}
                                            </td>
                                            <td>{m.subject} · {m.level}</td>
                                            <td className={d >= 2 ? "font-semibold text-red-600" : ""}>{d === 0 ? "aujourd'hui" : `${d} j`}</td>
                                            <td>
                                                <select defaultValue="" onChange={(e) => assign(m.id, e.target.value)} className="dash-input !w-auto !py-1 text-sm">
                                                    <option value="">{candidates.length ? "Choisir…" : "Aucun bénévole libre"}</option>
                                                    {candidates.map((c) => (
                                                        <option key={c.user.id} value={c.user.id}>
                                                            {c.user.username} ({c.activeCount}/{c.maxActive})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ─── Suivis en cours ─── */}
            <section>
                <h2 className="mb-3 text-sm font-semibold text-[var(--dash-text-secondary)]">Suivis en cours — les élèves qui attendent en premier</h2>
                {data.open.length === 0 ? (
                    <p className="text-sm text-[var(--dash-text-tertiary)]">Aucun suivi en cours.</p>
                ) : (
                    <div className="dash-table-container">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Élève</th>
                                    <th>Bénévole</th>
                                    <th>Matière</th>
                                    <th>Élève en attente</th>
                                    <th>Dernier message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.open.map((m) => (
                                    <tr key={m.id}>
                                        <td>
                                            <Link href={`/suivi/${m.id}`} className="font-medium hover:text-[var(--dash-accent)]">{m.student?.username}</Link>
                                        </td>
                                        <td>{m.mentor?.username}{m.status === "paused" && <span className="dash-badge dash-badge-info ml-2">Pause</span>}</td>
                                        <td>{m.subject}</td>
                                        <td
                                            className={
                                                m.waitingForMentorDays >= MENTOR_TIMEOUT_DAYS - 1
                                                    ? "font-semibold text-red-600"
                                                    : m.waitingForMentorDays >= MENTOR_REMINDER_DAYS
                                                      ? "font-semibold text-amber-600"
                                                      : "text-[var(--dash-text-tertiary)]"
                                            }
                                        >
                                            {m.waitingForMentorDays ? `${m.waitingForMentorDays} j` : "—"}
                                        </td>
                                        <td>{m.lastMessageAt ? formatDate(m.lastMessageAt, { day: "numeric", month: "short" }) : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ─── Bénévoles ─── */}
            <section>
                <h2 className="mb-3 text-sm font-semibold text-[var(--dash-text-secondary)]">Bénévoles accompagnants</h2>
                {data.mentors.length === 0 ? (
                    <p className="text-sm text-[var(--dash-text-tertiary)]">
                        Aucun bénévole n&apos;a encore ouvert son profil. Les Helpeurs le font depuis l&apos;onglet « Profil & charte ».
                    </p>
                ) : (
                    <div className="dash-table-container">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Bénévole</th>
                                    <th>Charte</th>
                                    <th>Statut</th>
                                    <th>Charge</th>
                                    <th>Matières</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {data.mentors.map((m) => (
                                    <tr key={m.user.id}>
                                        <td className="font-medium">{m.user.username}</td>
                                        <td>
                                            {m.charterAccepted ? (
                                                <span className="dash-badge dash-badge-success">Signée</span>
                                            ) : (
                                                <span className="dash-badge dash-badge-warning">Non signée</span>
                                            )}
                                        </td>
                                        <td>{m.status === "available" ? "Disponible" : "En pause"}</td>
                                        <td>{m.activeCount}/{m.maxActive}</td>
                                        <td className="max-w-[260px] truncate text-xs text-[var(--dash-text-secondary)]">
                                            {m.subjects.length ? m.subjects.join(", ") : "Toutes"}
                                        </td>
                                        <td>
                                            <button type="button" onClick={() => showEngagement(m.user)} className="dash-button dash-button-ghost dash-button-sm">
                                                Engagement
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ─── Messages bloqués ─── */}
            <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--dash-text-secondary)]">
                    <ShieldAlert className="h-4 w-4" /> Messages bloqués (coordonnées)
                </h2>
                {data.blocked.length === 0 ? (
                    <p className="text-sm text-[var(--dash-text-tertiary)]">Aucun message bloqué.</p>
                ) : (
                    <ul className="space-y-2">
                        {data.blocked.map((b) => (
                            <li key={b.id} className="dash-card p-4 text-sm">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dash-text-tertiary)]">
                                    <strong className="text-[var(--dash-text)]">{b.author?.username || "?"}</strong>
                                    <span>({b.authorRole === "mentor" ? "bénévole" : b.authorRole === "student" ? "élève" : b.authorRole})</span>
                                    <span>· {formatDate(b.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                    {b.reasons.map((r) => (
                                        <span key={r} className="dash-badge dash-badge-danger">{r}</span>
                                    ))}
                                    <Link href={`/suivi/${b.mentorshipId}`} className="ml-auto font-medium text-[var(--dash-accent)]">
                                        Ouvrir le suivi
                                    </Link>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-[var(--dash-text-secondary)]">{b.text}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <Dialog open={!!engagementOf} onOpenChange={(o) => !o && setEngagementOf(null)}>
                {engagementOf && (
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Engagement de {engagementOf.user.username}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="rounded-xl bg-[var(--dash-bg-secondary)] p-3">
                                <div className="text-xl font-bold">{engagementOf.engagement.students}</div>élèves
                            </div>
                            <div className="rounded-xl bg-[var(--dash-bg-secondary)] p-3">
                                <div className="text-xl font-bold">{engagementOf.engagement.weeks}</div>semaines
                            </div>
                            <div className="rounded-xl bg-[var(--dash-bg-secondary)] p-3">
                                <div className="text-xl font-bold">{engagementOf.engagement.completed}</div>menés à terme
                            </div>
                        </div>
                        <p className="text-xs text-[var(--dash-text-secondary)]">
                            À reporter dans les contributions de son attestation (Certificats) :
                        </p>
                        <ul className="space-y-1.5 rounded-xl bg-[var(--dash-bg-secondary)] p-3 text-sm">
                            {engagementOf.engagement.certificateLines.length
                                ? engagementOf.engagement.certificateLines.map((l) => <li key={l}>{l}</li>)
                                : <li>Pas encore de suivi.</li>}
                        </ul>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    await navigator.clipboard.writeText(engagementOf.engagement.certificateLines.join("\n"));
                                    toast.success("Copié");
                                }}
                                className="dash-button dash-button-secondary dash-button-sm"
                            >
                                <Copy className="h-4 w-4" /> Copier
                            </button>
                            <button type="button" onClick={() => setEngagementOf(null)} className="dash-button dash-button-ghost dash-button-sm">
                                <X className="h-4 w-4" /> Fermer
                            </button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}

function StatCard({
    icon: Icon,
    tone,
    value,
    label,
    hint,
}: {
    icon: React.ComponentType<{ className?: string }>;
    tone: "primary" | "success" | "warning" | "info";
    value: number | string;
    label: string;
    hint?: string;
}) {
    return (
        <div className="dash-stat-card">
            <div className={`dash-stat-icon ${tone}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="dash-stat-content">
                <div className="dash-stat-value">{value}</div>
                <div className="dash-stat-label">{label}</div>
                {hint && <div className="mt-1 text-xs text-[var(--dash-text-tertiary)]">{hint}</div>}
            </div>
        </div>
    );
}
