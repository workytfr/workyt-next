"use client";

import { useState } from "react";
import { Radio, Volume2, X } from "lucide-react";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";
import { AMBIENCES } from "@/lib/pomodoro/ambience";
import { RADIO_STATIONS, type RadioStation } from "@/lib/pomodoro/radio";

export default function SoundPanel() {
    const p = usePomodoro();
    const [loading, setLoading] = useState<string | null>(null);
    const [stationError, setStationError] = useState(false);

    // Le direct change d'identifiant à chaque redémarrage : on demande le direct en cours
    const playStation = async (station: RadioStation) => {
        setLoading(station.id);
        setStationError(false);
        try {
            const res = await fetch(`/api/pomodoro/radio?channel=${station.id}`);
            const data = res.ok ? await res.json() : null;
            if (data?.videoId) p.setRadio({ stationId: station.id, videoId: data.videoId, label: station.channel });
            else setStationError(true);
        } catch {
            setStationError(true);
        } finally {
            setLoading(null);
        }
    };

    return (
        <section className="rounded-[28px] border border-[rgba(26,21,18,0.08)] bg-white p-6">
            <h2 className="font-serif-display text-2xl">Ambiance sonore</h2>
            <p className="mt-1 text-sm text-[rgba(26,21,18,0.6)]">
                Choisis ton fond sonore : il se lance avec le focus et se coupe pendant les pauses. Les sons
                sont créés par ton navigateur.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
                {AMBIENCES.map((a) => {
                    const on = p.ambience === a.kind;
                    return (
                        <button
                            key={a.kind}
                            type="button"
                            aria-pressed={on}
                            onClick={() => p.setAmbience(on ? null : a.kind)}
                            className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                                on
                                    ? "border-[var(--wk-accent)] bg-[#fff1e3] text-[var(--wk-ink)]"
                                    : "border-[rgba(26,21,18,0.1)] text-[rgba(26,21,18,0.7)] hover:bg-[var(--wk-paper-2)]"
                            }`}
                        >
                            <span aria-hidden>{a.emoji}</span> {a.label}
                        </button>
                    );
                })}
            </div>
            {p.ambience && !p.focusing && (
                <p className="mt-3 text-xs text-[rgba(26,21,18,0.55)]">
                    Petit aperçu de 4 secondes : l&apos;ambiance jouera pendant tes focus.
                </p>
            )}
            <label className="mt-4 flex items-center gap-3 text-sm text-[rgba(26,21,18,0.6)]">
                <Volume2 className="h-4 w-4 shrink-0" />
                <span className="sr-only">Volume de l&apos;ambiance</span>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={p.volume}
                    onChange={(e) => p.setVolume(Number(e.target.value))}
                    className="w-full accent-[var(--wk-accent)]"
                />
            </label>

            <div className="mt-6 border-t border-[rgba(26,21,18,0.08)] pt-5">
                <h3 className="flex items-center gap-2 font-semibold">
                    <Radio className="h-4 w-4 text-[var(--wk-accent)]" /> Radio lofi
                </h3>
                {p.radio ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[var(--wk-paper-2)] px-4 py-3 text-sm">
                        <span>
                            <strong>{p.radio.label}</strong>{" "}
                            {p.focusing ? "joue dans le lecteur en bas à gauche." : "jouera pendant tes focus."}
                        </span>
                        <button
                            type="button"
                            onClick={() => p.setRadio(null)}
                            className="inline-flex items-center gap-1 font-semibold text-[var(--wk-accent)]"
                        >
                            <X className="h-4 w-4" /> Retirer
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="mt-2 text-xs leading-relaxed text-[rgba(26,21,18,0.55)]">
                            Workyt n&apos;héberge aucune musique : la radio est le lecteur officiel de YouTube.
                            En la choisissant, tu acceptes que YouTube (Google) dépose des traceurs sur ton
                            appareil. Le lecteur ne se charge que pendant tes focus.
                        </p>
                        <p className="mt-2 rounded-xl bg-[#fff1d6] px-3 py-2 text-xs leading-relaxed text-[#8a5a00]">
                            📶 La radio est une vidéo en direct : elle consomme plusieurs dizaines de Mo par focus. En
                            données mobiles, préfère les sons d&apos;ambiance, qui ne consomment rien.
                        </p>
                        <div className="mt-3 space-y-2">
                            {RADIO_STATIONS.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => playStation(s)}
                                    disabled={loading !== null}
                                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[rgba(26,21,18,0.1)] px-4 py-2.5 text-left text-sm transition hover:bg-[var(--wk-paper-2)]"
                                >
                                    <span>
                                        <span className="block font-semibold">{s.channel}</span>
                                        <span className="block text-xs text-[rgba(26,21,18,0.55)]">{s.label}</span>
                                    </span>
                                    <span className="text-xs font-semibold text-[var(--wk-accent)]">{loading === s.id ? "…" : "Choisir"}</span>
                                </button>
                            ))}
                        </div>
                        {stationError && (
                            <p className="mt-2 text-xs text-red-600">Cette radio n&apos;est pas en direct pour le moment. Essaie l&apos;autre station.</p>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
