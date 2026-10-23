"use client";

import { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay, FaVolumeUp } from "react-icons/fa";

/** Lecture audio (TTS) d'une leçon */
export default function AudioPlayer({ audioUrl }: { audioUrl: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    // Extraire le lessonId depuis l'audioUrl (format: audio-tts/{lessonId}.mp3)
    const lessonId = audioUrl.replace("audio-tts/", "").replace(".mp3", "");
    const directUrl = `/api/tts/audio/${lessonId}`;

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!signedUrl) {
            setLoading(true);
            try {
                audio.src = directUrl;
                audio.load();
                await new Promise<void>((resolve, reject) => {
                    audio.addEventListener("canplaythrough", () => resolve(), { once: true });
                    audio.addEventListener("error", () => reject(new Error("Impossible de charger l'audio")), { once: true });
                });
                setSignedUrl(directUrl);
                await audio.play();
                setIsPlaying(true);
            } catch (err) {
                console.error("Erreur chargement audio :", err);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            await audio.play();
            setIsPlaying(true);
        }
    };

    // Arrêter et réinitialiser l'audio quand on change de leçon
    const prevAudioUrl = useRef(audioUrl);
    useEffect(() => {
        if (prevAudioUrl.current === audioUrl) return;
        prevAudioUrl.current = audioUrl;
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        setIsPlaying(false);
        setSignedUrl(null);
        setProgress(0);
        setDuration(0);
    }, [audioUrl]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
        };
        const onLoaded = () => setDuration(audio.duration);
        const onEnded = () => { setIsPlaying(false); setProgress(0); };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("ended", onEnded);
            // Arrêter l'audio au démontage du composant
            audio.pause();
        };
    }, [signedUrl]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * audio.duration;
    };

    return (
        <div className="flex items-center gap-3 bg-orange-50 rounded-lg px-4 py-2.5 border border-orange-200">
            <button
                onClick={togglePlay}
                disabled={loading}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                    <FaPause className="w-3 h-3" />
                ) : (
                    <FaPlay className="w-3 h-3 ml-0.5" />
                )}
            </button>

            <FaVolumeUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span className="text-xs font-medium text-orange-800 whitespace-nowrap">Écouter la leçon</span>

            {signedUrl && (
                <>
                    <div
                        className="flex-1 h-1.5 bg-orange-200 rounded-full cursor-pointer min-w-[60px]"
                        onClick={handleSeek}
                    >
                        <div
                            className="h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {duration > 0 && (
                        <span className="text-xs text-orange-600 tabular-nums whitespace-nowrap">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    )}
                </>
            )}

            <audio ref={audioRef} preload="none" />
        </div>
    );
}
