"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username, email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            setMessage("Inscription réussie !");
            window.location.reload(); // Rafraîchit la page
        } else {
            setMessage(data.message || "L'inscription a échoué.");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.ok) {
            setMessage("Connexion réussie !");
            window.location.reload(); // Rafraîchit la page
        } else {
            setMessage("Email ou mot de passe incorrect.");
        }
    };

    const handleGoogleSignIn = async () => {
        await signIn("google", { callbackUrl: "/" });
    };

    return (
        <div className="p-6 flex flex-col space-y-4 bg-white text-black">
            <div className="flex justify-center space-x-4">
                <button
                    className={`text-lg font-semibold ${
                        !isRegister ? "text-primary border-b-2 border-primary" : "text-gray-500"
                    }`}
                    onClick={() => setIsRegister(false)}
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

            {isRegister ? (
                <form onSubmit={handleRegister} className="flex flex-col space-y-4">
                    <Input
                        id="name"
                        type="text"
                        placeholder="Votre prénom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Input
                        id="username"
                        type="text"
                        placeholder="Votre nom d'utilisateur"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Votre email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit">S&apos;inscrire</Button>
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
                    />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit">Se connecter</Button>
                </form>
            )}

            <div className="flex justify-center mt-4">
                <Button onClick={handleGoogleSignIn} className="flex items-center space-x-2">
                    <FcGoogle />
                    <span>{isRegister ? "S'inscrire avec Google" : "Se connecter avec Google"}</span>
                </Button>
            </div>

            {message && <p className="text-center text-sm mt-4">{message}</p>}
        </div>
    );
}
