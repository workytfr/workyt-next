"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Assurez-vous que ce composant existe
import { Textarea } from "@/components/ui/Textarea"; // Assurez-vous que ce composant existe
import { useSession } from "next-auth/react";

interface CommentFormProps {
    revisionId: string; // ID de la fiche
    currentUser: { username: string; id: string }; // Informations sur l'utilisateur connecté
}

const CommentForm: React.FC<CommentFormProps> = ({ revisionId, currentUser }) => {
    const { data: session } = useSession();
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = (session as any)?.accessToken || "";
            const response = await fetch("/api/comment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    revisionId,
                    content,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Erreur lors de l'ajout du commentaire.");
            }

            setContent(""); // Réinitialiser le champ de contenu
            router.refresh(); // Recharger les commentaires
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
                placeholder="Écrivez votre commentaire..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border rounded"
                required
            />
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Poster le commentaire"}
            </Button>
        </form>
    );
};

export default CommentForm;
