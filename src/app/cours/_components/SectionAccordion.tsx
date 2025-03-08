"use client";

import React, { useState, useEffect } from "react";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/Accordion";
import { BookOpen, FileText, Loader2 } from "lucide-react";
import { Section, Lesson } from "./types";

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
            className="mb-2 rounded-lg bg-white shadow-md border border-gray-200 transition-all hover:bg-gray-50"
        >
            <AccordionTrigger
                className="w-full px-5 py-3 text-left text-md font-semibold rounded-lg flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span>{sectionData.title}</span>
                {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
            </AccordionTrigger>

            <AccordionContent className="px-5 pb-3 bg-gray-50 rounded-b-lg border-t space-y-2">
                {isLoading ? (
                    <p className="text-sm text-gray-500 flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Chargement...
                    </p>
                ) : (
                    <>
                        {sectionData.lessons && sectionData.lessons.length > 0 && (
                            <div className="flex items-start gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                <ul className="list-none space-y-1 text-sm w-full">
                                    {sectionData.lessons.map((lesson) => (
                                        <li
                                            key={lesson._id}
                                            className="text-gray-700 hover:text-blue-600 cursor-pointer transition"
                                            onClick={() => onSelectContent(lesson)}
                                        >
                                            {lesson.title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {sectionData.exercises && sectionData.exercises.length > 0 && (
                            <button
                                className="flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold transition cursor-pointer mt-3 w-full justify-start"
                                onClick={() => onSelectContent(sectionData)}
                            >
                                <FileText className="w-5 h-5" />
                                Voir les exercices de {sectionData.title}
                            </button>
                        )}
                    </>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}
