"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import FicheEditor from "@/app/fiches/_components/FicheEditor";
import { compressImage, FORUM_ANSWER_IMAGE_OPTS } from "@/app/fiches/_components/imageCompression";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Camera,
    FileUp,
    AlertTriangle,
    Lightbulb,
    Coins,
    Loader2,
    Send,
} from "lucide-react";

const MAX_IMAGES = 2;
const MAX_FILES = 4;

interface AnswerPopupProps {
    questionId: string;
    onClose: () => void;
    onSubmitted?: (answer: any) => void;
}

const AnswerPopup: React.FC<AnswerPopupProps> = ({ questionId, onClose, onSubmitted }) => {
    const { data: session } = useSession();
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTips, setShowTips] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Esc pour fermer
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const imageCount = useMemo(
        () => files.filter((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)).length,
        [files],
    );
    const photoCost = Math.max(0, imageCount - 1);

    const addFiles = async (selected: File[]) => {
        const valid = selected.filter(
            (f) =>
                f.type === "application/pdf" ||
                f.type.startsWith("image/") ||
                /\.heic|\.heif$/i.test(f.name),
        );
        const currentImg = files.filter((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)).length;
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
        } else {
            setErrorMessage(null);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        e.target.value = "";
        await addFiles(selected);
    };

    const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (content.trim().length < 30) {
            setErrorMessage("Ta réponse est un peu courte — ajoute un peu de contexte.");
            return;
        }
        setIsSubmitting(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append("content", content);
        files.forEach((file) => formData.append("file", file));

        try {
            if (!session || !(session as any).accessToken) {
                throw new Error("Utilisateur non authentifié.");
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
            onSubmitted?.(json.data);
            onClose();
        } catch (error: any) {
            console.error("Erreur:", error);
            setErrorMessage(error?.message ?? "Erreur lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const charCount = content.length;
    const hasEnoughContent = charCount >= 30;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-x-0 bottom-0 top-[88px] sm:top-[96px] z-40 flex items-stretch justify-center bg-black/40 p-2 sm:p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !isSubmitting) onClose();
                }}
            >
                <motion.div
                    ref={popupRef}
                    initial={{ scale: 0.96, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.96, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 280 }}
                    className="flex flex-col w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100 text-orange-700">
                                <Send size={16} />
                            </span>
                            <div>
                                <h2 className="font-semibold text-base">Répondre à la question</h2>
                                <p className="text-xs text-gray-500">Aide la communauté avec une réponse claire</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                            aria-label="Fermer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
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
                            <AnimatePresence>
                                {showTips && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r-md text-sm overflow-hidden"
                                    >
                                        <ul className="list-disc pl-4 space-y-1 text-gray-700">
                                            <li>Explique ton raisonnement <b>étape par étape</b></li>
                                            <li>Utilise les <b>formules LaTeX</b> (bouton Σ) si besoin</li>
                                            <li>Tu peux <b>dessiner un schéma</b> directement dans l'éditeur (bouton crayon)</li>
                                            <li>Sois bienveillant — l'élève apprend</li>
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Erreur */}
                        {errorMessage && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 inline-flex items-start gap-2">
                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Éditeur */}
                        <FicheEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Rédige ta réponse… texte, formules LaTeX (bouton Σ), dessins (bouton crayon)."
                        />

                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{charCount} caractères</span>
                            {charCount > 0 && !hasEnoughContent && (
                                <span className="text-amber-600">Au moins 30 caractères pour une réponse utile.</span>
                            )}
                        </div>

                        {/* Quota photos */}
                        <div className="rounded-lg bg-orange-50/60 border border-orange-100 p-3 text-sm">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="font-medium text-orange-800 inline-flex items-center gap-1.5">
                                    <Camera size={14} /> Photos : {imageCount}/{MAX_IMAGES}
                                </span>
                                <span className="text-xs text-orange-700">
                                    {photoCost === 0 ? "1ʳᵉ photo gratuite" : `+${photoCost} pt de malus`}
                                </span>
                            </div>
                            <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
                                    style={{ width: `${(imageCount / MAX_IMAGES) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Upload */}
                        <label
                            htmlFor="answer-file-pick"
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
                            id="answer-file-pick"
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="application/pdf,image/*,.heic,.heif"
                            capture="environment"
                            onChange={handleFileChange}
                            disabled={files.length >= MAX_FILES}
                            hidden
                        />

                        {/* Liste fichiers */}
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
                                    <Coins size={14} className="text-orange-600" /> Coût photos
                                </span>
                                <span className="font-semibold text-orange-600">{photoCost} ⭐</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !hasEnoughContent}
                            className={`${
                                hasEnoughContent
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
                                    <Send size={14} className="mr-2" /> Publier
                                    {photoCost > 0 && <span className="ml-1.5 text-xs opacity-80">({photoCost} ⭐)</span>}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AnswerPopup;
