"use client";

import React, { useState, useEffect } from "react";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/Accordion";
import { BookOpen, FileText, Loader2, ChevronRight, Book } from "lucide-react";
import { Section, Lesson } from "./types";

// Subtle grain effect component
const GrainOverlay = ({ opacity = 0.05 }) => (
    <div
        className="absolute inset-0 pointer-events-none"
        style={{
            backgroundImage: "url(/noise.webp)",
            backgroundSize: "30%",
            opacity: opacity,
            mixBlendMode: "overlay"
        }}
    />
);

interface SectionAccordionProps {
    courseId: string;
    sectionInitial: Section;
    onSelectContent: (content: Lesson | Section) => void;
}

export function SectionAccordion({ courseId, sectionInitial, onSelectContent }: SectionAccordionProps) {
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
                `${process.env.NEXT_PUBLIC_API_URL}/api/cours/${courseId}/sections/${sectionInitial._id}`,
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

    return (
        <AccordionItem
            value={sectionInitial._id}
            className="overflow-hidden border border-orange-100 rounded-lg bg-white shadow-sm transition-all group relative hover:shadow-md"
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-300 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <AccordionTrigger
                className="w-full px-4 py-3 text-left text-gray-800 font-medium rounded-t-lg flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50/50 transition-colors relative"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <GrainOverlay opacity={0.07} />
                <div className="flex items-center gap-2 relative z-10">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-md flex items-center justify-center text-white shadow-sm">
                        <Book className="w-3 h-3" />
                    </div>
                    <span className="text-sm md:text-base">{sectionData.title}</span>
                </div>
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500 relative z-10" />
                ) : (
                    <div className="flex-shrink-0 text-orange-500 bg-white/70 rounded-full p-1 shadow-sm relative z-10">
                        <ChevronRight className="w-4 h-4 transform transition-transform duration-200 ease-in-out" />
                    </div>
                )}
            </AccordionTrigger>

            <AccordionContent className="bg-white px-4 py-2 relative">
                <GrainOverlay opacity={0.03} />

                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="flex items-center justify-center p-2 bg-orange-50 rounded-full">
                            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                        </div>
                        <span className="text-sm text-gray-600 ml-3">Chargement...</span>
                    </div>
                ) : (
                    <div className="relative z-10">
                        {sectionData.lessons && sectionData.lessons.length > 0 && (
                            <div className="space-y-1 py-2">
                                {sectionData.lessons.map((lesson) => (
                                    <div
                                        key={lesson._id}
                                        className="flex items-center gap-3 p-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50/30 rounded-md transition-all cursor-pointer group"
                                        onClick={() => onSelectContent(lesson)}
                                    >
                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <BookOpen className="w-4 h-4 flex-shrink-0" />
                                        </div>
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {lesson.title}
                    </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sectionData.exercises && sectionData.exercises.length > 0 && (
                            <div className="my-2 py-2 border-t border-orange-100">
                                <button
                                    className="flex items-center gap-3 w-full p-2 justify-start hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50/30 rounded-md transition-all group"
                                    onClick={() => onSelectContent(sectionData)}
                                >
                                    <div className="p-1.5 bg-green-100 text-green-600 rounded-md group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                    </div>
                                    <span className="text-sm font-medium text-green-700 group-hover:text-green-800">
                    Voir les exercices
                  </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}