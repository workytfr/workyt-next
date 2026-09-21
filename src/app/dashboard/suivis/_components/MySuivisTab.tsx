"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Flame, Target, BookOpen, MessageCircle, AlertTriangle, Pause, Inbox, CheckCircle2 } from "lucide-react";
import { MOOD_LABELS, OUTCOME_LABELS, MENTOR_REMINDER_DAYS } from "@/lib/mentorship/config";
import { api, daysSince, formatDate, type MentorshipSummary } from "@/app/suivi/_lib/client";

interface Data {
    asMentor: { current: MentorshipSummary[]; past: MentorshipSummary[] } | null;
}

/**
 * Les suivis du bénévole, les plus urgents en premier : un élève qui attend
 * une réponse passe devant tout le reste.
 */
export default function MySuivisTab({ goToQueue }: { goToQueue: () => void }) {
    const [data, setData] = useState<Data | null>(null);

    useEffect(() => {
        api<Data>("/api/suivi").then(setData).catch(() => setData({ asMentor: null }));
    }, []);

    if (!data) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-accent)]" />
            </div>
        );
    }

    const current = [...(data.asMentor?.current || [])].sort((a, b) => urgency(b) - urgency(a));
    const past = data.asMentor?.past || [];

    return (
        <div className="space-y-8">
            {current.length === 0 ? (
                <div className="dash-card">
                    <div className="dash-empty">
                        <Inbox className="mx-auto mb-3 h-8 w-8 text-[var(--dash-text-tertiary)]" />
                        <p className="dash-empty-title">Aucun suivi en cours</p>
                        <p className="dash-empty-text">Des élèves attendent peut-être dans la file.</p>
                        <button type="button" onClick={goToQueue} className="dash-button dash-button-primary mt-4">
                            Voir la file d&apos;attente
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {current.map((m) => (
                        <SuiviCard key={m.id} m={m} />
                    ))}
                </div>
            )}

            {past.length > 0 && (
                <section>
                    <h2 className="mb-3 text-sm font-semibold text-[var(--dash-text-secondary)]">Suivis terminés</h2>
                    <div className="dash-table-container">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Élève</th>
                                    <th>Matière</th>
                                    <th>Issue</th>
                                    <th>Terminé le</th>
                                </tr>
                            </thead>
                            <tbody>
                                {past.map((m) => (
                                    <tr key={m.id}>
                                        <td>{m.student?.username}</td>
                                        <td>{m.subject} · {m.level}</td>
                                        <td>{m.outcome ? OUTCOME_LABELS[m.outcome] : m.status === "cancelled" ? "Annulé" : "—"}</td>
                                        <td>{formatDate(m.closedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}

/** Jours depuis lesquels l'élève attend une réponse (0 s'il n'attend pas) */
function waitingDays(m: MentorshipSummary) {
    if (!m.lastStudentActivityAt) return 0;
    const s = new Date(m.lastStudentActivityAt).getTime();
    const mt = m.lastMentorActivityAt ? new Date(m.lastMentorActivityAt).getTime() : 0;
    return s > mt ? daysSince(m.lastStudentActivityAt) || 0 : 0;
}

function urgency(m: MentorshipSummary) {
    return (m.unread > 0 ? 100 : 0) + waitingDays(m) * 10 + (m.checkinPending ? 5 : 0) - (m.status === "paused" ? 1000 : 0);
}

function SuiviCard({ m }: { m: MentorshipSummary }) {
    const waiting = waitingDays(m);
    const quiet = daysSince(m.lastStudentActivityAt);
    return (
        <Link href={`/suivi/${m.id}`} className="dash-card dash-card-interactive block p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-medium text-[var(--dash-text-tertiary)]">{m.level}</div>
                    <div className="text-lg font-semibold text-[var(--dash-text)]">{m.subject}</div>
                    <div className="text-sm text-[var(--dash-text-secondary)]">avec {m.student?.username}</div>
                </div>
                {m.status === "paused" ? (
                    <span className="dash-badge dash-badge-info"><Pause className="mr-1 h-3 w-3" /> Pause</span>
                ) : m.unread > 0 ? (
                    <span className="dash-badge dash-badge-primary"><MessageCircle className="mr-1 h-3 w-3" /> {m.unread}</span>
                ) : null}
            </div>

            {waiting >= 1 && m.status === "active" && (
                <p className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${waiting >= MENTOR_REMINDER_DAYS ? "text-red-600" : "text-amber-600"}`}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Attend ta réponse depuis {waiting} jour{waiting > 1 ? "s" : ""}
                </p>
            )}
            {waiting === 0 && quiet !== null && quiet >= 7 && m.status === "active" && (
                <p className="mt-3 text-xs text-[var(--dash-text-tertiary)]">Pas de nouvelles de l&apos;élève depuis {quiet} jours</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="dash-badge"><Target className="mr-1 h-3 w-3" /> {m.goals.done}/{m.goals.total}</span>
                <span className="dash-badge"><BookOpen className="mr-1 h-3 w-3" /> {m.assignments.done}/{m.assignments.total}</span>
                {m.duoStreak > 0 && <span className="dash-badge dash-badge-warning"><Flame className="mr-1 h-3 w-3" /> {m.duoStreak} sem.</span>}
                {m.checkinMood && (
                    <span className={`dash-badge ${m.checkinMood === "bloque" ? "dash-badge-danger" : m.checkinMood === "bien" ? "dash-badge-success" : "dash-badge-warning"}`}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> {MOOD_LABELS[m.checkinMood]}
                    </span>
                )}
                {m.resumed && <span className="dash-badge">Repris</span>}
            </div>
        </Link>
    );
}
