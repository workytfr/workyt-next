"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { FaDiscord } from "react-icons/fa";
import PrivacyConsent from "./PrivacyConsent";

// Fonction pour normaliser le username côté client
function normalizeUsername(username: string): string {
    return username
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 20);
}

// Fonction pour valider le username
function validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.length === 0) {
        return { isValid: false, error: "Le nom d'utilisateur est requis" };
    }

    if (username.length < 3) {
        return { isValid: false, error: "Au moins 3 caractères requis" };
    }

    if (username.length > 20) {
        return { isValid: false, error: "Maximum 20 caractères" };
    }

    const validPattern = /^[a-zA-Z0-9][a-z0-9_]*$/;
    if (!validPattern.test(username)) {
        return { isValid: false, error: "Seules les lettres, chiffres et _ sont autorisés (première lettre peut être majuscule)" };
    }

    if (username.startsWith('_')) {
        return { isValid: false, error: "Ne peut pas commencer par un underscore" };
    }

    return { isValid: true };
}

export default function AuthPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [normalizedUsername, setNormalizedUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
    const [hasAcceptedPrivacyPolicy, setHasAcceptedPrivacyPolicy] = useState(false);

    // Normalisation en temps réel du username
    useEffect(() => {
        if (username) {
            const normalized = normalizeUsername(username);
            setNormalizedUsername(normalized);

            const validation = validateUsername(normalized);
            if (!validation.isValid) {
                setUsernameError(validation.error || "");
            } else {
                setUsernameError("");
            }
        } else {
            setNormalizedUsername("");
            setUsernameError("");
        }
        setUsernameSuggestions([]); // Reset suggestions quand l'utilisateur tape
    }, [username]);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setUsername(suggestion);
        setUsernameSuggestions([]);
        setMessage("");
    };

    const handlePrivacyConsent = (hasConsented: boolean) => {
        setHasAcceptedPrivacyPolicy(hasConsented);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation finale côté client
        const validation = validateUsername(normalizedUsername);
        if (!validation.isValid) {
            setUsernameError(validation.error || "");
            return;
        }

        if (!hasAcceptedPrivacyPolicy) {
            setMessage("Vous devez accepter la politique de confidentialité pour continuer.");
            return;
        }

        setIsLoading(true);
        setMessage("");
        setUsernameSuggestions([]);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    username: normalizedUsername, // Envoie la version normalisée
                    email,
                    password,
                    hasAcceptedPrivacyPolicy
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Inscription réussie !");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setMessage(data.message || "L'inscription a échoué.");

                // Affiche les suggestions si le username est pris
                if (data.suggestions && data.suggestions.length > 0) {
                    setUsernameSuggestions(data.suggestions);
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);
            setMessage("Erreur de connexion au serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false
            });

            if (result?.ok) {
                setMessage("Connexion réussie !");
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                setMessage("Email ou mot de passe incorrect.");
            }
        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
            setMessage("Erreur de connexion.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoading) return;

        setIsLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessage(data.message || "Un email de réinitialisation a été envoyé.");
            } else {
                const errorData = await res.json();
                setMessage(errorData.error || "Une erreur est survenue.");
            }
        } catch (error) {
            console.error(error);
            setMessage("Impossible de se connecter au serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDiscordSignIn = async () => {
        await signIn("discord", { callbackUrl: "/" });
    };

    return (
        <div className="p-6 flex flex-col space-y-4 bg-white text-black">
            {!isForgotPassword && (
                <div className="flex justify-center space-x-4">
                    <button
                        className={`text-lg font-semibold ${
                            !isRegister ? "text-primary border-b-2 border-primary" : "text-gray-500"
                        }`}
                        onClick={() => {
                            setIsRegister(false);
                            setUsernameSuggestions([]);
                            setUsernameError("");
                        }}
                    >
                        Connexion
                    </button>
                    <button
                        className={`text-lg font-semibold ${
                            isRegister ? "text-primary border-b-2 border-primary" : "text-gray-500"
                        }`}
                        onClick={() => setIsRegister(true)}
                    >
                        Inscription
                    </button>
                </div>
            )}

            {isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="flex flex-col space-y-4">
                    <Input
                        id="email"
                        type="email"
                        placeholder="Votre email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Envoi en cours..." : "Envoyer un email de réinitialisation"}
                    </Button>
                    <button
                        type="button"
                        className="text-sm text-gray-500 underline"
                        onClick={() => setIsForgotPassword(false)}
                        disabled={isLoading}
                    >
                        Retour à la connexion
                    </button>
                </form>
            ) : isRegister ? (
                <form onSubmit={handleRegister} className="flex flex-col space-y-4">
                    <Input
                        id="name"
                        type="text"
                        placeholder="Votre prénom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    <div className="relative">
                        <Input
                            id="username"
                            type="text"
                            placeholder="Votre nom d'utilisateur"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                            disabled={isLoading}
                            className={usernameError ? "border-red-500" : ""}
                        />

                        {/* Aperçu du username normalisé */}
                        {username && normalizedUsername !== username && (
                            <div className="text-xs text-gray-500 mt-1">
                                Sera sauvegardé comme: <span className="font-mono bg-gray-100 px-1 rounded">{normalizedUsername}</span>
                            </div>
                        )}

                        {/* Erreur de validation */}
                        {usernameError && (
                            <div className="text-xs text-red-500 mt-1">
                                {usernameError}
                            </div>
                        )}

                        {/* Suggestions */}
                        {usernameSuggestions.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded border">
                                <div className="text-xs text-gray-600 mb-2">Suggestions disponibles :</div>
                                <div className="flex flex-wrap gap-2">
                                    {usernameSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Input
                        id="email"
                        type="email"
                        placeholder="Votre email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    <Input
                        id="password"
                        type="password"
                        placeholder="Votre mot de passe (min. 6 caractères)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={isLoading}
                    />

                    {/* Consentement à la politique de confidentialité */}
                    <div className="border-t pt-4">
                        <PrivacyConsent
                            onConsentChange={handlePrivacyConsent}
                            required={true}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !!usernameError || !hasAcceptedPrivacyPolicy}
                    >
                        {isLoading ? "Inscription en cours..." : "S'inscrire"}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                    <Input
                        id="email"
                        type="email"
                        placeholder="Votre email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Connexion en cours..." : "Se connecter"}
                    </Button>
                    <button
                        type="button"
                        className="text-sm text-gray-500 underline"
                        onClick={() => setIsForgotPassword(true)}
                        disabled={isLoading}
                    >
                        Mot de passe oublié ?
                    </button>
                </form>
            )}

            <div className="flex justify-center mt-4">
                <Button
                    onClick={handleDiscordSignIn}
                    className="flex items-center space-x-2 bg-[#5865F2] hover:bg-[#4752C4] text-white"
                    disabled={isLoading}
                >
                    <FaDiscord />
                    <span>{isRegister ? "S'inscrire avec Discord" : "Se connecter avec Discord"}</span>
                </Button>
            </div>

            {message && (
                <p className={`text-center text-sm mt-4 ${
                    message.includes("réussie") ? "text-green-600" : "text-red-600"
                }`}>
                    {message}
                </p>
            )}
        </div>
    );
}