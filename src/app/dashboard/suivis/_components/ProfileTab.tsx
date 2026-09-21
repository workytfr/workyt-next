"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Copy, Check, Award, Users, CalendarDays, Target, Heart } from "lucide-react";
import { toast } from "sonner";
import { educationData } from "@/data/educationData";
import { DEFAULT_MAX_ACTIVE, MAX_ACTIVE_LIMIT, HELP_LINES } from "@/lib/mentorship/config";
import { api, ApiError, formatDate, type MentorProfileView } from "@/app/suivi/_lib/client";

export interface Engagement {
    students: number;
    subjects: string[];
    active: number;
    completed: number;
    goalReached: number;
    helpful: number;
    messages: number;
    weeks: number;
    since: string | null;
    certificateLines: string[];
}

/**
 * La charte du bénévole. Elle conditionne la prise de tout suivi : c'est
 * l'engagement qui rend le dispositif sûr pour des élèves souvent mineurs.
 */
export const CHARTER = [
    "Je suis majeur·e et j'agis bénévolement, au nom de l'association Workyt.",
    "Tous les échanges restent sur Workyt : jamais de numéro, de réseau social, de visio ou de rencontre en dehors de la plateforme.",
    "Je ne demande aucune information personnelle à l'élève (adresse, établissement, photos de lui) et je n'en partage aucune sur moi.",
    "J'explique et je guide : je ne fais jamais le travail à la place de l'élève.",
    "Je reste dans le champ scolaire. Si un élève confie une difficulté grave (harcèlement, violences, détresse), je ne la gère pas seul : je signale le suivi et je l'oriente vers les lignes d'écoute.",
    "Je réponds sous 3 jours. Si je ne peux plus, je mets le suivi en pause ou je passe la main — sans culpabiliser.",
    "Je sais que les échanges sont conservés et peuvent être relus par la modération.",
];

export default function ProfileTab() {
    const [profile, setProfile] = useState<MentorProfileView | null>(null);
    const [engagement, setEngagement] = useState<Engagement | null>(null);
    const [form, setForm] = useState({ status: "available", maxActive: DEFAULT_MAX_ACTIVE, subjects: [] as string[], levels: [] as string[], bio: "" });
    const [accept, setAccept] = useState(false);
    const [adult, setAdult] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const load = async () => {
        const d = await api<{ profile: MentorProfileView; engagement: Engagement }>("/api/suivi/mentor");
        setProfile(d.profile);
        setEngagement(d.engagement);
        setForm({ status: d.profile.status, maxActive: d.profile.maxActive, subjects: d.profile.subjects, levels: d.profile.levels, bio: d.profile.bio });
    };

    useEffect(() => {
        load().catch(() => toast.error("Profil indisponible"));
    }, []);

    const toggle = (key: "subjects" | "levels", value: string) =>
        setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));

    const save = async (withCharter = false) => {
        setSaving(true);
        try {
            await api("/api/suivi/mentor", {
                method: "PUT",
                json: { ...form, ...(withCharter ? { acceptCharter: true, adultDeclared: adult } : {}) },
            });
            toast.success(withCharter ? "Charte acceptée — bienvenue parmi les bénévoles accompagnants !" : "Profil enregistré");
            await load();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible");
        } finally {
            setSaving(false);
        }
    };

    if (!profile) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--dash-accent)]" />
            </div>
        );
    }

    const copyLines = async () => {
        if (!engagement) return;
        await navigator.clipboard.writeText(engagement.certificateLines.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
                {/* ─── Charte ─── */}
                <section className="dash-card p-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[var(--dash-accent)]" />
                        <h2 className="text-lg font-semibold">La charte du bénévole accompagnant</h2>
                    </div>
                    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--dash-text-secondary)]">
                        {CHARTER.map((c) => (
                            <li key={c}>{c}</li>
                        ))}
                    </ol>
                    <div className="mt-4 rounded-xl bg-[var(--dash-bg-secondary)] p-3 text-xs text-[var(--dash-text-secondary)]">
                        <strong>Lignes d&apos;écoute à transmettre si besoin :</strong>{" "}
                        {HELP_LINES.map((h) => h.name).join(" · ")}
                    </div>

                    {profile.charterAccepted ? (
                        <p className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--dash-success)]">
                            <Check className="h-4 w-4" /> Charte acceptée le {formatDate(profile.charterAcceptedAt, { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    ) : (
                        <div className="mt-5 space-y-2.5">
                            <label className="flex items-start gap-2.5 text-sm">
                                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 accent-[var(--dash-accent)]" />
                                J&apos;ai lu la charte et je m&apos;engage à la respecter.
                            </label>
                            <label className="flex items-start gap-2.5 text-sm">
                                <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 accent-[var(--dash-accent)]" />
                                Je certifie être majeur·e.
                            </label>
                            <button type="button" disabled={!accept || !adult || saving} onClick={() => save(true)} className="dash-button dash-button-primary mt-2 disabled:opacity-50">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Accepter la charte
                            </button>
                        </div>
                    )}
                </section>

                {/* ─── Préférences ─── */}
                <section className="dash-card space-y-6 p-6">
                    <h2 className="text-lg font-semibold">Mes préférences</h2>

                    <div>
                        <span className="dash-label">Disponibilité</span>
                        <div className="mt-2 flex gap-2">
                            {[
                                ["available", "Disponible"],
                                ["paused", "En pause"],
                            ].map(([k, l]) => (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, status: k }))}
                                    className={`dash-button dash-button-sm ${form.status === k ? "dash-button-primary" : "dash-button-secondary"}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1.5 text-xs text-[var(--dash-text-tertiary)]">
                            En pause, tu ne reçois plus de nouvelles demandes. Tes suivis en cours continuent.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="max-active" className="dash-label">
                            Suivis en même temps : <strong>{form.maxActive}</strong>
                        </label>
                        <input
                            id="max-active"
                            type="range"
                            min={1}
                            max={MAX_ACTIVE_LIMIT}
                            value={form.maxActive}
                            onChange={(e) => setForm((f) => ({ ...f, maxActive: Number(e.target.value) }))}
                            className="mt-2 w-full max-w-xs accent-[var(--dash-accent)]"
                        />
                        <p className="mt-1 text-xs text-[var(--dash-text-tertiary)]">
                            Compte 20 à 30 minutes par élève et par semaine. On conseille {DEFAULT_MAX_ACTIVE}.
                        </p>
                    </div>

                    <ChipPicker
                        label="Matières"
                        hint="Aucune sélection = toutes les matières."
                        options={educationData.subjects}
                        selected={form.subjects}
                        onToggle={(v) => toggle("subjects", v)}
                    />
                    <ChipPicker
                        label="Niveaux"
                        hint="Aucune sélection = tous les niveaux."
                        options={educationData.levels}
                        selected={form.levels}
                        onToggle={(v) => toggle("levels", v)}
                    />

                    <div>
                        <label htmlFor="bio" className="dash-label">Ma présentation aux élèves</label>
                        <textarea
                            id="bio"
                            value={form.bio}
                            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 280) }))}
                            rows={3}
                            placeholder="Ex. Étudiante en licence de maths, j'adore débloquer les équations. Patience garantie !"
                            className="dash-input mt-2"
                        />
                        <p className="mt-1 text-right text-xs text-[var(--dash-text-tertiary)]">{form.bio.length}/280</p>
                    </div>

                    <button type="button" onClick={() => save(false)} disabled={saving} className="dash-button dash-button-primary">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Enregistrer
                    </button>
                </section>
            </div>

            {/* ─── Mon engagement ─── */}
            {engagement && (
                <aside className="space-y-4">
                    <section className="dash-card p-6">
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-[var(--dash-accent)]" />
                            <h2 className="text-lg font-semibold">Mon engagement</h2>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <Stat icon={Users} value={engagement.students} label="élèves accompagnés" />
                            <Stat icon={CalendarDays} value={engagement.weeks} label="semaines de suivi" />
                            <Stat icon={Target} value={engagement.goalReached} label="objectifs d'élèves atteints" />
                            <Stat icon={Heart} value={engagement.helpful} label="élèves aidés (leur avis)" />
                        </div>
                        {engagement.since && (
                            <p className="mt-3 text-xs text-[var(--dash-text-tertiary)]">
                                Bénévole accompagnant depuis le {formatDate(engagement.since, { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                        )}
                    </section>

                    <section className="dash-card p-6">
                        <h3 className="font-semibold">Pour ton attestation de bénévolat</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--dash-text-secondary)]">
                            Ces lignes sont calculées à partir de tes suivis réels. Elles alimentent ton attestation Workyt — utile pour un CV, Parcoursup ou un dossier de master.
                        </p>
                        {engagement.certificateLines.length ? (
                            <>
                                <ul className="mt-3 space-y-2 rounded-xl bg-[var(--dash-bg-secondary)] p-3 text-sm">
                                    {engagement.certificateLines.map((l) => (
                                        <li key={l}>{l}</li>
                                    ))}
                                </ul>
                                <button type="button" onClick={copyLines} className="dash-button dash-button-secondary dash-button-sm mt-3">
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copied ? "Copié" : "Copier"}
                                </button>
                            </>
                        ) : (
                            <p className="mt-3 text-sm text-[var(--dash-text-tertiary)]">Tes premiers suivis apparaîtront ici.</p>
                        )}
                    </section>
                </aside>
            )}
        </div>
    );
}

function Stat({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string }) {
    return (
        <div className="rounded-xl bg-[var(--dash-bg-secondary)] p-3">
            <Icon className="h-4 w-4 text-[var(--dash-accent)]" />
            <div className="mt-1 text-2xl font-bold">{value}</div>
            <div className="text-[11px] leading-tight text-[var(--dash-text-secondary)]">{label}</div>
        </div>
    );
}

function ChipPicker({
    label,
    hint,
    options,
    selected,
    onToggle,
}: {
    label: string;
    hint: string;
    options: string[];
    selected: string[];
    onToggle: (v: string) => void;
}) {
    return (
        <div>
            <span className="dash-label">{label}</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {options.map((o) => {
                    const on = selected.includes(o);
                    return (
                        <button
                            key={o}
                            type="button"
                            onClick={() => onToggle(o)}
                            aria-pressed={on}
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                                on
                                    ? "border-[var(--dash-accent)] bg-[var(--dash-accent-light)] font-medium text-[var(--dash-accent-hover)]"
                                    : "border-[var(--dash-border)] text-[var(--dash-text-secondary)] hover:border-[var(--dash-border-hover)]"
                            }`}
                        >
                            {o}
                        </button>
                    );
                })}
            </div>
            <p className="mt-1.5 text-xs text-[var(--dash-text-tertiary)]">{hint}</p>
        </div>
    );
}
