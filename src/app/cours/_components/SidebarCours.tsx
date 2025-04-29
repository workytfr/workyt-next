"use client";

import React from "react";
import { Accordion } from "@/components/ui/Accordion";
import { Course, Section, Lesson } from "./types";
import { SectionAccordion } from "./SectionAccordion";
import { Sparkles } from "lucide-react";

interface SidebarProps {
    course: Course;
    onSelectContent: (content: Section | Lesson) => void;
}

export function Sidebar({ course, onSelectContent }: SidebarProps) {
    return (
        <div className="w-full md:w-80 h-full flex flex-col">
            {/* Course information at top */}
            <div className="flex-shrink-0 mb-4 px-4">
                <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-shrink-0 bg-gradient-to-r from-orange-400 to-amber-500 p-1 rounded-full">
                        <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                        {course.sections.length} sections • {course.niveau}
                    </span>
                </div>
            </div>

            {/* Sections list - main scrollable area */}
            <div className="flex-grow overflow-y-auto pr-2">
                <Accordion
                    type="single"
                    collapsible
                    className="px-2 space-y-3"
                >
                    {course.sections.map((section) => (
                        <SectionAccordion
                            key={section._id}
                            courseId={course._id}
                            sectionInitial={section}
                            onSelectContent={onSelectContent}
                        />
                    ))}
                </Accordion>

                {/* Add padding at the bottom to ensure all content is accessible when scrolling */}
                <div className="h-16"></div>
            </div>

            {/* Decorative elements */}
            <div className="absolute bottom-10 right-4 w-24 h-24 bg-orange-200/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute top-20 left-0 w-16 h-16 bg-amber-300/10 rounded-full blur-xl pointer-events-none"></div>
        </div>
    );
}