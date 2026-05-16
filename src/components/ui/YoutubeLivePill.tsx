"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PLATFORM_CONFIG, type PlatformType, type IPlatform } from "@/lib/livePlatforms";

interface LiveStatus {
    status: "live" | "upcoming" | "none";
    videoId?: string;
    title?: string;
    thumbnail?: string;
    scheduledAt?: string;
    platforms?: IPlatform[];
}

const POLL_INTERVAL_IDLE = 15 * 60 * 1000;  // 15 min — aucun live connu
const POLL_INTERVAL_ACTIVE = 2 * 60 * 1000; // 2 min — live prévu ou en cours
const DISMISS_KEY = "yt-upcoming-dismissed";

function Countdown({ scheduledAt }: { scheduledAt: string }) {
    const [label, setLabel] = useState("");

    useEffect(() => {
        const compute = () => {
            const diff = new Date(scheduledAt).getTime() - Date.now();
            if (diff <= 0) { setLabel("Bientôt"); return; }
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            setLabel(h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m} min`);
        };
        compute();
        const id = setInterval(compute, 30_000);
        return () => clearInterval(id);
    }, [scheduledAt]);

    return <span>{label}</span>;
}

function PlatformButton({ platform, isLive }: { platform: IPlatform; isLive: boolean }) {
    const cfg = PLATFORM_CONFIG[platform.type as PlatformType] ?? {
        label: platform.type,
        buttonColor: "bg-gray-900 hover:bg-gray-800 text-white",
        actionLabel: "Rejoindre",
        actionLabelLive: "Rejoindre",
    };
    return (
        <a
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${cfg.buttonColor}`}
        >
            {isLive ? cfg.actionLabelLive : cfg.actionLabel}
        </a>
    );
}

export default function YoutubeLivePill() {
    const [data, setData] = useState<LiveStatus>({ status: "none" });
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/youtube-live");
            const json: LiveStatus = await res.json();
            setData(json);
            if (json.status === "live") setDismissed(false);
        } catch {}
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setDismissed(!!sessionStorage.getItem(DISMISS_KEY));
        }
        fetchStatus();
        const interval = data.status !== "none" ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
        const id = setInterval(fetchStatus, interval);
        return () => clearInterval(id);
    }, [fetchStatus, data.status]);

    useEffect(() => {
        if (!expanded) return;
        const handler = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                setExpanded(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [expanded]);

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        sessionStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
        setExpanded(false);
    };

    if (data.status === "none") return null;
    if (data.status === "upcoming" && dismissed) return null;

    const isLive = data.status === "live";
    const platforms = data.platforms ?? [];

    // Fallback pour les anciens events sans platforms
    const displayPlatforms: IPlatform[] =
        platforms.length > 0
            ? platforms
            : data.videoId
                ? [{ type: "youtube", url: `https://www.youtube.com/watch?v=${data.videoId}` }]
                : [];

    const multiplePlatforms = displayPlatforms.length > 1;

    return (
        <div ref={cardRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">

            {/* Carte dépliée */}
            {expanded && (
                <div className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Thumbnail ou header gradient */}
                    {data.thumbnail ? (
                        <div className="relative">
                            <img
                                src={data.thumbnail}
                                alt={data.title}
                                className="w-full h-36 object-cover"
                            />
                            {isLive && (
                                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    EN DIRECT
                                </span>
                            )}
                            {!isLive && (
                                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                                    ⏰ À venir
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className={`relative h-16 flex items-center px-4 ${isLive ? "bg-gradient-to-r from-red-600 to-red-500" : "bg-gradient-to-r from-gray-800 to-gray-700"}`}>
                            {isLive && (
                                <span className="inline-flex items-center gap-1.5 text-white text-xs font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    EN DIRECT
                                </span>
                            )}
                            {!isLive && (
                                <span className="text-white text-xs font-semibold">⏰ À venir</span>
                            )}
                        </div>
                    )}

                    <div className="p-4">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 leading-snug">
                            {data.title}
                        </p>

                        {!isLive && data.scheduledAt && (
                            <p className="text-xs text-gray-500 mb-3">
                                Live dans{" "}
                                <span className="font-semibold text-gray-700">
                                    <Countdown scheduledAt={data.scheduledAt} />
                                </span>
                            </p>
                        )}
                        {isLive && (
                            <p className="text-xs text-red-500 font-medium mb-3">
                                Workyt est en live maintenant !
                            </p>
                        )}

                        {/* Plateformes */}
                        {multiplePlatforms && (
                            <p className="text-xs text-gray-400 mb-2 font-medium">
                                Disponible sur {displayPlatforms.length} plateformes :
                            </p>
                        )}
                        <div className="flex flex-col gap-2">
                            {displayPlatforms.map((p) => (
                                <PlatformButton key={p.type} platform={p} isLive={isLive} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Pill */}
            <div className="flex items-center gap-2">
                {/* Bouton fermer — uniquement pour "upcoming" */}
                {!isLive && (
                    <button
                        onClick={handleDismiss}
                        aria-label="Fermer"
                        className="w-6 h-6 rounded-full bg-white shadow-md border border-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-xs transition-colors"
                    >
                        ✕
                    </button>
                )}

                <button
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className={`flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full shadow-lg text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 select-none ${
                        isLive
                            ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                            : "bg-gray-900 hover:bg-gray-800 shadow-gray-300"
                    }`}
                >
                    {isLive ? (
                        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                        </span>
                    ) : (
                        <span className="text-base leading-none">⏰</span>
                    )}

                    <span>
                        {isLive ? "EN DIRECT" : (
                            data.scheduledAt
                                ? <>Dans <Countdown scheduledAt={data.scheduledAt} /></>
                                : "Live à venir"
                        )}
                    </span>

                    {/* Badge nombre de plateformes si > 1 */}
                    {displayPlatforms.length > 1 && (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-xs font-bold leading-none">
                            {displayPlatforms.length}
                        </span>
                    )}

                    <svg
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
