"use client";

/**
 * Partie légère du Pomodoro, chargée sur toutes les pages : types, petites
 * fonctions d'affichage et le magasin que lisent la page /kits/pomodoro et le
 * widget flottant.
 *
 * Le moteur (PomodoroEngine : minuteur, sons, synchro serveur, radio) n'est
 * téléchargé que lorsqu'il sert : sur /kits/pomodoro, ou quand un minuteur
 * sauvegardé dans ce navigateur tourne ou est en pause (voir PomodoroGate).
 * Il publie son état ici ; tant qu'il n'est pas monté, usePomodoro() renvoie
 * l'état initial (minuteur arrêté, réglages par défaut), exactement ce que le
 * moteur affiche lui-même avant d'avoir relu le localStorage.
 */

import { useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, type PomodoroSettings } from "@/lib/pomodoro/settings";
import type { AmbienceKind } from "@/lib/pomodoro/ambience";

export type Phase = "focus" | "short" | "long";
export type Status = "idle" | "running" | "paused";
/** Issue du dernier focus : Corvy a gardé son fromage, ou Foxy l'a pris. */
export type Outcome = "kept" | "stolen" | null;

export interface RadioTrack {
    stationId: string;
    videoId: string;
    label: string;
    /** Moment où le direct a été résolu : un direct YouTube peut changer d'identifiant */
    resolvedAt: number;
}

export interface PomodoroContextValue {
    hydrated: boolean;
    isAuthenticated: boolean;
    settings: PomodoroSettings;
    updateSettings: (patch: Partial<PomodoroSettings>) => void;
    phase: Phase;
    status: Status;
    remainingMs: number;
    totalMs: number;
    cycle: number;
    outcome: Outcome;
    subject: string;
    setSubject: (s: string) => void;
    start: () => void;
    pause: () => void;
    /** Abandon du focus en cours (Foxy prend le fromage) ou fin de la pause */
    stop: () => void;
    skip: () => void;
    selectPhase: (p: Phase) => void;
    /** Pomodoros réussis au total (avance dans la fable) */
    fableCount: number;
    syncFableCount: (serverTotal: number) => void;
    todayCount: number;
    /** Change à chaque focus enregistré : les stats se rechargent */
    statsVersion: number;
    /** Un focus est en cours : seul moment où l'ambiance et la radio jouent */
    focusing: boolean;
    /** Ambiance choisie (elle ne joue que pendant le focus) */
    ambience: AmbienceKind | null;
    setAmbience: (k: AmbienceKind | null) => void;
    volume: number;
    setVolume: (v: number) => void;
    /** Radio choisie (lecteur dans PomodoroWidget, joue seulement pendant le focus) */
    radio: RadioTrack | null;
    setRadio: (r: Omit<RadioTrack, "resolvedAt"> | null) => void;
}

/** Clé du minuteur dans le localStorage (lue aussi par PomodoroGate). */
export const STATE_KEY = "wk-pomodoro-state";

export function formatClock(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function phaseLabel(p: Phase): string {
    return p === "focus" ? "Focus" : p === "short" ? "Pause courte" : "Pause longue";
}

/** Un minuteur tourne ou est en pause dans ce navigateur : le moteur doit être chargé. */
export function hasSavedTimer(): boolean {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        if (!raw) return false;
        const status = (JSON.parse(raw) as { status?: unknown }).status;
        return status === "running" || status === "paused";
    } catch {
        return false;
    }
}

const noop = () => {};

/** État avant le montage du moteur : identique au premier rendu du moteur. */
const FALLBACK: PomodoroContextValue = {
    hydrated: false,
    isAuthenticated: false,
    settings: DEFAULT_SETTINGS,
    updateSettings: noop,
    phase: "focus",
    status: "idle",
    remainingMs: DEFAULT_SETTINGS.focusMin * 60_000,
    totalMs: DEFAULT_SETTINGS.focusMin * 60_000,
    cycle: 0,
    outcome: null,
    subject: "",
    setSubject: noop,
    start: noop,
    pause: noop,
    stop: noop,
    skip: noop,
    selectPhase: noop,
    fableCount: 0,
    syncFableCount: noop,
    todayCount: 0,
    statsVersion: 0,
    focusing: false,
    ambience: null,
    setAmbience: noop,
    volume: 0.4,
    setVolume: noop,
    radio: null,
    setRadio: noop,
};

let current: PomodoroContextValue | null = null;
const listeners = new Set<() => void>();

/** Appelé par le moteur à chaque changement d'état (null au démontage). */
export function publishPomodoro(value: PomodoroContextValue | null): void {
    current = value;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

const getSnapshot = () => current ?? FALLBACK;
const getServerSnapshot = () => FALLBACK;

export function usePomodoro(): PomodoroContextValue {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
