"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Radio, Plus, Trash2, ToggleLeft, ToggleRight,
    ExternalLink, Calendar, PlayCircle, StopCircle,
} from "lucide-react";
import { PLATFORM_CONFIG, type PlatformType, type IPlatform } from "@/lib/livePlatforms";

interface LiveEvent {
    _id: string;
    title: string;
    videoId?: string;
    platforms: IPlatform[];
    scheduledAt: string;
    isActive: boolean;
    forceLive: boolean;
    createdAt: string;
}

const ALL_PLATFORMS = Object.entries(PLATFORM_CONFIG) as [PlatformType, typeof PLATFORM_CONFIG[PlatformType]][];

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function statusLabel(event: LiveEvent) {
    const now = Date.now();
    const scheduled = new Date(event.scheduledAt).getTime();
    const diff = scheduled - now;
    if (!event.isActive) return { label: "Désactivé", color: "bg-gray-100 text-gray-500" };
    if (event.forceLive) return { label: "EN DIRECT", color: "bg-red-100 text-red-600" };
    if (diff < 0) return { label: "Passé", color: "bg-gray-100 text-gray-500" };
    if (diff < 3_600_000) return { label: "Imminent", color: "bg-red-100 text-red-600" };
    const h = Math.floor(diff / 3_600_000);
    if (h <= 48) return { label: `Dans ${h}h`, color: "bg-orange-100 text-orange-600" };
    return { label: "Planifié", color: "bg-blue-100 text-blue-600" };
}

function toLocalInputValue(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyPlatform = (): IPlatform => ({ type: "youtube", url: "" });
const emptyForm = () => ({ title: "", scheduledAt: "", platforms: [emptyPlatform()] });

export default function LivesAdminClient() {
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/live-events");
            const data = await res.json();
            setEvents(data.events || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    /* ── Platform helpers ── */
    const addPlatform = () =>
        setForm((f) => ({ ...f, platforms: [...f.platforms, emptyPlatform()] }));

    const removePlatform = (i: number) =>
        setForm((f) => ({ ...f, platforms: f.platforms.filter((_, idx) => idx !== i) }));

    const updatePlatform = (i: number, key: keyof IPlatform, value: string) =>
        setForm((f) => {
            const platforms = [...f.platforms];
            platforms[i] = { ...platforms[i], [key]: value };
            return { ...f, platforms };
        });

    /* ── Submit ── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.title.trim() || !form.scheduledAt) {
            setError("Le titre et la date sont requis.");
            return;
        }
        if (form.platforms.length === 0 || form.platforms.some((p) => !p.url.trim())) {
            setError("Chaque plateforme doit avoir une URL renseignée.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/live-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title.trim(),
                    scheduledAt: new Date(form.scheduledAt).toISOString(),
                    isActive: true,
                    platforms: form.platforms,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.message || "Erreur lors de la création.");
                return;
            }
            setForm(emptyForm());
            setShowForm(false);
            await load();
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (event: LiveEvent) => {
        await fetch(`/api/live-events/${event._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !event.isActive }),
        });
        await load();
    };

    const toggleForceLive = async (event: LiveEvent) => {
        await fetch(`/api/live-events/${event._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ forceLive: !event.forceLive }),
        });
        await load();
    };

    const deleteEvent = async (id: string) => {
        if (!confirm("Supprimer cet événement ?")) return;
        await fetch(`/api/live-events/${id}`, { method: "DELETE" });
        await load();
    };

    /* ── Derive display platforms (backwards compat with old videoId-only events) ── */
    function effectivePlatforms(event: LiveEvent): IPlatform[] {
        if (event.platforms && event.platforms.length > 0) return event.platforms;
        if (event.videoId) return [{ type: "youtube", url: `https://www.youtube.com/watch?v=${event.videoId}` }];
        return [];
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Gestion des Lives</h1>
                        <p className="text-sm text-gray-500">Multi-plateforme — YouTube, Discord, Meet…</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowForm((v) => !v); setError(""); }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Ajouter un live
                </button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-5">Nouveau live</h2>

                    <div className="space-y-5">
                        {/* Titre */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Titre du live
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="Ex : Maths Terminale — Bac blanc"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Date et heure du live
                            </label>
                            <input
                                type="datetime-local"
                                value={form.scheduledAt}
                                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                        </div>

                        {/* Plateformes */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-gray-600">
                                    Plateformes <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={addPlatform}
                                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Ajouter une plateforme
                                </button>
                            </div>

                            {form.platforms.length === 0 && (
                                <p className="text-xs text-gray-400 italic py-2">
                                    Aucune plateforme — clique sur &quot;Ajouter&quot; pour en ajouter une.
                                </p>
                            )}

                            <div className="space-y-2">
                                {form.platforms.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        {/* Type selector */}
                                        <select
                                            value={p.type}
                                            onChange={(e) => updatePlatform(i, "type", e.target.value)}
                                            className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 shrink-0"
                                        >
                                            {ALL_PLATFORMS.map(([type, cfg]) => (
                                                <option key={type} value={type}>{cfg.label}</option>
                                            ))}
                                        </select>

                                        {/* URL */}
                                        <input
                                            type="text"
                                            value={p.url}
                                            onChange={(e) => updatePlatform(i, "url", e.target.value)}
                                            placeholder={PLATFORM_CONFIG[p.type].placeholder}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                        />

                                        {/* Remove */}
                                        <button
                                            type="button"
                                            onClick={() => removePlatform(i)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-gray-400 mt-2">
                                Ajoute toutes les plateformes où le live aura lieu. Les utilisateurs verront un bouton pour chacune.
                            </p>
                        </div>
                    </div>

                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                    <div className="flex gap-3 mt-5">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            {submitting ? "Enregistrement..." : "Enregistrer"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setError(""); setForm(emptyForm()); }}
                            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            )}

            {/* Liste */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun live programmé</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map((event) => {
                        const { label, color } = statusLabel(event);
                        const platforms = effectivePlatforms(event);
                        const firstPlatformUrl = platforms[0]?.url;

                        return (
                            <div
                                key={event._id}
                                className={`bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${event.forceLive ? "border-red-400 bg-red-50/30" : "border-transparent"} ${!event.isActive ? "opacity-50" : ""}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Badges statut */}
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {event.forceLive && (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    EN DIRECT
                                                </span>
                                            )}
                                            <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
                                                {label}
                                            </span>
                                        </div>

                                        {/* Titre */}
                                        <p className="font-semibold text-sm text-gray-900 truncate">{event.title}</p>

                                        {/* Date */}
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatDate(event.scheduledAt)}</span>
                                        </div>

                                        {/* Plateformes chips */}
                                        {platforms.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {platforms.map((p) => {
                                                    const cfg = PLATFORM_CONFIG[p.type];
                                                    return (
                                                        <span
                                                            key={p.type}
                                                            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cfg.chipColor}`}
                                                        >
                                                            {cfg.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => toggleForceLive(event)}
                                            title={event.forceLive ? "Arrêter le live" : "Démarrer le live maintenant"}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                event.forceLive
                                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                            }`}
                                        >
                                            {event.forceLive
                                                ? <><StopCircle className="w-3.5 h-3.5" /> Arrêter</>
                                                : <><PlayCircle className="w-3.5 h-3.5" /> Démarrer</>
                                            }
                                        </button>

                                        {firstPlatformUrl && (
                                            <a
                                                href={firstPlatformUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                title="Ouvrir la plateforme principale"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}

                                        <button
                                            onClick={() => toggleActive(event)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            title={event.isActive ? "Désactiver" : "Activer"}
                                        >
                                            {event.isActive
                                                ? <ToggleRight className="w-4 h-4 text-green-500" />
                                                : <ToggleLeft className="w-4 h-4" />
                                            }
                                        </button>

                                        <button
                                            onClick={() => deleteEvent(event._id)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
