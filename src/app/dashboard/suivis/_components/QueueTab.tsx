"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Inbox, Clock, RotateCcw, Filter } from "lucide-react";
import { educationData } from "@/data/educationData";
import { FORMAT_LABELS, GOAL_TYPE_LABELS } from "@/lib/mentorship/config";
import { api, daysSince, type MentorProfileView, type MentorshipSummary } from "@/app/suivi/_lib/client";

/**
 * La file d'attente vue par un bénévole. Les reprises (suivis revenus en file
 * après un relais) passent en premier : ces élèves ont déjà été lâchés une fois.
 */
export default function QueueTab({ goToProfile }: { goToProfile: () => void }) {
    const [queue, setQueue] = useState<MentorshipSummary[] | null>(null);
    const [profile, setProfile] = useState<MentorProfileView | null>(null);
    const [mine, setMine] = useState(true);
    const [subject, setSubject] = useState("");

    useEffect(() => {
        const params = new URLSearchParams();
        if (mine) params.set("mine", "1");
        if (subject) params.set("subject", subject);
        let alive = true;
        api<{ queue: MentorshipSummary[]; profile: MentorProfileView }>(`/api/suivi/queue?${params}`)
            .then((d) => {
                if (!alive) return;
                setQueue(d.queue);
                setProfile(d.profile);
            })
            .catch(() => alive && setQueue([]));
        return () => {
            alive = false;
        };
    }, [mine, subject]);

    const full = !!profile && profile.activeCount >= profile.maxActive;

    return (
        <div className="space-y-5">
            {profile && !profile.charterAccepted && (
                <div className="dash-card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Pour prendre ton premier suivi, accepte d&apos;abord la charte du bénévole.{" "}
                    <button type="button" onClick={goToProfile} className="font-semibold underline">Lire la charte</button>
                </div>
            )}
            {profile?.charterAccepted && full && (
                <div className="dash-card p-4 text-sm text-[var(--dash-text-secondary)]">
                    Tu accompagnes déjà {profile.activeCount} élève{profile.activeCount > 1 ? "s" : ""} — ton maximum. Tu peux l&apos;augmenter dans ton profil,
                    mais ne te surcharge pas : un suivi bien tenu vaut mieux que trois abandonnés.
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)]">
                    <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="accent-[var(--dash-accent)]" />
                    Seulement mes matières et niveaux
                </label>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[var(--dash-text-tertiary)]" />
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="dash-input !w-auto !py-1.5 text-sm">
                        <option value="">Toutes les matières</option>
                        {educationData.subjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                {queue && <span className="ml-auto text-sm text-[var(--dash-text-tertiary)]">{queue.length} demande{queue.length > 1 ? "s" : ""}</span>}
            </div>

            {!queue ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-accent)]" />
                </div>
            ) : queue.length === 0 ? (
                <div className="dash-card">
                    <div className="dash-empty">
                        <Inbox className="mx-auto mb-3 h-8 w-8 text-[var(--dash-text-tertiary)]" />
                        <p className="dash-empty-title">Personne n&apos;attend pour le moment</p>
                        <p className="dash-empty-text">Tu seras notifié dès qu&apos;une demande correspond à tes matières.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {queue.map((m) => {
                        const d = daysSince(m.createdAt) || 0;
                        return (
                            <Link key={m.id} href={`/suivi/${m.id}`} className="dash-card dash-card-interactive block p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-semibold text-[var(--dash-text)]">{m.subject}</span>
                                    <span className="dash-badge">{m.level}</span>
                                    {m.resumed && (
                                        <span className="dash-badge dash-badge-primary"><RotateCcw className="mr-1 h-3 w-3" /> Reprise</span>
                                    )}
                                </div>
                                <div className="mt-1 text-xs text-[var(--dash-text-tertiary)]">
                                    {FORMAT_LABELS[m.format]?.label} · {GOAL_TYPE_LABELS[m.goalType]}
                                </div>
                                {m.need && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--dash-text-secondary)]">{m.need}</p>}
                                <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${d >= 2 ? "text-red-600" : "text-[var(--dash-text-tertiary)]"}`}>
                                    <Clock className="h-3.5 w-3.5" />
                                    {d === 0 ? "Aujourd'hui" : `Attend depuis ${d} jour${d > 1 ? "s" : ""}`}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
