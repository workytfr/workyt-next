"use client";

import React, { useState, useEffect } from "react";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/Accordion";
import { BookOpen, FileText, Trophy, Check, Clock, ChevronRight } from "lucide-react";
import { Section, SelectedContent } from "./types";
import { useSession } from "next-auth/react";
import { estimateReadingTime } from "./utils/readingTime";
import "./styles/notion-theme.css";

interface SectionAccordionProps {
    courseId: string;
    sectionInitial: Section;
    onSelectContent: (content: SelectedContent) => void;
    readLessons?: Set<string>;
}

export function SectionAccordion({ courseId, sectionInitial, onSelectContent, readLessons }: SectionAccordionProps) {
    const { data: session } = useSession();
    const [sectionDetail, setSectionDetail] = useState<Section | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && !sectionDetail) {
            fetchSectionDetails();
        }
    }, [isOpen]);

    const fetchSectionDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `/api/cours/${courseId}/sections/${sectionInitial._id}`,
                { cache: "no-store" }
            );
            const data = await res.json();
            if (data?.section) {
                setSectionDetail(data.section);
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la section :", error);
        } finally {
            setIsLoading(false);
        }
    };

    const sectionData = sectionDetail ?? sectionInitial;

    const totalLessons = sectionData.lessons?.length || 0;
    const readCount = readLessons && sectionData.lessons
        ? sectionData.lessons.filter(l => readLessons.has(l._id)).length
        : 0;

    const progress = totalLessons > 0 ? Math.round((readCount / totalLessons) * 100) : 0;

    return (
        <AccordionItem
            value={sectionInitial._id}
            className="border-0 rounded-xl overflow-hidden mb-1"
        >
            <AccordionTrigger
                className="flex items-center w-full px-3 py-3 text-left hover:bg-[#ebebea] rounded-xl transition-colors group"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                            isOpen ? 'bg-[#f97316] text-white' : 'bg-[#f1f1ef] text-[#9ca3af] group-hover:bg-[#e3e2e0]'
                        }`}
                    >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-[#37352f] truncate">
                        {sectionData.title}
                    </span>
                </div>
                
                {totalLessons > 0 && readLessons && (
                    <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ml-2 ${
                        readCount === totalLessons 
                            ? 'bg-[#ecfdf5] text-[#10b981]' 
                            : 'bg-[#f1f1ef] text-[#6b6b6b]'
                    }`}>
                        {readCount}/{totalLessons}
                    </span>
                )}
            </AccordionTrigger>

            <AccordionContent className="px-3 pb-2">
                {isLoading ? (
                    <div className="flex items-center gap-2 py-3 px-2">
                        <div className="w-4 h-4 border-2 border-[#e3e2e0] border-t-[#f97316] rounded-full animate-spin" />
                        <span className="text-sm text-[#9ca3af]">Chargement...</span>
                    </div>
                ) : (
                    <div className="space-y-0.5 pl-11">
                        {/* Leçons */}
                        {sectionData.lessons && sectionData.lessons.length > 0 && (
                            <div className="space-y-0.5">
                                {sectionData.lessons.map((lesson) => {
                                    const isRead = readLessons?.has(lesson._id);
                                    const readTime = lesson.content ? estimateReadingTime(lesson.content) : null;
                                    
                                    return (
                                        <button
                                            key={lesson._id}
                                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors group ${
                                                isRead 
                                                    ? 'text-[#9ca3af] hover:bg-[#ebebea]' 
                                                    : 'text-[#37352f] hover:bg-[#ebebea]'
                                            }`}
                                            onClick={() => onSelectContent({
                                                kind: 'lesson',
                                                lesson,
                                                sectionId: sectionInitial._id,
                                                sectionTitle: sectionData.title
                                            })}
                                        >
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
                                                isRead 
                                                    ? 'bg-[#ecfdf5] text-[#10b981]' 
                                                    : 'bg-[#eff6ff] text-[#3b82f6]'
                                            }`}>
                                                {isRead ? (
                                                    <Check className="w-3.5 h-3.5" />
                                                ) : (
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                )}
                                            </div>
                                            <span className="flex-1 truncate font-normal">
                                                {lesson.title}
                                            </span>
                                            {readTime && (
                                                <span className="flex-shrink-0 text-xs text-[#9ca3af] flex items-center gap-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {readTime}m
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Exercices */}
                        {sectionData.exercises && sectionData.exercises.length > 0 && (
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm text-[#37352f] hover:bg-[#ebebea] transition-colors group mt-1"
                                onClick={() => onSelectContent({
                                    kind: 'exercises',
                                    exercises: sectionData.exercises || [],
                                    sectionId: sectionInitial._id,
                                    sectionTitle: sectionData.title
                                })}
                            >
                                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#ecfdf5] text-[#10b981] flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5" />
                                </div>
                                <span className="flex-1">
                                    Exercices ({sectionData.exercises.length})
                                </span>
                            </button>
                        )}

                        {/* Quiz */}
                        {sectionData.quizzes && sectionData.quizzes.length > 0 && (
                            <button
                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors group mt-1 ${
                                    session?.user 
                                        ? 'text-[#37352f] hover:bg-[#ebebea]' 
                                        : 'text-[#9ca3af] cursor-not-allowed'
                                }`}
                                onClick={() => session?.user && onSelectContent({
                                    kind: 'quizzes',
                                    quizzes: sectionData.quizzes || [],
                                    sectionId: sectionInitial._id,
                                    sectionTitle: sectionData.title
                                })}
                            >
                                <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
                                    session?.user 
                                        ? 'bg-[#fffbeb] text-[#f59e0b]' 
                                        : 'bg-[#f1f1ef] text-[#9ca3af]'
                                }`}>
                                    <Trophy className="w-3.5 h-3.5" />
                                </div>
                                <span className="flex-1">
                                    Quiz ({sectionData.quizzes.length})
                                </span>
                                {!session?.user && (
                                    <span className="text-xs text-[#9ca3af]">Connexion requise</span>
                                )}
                            </button>
                        )}

                        {/* Vide */}
                        {!sectionData.lessons?.length && !sectionData.exercises?.length && !sectionData.quizzes?.length && (
                            <p className="text-sm text-[#9ca3af] px-3 py-3">
                                Aucun contenu dans cette section
                            </p>
                        )}
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}
