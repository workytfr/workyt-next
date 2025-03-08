"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface ExerciseProps {
    exercise: {
        _id: string;
        title: string;
        content: string;
        difficulty: string;
        correction?: { text?: string; image?: string };
        image?: string;
    };
    index: number;
}

// Définition des couleurs et styles par difficulté
const difficultyStyles: Record<string, { bg: string; border: string; text: string }> = {
    "Facile 1": { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
    "Facile 2": { bg: "bg-green-200", border: "border-green-600", text: "text-green-800" },
    "Moyen 1": { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700" },
    "Moyen 2": { bg: "bg-yellow-200", border: "border-yellow-600", text: "text-yellow-800" },
    "Difficile 1": { bg: "bg-red-100", border: "border-red-500", text: "text-red-700" },
    "Difficile 2": { bg: "bg-red-200", border: "border-red-600", text: "text-red-800" },
    "Élite": { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700" },
};

// Fonction pour obtenir le chemin du badge SVG
const getDifficultyBadge = (difficulty: string) => `/badge/${difficulty.toLowerCase().replace(" ", "_")}.svg`;

export default function ExerciseCard({ exercise, index }: ExerciseProps) {
    const [showCorrection, setShowCorrection] = useState(false);
    const difficulty = difficultyStyles[exercise.difficulty] || difficultyStyles["Facile 1"];

    return (
        <div className="flex justify-center w-full">
            <Card className={`w-full max-w-3xl p-6 shadow-lg rounded-xl border-2 transition-all hover:shadow-2xl ${difficulty.bg} ${difficulty.border}`}>
                {/* En-tête avec compteur, titre et difficulté */}
                <CardHeader className="flex items-center justify-between">
                    <span className="px-4 py-1 bg-white text-gray-800 font-semibold rounded-full text-sm shadow-md">
                        Exercice {index + 1}
                    </span>
                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-full shadow-md">
                        <img src={getDifficultyBadge(exercise.difficulty)} alt={exercise.difficulty} className="h-6 w-6" />
                        <span className={`font-semibold ${difficulty.text}`}>{exercise.difficulty}</span>
                    </div>
                </CardHeader>

                {/* Contenu principal */}
                <CardContent className="mt-4 space-y-4">
                    <h3 className={`text-xl font-bold ${difficulty.text}`}>{exercise.title}</h3>
                    <ReactMarkdown
                        className="prose text-gray-900 leading-relaxed"
                        rehypePlugins={[rehypeKatex]}
                        remarkPlugins={[remarkMath]}
                    >
                        {exercise.content}
                    </ReactMarkdown>

                    {/* Image associée si elle existe */}
                    {exercise.image && (
                        <img
                            src={exercise.image}
                            alt="Illustration"
                            className="mt-4 w-full rounded-lg shadow-md border border-gray-300"
                        />
                    )}

                    {/* Bouton bascule pour voir la correction */}
                    {exercise.correction && exercise.correction.text && (
                        <div className="mt-4 flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm">
                            <span className="text-gray-700 font-medium">Afficher la correction</span>
                            <button
                                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-orange-600 transition"
                                onClick={() => setShowCorrection(!showCorrection)}
                            >
                                {showCorrection ? <FaEyeSlash /> : <FaEye />} {showCorrection ? "Masquer" : "Voir"}
                            </button>
                        </div>
                    )}

                    {/* Affichage de la correction si activée */}
                    {showCorrection && exercise.correction && (
                        <div className="mt-4 p-4 border border-orange-400 bg-orange-50 rounded-lg shadow-md">
                            <h3 className="text-orange-700 font-semibold text-lg">Correction :</h3>
                            <ReactMarkdown
                                className="prose text-orange-900 leading-relaxed"
                                rehypePlugins={[rehypeKatex]}
                                remarkPlugins={[remarkMath]}
                            >
                                {exercise.correction.text}
                            </ReactMarkdown>

                            {exercise.correction.image && (
                                <img
                                    src={exercise.correction.image}
                                    alt="Correction"
                                    className="mt-2 w-full rounded-md shadow-md border border-orange-300"
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
