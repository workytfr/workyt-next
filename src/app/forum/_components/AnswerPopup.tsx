"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import {
    FaPaperclip,
    FaTimes,
    FaRegLightbulb,
    FaRegSmile,
    FaMarkdown,
    FaFileUpload,
    FaRegTimesCircle
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { motion, AnimatePresence } from "framer-motion";

interface AnswerPopupProps {
    questionId: string;
    onClose: () => void;
}

const AnswerPopup: React.FC<AnswerPopupProps> = ({ questionId, onClose }) => {
    const { data: session } = useSession();
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTips, setShowTips] = useState(false);
    const [uploadActive, setUploadActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles([...files, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("content", content);
        files.forEach((file) => formData.append("file", file));

        try {
            if (!session || !session.accessToken) {
                throw new Error("Utilisateur non authentifié.");
            }

            const response = await fetch(`/api/forum/questions/${questionId}/repondre`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de l'envoi de la réponse.");
            }

            onClose(); // Ferme le popup
            window.location.reload(); // Rafraîchit la page pour afficher la nouvelle réponse

        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate character count and estimate read time
    const charCount = content.length;
    const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    // Check if we have enough content
    const hasEnoughContent = charCount > 30;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 backdrop-blur-sm"
            >
                <motion.div
                    ref={popupRef}
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header avec titre et bouton fermer */}
                    <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="bg-gradient-to-r from-orange-500 to-orange-600 w-1 h-6 md:h-8 rounded-full mr-2"></span>
                            Répondre à la question
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 p-2 rounded-full transition-colors"
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>

                    {/* Corps de la popup */}
                    <div className="p-4 md:p-6">
                        {/* Quick tips toggle */}
                        <div className="mb-4">
                            <button
                                onClick={() => setShowTips(!showTips)}
                                className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 transition-colors"
                            >
                                <FaRegLightbulb />
                                {showTips ? "Masquer les conseils" : "Afficher quelques conseils pour une bonne réponse"}
                            </button>

                            <AnimatePresence>
                                {showTips && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 bg-orange-50 dark:bg-gray-700/40 border-l-4 border-orange-500 p-3 rounded-r-md text-sm"
                                    >
                                        <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-300">
                                            <li>Explique ton raisonnement étape par étape</li>
                                            <li>Utilise des formules mathématiques avec <code>$\LaTeX$</code> si nécessaire</li>
                                            <li>Cite tes sources si tu utilises des références</li>
                                            <li>Tu peux utiliser la syntaxe Markdown pour formater ta réponse</li>
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Éditeur Markdown */}
                        <div className="mb-4">
<MDEditor
                            value={content}
                            onChange={(value) => setContent(value || "")}
                            height={250}
                            highlightEnable={false}
                            preview="edit"
                                className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm"
                                previewOptions={{
                                    remarkPlugins: [remarkMath],
                                    rehypePlugins: [rehypeKatex],
                                }}
                            />

                            {/* Stats et info */}
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <FaMarkdown className="text-gray-400" />
                                    <span>Markdown & LaTeX supportés</span>
                                </div>
                                <div>
                                    {charCount} caractères | ~{readTime} min de lecture
                                </div>
                            </div>
                        </div>

                        {/* Upload de fichiers */}
                        <div className="mt-6">
                            <div
                                className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                                    uploadActive
                                        ? "border-orange-500 bg-orange-50 dark:bg-gray-700/40"
                                        : "border-gray-300 dark:border-gray-600"
                                }`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setUploadActive(true);
                                }}
                                onDragLeave={() => setUploadActive(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setUploadActive(false);
                                    const droppedFiles = Array.from(e.dataTransfer.files);
                                    setFiles([...files, ...droppedFiles]);
                                }}
                            >
                                <div className="flex flex-col items-center justify-center py-2">
                                    <FaFileUpload className="text-gray-400 dark:text-gray-500 text-3xl mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        Glissez-déposez vos fichiers ici ou
                                    </p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        multiple
                                        accept="application/pdf,image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white dark:bg-gray-700 text-orange-500 border-orange-300 hover:bg-orange-50 dark:hover:bg-gray-600"
                                    >
                                        <FaPaperclip className="mr-2" /> Sélectionner des fichiers
                                    </Button>
                                </div>
                            </div>

                            {/* Liste des fichiers */}
                            {files.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {files.length} fichier{files.length > 1 ? 's' : ''} joint{files.length > 1 ? 's' : ''}
                                    </p>
                                    <div className="max-h-32 overflow-y-auto">
                                        <ul className="space-y-2">
                                            {files.map((file, index) => (
                                                <li key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md text-sm">
                                                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">
                                                        📎 {file.name}
                                                    </span>
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                                        title="Supprimer"
                                                    >
                                                        <FaRegTimesCircle />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer avec boutons */}
                    <div className="flex justify-between items-center p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !hasEnoughContent}
                            className={`${
                                hasEnoughContent
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                                    : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                            } text-white px-6 transition-all duration-200`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <FaRegSmile className="mr-2" /> Publier la réponse
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