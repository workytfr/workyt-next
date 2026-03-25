"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Upload, AlertCircle, Loader2, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContextualQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextType: "lesson" | "exercise";
    contextId: string;
    contextTitle: string;
}

export default function ContextualQuestionModal({
    isOpen,
    onClose,
    contextType,
    contextId,
    contextTitle,
}: ContextualQuestionModalProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [whatIDid, setWhatIDid] = useState("");
    const [whatINeed, setWhatINeed] = useState("");
    const [points, setPoints] = useState(5);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !whatIDid.trim() || !whatINeed.trim()) {
            setError("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("whatIDid", whatIDid);
            formData.append("whatINeed", whatINeed);
            formData.append("points", points.toString());
            formData.append("contextType", contextType);
            formData.append("contextId", contextId);
            files.forEach((f) => formData.append("files", f));

            const res = await fetch("/api/forum/questions/contextual", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${(session as any)?.accessToken || ""}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Erreur lors de la création.");
                return;
            }

            const question = await res.json();
            onClose();
            router.push(`/forum/${question._id}`);
        } catch {
            setError("Erreur réseau. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const contextLabel = contextType === "lesson" ? "Leçon" : "Exercice";
    const userPoints = (session?.user as any)?.points || 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <HelpCircle className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Poser une question
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {contextLabel} : {contextTitle}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Titre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Titre de votre question *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={`Question sur "${contextTitle}"...`}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                                    maxLength={200}
                                />
                            </div>

                            {/* Ce que j'ai compris/fait */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Ce que j&apos;ai compris / fait *
                                </label>
                                <textarea
                                    value={whatIDid}
                                    onChange={(e) => setWhatIDid(e.target.value)}
                                    placeholder="Expliquez ce que vous avez compris ou essayé..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm resize-none"
                                />
                            </div>

                            {/* Ce que je ne comprends pas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Ce que je ne comprends pas *
                                </label>
                                <textarea
                                    value={whatINeed}
                                    onChange={(e) => setWhatINeed(e.target.value)}
                                    placeholder="Décrivez précisément ce qui vous bloque..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm resize-none"
                                />
                            </div>

                            {/* Points */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Points à miser : <span className="text-purple-600 font-bold">{points}</span>
                                    <span className="text-gray-400 text-xs ml-2">
                                        (Vous avez {userPoints} points)
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={15}
                                    value={points}
                                    onChange={(e) => setPoints(parseInt(e.target.value))}
                                    className="w-full accent-purple-500"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>1</span>
                                    <span>15</span>
                                </div>
                            </div>

                            {/* Fichiers */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Pièces jointes <span className="text-gray-400">(optionnel, max 5)</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors text-sm text-gray-500"
                                >
                                    <Upload className="w-4 h-4" />
                                    Ajouter des fichiers
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {files.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {files.map((f, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg text-xs"
                                            >
                                                <span className="truncate text-gray-600">{f.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(i)}
                                                    className="text-gray-400 hover:text-red-500 ml-2"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !title.trim() || !whatIDid.trim() || !whatINeed.trim()}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Publication...
                                    </>
                                ) : (
                                    "Publier ma question"
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
