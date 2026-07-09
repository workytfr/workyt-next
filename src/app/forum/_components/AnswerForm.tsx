"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import FicheEditor from "@/app/fiches/_components/FicheEditor";
import { compressImage, FORUM_ANSWER_IMAGE_OPTS } from "@/app/fiches/_components/imageCompression";
import { countDrawings } from "@/app/forum/_components/imageCounting";
import {
    Send,
    Camera,
    FileUp,
    X,
    AlertTriangle,
    Lightbulb,
    Loader2,
    MessageSquarePlus,
    ChevronUp,
    Check,
    CloudOff,
    AtSign,
} from "lucide-react";
import PointsIcon from "@/components/ui/PointsIcon";

const MAX_IMAGES = 2;
const MAX_FILES = 4;

export interface QuoteTrigger {
    /** Texte markdown préfixé > pour insertion comme blockquote. */
    quotedMarkdown: string;
    /** Sert à différencier deux clics successifs sur le même contenu. */
    key: number;
}

interface Participant {
    _id: string;
    username: string;
}

interface AnswerFormProps {
    questionId: string;
    onSubmitted?: (answer: any) => void;
    questionStatus?: string;
    /** Trigger externe pour insérer une citation dans le formulaire. */
    quoteTrigger?: QuoteTrigger | null;
    /** Temps réel : signaler que l'utilisateur est en train d'écrire (avec le nb de mots). */
    onTypingStart?: (wordCount: number) => void;
    /** Temps réel : signaler l'arrêt de la frappe. */
    onTypingStop?: () => void;
}

export default function AnswerForm({ questionId, onSubmitted, questionStatus, quoteTrigger, onTypingStart, onTypingStop }: AnswerFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const draftKey = `forum-answer-draft-${questionId}`;

    const [expanded, setExpanded] = useState(false);
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTips, setShowTips] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [online, setOnline] = useState(true);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const cardRef = useRef<HTMLDivElement>(null);

    // Charger brouillon
    useEffect(() => {
        try {
            const raw = localStorage.getItem(draftKey);
            if (raw && raw.trim().length > 0) {
                setContent(raw);
                setDraftStatus("saved");
            }
        } catch {}
        setDraftLoaded(true);
    }, [draftKey]);

    // Sauvegarder brouillon
    useEffect(() => {
        if (!draftLoaded) return;
        if (!expanded && content.trim().length === 0) return;
        setDraftStatus("saving");
        const t = setTimeout(() => {
            try {
                if (content.trim()) localStorage.setItem(draftKey, content);
                else localStorage.removeItem(draftKey);
                setDraftStatus(content.trim() ? "saved" : "idle");
            } catch {
                setDraftStatus("idle");
            }
        }, 800);
        return () => clearTimeout(t);
    }, [content, draftLoaded, expanded, draftKey]);

    // Statut connexion
    useEffect(() => {
        if (typeof window === "undefined") return;
        const update = () => setOnline(navigator.onLine);
        update();
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    // Auto-expand si on a un brouillon déjà
    useEffect(() => {
        if (draftLoaded && content.trim().length > 0 && !expanded) {
            setExpanded(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftLoaded]);

    // Charge les participants de la discussion
    useEffect(() => {
        if (sessionStatus !== "authenticated") return;
        fetch(`/api/forum/questions/${questionId}/participants`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.participants) {
                    const currentUserId = String((session?.user as any)?.id ?? "");
                    setParticipants(
                        data.participants.filter((p: Participant) => p._id !== currentUserId),
                    );
                }
            })
            .catch(() => {});
    }, [questionId, sessionStatus, session]);

    // Réagit aux clics "Citer" depuis l'extérieur
    useEffect(() => {
        if (!quoteTrigger) return;
        setContent((prev) => {
            const sep = prev.trim().length > 0 ? "\n\n" : "";
            return prev + sep + quoteTrigger.quotedMarkdown;
        });
        setExpanded(true);
        setTimeout(() => {
            const el = document.getElementById("answer-form");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }, [quoteTrigger]);

    const insertMention = (username: string) => {
        setContent((prev) => {
            const needsSpace = prev.length > 0 && !prev.endsWith(" ") && !prev.endsWith("\n");
            return prev + (needsSpace ? " " : "") + `@${username} `;
        });
    };

    const photoCount = useMemo(
        () => files.filter((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)).length,
        [files],
    );
    const drawingCount = useMemo(() => countDrawings(content), [content]);
    const imageCount = photoCount + drawingCount;
    const photoCost = Math.max(0, imageCount - 1);
    const quotaExceeded = imageCount > MAX_IMAGES;

    const addFiles = async (selected: File[]) => {
        setErrorMessage(null);
        const valid = selected.filter(
            (f) =>
                f.type === "application/pdf" ||
                f.type.startsWith("image/") ||
                /\.heic|\.heif$/i.test(f.name),
        );
        const currentPhotos = files.filter((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)).length;
        const currentDrawings = countDrawings(content);
        const currentImg = currentPhotos + currentDrawings;
        const incomingImg = valid.filter((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name));
        const allowedImg = Math.max(0, MAX_IMAGES - currentImg);
        const acceptedImg = incomingImg.slice(0, allowedImg);
        const dropped = incomingImg.length - acceptedImg.length;

        const others = valid.filter((f) => !(f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)));
        const all = [...acceptedImg, ...others];
        const processed = await Promise.all(
            all.map((f) =>
                f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)
                    ? compressImage(f, FORUM_ANSWER_IMAGE_OPTS).catch(() => f)
                    : Promise.resolve(f),
            ),
        );
        const totalAfter = files.length + processed.length;
        const final = totalAfter > MAX_FILES ? processed.slice(0, MAX_FILES - files.length) : processed;
        setFiles((prev) => [...prev, ...final]);
        if (dropped > 0) {
            setErrorMessage(
                `${dropped} photo${dropped > 1 ? "s" : ""} ignorée${dropped > 1 ? "s" : ""} (max ${MAX_IMAGES}/réponse).`,
            );
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        e.target.value = "";
        await addFiles(selected);
    };

    const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

    // Temps réel : émettre l'état de frappe + le nombre de mots (auto-stop après 2,5 s d'inactivité)
    useEffect(() => {
        if (!onTypingStart || !expanded || content.trim().length === 0) return;
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        onTypingStart(wordCount);
        const t = setTimeout(() => onTypingStop?.(), 2500);
        return () => clearTimeout(t);
    }, [content, expanded, onTypingStart, onTypingStop]);

    // Stopper la frappe au démontage du formulaire
    useEffect(() => {
        return () => {
            onTypingStop?.();
        };
    }, [onTypingStop]);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (content.trim().length < 30) {
            setErrorMessage("Ta réponse est un peu courte — ajoute un peu de contexte (au moins 30 caractères).");
            return;
        }
        if (quotaExceeded) {
            setErrorMessage(`Maximum ${MAX_IMAGES} images au total (photos + dessins). Tu en as ${imageCount}.`);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append("content", content);
        files.forEach((file) => formData.append("file", file));

        try {
            if (!session || !(session as any).accessToken) {
                throw new Error("Tu dois être connecté pour répondre.");
            }
            const response = await fetch(`/api/forum/questions/${questionId}/repondre`, {
                method: "POST",
                headers: { Authorization: `Bearer ${(session as any).accessToken}` },
                body: formData,
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || "Erreur lors de l'envoi de la réponse.");
            }
            const json = await response.json().catch(() => ({}));
            try {
                localStorage.removeItem(draftKey);
            } catch {}
            setContent("");
            setFiles([]);
            setExpanded(false);
            onTypingStop?.();
            onSubmitted?.(json.data);
        } catch (error: any) {
            console.error("Erreur:", error);
            setErrorMessage(error?.message ?? "Erreur lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (content.trim().length > 0) {
            const ok = window.confirm("Abandonner la réponse en cours ? Le brouillon sera supprimé.");
            if (!ok) return;
            try {
                localStorage.removeItem(draftKey);
            } catch {}
            setContent("");
        }
        setFiles([]);
        setErrorMessage(null);
        setExpanded(false);
    };

    const isClosed = questionStatus === "Résolue" || questionStatus === "Validée";

    if (sessionStatus !== "authenticated") {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
                <p className="text-sm text-gray-600">
                    Connecte-toi pour répondre à cette question.
                </p>
            </div>
        );
    }

    if (isClosed) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                <p className="text-sm text-gray-600">
                    Cette question est fermée — tu ne peux plus y répondre.
                </p>
            </div>
        );
    }

    // État replié — carte d'invite
    if (!expanded) {
        return (
            <button
                ref={cardRef as any}
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full text-left rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 transition-colors p-5 flex items-center gap-4 group"
            >
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-700 group-hover:bg-orange-200 transition-colors shrink-0">
                    <MessageSquarePlus size={22} />
                </span>
                <div className="flex-1">
                    <h3 className="font-semibold text-base">Répondre à cette question</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                        Ton aide compte. Texte, formules LaTeX, schémas dessinés au stylet.
                    </p>
                </div>
                {draftStatus === "saved" && content.trim() && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-green-700">
                        <Check size={14} /> brouillon
                    </span>
                )}
            </button>
        );
    }

    // État déplié — formulaire complet
    return (
        <div ref={cardRef} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100 text-orange-700">
                        <Send size={16} />
                    </span>
                    <div>
                        <h3 className="font-semibold text-base">Ta réponse</h3>
                        <p className="text-xs text-gray-500">
                            Texte · formules LaTeX (Σ) · schémas (crayon)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                        {!online && (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                                <CloudOff size={12} /> hors ligne
                            </span>
                        )}
                        {online && draftStatus === "saving" && <span>Enregistrement…</span>}
                        {online && draftStatus === "saved" && content.trim() && (
                            <span className="inline-flex items-center gap-1 text-green-700">
                                <Check size={12} /> brouillon
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 text-gray-500"
                        aria-label="Replier"
                    >
                        <ChevronUp size={18} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4">
                {/* Conseils */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowTips((v) => !v)}
                        className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                    >
                        <Lightbulb size={14} />
                        {showTips ? "Masquer les conseils" : "Conseils pour une bonne réponse"}
                    </button>
                    {showTips && (
                        <div className="mt-3 bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r-md text-sm">
                            <ul className="list-disc pl-4 space-y-1 text-gray-700">
                                <li>Explique ton raisonnement <b>étape par étape</b></li>
                                <li>Utilise les <b>formules LaTeX</b> (bouton Σ)</li>
                                <li>Tu peux <b>dessiner un schéma</b> directement (bouton crayon)</li>
                                <li>Sois bienveillant — l'élève apprend</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Erreur */}
                {errorMessage && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 inline-flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Chips de mentions */}
                {participants.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-gray-500 inline-flex items-center gap-1">
                            <AtSign size={12} /> Mentionner :
                        </span>
                        {participants.slice(0, 8).map((p) => (
                            <button
                                key={p._id}
                                type="button"
                                onClick={() => insertMention(p.username)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
                            >
                                @{p.username}
                            </button>
                        ))}
                    </div>
                )}

                {/* Éditeur */}
                <FicheEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Rédige ta réponse… (tu peux coller du texte, des formules, ou insérer un dessin)"
                />

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{content.length} caractères</span>
                    {content.length > 0 && content.length < 30 && (
                        <span className="text-amber-600">Au moins 30 caractères pour une réponse utile.</span>
                    )}
                </div>

                {/* Quota images (photos + dessins) */}
                <div className={`rounded-lg border p-3 text-sm ${quotaExceeded ? "bg-red-50 border-red-200" : "bg-orange-50/60 border-orange-100"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-medium inline-flex items-center gap-1.5 ${quotaExceeded ? "text-red-800" : "text-orange-800"}`}>
                            <Camera size={14} /> Images : {imageCount}/{MAX_IMAGES}
                            {(photoCount > 0 || drawingCount > 0) && (
                                <span className="text-xs font-normal text-gray-600">
                                    ({[
                                        photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? "s" : ""}` : null,
                                        drawingCount > 0 ? `${drawingCount} dessin${drawingCount > 1 ? "s" : ""}` : null,
                                    ].filter(Boolean).join(" · ")})
                                </span>
                            )}
                        </span>
                        <span className={`text-xs ${quotaExceeded ? "text-red-700" : "text-orange-700"}`}>
                            {photoCost === 0 ? "1ʳᵉ image gratuite" : `+${photoCost} pt de malus`}
                        </span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${quotaExceeded ? "bg-red-100" : "bg-orange-100"}`}>
                        <div
                            className={`h-full transition-all ${quotaExceeded ? "bg-red-600" : "bg-gradient-to-r from-orange-400 to-orange-600"}`}
                            style={{ width: `${Math.min(100, (imageCount / MAX_IMAGES) * 100)}%` }}
                        />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">Les <b>dessins</b> comptent comme des images.</p>
                </div>

                {/* Upload */}
                <label
                    htmlFor={`answer-file-pick-${questionId}`}
                    className={`flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        files.length >= MAX_FILES
                            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                    }`}
                >
                    <div className="flex items-center gap-2 text-gray-600">
                        <Camera size={18} />
                        <FileUp size={18} />
                    </div>
                    <span className="text-sm font-medium">
                        {files.length >= MAX_FILES ? "Maximum atteint" : "Ajouter une photo / un fichier"}
                    </span>
                    <span className="text-xs text-gray-500">PDF · JPG · PNG · HEIC</span>
                </label>
                <input
                    id={`answer-file-pick-${questionId}`}
                    type="file"
                    multiple
                    accept="application/pdf,image/*,.heic,.heif"
                    capture="environment"
                    onChange={handleFileChange}
                    disabled={files.length >= MAX_FILES}
                    hidden
                />

                {files.length > 0 && (
                    <ul className="space-y-2">
                        {files.map((f, i) => (
                            <li
                                key={i}
                                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                                <span className="truncate">
                                    {f.type.startsWith("image/") ? "🖼️" : "📎"} {f.name}
                                    <span className="text-gray-400 text-xs ml-2">
                                        ({Math.round(f.size / 1024)} Ko)
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(i)}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-200 text-gray-500"
                                >
                                    <X size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Coût */}
                {photoCost > 0 && (
                    <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <span className="text-gray-700 inline-flex items-center gap-2">
                            <PointsIcon size={14} /> Coût images
                        </span>
                        <span className="font-semibold text-orange-600 inline-flex items-center gap-1">
                            {photoCost} <PointsIcon size={14} />
                        </span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center gap-2 p-4 border-t border-gray-200 bg-gray-50">
                <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="text-gray-500 hover:text-gray-700"
                >
                    Annuler
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || content.trim().length < 30 || quotaExceeded}
                    className={`${
                        content.trim().length >= 30 && !isSubmitting
                            ? "bg-black hover:bg-gray-800"
                            : "bg-gray-300 cursor-not-allowed"
                    } text-white px-6 transition-all`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={14} className="animate-spin mr-2" />
                            Envoi…
                        </>
                    ) : (
                        <>
                            <Send size={14} className="mr-2" />
                            Publier la réponse
                            {photoCost > 0 && (
                                <span className="ml-1.5 inline-flex items-center gap-1 text-xs opacity-80">
                                    ({photoCost} <PointsIcon size={12} />)
                                </span>
                            )}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
