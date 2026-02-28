"use client";

import React from "react";
import { Accordion } from "@/components/ui/Accordion";
import { Course, SelectedContent } from "./types";
import { SectionAccordion } from "./SectionAccordion";
import CourseSearch from "./CourseSearch";
import RelatedContentPanel from "./RelatedContentPanel";
import { Search } from "lucide-react";
import "./styles/notion-theme.css";

interface SidebarProps {
    course: Course;
    onSelectContent: (content: SelectedContent) => void;
    readLessons?: Set<string>;
}

export function Sidebar({ course, onSelectContent, readLessons }: SidebarProps) {
    const handleSearchResult = (sectionId: string, lessonId: string) => {
        fetch(`/api/cours/${course._id}/sections/${sectionId}`)
            .then(res => res.json())
            .then(data => {
                if (data?.section) {
                    const lesson = data.section.lessons?.find((l: any) => l._id === lessonId);
                    if (lesson) {
                        onSelectContent({
                            kind: 'lesson',
                            lesson,
                            sectionId,
                            sectionTitle: data.section.title,
                        });
                    }
                }
            })
            .catch(console.error);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Recherche */}
            <div className="px-4 py-3 border-b border-[#e3e2e0]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] w-4 h-4" />
                    <CourseSearch courseId={course._id} onSelectResult={handleSearchResult} />
                </div>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 min-h-0">
                <div className="px-2">
                    <Accordion type="single" collapsible className="space-y-1">
                        {course.sections.map((section) => (
                            <SectionAccordion
                                key={section._id}
                                courseId={course._id}
                                sectionInitial={section}
                                onSelectContent={onSelectContent}
                                readLessons={readLessons}
                            />
                        ))}
                    </Accordion>
                </div>
            </div>

            {/* Ressources liées - Ultra compact */}
            <RelatedContentPanel courseId={course._id} />

            {/* Footer info */}
            <div className="px-4 py-3 border-t border-[#e3e2e0] text-xs text-[#9ca3af] flex-shrink-0">
                {course.sections.length} section{course.sections.length > 1 ? 's' : ''}
            </div>
        </div>
    );
}
