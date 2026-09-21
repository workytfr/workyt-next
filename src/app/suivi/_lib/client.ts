"use client";

/**
 * Types et appels réseau partagés par les pages du suivi (élève, bénévole,
 * modération). Les routes /api/suivi s'authentifient par la session : aucun
 * jeton à passer.
 */

export type ViewerRole = "student" | "mentor" | "moderator" | "candidate";
export type Status = "pending" | "active" | "paused" | "closed" | "cancelled";
export type Kind = "course" | "lesson" | "exercise" | "quiz" | "fiche" | "evaluation";
export type Mood = "bien" | "moyen" | "bloque";

export interface PublicUser {
    id: string;
    username: string;
    role?: string;
}

export interface Goal {
    id: string;
    title: string;
    done: boolean;
    doneAt: string | null;
}

export interface Assignment {
    id: string;
    kind: Kind;
    title: string;
    url: string;
    note: string;
    dueAt: string | null;
    assignedAt: string | null;
    doneAt: string | null;
    doneSource: "auto" | "student" | "mentor" | null;
    alreadyDone: boolean;
    score: number | null;
    maxScore: number | null;
}

export interface MentorProfileView {
    status: "available" | "paused";
    maxActive: number;
    subjects: string[];
    levels: string[];
    bio: string;
    charterAccepted: boolean;
    charterAcceptedAt: string | null;
    activeCount: number;
}

export interface MentorshipDetail {
    id: string;
    viewer: ViewerRole;
    status: Status;
    format: "ponctuel" | "suivi";
    subject: string;
    level: string;
    need: string;
    goalType: string;
    availability: string;
    createdAt: string | null;
    student: PublicUser | null;
    // Absents pour un bénévole candidat
    roomKey?: string;
    mentor?: (PublicUser & { bio: string }) | null;
    matchedAt?: string | null;
    pausedAt?: string | null;
    closedAt?: string | null;
    goals?: Goal[];
    assignments?: Assignment[];
    checkin?: { askedAt: string | null; answeredAt: string | null; mood: Mood | null } | null;
    nextCheckinAt?: string | null;
    duoStreak?: { current: number; best: number };
    lastReadAt?: { student: string | null; mentor: string | null };
    closure?: {
        outcome: string;
        summary: string;
        studentFeedback: "helpful" | "neutral" | "not_helpful" | null;
        byStudent: boolean;
    } | null;
    mentorNotes?: string;
    handoffNote?: string | null;
    resumed?: boolean;
    mentorHistory?: { mentor: PublicUser; from: string | null; to: string | null; reason: string | null; note: string }[];
    myMentorProfile?: MentorProfileView | null;
}

export interface Message {
    id: string;
    authorRole: "student" | "mentor" | "moderator" | "system";
    author: PublicUser | null;
    kind: "text" | "resource" | "goal" | "checkin" | "checkin_reply" | "event";
    text: string;
    attachment: { name: string; mime: string; url: string } | null;
    meta: { assignmentId: string | null; goalId: string | null; mood: Mood | null; event: string | null } | null;
    status: "visible" | "blocked";
    blockedReasons?: string[];
    createdAt: string;
}

export interface MentorshipSummary {
    id: string;
    status: Status;
    format: "ponctuel" | "suivi";
    subject: string;
    level: string;
    goalType: string;
    need?: string;
    student: PublicUser | null;
    mentor: PublicUser | null;
    createdAt: string | null;
    matchedAt: string | null;
    closedAt: string | null;
    lastMessageAt: string | null;
    lastStudentActivityAt: string | null;
    lastMentorActivityAt: string | null;
    goals: { total: number; done: number };
    assignments: { total: number; done: number };
    checkinMood: Mood | null;
    checkinPending: boolean;
    duoStreak: number;
    resumed: boolean;
    outcome: string | null;
    unread: number;
    waitingForMentorDays?: number;
}

export interface ResourceHit {
    kind: Kind;
    id: string;
    title: string;
    subtitle?: string;
    url: string;
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/** fetch JSON vers /api/suivi — lève ApiError avec le message du serveur */
export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
    const { json, ...rest } = init || {};
    const res = await fetch(path, {
        ...rest,
        headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
        body: json !== undefined ? JSON.stringify(json) : rest.body,
        cache: "no-store",
    });
    let payload: { success?: boolean; data?: T; error?: string; message?: string } = {};
    try {
        payload = await res.json();
    } catch {
        /* réponse vide */
    }
    if (!res.ok || payload.success === false) {
        throw new ApiError(payload.error || payload.message || "Une erreur est survenue.", res.status);
    }
    return payload.data as T;
}

/** Ouvre la fenêtre de connexion de la navbar */
export function openAuth() {
    window.dispatchEvent(new Event("workyt:open-auth"));
}

export function daysSince(iso: string | null | undefined): number | null {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("fr-FR", opts);
}

export function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
