"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowRight,
    ArrowUpRight,
    MessagesSquare,
    Target,
    BookOpen,
    Flame,
    ShieldCheck,
    Lock,
    Flag,
    UserCheck,
    Clock,
    HeartHandshake,
    Sparkles,
    ChevronRight,
    LifeBuoy,
} from "lucide-react";
import { educationData } from "@/data/educationData";
import {
    ANNOUNCED_DELAY_HOURS,
    FORMAT_LABELS,
    GOAL_TYPE_LABELS,
    HELP_LINES,
    MAX_OPEN_PER_STUDENT,
} from "@/lib/mentorship/config";
import { api, ApiError, openAuth, formatDate, type MentorshipSummary, type PublicUser } from "../_lib/client";
import { Eyebrow, StatusPill, Initial, Card, Spinner } from "./ui";

interface HomeData {
    authenticated: boolean;
    me?: PublicUser;
    canMentor?: boolean;
    canManage?: boolean;
    asStudent?: MentorshipSummary[];
}

export default function SuiviHome() {
    const { status: sessionStatus } = useSession();
    const [data, setData] = useState<HomeData | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setData(await api<HomeData>("/api/suivi"));
        } catch {
            setData({ authenticated: false });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (sessionStatus !== "loading") load();
    }, [sessionStatus, load]);

    // Arrivée depuis la passerelle du forum (/suivi?subject=…#demande) : le
    // formulaire n'existe qu'une fois les données chargées, on y descend alors.
    useEffect(() => {
        if (!loading && window.location.hash === "#demande") {
            document.getElementById("demande")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [loading]);

    const mine = data?.asStudent || [];
    const openCount = mine.filter((m) => ["pending", "active", "paused"].includes(m.status)).length;
    const canRequest = !!data?.authenticated && openCount < MAX_OPEN_PER_STUDENT;

    const scrollToForm = () => document.getElementById("demande")?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            {/* ─── En-tête ─── */}
            <header className="relative overflow-hidden border-b border-[rgba(26,21,18,0.08)]">
                <div className="wk-dotgrid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
                <div className="relative mx-auto grid grid-cols-1 max-w-[1200px] gap-12 px-4 pb-16 pt-14 sm:px-6 md:pb-20 md:pt-20 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <Eyebrow>Suivi personnalisé</Eyebrow>
                        <h1 className="font-serif-display mt-5 text-[clamp(2.6rem,7vw,5rem)] leading-[0.92]">
                            Un bénévole,
                            <br />
                            <span className="italic text-[rgba(26,21,18,0.45)]">rien que pour toi</span>
                            <span className="text-[var(--wk-accent)]">.</span>
                        </h1>
                        <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-[rgba(26,21,18,0.68)]">
                            Quand un exercice ne suffit plus et que c&apos;est tout un chapitre qui coince, un
                            bénévole de l&apos;association t&apos;accompagne pendant quelques semaines : il te
                            connaît, choisit les bons cours et quiz pour toi, et suit tes progrès. Gratuit.
                        </p>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                            {loading ? (
                                <Spinner />
                            ) : data?.authenticated ? (
                                canRequest ? (
                                    <button type="button" onClick={scrollToForm} className="wk-btn-orange justify-center">
                                        Demander un suivi <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : null
                            ) : (
                                <button type="button" onClick={openAuth} className="wk-btn-orange justify-center">
                                    Se connecter pour demander <ArrowRight className="h-4 w-4" />
                                </button>
                            )}
                            <Link
                                href="/forum"
                                className="group inline-flex items-center gap-2 px-2 text-sm font-semibold text-[rgba(26,21,18,0.7)] hover:text-[var(--wk-accent)]"
                            >
                                <MessagesSquare className="h-4 w-4" />
                                <span className="border-b border-[rgba(26,21,18,0.2)] pb-0.5 group-hover:border-[var(--wk-accent)]">
                                    Juste une question ? Le forum est là
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Aperçu : à quoi ressemble un suivi */}
                    <div className="lg:col-span-5">
                        <SuiviPreview />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
                {/* ─── Espace bénévole ─── */}
                {data?.canMentor && (
                    <Link
                        href="/dashboard/suivis"
                        className="group mb-10 flex items-center gap-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-[var(--wk-ink)] p-5 text-[var(--wk-paper)] transition hover:-translate-y-0.5"
                    >
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                            <HeartHandshake className="h-5 w-5 text-[var(--wk-accent-2)]" />
                        </span>
                        <span className="flex-1">
                            <span className="block font-semibold">Tu es bénévole accompagnant</span>
                            <span className="block text-sm text-white/65">
                                La file d&apos;attente, tes suivis et ton profil sont dans ton espace bénévole.
                            </span>
                        </span>
                        <ArrowUpRight className="h-5 w-5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                )}

                {/* ─── Mes suivis ─── */}
                {data?.authenticated && mine.length > 0 && (
                    <section className="mb-16">
                        <Eyebrow>Mes suivis</Eyebrow>
                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {mine.map((m) => (
                                <MySuiviCard key={m.id} m={m} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ─── Comment ça marche ─── */}
                <section className="mb-16">
                    <Eyebrow>Comment ça marche</Eyebrow>
                    <h2 className="font-serif-display mt-4 max-w-2xl text-4xl leading-[0.95] sm:text-5xl">
                        Trois étapes, <span className="italic">et quelqu&apos;un à tes côtés.</span>
                    </h2>
                    <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {[
                            {
                                n: "01",
                                title: "Tu expliques ce qui coince",
                                text: "La matière, ton niveau, ce que tu as déjà essayé et ce que tu vises. Deux minutes, pas plus.",
                                icon: Sparkles,
                            },
                            {
                                n: "02",
                                title: "Un bénévole te répond",
                                text: `Un membre de l'association prend ta demande, en général sous ${ANNOUNCED_DELAY_HOURS} h. Tu le retrouves à chaque fois.`,
                                icon: UserCheck,
                            },
                            {
                                n: "03",
                                title: "Vous avancez ensemble",
                                text: "Un plan avec des objectifs clairs, des cours et quiz choisis pour toi, et un point d'étape toutes les deux semaines.",
                                icon: Target,
                            },
                        ].map((s) => (
                            <Card key={s.n} className="p-6">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono-ui text-xs tracking-[0.2em] text-[var(--wk-accent)]">{s.n}</span>
                                    <s.icon className="h-5 w-5 text-[rgba(26,21,18,0.35)]" />
                                </div>
                                <h3 className="font-serif-display mt-6 text-2xl leading-tight">{s.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[rgba(26,21,18,0.65)]">{s.text}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ─── Demande ─── */}
                <section id="demande" className="mb-16 scroll-mt-24">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                            <Eyebrow>Ta demande</Eyebrow>
                            <h2 className="font-serif-display mt-4 text-4xl leading-[0.95]">
                                Dis-nous <span className="italic">où tu en es.</span>
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-[rgba(26,21,18,0.65)]">
                                Plus tu es précis, plus le bénévole pourra t&apos;aider vite. Pas besoin de bien
                                écrire : écris comme tu parles.
                            </p>
                            <ul className="mt-6 space-y-3 text-sm text-[rgba(26,21,18,0.7)]">
                                <li className="flex gap-2.5">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--wk-accent)]" />
                                    Réponse en général sous {ANNOUNCED_DELAY_HOURS} h.
                                </li>
                                <li className="flex gap-2.5">
                                    <Flame className="mt-0.5 h-4 w-4 shrink-0 text-[var(--wk-accent)]" />
                                    Des points et des badges quand tu avances.
                                </li>
                            </ul>
                        </div>

                        <div className="lg:col-span-8">
                            {loading ? (
                                <Card className="flex justify-center p-10">
                                    <Spinner />
                                </Card>
                            ) : !data?.authenticated ? (
                                <Card className="p-8 text-center">
                                    <Lock className="mx-auto h-6 w-6 text-[rgba(26,21,18,0.4)]" />
                                    <p className="mt-3 font-semibold">Connecte-toi pour demander un suivi</p>
                                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                                        Ton suivi est privé : il est lié à ton compte.
                                    </p>
                                    <button type="button" onClick={openAuth} className="wk-btn-ink mt-6">
                                        Connexion / inscription
                                    </button>
                                </Card>
                            ) : canRequest ? (
                                <RequestForm />
                            ) : (
                                <Card className="p-8">
                                    <p className="font-semibold">Tu as déjà {openCount} demandes ou suivis en cours.</p>
                                    <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                                        Pour que chacun puisse être accompagné, on limite à {MAX_OPEN_PER_STUDENT} suivis en
                                        même temps. Termine-en un pour en ouvrir un autre.
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </section>

                {/* ─── Un cadre sûr ─── */}
                <section className="grid grid-cols-1 gap-5 md:grid-cols-5">
                    <Card className="p-7 md:col-span-3">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-[var(--wk-accent)]" />
                            <h2 className="font-serif-display text-3xl leading-tight">Un cadre sûr</h2>
                        </div>
                        <ul className="mt-6 grid grid-cols-1 gap-4 text-sm leading-relaxed text-[rgba(26,21,18,0.72)] sm:grid-cols-2">
                            <li>
                                <strong className="block text-[var(--wk-ink)]">Des bénévoles identifiés</strong>
                                Majeurs, connus de l&apos;association et engagés par une charte.
                            </li>
                            <li>
                                <strong className="block text-[var(--wk-ink)]">Tout reste sur Workyt</strong>
                                Pas de numéro, pas de réseau social : les coordonnées sont bloquées automatiquement.
                            </li>
                            <li>
                                <strong className="block text-[var(--wk-ink)]">Des échanges conservés</strong>
                                La modération peut relire une conversation si quelqu&apos;un la signale.
                            </li>
                            <li>
                                <strong className="block text-[var(--wk-ink)]">Un bouton Signaler</strong>
                                <span className="inline-flex items-center gap-1">
                                    <Flag className="h-3.5 w-3.5" /> dans chaque suivi, à tout moment.
                                </span>
                            </li>
                        </ul>
                    </Card>
                    <Card className="bg-[var(--wk-paper-2)] p-7 md:col-span-2">
                        <div className="flex items-center gap-3">
                            <LifeBuoy className="h-6 w-6 text-[var(--wk-accent)]" />
                            <h2 className="font-serif-display text-2xl leading-tight">Besoin de parler à quelqu&apos;un ?</h2>
                        </div>
                        <p className="mt-3 text-sm text-[rgba(26,21,18,0.65)]">
                            Si ce qui te pèse dépasse les cours, ces lignes sont gratuites et anonymes :
                        </p>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {HELP_LINES.map((h) => (
                                <li key={h.name}>
                                    <strong>{h.name}</strong>
                                    <span className="block text-[rgba(26,21,18,0.6)]">{h.detail}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>
            </main>
        </div>
    );
}

/* ───────────────────────── Aperçu décoratif ───────────────────────── */

function SuiviPreview() {
    return (
        <div className="relative mx-auto max-w-md rotate-[1.2deg] lg:mt-6" aria-hidden="true">
            <div className="rounded-[28px] border border-[rgba(26,21,18,0.1)] bg-white p-5 shadow-[0_24px_60px_rgba(26,21,18,0.12)]">
                <div className="flex items-center gap-3 border-b border-[rgba(26,21,18,0.08)] pb-4">
                    <Initial name="Inès" tone="orange" size={36} />
                    <div className="flex-1">
                        <div className="text-sm font-semibold">Inès · bénévole</div>
                        <div className="text-xs text-[rgba(26,21,18,0.55)]">Mathématiques · 3ème</div>
                    </div>
                    <span className="wk-chip">
                        <Flame className="h-3.5 w-3.5 text-[var(--wk-accent)]" /> 4 sem.
                    </span>
                </div>
                <div className="space-y-3 py-4 text-sm">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-[var(--wk-paper-2)] px-3.5 py-2.5">
                        Ton quiz sur les fractions : 7/10, c&apos;est bien mieux ! On attaque les équations ?
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(26,21,18,0.08)] p-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6a1a1a] text-[var(--wk-accent)]">
                            <BookOpen className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                            <div className="text-xs font-semibold uppercase tracking-wide text-[rgba(26,21,18,0.5)]">Cours à lire</div>
                            <div className="font-semibold">Équations du 1er degré</div>
                        </div>
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-[var(--wk-ink)] px-3.5 py-2.5 text-[var(--wk-paper)]">
                        Oui ! Je le fais ce soir.
                    </div>
                </div>
                <div className="rounded-2xl bg-[var(--wk-paper)] p-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Mon plan</span>
                        <span className="text-[rgba(26,21,18,0.55)]">2 / 3 objectifs</span>
                    </div>
                    <div className="wk-xp-bar mt-2">
                        <div className="wk-xp-fill" style={{ width: "66%" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── Mes suivis ───────────────────────── */

function MySuiviCard({ m }: { m: MentorshipSummary }) {
    const who = m.mentor?.username;
    return (
        <Link
            href={`/suivi/${m.id}`}
            className="group flex flex-col rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[rgba(26,21,18,0.18)] hover:shadow-[0_16px_40px_rgba(26,21,18,0.08)]"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[var(--wk-accent)]">
                        {m.level} · {FORMAT_LABELS[m.format]?.label}
                    </div>
                    <h3 className="font-serif-display mt-1 text-2xl leading-tight">{m.subject}</h3>
                </div>
                <StatusPill status={m.status} />
            </div>
            <div className="mt-4 flex items-center gap-2.5 text-sm text-[rgba(26,21,18,0.7)]">
                {who ? (
                    <>
                        <Initial name={who} tone="orange" size={26} />
                        avec <strong className="text-[var(--wk-ink)]">{who}</strong>
                    </>
                ) : m.status === "pending" ? (
                    <>
                        <Clock className="h-4 w-4" /> Demande envoyée le {formatDate(m.createdAt)}
                    </>
                ) : (
                    <span>{GOAL_TYPE_LABELS[m.goalType]}</span>
                )}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[rgba(26,21,18,0.06)] pt-4 text-xs">
                {m.goals.total > 0 && (
                    <span className="wk-chip">
                        <Target className="h-3.5 w-3.5" /> {m.goals.done}/{m.goals.total} objectifs
                    </span>
                )}
                {m.duoStreak > 0 && (
                    <span className="wk-chip">
                        <Flame className="h-3.5 w-3.5 text-[var(--wk-accent)]" /> {m.duoStreak} sem.
                    </span>
                )}
                {m.checkinPending && <span className="wk-chip !border-emerald-200 !bg-emerald-50 text-emerald-700">Point d&apos;étape</span>}
                {m.unread > 0 && (
                    <span className="wk-chip !border-[var(--wk-accent)] !bg-[var(--wk-accent)] text-white">
                        {m.unread} nouveau{m.unread > 1 ? "x" : ""}
                    </span>
                )}
                <ChevronRight className="ml-auto h-4 w-4 text-[rgba(26,21,18,0.35)] transition group-hover:translate-x-0.5" />
            </div>
        </Link>
    );
}

/* ───────────────────────── Formulaire ───────────────────────── */

function RequestForm() {
    const router = useRouter();
    const params = useSearchParams();
    const [format, setFormat] = useState<"ponctuel" | "suivi">("suivi");
    const [subject, setSubject] = useState(params.get("subject") || "");
    const [level, setLevel] = useState(params.get("level") || "");
    const [goalType, setGoalType] = useState("");
    const [need, setNeed] = useState("");
    const [availability, setAvailability] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Une valeur venue de l'URL doit exister dans les listes, sinon on l'ignore
    useEffect(() => {
        if (subject && !educationData.subjects.includes(subject)) setSubject("");
        if (level && !educationData.levels.includes(level)) setLevel("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const needOk = need.trim().length >= 20;
    const ready = useMemo(() => subject && level && goalType && needOk, [subject, level, goalType, needOk]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ready || sending) return;
        setSending(true);
        setError(null);
        try {
            const res = await api<{ id: string }>("/api/suivi", {
                method: "POST",
                json: { format, subject, level, goalType, need, availability },
            });
            router.push(`/suivi/${res.id}`);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Impossible d'envoyer la demande.");
            setSending(false);
        }
    };

    const field = "w-full rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--wk-accent)] focus:ring-4 focus:ring-[rgba(255,106,26,0.12)]";
    const label = "mb-2 block text-sm font-semibold";

    return (
        <form onSubmit={submit} className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-6 sm:p-8">
            {/* Format */}
            <fieldset>
                <legend className={label}>De quoi as-tu besoin ?</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(["suivi", "ponctuel"] as const).map((f) => (
                        <label
                            key={f}
                            className={`cursor-pointer rounded-2xl border p-4 transition ${
                                format === f
                                    ? "border-[var(--wk-accent)] bg-[rgba(255,106,26,0.05)] ring-4 ring-[rgba(255,106,26,0.1)]"
                                    : "border-[rgba(26,21,18,0.12)] hover:border-[rgba(26,21,18,0.25)]"
                            }`}
                        >
                            <input
                                type="radio"
                                name="format"
                                value={f}
                                checked={format === f}
                                onChange={() => setFormat(f)}
                                className="sr-only"
                            />
                            <span className="block font-semibold">{FORMAT_LABELS[f].label}</span>
                            <span className="mt-0.5 block text-sm text-[rgba(26,21,18,0.6)]">{FORMAT_LABELS[f].hint}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="suivi-subject" className={label}>Matière</label>
                    <select id="suivi-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={field} required>
                        <option value="">Choisir…</option>
                        {educationData.subjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="suivi-level" className={label}>Niveau</label>
                    <select id="suivi-level" value={level} onChange={(e) => setLevel(e.target.value)} className={field} required>
                        <option value="">Choisir…</option>
                        {educationData.levels.map((l) => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>
            </div>

            <fieldset className="mt-6">
                <legend className={label}>Ton objectif</legend>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(GOAL_TYPE_LABELS).map(([key, text]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setGoalType(key)}
                            aria-pressed={goalType === key}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                goalType === key
                                    ? "border-[var(--wk-ink)] bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                                    : "border-[rgba(26,21,18,0.14)] bg-white hover:border-[rgba(26,21,18,0.3)]"
                            }`}
                        >
                            {text}
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="mt-6">
                <label htmlFor="suivi-need" className={label}>Qu&apos;est-ce qui te bloque ?</label>
                <textarea
                    id="suivi-need"
                    value={need}
                    onChange={(e) => setNeed(e.target.value.slice(0, 1000))}
                    rows={5}
                    placeholder="Ex. Je ne comprends pas les équations depuis le début du trimestre. J'ai refait les exercices du cours mais je me trompe toujours au moment de passer les termes de l'autre côté…"
                    className={`${field} resize-y leading-relaxed`}
                    required
                />
                <div className="mt-1.5 flex justify-between text-xs text-[rgba(26,21,18,0.5)]">
                    <span>{needOk ? "C'est parfait." : "Encore quelques mots (20 caractères minimum)."}</span>
                    <span>{need.length}/1000</span>
                </div>
            </div>

            <div className="mt-6">
                <label htmlFor="suivi-dispo" className={label}>
                    Tes disponibilités <span className="font-normal text-[rgba(26,21,18,0.5)]">(facultatif)</span>
                </label>
                <input
                    id="suivi-dispo"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value.slice(0, 200))}
                    placeholder="Ex. le mercredi après-midi et le week-end"
                    className={field}
                />
            </div>

            {error && (
                <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-xs leading-relaxed text-[rgba(26,21,18,0.55)]">
                    Les échanges sont conservés et peuvent être relus par la modération en cas de signalement. Ne
                    partage jamais tes coordonnées.
                </p>
                <button type="submit" disabled={!ready || sending} className="wk-btn-orange justify-center disabled:cursor-not-allowed disabled:opacity-50">
                    {sending ? <Spinner className="h-4 w-4" /> : null}
                    Envoyer ma demande
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </form>
    );
}
