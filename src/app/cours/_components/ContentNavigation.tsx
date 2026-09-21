"use client";

import { ChevronLeft, ChevronRight, BookOpen, FileText, Trophy } from "lucide-react";
import { NavigableItem } from "./types";
import "./styles/notion-theme.css";

interface ContentNavigationProps {
    prev: NavigableItem | null;
    next: NavigableItem | null;
    onNavigate: (item: NavigableItem) => void;
}

function getKindIcon(kind: string) {
    switch (kind) {
        case 'lesson': return <BookOpen className="w-4 h-4" />;
        case 'exercises': return <FileText className="w-4 h-4" />;
        case 'quizzes': return <Trophy className="w-4 h-4" />;
        default: return null;
    }
}

function getKindColor(kind: string) {
    switch (kind) {
        case 'lesson': return 'text-[#3b82f6] bg-[#eff6ff]';
        case 'exercises': return 'text-[#10b981] bg-[#ecfdf5]';
        case 'quizzes': return 'text-[#f59e0b] bg-[#fffbeb]';
        default: return 'text-[#6b625a] bg-[#efe6d6]';
    }
}

export default function ContentNavigation({ prev, next, onNavigate }: ContentNavigationProps) {
    if (!prev && !next) return null;

    return (
        <div className="flex flex-col sm:flex-row gap-3 mt-12 pt-8 border-t border-[#e8dfd0]">
            {/* Bouton précédent */}
            <button
                onClick={() => prev && onNavigate(prev)}
                disabled={!prev}
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border text-left group transition-all ${
                    prev
                        ? "border-[#e8dfd0] hover:border-[#d6cab5] hover:bg-[#f5efe3] cursor-pointer"
                        : "border-[#efe6d6] opacity-40 cursor-not-allowed"
                }`}
            >
                <ChevronLeft className={`w-5 h-5 flex-shrink-0 ${prev ? "text-[#6b625a] group-hover:-translate-x-0.5 transition-transform" : "text-[#b8ad9f]"}`} />
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#8f857b] mb-0.5">Précédent</p>
                    {prev && (
                        <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded flex items-center justify-center ${getKindColor(prev.kind)}`}>
                                {getKindIcon(prev.kind)}
                            </span>
                            <p className="text-sm font-medium text-[#1a1512] truncate">
                                {prev.label}
                            </p>
                        </div>
                    )}
                </div>
            </button>

            {/* Bouton suivant */}
            <button
                onClick={() => next && onNavigate(next)}
                disabled={!next}
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border text-right group transition-all ${
                    next
                        ? "border-[#e8dfd0] hover:border-[#d6cab5] hover:bg-[#f5efe3] cursor-pointer"
                        : "border-[#efe6d6] opacity-40 cursor-not-allowed"
                }`}
            >
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#8f857b] mb-0.5">Suivant</p>
                    {next && (
                        <div className="flex items-center gap-2 justify-end">
                            <p className="text-sm font-medium text-[#1a1512] truncate">
                                {next.label}
                            </p>
                            <span className={`w-5 h-5 rounded flex items-center justify-center ${getKindColor(next.kind)}`}>
                                {getKindIcon(next.kind)}
                            </span>
                        </div>
                    )}
                </div>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 ${next ? "text-[#6b625a] group-hover:translate-x-0.5 transition-transform" : "text-[#b8ad9f]"}`} />
            </button>
        </div>
    );
}
