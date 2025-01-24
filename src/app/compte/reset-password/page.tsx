"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token"); // Récupérer le jeton depuis l'URL

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setMessage("Le jeton est manquant. Veuillez vérifier votre email.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Les mots de passe ne correspondent pas.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/auth/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Mot de passe réinitialisé avec succès !");
                setTimeout(() => {
                    router.push("/"); // Redirection vers la page principale
                }, 2000);
            } else {
                setMessage(data.error || "Une erreur est survenue.");
            }
        } catch (error) {
            console.error(error);
            setMessage("Impossible de se connecter au serveur.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 flex flex-col items-center justify-center space-y-6 bg-white text-black">
            <h1 className="text-2xl font-semibold">Réinitialisation de mot de passe</h1>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
                <Input
                    id="password"
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "En cours..." : "Réinitialiser"}
                </Button>
            </form>
            {message && <p className="text-center text-sm text-red-500">{message}</p>}
        </div>
    );
}
