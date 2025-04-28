"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Eye, EyeOff } from "lucide-react";

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

// Modern difficulty styles with grainy gradients
const difficultyStyles: Record<string, { gradient: string; text: string; border: string }> = {
    "Facile 1": {
        gradient: "bg-gradient-to-r from-green-100 to-emerald-200",
        text: "text-emerald-800",
        border: "border-emerald-400"
    },
    "Facile 2": {
        gradient: "bg-gradient-to-r from-emerald-100 to-teal-200",
        text: "text-teal-800",
        border: "border-teal-400"
    },
    "Moyen 1": {
        gradient: "bg-gradient-to-r from-amber-100 to-yellow-200",
        text: "text-amber-800",
        border: "border-amber-400"
    },
    "Moyen 2": {
        gradient: "bg-gradient-to-r from-yellow-100 to-orange-200",
        text: "text-orange-800",
        border: "border-orange-400"
    },
    "Difficile 1": {
        gradient: "bg-gradient-to-r from-rose-100 to-red-200",
        text: "text-rose-800",
        border: "border-rose-400"
    },
    "Difficile 2": {
        gradient: "bg-gradient-to-r from-red-100 to-pink-200",
        text: "text-pink-800",
        border: "border-pink-400"
    },
    "Élite": {
        gradient: "bg-gradient-to-r from-indigo-100 to-purple-200",
        text: "text-indigo-800",
        border: "border-indigo-400"
    },
};

// Function to get difficulty badge path
const getDifficultyBadge = (difficulty: string) => `/badge/${difficulty.toLowerCase().replace(" ", "_")}.svg`;

export default function ExerciseCard({ exercise, index }: ExerciseProps) {
    const [showCorrection, setShowCorrection] = useState(false);
    const difficulty = difficultyStyles[exercise.difficulty] || difficultyStyles["Facile 1"];

    return (
        <div className="flex justify-center w-full my-6">
            <Card className={`w-full max-w-3xl overflow-hidden shadow-xl rounded-2xl border border-opacity-40 ${difficulty.border} backdrop-blur-sm`}>
                {/* Grainy gradient overlay */}
                <div className={`absolute inset-0 opacity-90 ${difficulty.gradient} mix-blend-multiply`}
                     style={{ backgroundImage: "url('/noise.png')" }}>
                </div>

                {/* Glass-like card content container */}
                <div className="relative z-10 p-6">
                    {/* Header with counter and difficulty badge */}
                    <CardHeader className="flex flex-col sm:flex-row gap-4 items-center justify-between p-0 mb-6">
                        <span className="px-6 py-2 bg-white/80 backdrop-blur-sm text-gray-800 font-semibold rounded-full text-sm shadow-lg border border-gray-100">
                            Exercice {index + 1}
                        </span>
                        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-100">
                            <img src={getDifficultyBadge(exercise.difficulty)} alt={exercise.difficulty} className="h-6 w-6" />
                            <span className={`font-semibold ${difficulty.text}`}>{exercise.difficulty}</span>
                        </div>
                    </CardHeader>

                    {/* Main content */}
                    <CardContent className="bg-white/70 backdrop-blur-md rounded-xl p-6 shadow-md border border-gray-100">
                        <h3 className={`text-2xl font-bold mb-4 ${difficulty.text}`}>{exercise.title}</h3>
                        <div className="prose max-w-none text-gray-800 leading-relaxed">
                            <ReactMarkdown
                                rehypePlugins={[rehypeKatex]}
                                remarkPlugins={[remarkMath]}
                            >
                                {exercise.content}
                            </ReactMarkdown>
                        </div>

                        {/* Exercise image if it exists */}
                        {exercise.image && (
                            <div className="mt-6">
                                <img
                                    src={exercise.image}
                                    alt="Illustration"
                                    className="w-full rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                                />
                            </div>
                        )}

                        {/* Correction toggle button */}
                        {exercise.correction && exercise.correction.text && (
                            <div className="mt-6 bg-gray-50/90 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-800 font-medium">Afficher la correction</span>
                                    <button
                                        className={`flex items-center gap-2 ${showCorrection ? 'bg-gray-700' : 'bg-orange-500'} text-white px-5 py-2 rounded-full shadow-md hover:translate-y-[-2px] hover:shadow-lg active:translate-y-[0px] transition-all duration-300`}
                                        onClick={() => setShowCorrection(!showCorrection)}
                                    >
                                        {showCorrection ? <EyeOff size={18} /> : <Eye size={18} />}
                                        {showCorrection ? "Masquer" : "Voir"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Correction content if shown */}
                        {showCorrection && exercise.correction && (
                            <div className="mt-6 animate-fadeIn">
                                <div className="bg-orange-50/90 backdrop-blur-sm border border-orange-200 rounded-lg shadow-md p-6">
                                    <h3 className="text-orange-700 font-semibold text-xl mb-4 flex items-center">
                                        <span className="inline-block w-1 h-6 bg-orange-500 mr-3 rounded-full"></span>
                                        Correction
                                    </h3>
                                    <div className="prose max-w-none text-gray-800 leading-relaxed">
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeKatex]}
                                            remarkPlugins={[remarkMath]}
                                        >
                                            {exercise.correction.text}
                                        </ReactMarkdown>
                                    </div>

                                    {exercise.correction.image && (
                                        <div className="mt-4">
                                            <img
                                                src={exercise.correction.image}
                                                alt="Correction"
                                                className="w-full rounded-lg shadow-md border border-orange-200 hover:shadow-lg transition-shadow"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}