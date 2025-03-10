"use client";

import { Accordion } from "@/components/ui/Accordion";
import { Course, Section, Lesson } from "./types";
import { SectionAccordion } from "./SectionAccordion";

interface SidebarProps {
    course: Course;
    onSelectContent: (content: Section | Lesson) => void;
}

export function Sidebar({ course, onSelectContent }: SidebarProps) {
    return (
        <div className="w-80 bg-gray-100 p-4 shadow-md border-r h-screen sticky top-0 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sommaire du cours</h2>

            <Accordion type="single" collapsible className="space-y-2">
                {course.sections.map((section) => (
                    <SectionAccordion
                        key={section._id}
                        courseId={course._id}
                        sectionInitial={section}
                        onSelectContent={onSelectContent}
                    />
                ))}
            </Accordion>
        </div>
    );
}
