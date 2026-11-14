"use client";

/**
 * Pomodoro global : monté dans ClientProviders, il continue de tourner quand
 * l'élève navigue sur le site (et reprend après un rechargement grâce au
 * localStorage). Le temps restant est toujours recalculé depuis une heure de
 * fin absolue : pas de dérive quand l'onglet est en arrière-plan.
 */

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    DEFAULT_SETTINGS,
    STRICT_HIDDEN_MS,
    sanitizeSettings,
    type PomodoroSettings,
} from "@/lib/pomodoro/settings";
import { playAmbience, playChime, previewAmbience, setAmbienceVolume, stopAmbience, unlockAudio, type AmbienceKind } from "@/lib/pomodoro/ambience";

export type Phase = "focus" | "short" | "long";
export type Status = "idle" | "running" | "paused";
/** Issue du dernier focus : Corvy a gardé son fromage, ou Foxy l'a pris. */
export type Outcome = "kept" | "stolen" | null;

interface TimerState {
    phase: Phase;
    status: Status;
    /** Heure de fin (ms) quand le minuteur tourne */
    endsAt: number | null;
    /** Temps restant quand le minuteur est arrêté ou en pause */
    remainingMs: number;
    /** Focus réussis dans la série en cours (pour la pause longue) */
    cycle: number;
    focusStartedAt: number | null;
    /** Temps de focus écoulé avant la dernière reprise */
    focusRunMs: number;
    resumedAt: number | null;
    outcome: Outcome;
    subject: string;
}

interface PomodoroContextValue {
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

export interface RadioTrack {
    stationId: string;
    videoId: string;
    label: string;
    /** Moment où le direct a été résolu : un direct YouTube peut changer d'identifiant */
    resolvedAt: number;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

const STATE_KEY = "wk-pomodoro-state";
const SETTINGS_KEY = "wk-pomodoro-settings";
const FABLE_KEY = "wk-pomodoro-fable";
const TODAY_KEY = "wk-pomodoro-today";
const VOLUME_KEY = "wk-pomodoro-volume";
const AMBIENCE_KEY = "wk-pomodoro-ambience";
const RADIO_KEY = "wk-pomodoro-radio";
const RADIO_STALE_MS = 60 * 60_000;
const TITLE_PREFIX_RE = /^(?:🧀|☕|⏸) \d+:\d{2} · /;

function phaseMs(phase: Phase, s: PomodoroSettings): number {
    const min = phase === "focus" ? s.focusMin : phase === "short" ? s.shortBreakMin : s.longBreakMin;
    return min * 60_000;
}

function initialState(s: PomodoroSettings): TimerState {
    return {
        phase: "focus",
        status: "idle",
        endsAt: null,
        remainingMs: phaseMs("focus", s),
        cycle: 0,
        focusStartedAt: null,
        focusRunMs: 0,
        resumedAt: null,
        outcome: null,
        subject: "",
    };
}

function todayKey(): string {
    return new Intl.DateTimeFormat("fr-CA").format(new Date());
}

export function formatClock(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function phaseLabel(p: Phase): string {
    return p === "focus" ? "Focus" : p === "short" ? "Pause courte" : "Pause longue";
}

function readJson<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function notify(enabled: boolean, title: string, body: string) {
    if (!enabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
        new Notification(title, { body, icon: "/favicon-48x48.png", tag: "wk-pomodoro" });
    } catch {
        /* Notification indisponible (iOS hors PWA) */
    }
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
    const { status: authStatus } = useSession();
    const isAuthenticated = authStatus === "authenticated";

    const [hydrated, setHydrated] = useState(false);
    const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
    const [state, setState] = useState<TimerState>(() => initialState(DEFAULT_SETTINGS));
    const [now, setNow] = useState(() => Date.now());
    const [fableCount, setFableCount] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [statsVersion, setStatsVersion] = useState(0);
    const [ambience, setAmbienceState] = useState<AmbienceKind | null>(null);
    const [volume, setVolumeState] = useState(0.4);
    const [radio, setRadioState] = useState<RadioTrack | null>(null);

    // Les actions lisent l'état courant via des refs : les effets de bord
    // (son, notification, API) restent hors des fonctions de mise à jour.
    const stateRef = useRef(state);
    const settingsRef = useRef(settings);
    const authRef = useRef(isAuthenticated);
    useLayoutEffect(() => {
        stateRef.current = state;
        settingsRef.current = settings;
        authRef.current = isAuthenticated;
    }, [state, settings, isAuthenticated]);
    const commit = useCallback((next: TimerState) => {
        stateRef.current = next;
        setState(next);
    }, []);

    /* ───────── Chargement / sauvegarde locale ───────── */

    // Lecture après le montage : le rendu serveur n'a pas accès au localStorage
    useEffect(() => {
        const s = sanitizeSettings(readJson(SETTINGS_KEY));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings(s);
        const saved = readJson<TimerState>(STATE_KEY);
        setState(saved && typeof saved.phase === "string" ? { ...initialState(s), ...saved } : initialState(s));
        setFableCount(Number(localStorage.getItem(FABLE_KEY)) || 0);
        const today = readJson<{ date: string; count: number }>(TODAY_KEY);
        setTodayCount(today?.date === todayKey() ? today.count : 0);
        const v = Number(localStorage.getItem(VOLUME_KEY));
        if (v >= 0 && v <= 1 && localStorage.getItem(VOLUME_KEY) !== null) setVolumeState(v);
        const amb = localStorage.getItem(AMBIENCE_KEY);
        if (amb) setAmbienceState(amb as AmbienceKind);
        const r = readJson<RadioTrack>(RADIO_KEY);
        if (r?.stationId && r.videoId) setRadioState(r);
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) localStorage.setItem(STATE_KEY, JSON.stringify(state));
    }, [state, hydrated]);

    /* ───────── Réglages synchronisés (comptes connectés) ───────── */

    const serverSyncedRef = useRef(false);
    useEffect(() => {
        if (!hydrated || !isAuthenticated || serverSyncedRef.current) return;
        serverSyncedRef.current = true;
        fetch("/api/pomodoro/preferences")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.settings) {
                    const s = sanitizeSettings(data.settings);
                    setSettings(s);
                    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
                    setState((st) => (st.status === "idle" ? { ...st, remainingMs: phaseMs(st.phase, s) } : st));
                } else if (data) {
                    // Premier passage : les réglages de ce navigateur deviennent ceux du compte
                    void fetch("/api/pomodoro/preferences", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ settings: settingsRef.current }),
                    });
                }
            })
            .catch(() => {});
    }, [hydrated, isAuthenticated]);

    const saveTimer = useRef<number | null>(null);
    const updateSettings = useCallback((patch: Partial<PomodoroSettings>) => {
        const next = sanitizeSettings({ ...settingsRef.current, ...patch });
        setSettings(next);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        // Nouvelle durée appliquée tout de suite si rien ne tourne
        setState((st) => (st.status === "idle" ? { ...st, remainingMs: phaseMs(st.phase, next) } : st));
        if (patch.notifications && typeof Notification !== "undefined" && Notification.permission === "default") {
            void Notification.requestPermission();
        }
        if (authRef.current) {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = window.setTimeout(() => {
                void fetch("/api/pomodoro/preferences", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ settings: next }),
                });
            }, 800);
        }
    }, []);

    /* ───────── Journal des focus ───────── */

    const logFocus = useCallback((s: TimerState, endedAt: number, completed: boolean) => {
        if (!authRef.current || !s.focusStartedAt) return;
        const focusedMs = s.focusRunMs + (s.resumedAt ? endedAt - s.resumedAt : 0);
        void fetch("/api/pomodoro/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                startedAt: new Date(s.focusStartedAt).toISOString(),
                endedAt: new Date(endedAt).toISOString(),
                plannedMinutes: settingsRef.current.focusMin,
                focusedSeconds: Math.round(focusedMs / 1000),
                completed,
                subject: s.subject || undefined,
            }),
        })
            .then(() => setStatsVersion((v) => v + 1))
            .catch(() => {});
    }, []);

    // Le localStorage fait foi (partagé entre onglets, mis à jour par syncFableCount)
    const bumpCounts = useCallback(() => {
        const fable = (Number(localStorage.getItem(FABLE_KEY)) || 0) + 1;
        localStorage.setItem(FABLE_KEY, String(fable));
        setFableCount(fable);

        const date = todayKey();
        const prev = readJson<{ date: string; count: number }>(TODAY_KEY);
        const today = (prev?.date === date ? prev.count : 0) + 1;
        localStorage.setItem(TODAY_KEY, JSON.stringify({ date, count: today }));
        setTodayCount(today);
        if (authRef.current && today === settingsRef.current.dailyGoal) {
            toast.success(`Objectif du jour atteint : ${today} pomodoros !`);
        }
    }, []);

    /* ───────── Transitions ───────── */

    const completePhase = useCallback((at: number) => {
        const s = stateRef.current;
        const cfg = settingsRef.current;
        if (s.status !== "running") return;
        // Revenu longtemps après la fin (onglet fermé) : on n'enchaîne pas tout seul
        const late = Date.now() - at > 60_000;

        if (s.phase === "focus") {
            logFocus(s, at, true);
            bumpCounts();
            const cycle = s.cycle + 1;
            const nextPhase: Phase = cycle % cfg.cyclesBeforeLong === 0 ? "long" : "short";
            const auto = cfg.autoStartBreaks && !late;
            commit({
                ...s,
                phase: nextPhase,
                status: auto ? "running" : "idle",
                endsAt: auto ? at + phaseMs(nextPhase, cfg) : null,
                remainingMs: phaseMs(nextPhase, cfg),
                cycle,
                focusStartedAt: null,
                focusRunMs: 0,
                resumedAt: null,
                outcome: "kept",
            });
            if (cfg.sound) playChime("up");
            notify(cfg.notifications, "Corvy a gardé son fromage 🧀", `Focus terminé ! ${phaseLabel(nextPhase)} de ${phaseMs(nextPhase, cfg) / 60_000} min.`);
        } else {
            const auto = cfg.autoStartFocus && !late;
            const startAt = Date.now();
            commit({
                ...s,
                phase: "focus",
                status: auto ? "running" : "idle",
                endsAt: auto ? startAt + phaseMs("focus", cfg) : null,
                remainingMs: phaseMs("focus", cfg),
                cycle: s.phase === "long" ? 0 : s.cycle,
                focusStartedAt: auto ? startAt : null,
                focusRunMs: 0,
                resumedAt: auto ? startAt : null,
                outcome: null,
            });
            if (cfg.sound) playChime("down");
            notify(cfg.notifications, "Fin de la pause ☕", "Foxy rôde déjà… on reprend le focus ?");
        }
    }, [bumpCounts, commit, logFocus]);

    const start = useCallback(() => {
        const s = stateRef.current;
        if (s.status === "running") return;
        const t = Date.now();
        const isFocus = s.phase === "focus";
        // Clic sur « Démarrer » : on débloque l'audio du navigateur tant que le geste compte
        unlockAudio();
        commit({
            ...s,
            status: "running",
            endsAt: t + s.remainingMs,
            focusStartedAt: isFocus ? (s.focusStartedAt ?? t) : null,
            resumedAt: isFocus ? t : null,
            outcome: isFocus && s.status === "idle" ? null : s.outcome,
        });
    }, [commit]);

    const pause = useCallback(() => {
        const s = stateRef.current;
        if (s.status !== "running" || !s.endsAt) return;
        const t = Date.now();
        commit({
            ...s,
            status: "paused",
            remainingMs: Math.max(0, s.endsAt - t),
            endsAt: null,
            focusRunMs: s.phase === "focus" && s.resumedAt ? s.focusRunMs + (t - s.resumedAt) : s.focusRunMs,
            resumedAt: null,
        });
    }, [commit]);

    const stop = useCallback(() => {
        const s = stateRef.current;
        const cfg = settingsRef.current;
        const t = Date.now();
        if (s.phase === "focus") {
            const ran = s.focusRunMs + (s.resumedAt ? t - s.resumedAt : 0);
            // Moins d'une minute : simple remise à zéro, pas de fable
            const stolen = s.status !== "idle" && ran >= 60_000;
            if (stolen) logFocus(s, t, false);
            commit({ ...initialState(cfg), cycle: s.cycle, subject: s.subject, outcome: stolen ? "stolen" : null });
        } else {
            commit({ ...initialState(cfg), cycle: s.phase === "long" ? 0 : s.cycle, subject: s.subject, outcome: s.outcome });
        }
    }, [commit, logFocus]);

    const skip = useCallback(() => {
        const s = stateRef.current;
        if (s.phase === "focus") {
            stop();
            return;
        }
        const cfg = settingsRef.current;
        commit({ ...initialState(cfg), cycle: s.phase === "long" ? 0 : s.cycle, subject: s.subject, outcome: s.outcome });
    }, [commit, stop]);

    const selectPhase = useCallback((p: Phase) => {
        const s = stateRef.current;
        if (s.status !== "idle") return;
        commit({ ...s, phase: p, remainingMs: phaseMs(p, settingsRef.current) });
    }, [commit]);

    const setSubject = useCallback((subject: string) => setState((s) => ({ ...s, subject })), []);

    const syncFableCount = useCallback((serverTotal: number) => {
        setFableCount((c) => {
            const next = Math.max(c, serverTotal);
            localStorage.setItem(FABLE_KEY, String(next));
            return next;
        });
    }, []);

    /* ───────── Horloge ───────── */

    useEffect(() => {
        if (state.status !== "running") return;
        const tick = () => {
            const t = Date.now();
            setNow(t);
            const s = stateRef.current;
            if (s.status === "running" && s.endsAt && t >= s.endsAt) completePhase(s.endsAt);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [state.status, state.endsAt, completePhase]);

    /* ───────── Mode strict : quitter l'onglet trop longtemps ───────── */

    useEffect(() => {
        let hiddenAt: number | null = null;
        const onVisibility = () => {
            const s = stateRef.current;
            if (document.hidden) {
                hiddenAt = Date.now();
                return;
            }
            const away = hiddenAt ? Date.now() - hiddenAt : 0;
            hiddenAt = null;
            if (settingsRef.current.strictMode && s.phase === "focus" && s.status === "running" && away > STRICT_HIDDEN_MS) {
                stop();
                toast.error("Tu as quitté l'onglet trop longtemps : Foxy a pris le fromage !");
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [stop]);

    /* ───────── Titre de l'onglet ───────── */

    const remainingMs = state.status === "running" && state.endsAt ? Math.max(0, state.endsAt - now) : state.remainingMs;
    const clock = formatClock(remainingMs);

    useEffect(() => {
        const base = document.title.replace(TITLE_PREFIX_RE, "");
        if (state.status === "idle") {
            if (base !== document.title) document.title = base;
            return;
        }
        const icon = state.status === "paused" ? "⏸" : state.phase === "focus" ? "🧀" : "☕";
        document.title = `${icon} ${clock} · ${base}`;
    }, [clock, state.status, state.phase]);

    /* ───────── Ambiance ───────── */

    const focusing = state.phase === "focus" && state.status === "running";

    // L'ambiance suit le focus : elle démarre avec lui et s'arrête à la pause,
    // pendant les pauses du Pomodoro et à l'arrêt
    useEffect(() => {
        if (!hydrated) return;
        if (focusing && ambience) playAmbience(ambience);
        else stopAmbience({ keepPreview: true });
    }, [hydrated, focusing, ambience]);

    const setAmbience = useCallback((k: AmbienceKind | null) => {
        setAmbienceState(k);
        if (k) localStorage.setItem(AMBIENCE_KEY, k);
        else localStorage.removeItem(AMBIENCE_KEY);
        // Hors focus, un court aperçu pour savoir à quoi ça ressemble
        const s = stateRef.current;
        if (!k) stopAmbience();
        else if (!(s.phase === "focus" && s.status === "running")) previewAmbience(k);
    }, []);

    useEffect(() => {
        setAmbienceVolume(volume);
    }, [volume]);

    const setRadio = useCallback((r: Omit<RadioTrack, "resolvedAt"> | null) => {
        const track = r ? { ...r, resolvedAt: Date.now() } : null;
        setRadioState(track);
        if (track) localStorage.setItem(RADIO_KEY, JSON.stringify(track));
        else localStorage.removeItem(RADIO_KEY);
    }, []);

    // Direct mémorisé depuis longtemps : on redemande le direct en cours au lancement du focus
    useEffect(() => {
        if (!focusing || !radio || Date.now() - radio.resolvedAt < RADIO_STALE_MS) return;
        let cancelled = false;
        fetch(`/api/pomodoro/radio?channel=${radio.stationId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data?.videoId) setRadio({ ...radio, videoId: data.videoId });
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [focusing, radio, setRadio]);

    const setVolume = useCallback((v: number) => {
        setVolumeState(v);
        localStorage.setItem(VOLUME_KEY, String(v));
    }, []);

    const value = useMemo<PomodoroContextValue>(() => ({
        hydrated,
        isAuthenticated,
        settings,
        updateSettings,
        phase: state.phase,
        status: state.status,
        remainingMs,
        totalMs: phaseMs(state.phase, settings),
        cycle: state.cycle,
        outcome: state.outcome,
        subject: state.subject,
        setSubject,
        start,
        pause,
        stop,
        skip,
        selectPhase,
        fableCount,
        syncFableCount,
        todayCount,
        statsVersion,
        focusing,
        ambience,
        setAmbience,
        volume,
        setVolume,
        radio,
        setRadio,
    }), [
        hydrated, isAuthenticated, settings, updateSettings, state.phase, state.status, remainingMs,
        state.cycle, state.outcome, state.subject, setSubject, start, pause, stop, skip, selectPhase,
        fableCount, syncFableCount, todayCount, statsVersion, focusing, ambience, setAmbience, volume, setVolume, radio, setRadio,
    ]);

    return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro(): PomodoroContextValue {
    const ctx = useContext(PomodoroContext);
    if (!ctx) throw new Error("usePomodoro doit être utilisé dans <PomodoroProvider>");
    return ctx;
}
