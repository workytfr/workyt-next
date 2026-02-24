"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import { Eye, EyeOff, FileText, CheckCircle } from "lucide-react";
import BookmarkButton from "@/components/BookmarkButton";
import "./styles/notion-theme.css";

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

// Function to get difficulty badge path
const getDifficultyBadge = (difficulty: string) => `/badge/${difficulty.toLowerCase().replace(/\s+/g, '_')}.svg`;

// Difficulté avec couleurs
const difficultyConfig: Record<string, { color: string; bgColor: string; gradient: string }> = {
    "Facile 1": { 
        color: "#10b981", 
        bgColor: "#ecfdf5",
        gradient: "from-green-100 to-emerald-200"
    },
    "Facile 2": { 
        color: "#10b981", 
        bgColor: "#ecfdf5",
        gradient: "from-emerald-100 to-teal-200"
    },
    "Moyen 1": { 
        color: "#f59e0b", 
        bgColor: "#fffbeb",
        gradient: "from-amber-100 to-yellow-200"
    },
    "Moyen 2": { 
        color: "#f59e0b", 
        bgColor: "#fffbeb",
        gradient: "from-yellow-100 to-orange-200"
    },
    "Difficile 1": { 
        color: "#ef4444", 
        bgColor: "#fef2f2",
        gradient: "from-rose-100 to-red-200"
    },
    "Difficile 2": { 
        color: "#ef4444", 
        bgColor: "#fef2f2",
        gradient: "from-red-100 to-pink-200"
    },
    "Élite": { 
        color: "#8b5cf6", 
        bgColor: "#f5f3ff",
        gradient: "from-indigo-100 to-purple-200"
    },
};

export default function ExerciseCard({ exercise, index }: ExerciseProps) {
    const [showCorrection, setShowCorrection] = useState(false);
    const config = difficultyConfig[exercise.difficulty] || difficultyConfig["Facile 1"];

    return (
        <div className="notion-card overflow-hidden rounded-3xl">
            {/* Header avec grainy gradient */}
            <div 
                className={`px-6 py-4 flex items-center justify-between bg-gradient-to-r ${config.gradient} relative`}
                style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply' }}
            >
                <div className="flex items-center gap-4">
                    {/* Numéro avec badge arrondi */}
                    <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-md"
                        style={{ backgroundColor: config.color }}
                    >
                        {index + 1}
                    </div>
                    <h3 className="font-semibold text-gray-800">{exercise.title}</h3>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Badge SVG de difficulté */}
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                        <img 
                            src={getDifficultyBadge(exercise.difficulty)} 
                            alt={exercise.difficulty} 
                            className="h-5 w-5" 
                        />
                        <span className="text-sm font-medium" style={{ color: config.color }}>
                            {exercise.difficulty}
                        </span>
                    </div>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                        <BookmarkButton exerciseId={exercise._id} size="sm" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="prose prose-lg max-w-none text-[#37352f] leading-relaxed">
                    <ReactMarkdown
                        rehypePlugins={[rehypeKatex]}
                        remarkPlugins={[remarkMath, remarkGfm]}
                    >
                        {exercise.content}
                    </ReactMarkdown>
                </div>

                {exercise.image && (
                    <div className="mt-6">
                        <img
                            src={exercise.image}
                            alt="Illustration"
                            className="w-full rounded-2xl border border-[#e3e2e0]"
                        />
                    </div>
                )}

                {/* Correction toggle */}
                {exercise.correction && exercise.correction.text && (
                    <div className="mt-6">
                        <button
                            onClick={() => setShowCorrection(!showCorrection)}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                                showCorrection 
                                    ? "bg-[#37352f] text-white" 
                                    : "bg-[#f7f6f3] text-[#37352f] hover:bg-[#ebebea] border border-[#e3e2e0]"
                            }`}
                        >
                            {showCorrection ? (
                                <>
                                    <EyeOff className="w-4 h-4" />
                                    Masquer la correction
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4" />
                                    Voir la correction
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Correction content */}
                {showCorrection && exercise.correction && (
                    <div className="mt-4 p-6 bg-[#f7f6f3] rounded-2xl border border-[#e3e2e0]">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-[#10b981]" />
                            <h4 className="font-semibold text-[#37352f]">Correction</h4>
                        </div>
                        
                        <div className="prose prose-lg max-w-none text-[#37352f] leading-relaxed">
                            <ReactMarkdown
                                rehypePlugins={[rehypeKatex]}
                                remarkPlugins={[remarkMath, remarkGfm]}
                            >
                                {exercise.correction.text}
                            </ReactMarkdown>
                        </div>

                        {exercise.correction.image && (
                            <div className="mt-4">
                                <img
                                    src={exercise.correction.image}
                                    alt="Correction"
                                    className="w-full rounded-2xl border border-[#e3e2e0]"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
