"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Loader2,
    Flame,
    Target,
    BookOpen,
    MessageCircle,
    AlertTriangle,
    Pause,
    Inbox,
    CheckCircle2,
    Clock,
    MessagesSquare,
    LayoutGrid,
    List,
} from "lucide-react";
import { MOOD_LABELS, OUTCOME_LABELS, MENTOR_REMINDER_DAYS } from "@/lib/mentorship/config";
import { api, daysSince, formatDate, formatDuration, type MentorshipSummary } from "@/app/suivi/_lib/client";

interface Data {
    asMentor: { current: MentorshipSummary[]; past: MentorshipSummary[] } | null;
}

type View = "cards" | "list";
type Sort = "urgency" | "messages" | "duration" | "recent";

const SORTS: Record<Sort, { label: string; score: (m: MentorshipSummary) => number }> = {
    urgency: { label: "Urgence", score: (m) => urgency(m) },
    messages: { label: "Messages", score: (m) => m.activity?.messages || 0 },
    duration: { label: "Durée", score: (m) => m.activity?.durationDays || 0 },
    recent: { label: "Dernier message", score: (m) => (m.activity?.lastMessageAt ? new Date(m.activity.lastMessageAt).getTime() : 0) },
};

/**
 * Les suivis du bénévole, les plus urgents en premier : un élève qui attend
 * une réponse passe devant tout le reste. En vue liste, on peut aussi trier
 * par volume de messages, durée ou dernier échange.
 */
export default function MySuivisTab({ goToQueue }: { goToQueue: () => void }) {
    const [data, setData] = useState<Data | null>(null);
    const [view, setView] = useState<View>("cards");
    const [sort, setSort] = useState<Sort>("urgency");

    useEffect(() => {
        api<Data>("/api/suivi")
            .then((d) => {
                const saved = localStorage.getItem("suivis-view");
                if (saved === "cards" || saved === "list") setView(saved);
                setData(d);
            })
            .catch(() => setData({ asMentor: null }));
    }, []);

    const changeView = (v: View) => {
        setView(v);
        localStorage.setItem("suivis-view", v);
    };

    if (!data) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-accent)]" />
            </div>
        );
    }

    const current = [...(data.asMentor?.current || [])].sort((a, b) => SORTS[sort].score(b) - SORTS[sort].score(a));
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
                <>
                    <Overview current={current} past={past} />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)]">
                            Trier par
                            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="dash-input w-auto py-1.5">
                                {(Object.keys(SORTS) as Sort[]).map((k) => (
                                    <option key={k} value={k}>
                                        {SORTS[k].label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => changeView("cards")}
                                aria-label="Vue en cartes"
                                aria-pressed={view === "cards"}
                                className={`dash-button ${view === "cards" ? "dash-button-primary" : ""}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => changeView("list")}
                                aria-label="Vue en liste"
                                aria-pressed={view === "list"}
                                className={`dash-button ${view === "list" ? "dash-button-primary" : ""}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {view === "list" ? (
                        <CurrentTable list={current} />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {current.map((m) => (
                                <SuiviCard key={m.id} m={m} />
                            ))}
                        </div>
                    )}
                </>
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
                                    <th>Messages</th>
                                    <th>Durée</th>
                                    <th>Terminé le</th>
                                </tr>
                            </thead>
                            <tbody>
                                {past.map((m) => (
                                    <tr key={m.id}>
                                        <td>{m.student?.username}</td>
                                        <td>{m.subject} · {m.level}</td>
                                        <td>{m.outcome ? OUTCOME_LABELS[m.outcome] : m.status === "cancelled" ? "Annulé" : "—"}</td>
                                        <td><Messages m={m} /></td>
                                        <td>{m.activity ? formatDuration(m.activity.durationDays) : "—"}</td>
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

function messagesTitle(m: MentorshipSummary) {
    return m.activity ? `${m.activity.studentMessages} de l'élève, ${m.activity.mentorMessages} du bénévole` : undefined;
}

/** Total des messages, le détail élève · bénévole à côté */
function Messages({ m }: { m: MentorshipSummary }) {
    if (!m.activity) return <>—</>;
    const a = m.activity;
    return (
        <span title={messagesTitle(m)}>
            {a.messages} <span className="text-[var(--dash-text-tertiary)]">({a.studentMessages} · {a.mentorMessages})</span>
        </span>
    );
}

/** Quelques chiffres en tête, pour voir d'un coup d'œil où en est son engagement */
function Overview({ current, past }: { current: MentorshipSummary[]; past: MentorshipSummary[] }) {
    const all = [...current, ...past];
    const messages = current.reduce((n, m) => n + (m.activity?.messages || 0), 0);
    const waiting = current.filter((m) => m.status === "active" && waitingDays(m) >= 1).length;
    const avg = all.length ? Math.round(all.reduce((n, m) => n + (m.activity?.durationDays || 0), 0) / all.length) : 0;
    const stats = [
        { label: "Suivis en cours", value: String(current.length) },
        { label: "Messages (en cours)", value: String(messages) },
        { label: "Durée moyenne", value: formatDuration(avg) },
        { label: "Attendent ta réponse", value: String(waiting), alert: waiting > 0 },
    ];
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => (
                <div key={s.label} className="dash-card p-4">
                    <div className="text-xs text-[var(--dash-text-tertiary)]">{s.label}</div>
                    <div className={`mt-1 text-2xl font-semibold ${s.alert ? "text-amber-600" : "text-[var(--dash-text)]"}`}>{s.value}</div>
                </div>
            ))}
        </div>
    );
}

function CurrentTable({ list }: { list: MentorshipSummary[] }) {
    return (
        <div className="dash-table-container">
            <table className="dash-table">
                <thead>
                    <tr>
                        <th>Élève</th>
                        <th>Matière</th>
                        <th>Messages</th>
                        <th>Durée</th>
                        <th>Dernier message</th>
                        <th>État</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map((m) => {
                        const waiting = waitingDays(m);
                        const last = daysSince(m.activity?.lastMessageAt);
                        return (
                            <tr key={m.id}>
                                <td>
                                    <Link href={`/suivi/${m.id}`} className="font-medium text-[var(--dash-accent)] hover:underline">
                                        {m.student?.username}
                                    </Link>
                                </td>
                                <td>{m.subject} · {m.level}</td>
                                <td><Messages m={m} /></td>
                                <td>{m.activity ? formatDuration(m.activity.durationDays) : "—"}</td>
                                <td>{last === null ? "—" : last === 0 ? "Aujourd'hui" : `Il y a ${last} j`}</td>
                                <td>
                                    <div className="flex flex-wrap gap-1">
                                        {m.status === "paused" && <span className="dash-badge dash-badge-info">Pause</span>}
                                        {m.unread > 0 && (
                                            <span className="dash-badge dash-badge-primary">
                                                {m.unread} non lu{m.unread > 1 ? "s" : ""}
                                            </span>
                                        )}
                                        {waiting >= 1 && m.status === "active" && (
                                            <span className={`dash-badge ${waiting >= MENTOR_REMINDER_DAYS ? "dash-badge-danger" : "dash-badge-warning"}`}>
                                                Attend depuis {waiting} j
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
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

            {m.activity && (
                <div className="mt-4 flex items-center justify-between border-t border-[var(--dash-border)] pt-3 text-xs text-[var(--dash-text-secondary)]">
                    <span className="flex items-center gap-1.5" title={messagesTitle(m)}>
                        <MessagesSquare className="h-3.5 w-3.5" />
                        {m.activity.messages} message{m.activity.messages > 1 ? "s" : ""}
                    </span>
                    <span
                        className="flex items-center gap-1.5"
                        title={m.activity.since ? `Depuis le ${formatDate(m.activity.since, { day: "numeric", month: "long", year: "numeric" })}` : undefined}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(m.activity.durationDays)}
                    </span>
                </div>
            )}
        </Link>
    );
}
