"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Send,
    ImagePlus,
    X,
    Target,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    ExternalLink,
    CalendarDays,
    Flame,
    Info,
} from "lucide-react";
import { MOOD_LABELS } from "@/lib/mentorship/config";
import {
    api,
    ApiError,
    formatDate,
    formatTime,
    type Assignment,
    type Message,
    type MentorshipDetail,
    type Mood,
} from "../../_lib/client";
import { KindBadge, KIND_META, Initial, Spinner } from "../ui";
import type { TypingUser } from "@/hooks/useThreadRealtime";

interface Props {
    detail: MentorshipDetail;
    messages: Message[];
    myId: string;
    typingUsers: TypingUser[];
    startTyping: (words?: number) => void;
    stopTyping: () => void;
    onSent: () => void;
}

const MOOD_STYLE: Record<Mood, string> = {
    bien: "bg-emerald-50 text-emerald-700 border-emerald-200",
    moyen: "bg-amber-50 text-amber-700 border-amber-200",
    bloque: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Conversation({ detail, messages, myId, typingUsers, startTyping, stopTyping, onSent }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const stickToBottom = useRef(true);

    // Reste collé en bas quand un message arrive, sauf si on est en train de relire plus haut
    useEffect(() => {
        const el = scrollRef.current;
        if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
    }, [messages.length, typingUsers.length]);

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };

    const assignments = new Map((detail.assignments || []).map((a) => [a.id, a]));
    const isStudent = detail.viewer === "student";
    const otherReadAt = isStudent ? detail.lastReadAt?.mentor : detail.lastReadAt?.student;
    const myLast = [...messages].reverse().find((m) => m.author?.id === myId && m.status === "visible");
    const openCheckinId =
        detail.checkin?.askedAt && !detail.checkin.answeredAt
            ? [...messages].reverse().find((m) => m.kind === "checkin")?.id
            : undefined;

    const dayOf = (iso: string) => formatDate(iso, { weekday: "long", day: "numeric", month: "long" });

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
                <RequestRecap detail={detail} />

                {messages.map((m, i) => {
                    const day = dayOf(m.createdAt);
                    // Séparateur de journée au premier message de chaque jour
                    const showDay = i === 0 || dayOf(messages[i - 1].createdAt) !== day;
                    return (
                        <React.Fragment key={m.id}>
                            {showDay && (
                                <div className="font-mono-ui py-2 text-center text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.4)]">
                                    {day}
                                </div>
                            )}
                            <MessageItem
                                m={m}
                                mine={m.author?.id === myId}
                                assignment={m.meta?.assignmentId ? assignments.get(m.meta.assignmentId) : undefined}
                                seen={!!(myLast && m.id === myLast.id && otherReadAt && otherReadAt >= m.createdAt)}
                                checkinOpen={isStudent && m.id === openCheckinId}
                                mentorshipId={detail.id}
                                onSent={onSent}
                            />
                        </React.Fragment>
                    );
                })}

                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[rgba(26,21,18,0.5)]">
                        <span className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                                <span
                                    key={i}
                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgba(26,21,18,0.35)]"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </span>
                        {typingUsers[0].username} écrit…
                    </div>
                )}
            </div>

            <Composer detail={detail} startTyping={startTyping} stopTyping={stopTyping} onSent={onSent} />
        </div>
    );
}

/* ─── Le rappel de la demande, en tête du fil ─── */

function RequestRecap({ detail }: { detail: MentorshipDetail }) {
    return (
        <div className="mx-auto mb-4 max-w-xl rounded-2xl border border-dashed border-[rgba(26,21,18,0.18)] bg-[var(--wk-paper)] p-4 text-sm">
            <div className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[rgba(26,21,18,0.5)]">
                La demande de {detail.student?.username} · {formatDate(detail.createdAt)}
            </div>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-[rgba(26,21,18,0.8)]">{detail.need}</p>
            {detail.availability && (
                <p className="mt-2 text-xs text-[rgba(26,21,18,0.55)]">Disponibilités : {detail.availability}</p>
            )}
        </div>
    );
}

/* ─── Un message ─── */

function MessageItem({
    m,
    mine,
    assignment,
    seen,
    checkinOpen,
    mentorshipId,
    onSent,
}: {
    m: Message;
    mine: boolean;
    assignment?: Assignment;
    seen: boolean;
    checkinOpen: boolean;
    mentorshipId: string;
    onSent: () => void;
}) {
    // Événements du suivi : une ligne centrée, discrète
    if (m.kind === "event") {
        const done = m.meta?.event === "assignment_done";
        const streak = m.meta?.event === "duo_streak";
        return (
            <div className="flex justify-center py-1">
                <span
                    className={`inline-flex max-w-[90%] items-center gap-2 rounded-full px-3.5 py-1.5 text-center text-xs font-medium ${
                        done
                            ? "bg-emerald-50 text-emerald-700"
                            : streak
                              ? "bg-[rgba(255,106,26,0.1)] text-[#c24a0a]"
                              : "bg-[rgba(26,21,18,0.05)] text-[rgba(26,21,18,0.65)]"
                    }`}
                >
                    {done && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                    {streak && <Flame className="h-3.5 w-3.5 shrink-0" />}
                    {m.text}
                </span>
            </div>
        );
    }

    if (m.kind === "goal") {
        const reached = m.meta?.event === "goal_done";
        return (
            <div className="flex justify-center py-1">
                <div
                    className={`flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        reached ? "border-emerald-200 bg-emerald-50" : "border-[rgba(26,21,18,0.1)] bg-white"
                    }`}
                >
                    {reached ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                        <Target className="h-5 w-5 shrink-0 text-[var(--wk-accent)]" />
                    )}
                    <span className="font-medium">{m.text}</span>
                </div>
            </div>
        );
    }

    if (m.kind === "checkin") {
        return <CheckinCard m={m} open={checkinOpen} mentorshipId={mentorshipId} onSent={onSent} />;
    }

    const blocked = m.status === "blocked";
    const fromModeration = m.authorRole === "moderator";

    return (
        <div className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
            {!mine && <Initial name={m.author?.username || "?"} tone={fromModeration ? "ink" : "orange"} size={30} />}
            <div className={`flex max-w-[82%] flex-col ${mine ? "items-end" : "items-start"}`}>
                {!mine && (
                    <span className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold text-[rgba(26,21,18,0.6)]">
                        {m.author?.username}
                        {fromModeration && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--wk-ink)] px-2 py-0.5 text-[10px] text-white">
                                <ShieldCheck className="h-3 w-3" /> Modération
                            </span>
                        )}
                    </span>
                )}

                {m.kind === "resource" && assignment && <ResourceCard a={assignment} />}
                {m.kind === "resource" && !assignment && (
                    <div className="rounded-2xl border border-dashed border-[rgba(26,21,18,0.15)] px-4 py-2 text-xs text-[rgba(26,21,18,0.5)]">
                        Ressource retirée du suivi
                    </div>
                )}

                {m.kind === "checkin_reply" && m.meta?.mood && (
                    <span className={`mb-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${MOOD_STYLE[m.meta.mood]}`}>
                        Point d&apos;étape · {MOOD_LABELS[m.meta.mood]}
                    </span>
                )}

                {m.attachment && (
                    <a href={m.attachment.url} target="_blank" rel="noopener noreferrer" className="mb-1 block overflow-hidden rounded-2xl border border-[rgba(26,21,18,0.1)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.attachment.url} alt={m.attachment.name} className="max-h-72 max-w-full object-contain" loading="lazy" />
                    </a>
                )}

                {m.text && (
                    <div
                        className={`whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            blocked
                                ? "border border-dashed border-red-300 bg-red-50 text-red-900"
                                : mine
                                  ? "rounded-tr-md bg-[var(--wk-ink)] text-[var(--wk-paper)]"
                                  : fromModeration
                                    ? "rounded-tl-md border border-[var(--wk-ink)] bg-white"
                                    : "rounded-tl-md bg-[var(--wk-paper-2)]"
                        } ${m.kind === "resource" ? "mt-1" : ""}`}
                    >
                        {m.text}
                    </div>
                )}

                <span className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-[rgba(26,21,18,0.4)]">
                    {blocked ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            Non envoyé — {(m.blockedReasons || []).join(", ")}
                        </span>
                    ) : (
                        <>
                            {formatTime(m.createdAt)}
                            {seen && <span className="font-semibold text-[rgba(26,21,18,0.55)]">· Vu</span>}
                        </>
                    )}
                </span>
            </div>
        </div>
    );
}

function ResourceCard({ a }: { a: Assignment }) {
    const meta = KIND_META[a.kind];
    return (
        <a
            href={a.url}
            className="group flex w-72 max-w-full items-center gap-3 rounded-2xl border border-[rgba(26,21,18,0.1)] bg-white p-3 text-left text-[var(--wk-ink)] transition hover:border-[rgba(26,21,18,0.25)]"
        >
            <KindBadge kind={a.kind} />
            <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                    {meta.label} à faire
                </span>
                <span className="block truncate text-sm font-semibold">{a.title}</span>
                {a.dueAt && (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[rgba(26,21,18,0.5)]">
                        <CalendarDays className="h-3 w-3" /> pour le {formatDate(a.dueAt)}
                    </span>
                )}
            </span>
            {a.doneAt ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Terminée" />
            ) : (
                <ExternalLink className="h-4 w-4 shrink-0 text-[rgba(26,21,18,0.35)] group-hover:text-[var(--wk-accent)]" />
            )}
        </a>
    );
}

/* ─── Point d'étape ─── */

function CheckinCard({ m, open, mentorshipId, onSent }: { m: Message; open: boolean; mentorshipId: string; onSent: () => void }) {
    const [mood, setMood] = useState<Mood | null>(null);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const send = async () => {
        if (!mood) return;
        setSending(true);
        setError(null);
        try {
            await api(`/api/suivi/${mentorshipId}/messages`, { method: "POST", json: { kind: "checkin_reply", mood, text } });
            onSent();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Envoi impossible.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mx-auto max-w-md rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <Target className="h-4 w-4" /> {m.text}
            </div>
            {open ? (
                <>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {(Object.keys(MOOD_LABELS) as Mood[]).map((k) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setMood(k)}
                                aria-pressed={mood === k}
                                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                                    mood === k ? MOOD_STYLE[k] + " ring-2 ring-offset-1 ring-current" : "border-[rgba(26,21,18,0.12)] bg-white"
                                }`}
                            >
                                {MOOD_LABELS[k]}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value.slice(0, 500))}
                        rows={2}
                        placeholder="Un mot pour ton bénévole ? (facultatif)"
                        className="mt-3 w-full resize-none rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    />
                    {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                    <button type="button" onClick={send} disabled={!mood || sending} className="wk-btn-ink mt-3 !px-4 !py-2 text-xs disabled:opacity-50">
                        {sending && <Spinner className="h-3.5 w-3.5" />}
                        Répondre
                    </button>
                </>
            ) : (
                <p className="mt-1 text-xs text-emerald-800/70">{formatDate(m.createdAt)}</p>
            )}
        </div>
    );
}

/* ─── Zone de saisie ─── */

function Composer({
    detail,
    startTyping,
    stopTyping,
    onSent,
}: {
    detail: MentorshipDetail;
    startTyping: (words?: number) => void;
    stopTyping: () => void;
    onSent: () => void;
}) {
    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const lastTyping = useRef(0);

    const closed = detail.status === "closed" || detail.status === "cancelled";
    const waiting = detail.status === "pending";
    const readOnly = closed || (waiting && detail.viewer !== "student" && detail.viewer !== "moderator");

    if (readOnly) {
        return (
            <div className="border-t border-[rgba(26,21,18,0.08)] bg-[var(--wk-paper)] px-5 py-4 text-center text-sm text-[rgba(26,21,18,0.55)]">
                {closed ? "Ce suivi est terminé : la conversation est conservée en lecture seule." : "La conversation s'ouvrira quand un bénévole aura pris la demande."}
            </div>
        );
    }

    const send = async () => {
        const clean = text.trim();
        if ((!clean && !file) || sending) return;
        setSending(true);
        setError(null);
        stopTyping();
        try {
            const form = new FormData();
            form.append("text", clean);
            if (file) form.append("file", file);
            await api(`/api/suivi/${detail.id}/messages`, { method: "POST", body: form });
            setText("");
            setFile(null);
            onSent();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Envoi impossible.");
            // Un message bloqué est conservé côté serveur : on l'affiche au rechargement
            if (err instanceof ApiError && err.status === 422) {
                setText("");
                onSent();
            }
        } finally {
            setSending(false);
        }
    };

    const onChange = (v: string) => {
        setText(v.slice(0, 2000));
        const now = Date.now();
        if (now - lastTyping.current > 2500) {
            lastTyping.current = now;
            startTyping(v.trim() ? v.trim().split(/\s+/).length : 0);
        }
    };

    return (
        <div className="border-t border-[rgba(26,21,18,0.08)] bg-white px-3 pb-3 pt-2 sm:px-4">
            {error && (
                <p role="alert" className="mb-2 flex gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </p>
            )}
            {file && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--wk-paper-2)] px-3 py-1 text-xs">
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span className="max-w-[200px] truncate">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} aria-label="Retirer l'image">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            <div className="flex items-end gap-2">
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[rgba(26,21,18,0.55)] transition hover:bg-[var(--wk-paper-2)] hover:text-[var(--wk-ink)]"
                    aria-label="Joindre une image"
                    title="Joindre une photo de ton exercice"
                >
                    <ImagePlus className="h-5 w-5" />
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                        setFile(e.target.files?.[0] || null);
                        e.target.value = "";
                    }}
                />
                <textarea
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={stopTyping}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }}
                    rows={1}
                    placeholder={
                        waiting
                            ? "Ajoute des précisions pour le bénévole qui prendra ta demande…"
                            : detail.viewer === "moderator"
                              ? "Écrire en tant que modération…"
                              : "Écris ton message…"
                    }
                    className="max-h-40 min-h-[44px] flex-1 resize-none rounded-3xl border border-[rgba(26,21,18,0.12)] bg-[var(--wk-paper)] px-4 py-2.5 text-sm leading-relaxed outline-none transition focus:border-[var(--wk-accent)] focus:bg-white"
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                    aria-label="Message"
                />
                <button
                    type="button"
                    onClick={send}
                    disabled={sending || (!text.trim() && !file)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--wk-accent)] text-white shadow-[0_3px_0_#c24a0a] transition hover:-translate-y-px disabled:opacity-40 disabled:shadow-none"
                    aria-label="Envoyer"
                >
                    {sending ? <Spinner className="h-4 w-4 !border-white/40 !border-t-white" /> : <Send className="h-4 w-4" />}
                </button>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 px-2 text-[11px] text-[rgba(26,21,18,0.45)]">
                <Info className="h-3 w-3 shrink-0" />
                Échanges conservés · pas de numéro ni de réseau social · Entrée pour envoyer, Maj+Entrée pour aller à la ligne
            </p>
        </div>
    );
}
