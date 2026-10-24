"use client";

import { useEffect, useState } from "react";
import { BarChart3, Flame, Target, Timer } from "lucide-react";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";

interface Stats {
    today: { date: string; completed: number; minutes: number };
    week: { date: string; completed: number; minutes: number }[];
    streak: number;
    totals: { completed: number; abandoned: number; minutes: number };
    bySubject: { subject: string; minutes: number }[];
    recent: { subject: string | null; endedAt: string; minutes: number; completed: boolean }[];
}

function hours(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`;
}

const WEEKDAY = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });

function openAuth() {
    window.dispatchEvent(new Event("workyt:open-auth"));
}

function Tile({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-[var(--wk-paper-2)] p-4">
            <Icon className="h-4 w-4 text-[var(--wk-accent)]" />
            <div className="mt-3 font-serif-display text-2xl leading-none">{value}</div>
            <div className="mt-1 text-xs text-[rgba(26,21,18,0.55)]">{label}</div>
        </div>
    );
}

export default function StatsPanel() {
    const { isAuthenticated, statsVersion, syncFableCount, settings, todayCount } = usePomodoro();
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        fetch("/api/pomodoro/sessions")
            .then((r) => (r.ok ? r.json() : null))
            .then((data: Stats | null) => {
                if (cancelled || !data) return;
                setStats(data);
                syncFableCount(data.totals.completed);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, statsVersion, syncFableCount]);

    if (!isAuthenticated) {
        return (
            <section className="rounded-[28px] bg-[var(--wk-ink)] p-6 text-[var(--wk-paper)] sm:p-8">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <h2 className="font-serif-display text-3xl">Suis tes heures de travail</h2>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                            Avec un compte Workyt (gratuit) : historique et statistiques de tes focus, temps passé par
                            matière, série de jours, objectif quotidien et réglages synchronisés sur tous tes appareils.
                        </p>
                        {todayCount > 0 && (
                            <p className="mt-3 text-sm text-[var(--wk-accent-2)]">
                                Déjà {todayCount} pomodoro{todayCount > 1 ? "s" : ""} aujourd&apos;hui sur ce navigateur.
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={openAuth} className="wk-btn-orange justify-center">
                        Se connecter
                    </button>
                </div>
            </section>
        );
    }

    if (!stats) {
        return <section className="h-48 animate-pulse rounded-[28px] bg-[var(--wk-paper-2)]" aria-label="Chargement des statistiques" />;
    }

    const maxWeek = Math.max(30, ...stats.week.map((d) => d.minutes));
    const goal = settings.dailyGoal;
    const goalPct = Math.min(100, (stats.today.completed / goal) * 100);
    const maxSubject = Math.max(1, ...stats.bySubject.map((s) => s.minutes));

    return (
        <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6 sm:p-8">
            <h2 className="font-serif-display text-3xl">Mes statistiques</h2>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Tile icon={Timer} label="Aujourd'hui" value={hours(stats.today.minutes)} />
                <Tile icon={Flame} label="Jours d'affilée" value={String(stats.streak)} />
                <Tile icon={BarChart3} label="Temps de focus (12 mois)" value={hours(stats.totals.minutes)} />
                <Tile icon={Target} label="Fromages gardés / volés (12 mois)" value={`${stats.totals.completed} / ${stats.totals.abandoned}`} />
            </div>

            <div className="mt-6">
                <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">Objectif du jour</span>
                    <span className="tabular-nums text-[rgba(26,21,18,0.6)]">{stats.today.completed} / {goal} pomodoros</span>
                </div>
                <div className="wk-xp-bar mt-2">
                    <div className="wk-xp-fill" style={{ width: `${goalPct}%` }} />
                </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <div>
                    <h3 className="text-sm font-semibold">7 derniers jours</h3>
                    <div className="mt-4 flex h-40 items-end gap-2" role="img" aria-label="Minutes de focus des 7 derniers jours">
                        {stats.week.map((d) => (
                            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                                <span className="text-[10px] tabular-nums text-[rgba(26,21,18,0.5)]">{d.minutes || ""}</span>
                                <div
                                    className="w-full rounded-t-lg bg-[var(--wk-accent)]"
                                    style={{ height: `${(d.minutes / maxWeek) * 110}px`, minHeight: d.minutes ? 4 : 0, opacity: d.minutes ? 1 : 0.15 }}
                                />
                                <span className="text-[11px] capitalize text-[rgba(26,21,18,0.55)]">
                                    {WEEKDAY.format(new Date(`${d.date}T12:00:00Z`)).replace(".", "")}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold">Par matière (30 jours)</h3>
                    {stats.bySubject.length === 0 ? (
                        <p className="mt-4 text-sm text-[rgba(26,21,18,0.55)]">Choisis une matière avant de lancer un focus pour la voir ici.</p>
                    ) : (
                        <ul className="mt-4 space-y-2.5">
                            {stats.bySubject.slice(0, 6).map((s) => (
                                <li key={s.subject}>
                                    <div className="flex justify-between text-sm">
                                        <span>{s.subject}</span>
                                        <span className="tabular-nums text-[rgba(26,21,18,0.6)]">{hours(s.minutes)}</span>
                                    </div>
                                    <div className="mt-1 h-1.5 rounded-full bg-[rgba(26,21,18,0.06)]">
                                        <div className="h-full rounded-full bg-[var(--wk-accent-2)]" style={{ width: `${(s.minutes / maxSubject) * 100}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {stats.recent.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-semibold">Derniers focus</h3>
                    <ul className="mt-3 divide-y divide-[rgba(26,21,18,0.06)]">
                        {stats.recent.map((r) => (
                            <li key={r.endedAt} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <span className="flex items-center gap-2">
                                    <span aria-hidden>{r.completed ? "🧀" : "🦊"}</span>
                                    {r.subject ?? "Sans matière"}
                                </span>
                                <span className="tabular-nums text-[rgba(26,21,18,0.55)]">
                                    {r.minutes} min ·{" "}
                                    {new Date(r.endedAt).toLocaleString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
