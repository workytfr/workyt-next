"use client";

import { useState, useEffect, useCallback } from "react";
import { Radio, Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink, Calendar, Youtube, PlayCircle, StopCircle } from "lucide-react";

interface LiveEvent {
    _id: string;
    title: string;
    videoId: string;
    scheduledAt: string;
    isActive: boolean;
    forceLive: boolean;
    createdAt: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function statusLabel(event: LiveEvent) {
    const now = Date.now();
    const scheduled = new Date(event.scheduledAt).getTime();
    const diff = scheduled - now;

    if (!event.isActive) return { label: "Désactivé", color: "bg-gray-100 text-gray-500" };
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

const emptyForm = { title: "", videoId: "", scheduledAt: "" };

export default function LivesAdminClient() {
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Extraire le videoId depuis une URL YouTube si nécessaire
        let videoId = form.videoId.trim();
        const urlMatch = videoId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (urlMatch) videoId = urlMatch[1];

        if (!form.title.trim() || !videoId || !form.scheduledAt) {
            setError("Tous les champs sont requis.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/live-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title.trim(),
                    videoId,
                    scheduledAt: new Date(form.scheduledAt).toISOString(),
                    isActive: true,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.message || "Erreur lors de la création.");
                return;
            }
            setForm(emptyForm);
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

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Lives YouTube</h1>
                        <p className="text-sm text-gray-500">
                            Fallback manuel si l'API YouTube est indisponible
                        </p>
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

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 text-sm text-blue-700">
                <Youtube className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <p>
                    La détection automatique via YouTube est prioritaire. Les événements ci-dessous
                    servent de <strong>fallback</strong> si l'API YouTube échoue ou si tu veux forcer
                    l'affichage d'un live non encore détecté.
                </p>
            </div>

            {/* Formulaire */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-4">Nouveau live</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Titre du live
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="Ex: Maths Terminale — Bac blanc"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                URL ou ID de la vidéo YouTube
                            </label>
                            <input
                                type="text"
                                value={form.videoId}
                                onChange={(e) => setForm((f) => ({ ...f, videoId: e.target.value }))}
                                placeholder="https://youtube.com/watch?v=... ou dQw4w9WgXcQ"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Colle l'URL complète ou juste l'ID (11 caractères)
                            </p>
                        </div>

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
                    </div>

                    {error && (
                        <p className="mt-3 text-sm text-red-600">{error}</p>
                    )}

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
                            onClick={() => { setShowForm(false); setError(""); }}
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
                    <p className="text-sm">Aucun live programmé manuellement</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map((event) => {
                        const { label, color } = statusLabel(event);
                        return (
                            <div
                                key={event._id}
                                className={`bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${event.forceLive ? "border-red-400 bg-red-50/30" : "border-transparent"} ${!event.isActive ? "opacity-50" : ""}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
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
                                            <span className="text-xs text-gray-400 font-mono">{event.videoId}</span>
                                        </div>
                                        <p className="font-semibold text-sm text-gray-900 truncate">{event.title}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatDate(event.scheduledAt)}</span>
                                        </div>
                                    </div>

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
                                        <a
                                            href={`https://www.youtube.com/watch?v=${event.videoId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            title="Ouvrir sur YouTube"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
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
