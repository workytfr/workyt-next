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

// Types pour la configuration des niveaux
interface LevelConfig {
    label: string;
    levels?: { value: string; label: string }[];
    subjects?: string[];
    commonSubjects?: string[];
    tracks?: { value: string; label: string }[];
    specialities?: { value: string; label: string }[];
    techTracks?: { value: string; label: string }[];
    proTracks?: { value: string; label: string }[];
    categories?: {
        key: string;
        label: string;
        levels: { value: string; label: string }[];
        tracks: { value: string; label: string }[];
    }[];
}

interface LevelsConfig {
    [key: string]: LevelConfig;
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

    // Champs pour le profil académique
    const [levelsConfig, setLevelsConfig] = useState<LevelsConfig | null>(null);
    const [selectedCycle, setSelectedCycle] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [selectedTrack, setSelectedTrack] = useState("");
    const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState(""); // Pour supérieur (BTS, BUT, etc.)

    // Charger la configuration des niveaux
    useEffect(() => {
        fetch("/api/curriculum/levels")
            .then((r) => r.json())
            .then((data) => setLevelsConfig(data))
            .catch(console.error);
    }, []);

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

    // Reset des champs dépendants quand le cycle change
    useEffect(() => {
        setSelectedLevel("");
        setSelectedTrack("");
        setSelectedSpecialities([]);
        setSelectedCategory("");
    }, [selectedCycle]);

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

    // Obtenir les niveaux disponibles selon le cycle sélectionné
    const getAvailableLevels = () => {
        if (!levelsConfig || !selectedCycle) return [];
        const config = levelsConfig[selectedCycle];
        if (!config) return [];

        // Pour le supérieur, on regroupe par catégorie
        if (selectedCycle === 'superieur' && config.categories) {
            if (selectedCategory) {
                const category = config.categories.find(c => c.key === selectedCategory);
                return category?.levels || [];
            }
            return [];
        }

        return config.levels || [];
    };

    // Obtenir les filières disponibles
    const getAvailableTracks = () => {
        if (!levelsConfig || !selectedCycle) return [];
        const config = levelsConfig[selectedCycle];
        if (!config) return [];

        if (selectedCycle === 'superieur' && config.categories && selectedCategory) {
            const category = config.categories.find(c => c.key === selectedCategory);
            return category?.tracks || [];
        }

        // Pour le lycée, retourne les filières selon le niveau
        if (selectedCycle === 'lycee' && selectedLevel) {
            if (selectedLevel === '2nde') {
                return []; // Pas de filière en 2nde
            }
            if (selectedTrack) {
                // Si une filière est sélectionnée, retourne les options de cette filière
                if (selectedTrack === 'generale') {
                    return config.specialities || [];
                }
            }
        }

        return config.tracks || [];
    };

    // Obtenir les spécialités disponibles (pour lycée général)
    const getAvailableSpecialities = () => {
        if (!levelsConfig || selectedCycle !== 'lycee') return [];
        const config = levelsConfig['lycee'];
        if (!config || selectedLevel === '2nde') return [];
        if (selectedTrack !== 'generale') return [];
        return config.specialities || [];
    };

    // Rendu des sélecteurs de niveau
    const renderAcademicSelectors = () => {
        if (!levelsConfig) {
            return (
                <div className="text-sm text-gray-500 py-2">
                    Chargement des options...
                </div>
            );
        }

        return (
            <div className="space-y-3 border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">+</span>
                    Mon parcours scolaire <span className="text-xs text-gray-400 font-normal">(optionnel)</span>
                </h4>

                {/* Sélection du cycle */}
                <select
                    value={selectedCycle}
                    onChange={(e) => setSelectedCycle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                    <option value="">Je suis en... (optionnel)</option>
                    <option value="cycle3">Collège (6ème)</option>
                    <option value="cycle4">Collège (5ème - 4ème - 3ème)</option>
                    <option value="lycee">Lycée</option>
                    <option value="superieur">Études Supérieures</option>
                </select>

                {/* Pour le supérieur : sélection de la catégorie */}
                {selectedCycle === 'superieur' && levelsConfig.superieur?.categories && (
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                        <option value="">Type de formation...</option>
                        {levelsConfig.superieur.categories.map((cat) => (
                            <option key={cat.key} value={cat.key}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Sélection du niveau précis */}
                {selectedCycle && (selectedCycle !== 'superieur' || selectedCategory) && (
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                        <option value="">Niveau précis...</option>
                        {getAvailableLevels().map((level) => (
                            <option key={level.value} value={level.value}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Pour le lycée : sélection de la filière */}
                {selectedCycle === 'lycee' && selectedLevel && selectedLevel !== '2nde' && (
                    <select
                        value={selectedTrack}
                        onChange={(e) => {
                            setSelectedTrack(e.target.value);
                            setSelectedSpecialities([]);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                        <option value="">Filière...</option>
                        {levelsConfig?.lycee?.tracks?.map((track) => (
                            <option key={track.value} value={track.value}>
                                {track.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Pour le lycée général : sélection des spécialités */}
                {selectedCycle === 'lycee' && selectedTrack === 'generale' && selectedLevel !== '2nde' && (
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500">
                            Spécialités {selectedLevel === 'terminale' ? '(actuelles)' : ''}
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                            {getAvailableSpecialities().map((spec) => (
                                <label
                                    key={spec.value}
                                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        value={spec.value}
                                        checked={selectedSpecialities.includes(spec.value)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                // Limite à 3 spécialités
                                                if (selectedSpecialities.length < 3) {
                                                    setSelectedSpecialities([...selectedSpecialities, spec.value]);
                                                }
                                            } else {
                                                setSelectedSpecialities(selectedSpecialities.filter(s => s !== spec.value));
                                            }
                                        }}
                                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">{spec.label}</span>
                                </label>
                            ))}
                        </div>
                        {selectedSpecialities.length > 0 && (
                            <p className="text-xs text-gray-500">
                                {selectedSpecialities.length} spécialité(s) sélectionnée(s)
                                {selectedLevel !== 'terminale' && " (maximum 3)"}
                            </p>
                        )}
                    </div>
                )}

                {/* Pour le lycée technologique : sélection de la série */}
                {selectedCycle === 'lycee' && selectedTrack === 'technologique' && (
                    <select
                        value={selectedSpecialities[0] || ''}
                        onChange={(e) => setSelectedSpecialities([e.target.value])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                        <option value="">Série technologique...</option>
                        {levelsConfig?.lycee?.techTracks?.map((track) => (
                            <option key={track.value} value={track.value}>
                                {track.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Pour le lycée professionnel */}
                {selectedCycle === 'lycee' && selectedTrack === 'professionnelle' && (
                    <select
                        value={selectedSpecialities[0] || ''}
                        onChange={(e) => setSelectedSpecialities([e.target.value])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                        <option value="">Filière professionnelle...</option>
                        {levelsConfig?.lycee?.proTracks?.map((track) => (
                            <option key={track.value} value={track.value}>
                                {track.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Pour le supérieur : sélection de la filière spécifique */}
                {selectedCycle === 'superieur' && selectedCategory && (
                    <select
                        value={selectedTrack}
                        onChange={(e) => setSelectedTrack(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                        <option value="">Filière...</option>
                        {getAvailableTracks().map((track) => (
                            <option key={track.value} value={track.value}>
                                {track.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Récapitulatif visuel */}
                {(selectedCycle || selectedLevel) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-orange-800 mb-1">Récapitulatif :</p>
                        <p className="text-orange-700">
                            {levelsConfig[selectedCycle]?.label}
                            {selectedLevel && ` • ${getAvailableLevels().find(l => l.value === selectedLevel)?.label}`}
                            {selectedTrack && ` • ${getAvailableTracks().find(t => t.value === selectedTrack)?.label || selectedTrack}`}
                            {selectedSpecialities.length > 0 && selectedCycle === 'lycee' && selectedTrack === 'generale' && (
                                <span className="block mt-1 text-xs">
                                    Spécialités : {selectedSpecialities.map(s => 
                                        levelsConfig?.lycee?.specialities?.find(sp => sp.value === s)?.label
                                    ).filter(Boolean).join(', ')}
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </div>
        );
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

        // Validation des champs académiques seulement si un cycle est sélectionné
        if (selectedCycle) {
            if (!selectedLevel) {
                setMessage("Veuillez indiquer votre niveau précis.");
                return;
            }
            if (selectedCycle === 'lycee' && selectedLevel !== '2nde' && !selectedTrack) {
                setMessage("Veuillez sélectionner votre filière.");
                return;
            }
            if (selectedCycle === 'superieur' && (!selectedCategory || !selectedTrack)) {
                setMessage("Veuillez compléter votre formation.");
                return;
            }
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
                    username: normalizedUsername,
                    email,
                    password,
                    hasAcceptedPrivacyPolicy,
                    // Données académiques (optionnel)
                    ...(selectedCycle && selectedLevel ? {
                        academicProfile: {
                            currentGrade: selectedLevel,
                            cycle: selectedCycle,
                            track: selectedTrack || undefined,
                            specialities: selectedSpecialities.length > 0 ? selectedSpecialities : undefined,
                            options: selectedCategory ? [selectedCategory] : undefined,
                        }
                    } : {}),
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

                    {/* Sélecteurs de niveau scolaire */}
                    {renderAcademicSelectors()}

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
