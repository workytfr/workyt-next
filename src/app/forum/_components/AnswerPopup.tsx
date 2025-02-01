"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import { FaPaperclip, FaTimes } from "react-icons/fa";
import { useSession } from "next-auth/react"; // Import NextAuth pour récupérer le token

interface AnswerPopupProps {
    questionId: string;
    onClose: () => void;
}

const AnswerPopup: React.FC<AnswerPopupProps> = ({ questionId, onClose }) => {
    const { data: session } = useSession(); // Récupère la session utilisateur
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                    Authorization: `Bearer ${session.accessToken}`, // Ajout du token ici
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de l'envoi de la réponse.");
            }

            onClose(); // Fermer le popup après soumission
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Répondre à la question</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes size={20} />
                    </button>
                </div>
                <MDEditor value={content} onChange={(value) => setContent(value || "")} height={150} />
                <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FaPaperclip className="text-blue-500" /> Ajouter des fichiers
                    </label>
                    <Input type="file" multiple accept="application/pdf,image/*" onChange={handleFileChange} />
                    {files.length > 0 && (
                        <ul className="mt-2">
                            {files.map((file, index) => (
                                <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md mt-2">
                                    <span className="text-gray-700">📎 {file.name}</span>
                                    <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                                        <FaTimes />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex justify-end mt-6">
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Envoi en cours..." : "Publier la réponse"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AnswerPopup;
