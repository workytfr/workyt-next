"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Layers, ChevronRight } from "lucide-react";
import BookmarkButton from "@/components/BookmarkButton";
import ProfileAvatar from "@/components/ui/profile";
import CourseDescription from "./CourseDescription";
import { CourseListing } from "./types";
import "./styles/notion-theme.css";

interface CourseCardProps {
    course: CourseListing;
}

export default function CourseCard({ course }: CourseCardProps) {
    const router = useRouter();
    const sectionsToShow = course.sections.slice(0, 2);
    const hasMoreSections = course.sections.length > 2;

    const firstAuthor = course.authors[0];

    return (
        <article 
            className="notion-card notion-card-interactive group rounded-3xl flex flex-col h-full"
            onClick={() => router.push(`/cours/${course._id}`)}
        >
            {/* Image */}
            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#f7f6f3] to-[#e3e2e0] rounded-t-3xl flex-shrink-0">
                {course.image ? (
                    <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-14 h-14 text-[#bfbfbf]" />
                    </div>
                )}
                
                {/* Badge niveau */}
                <div className="absolute top-4 right-4">
                    <span className="notion-badge bg-white/90 backdrop-blur-sm rounded-full">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {course.niveau}
                    </span>
                </div>
            </div>

            {/* Contenu - flex-grow pour remplir l'espace */}
            <div className="p-5 flex flex-col flex-grow">
                {/* Header avec titre et bookmark */}
                <div className="flex items-start justify-between gap-3 mb-2 flex-shrink-0">
                    <h3 className="text-base font-semibold text-[#37352f] line-clamp-2 flex-1 group-hover:text-[#f97316] transition-colors leading-snug">
                        {course.title}
                    </h3>
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        <BookmarkButton courseId={course._id} size="sm" />
                    </div>
                </div>

                {/* Description avec Markdown/LaTeX */}
                <div className="mb-3 flex-shrink-0 min-h-[2.5rem]">
                    <CourseDescription content={course.description} maxLength={120} />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
                    <span className="notion-badge notion-badge-accent rounded-full text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {course.matiere}
                    </span>
                    
                    {course.sections.length > 0 && (
                        <span className="notion-badge rounded-full text-xs">
                            <Layers className="w-3 h-3 mr-1" />
                            {course.sections.length}
                        </span>
                    )}
                </div>

                {/* Aperçu des sections - prend l'espace disponible */}
                <div className="flex-grow min-h-[60px]">
                    {sectionsToShow.length > 0 && (
                        <div className="border-t border-[#e3e2e0] pt-3">
                            <p className="text-xs text-[#9ca3af] mb-1.5 uppercase tracking-wide font-medium">
                                Contenu
                            </p>
                            <ul className="space-y-1">
                                {sectionsToShow.map((section) => (
                                    <li 
                                        key={section._id}
                                        className="text-xs text-[#6b6b6b] truncate flex items-center gap-2"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-[#bfbfbf] flex-shrink-0" />
                                        <span className="truncate">{section.title}</span>
                                    </li>
                                ))}
                                {hasMoreSections && (
                                    <li className="text-xs text-[#f97316] font-medium">
                                        + {course.sections.length - 2} autres
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer avec auteur - toujours en bas */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#e3e2e0] flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        {firstAuthor ? (
                            <>
                                <ProfileAvatar
                                    username={firstAuthor.username}
                                    image={firstAuthor.image}
                                    size="small"
                                    userId={firstAuthor._id}
                                    showPoints={false}
                                />
                                <span className="text-xs text-[#6b6b6b] font-medium truncate max-w-[100px]">
                                    {firstAuthor.username}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-[#f1f1ef] flex items-center justify-center text-xs font-medium text-[#6b6b6b]">
                                    W
                                </div>
                                <span className="text-xs text-[#6b6b6b]">Workyt</span>
                            </>
                        )}
                    </div>
                    
                    <div className="w-7 h-7 rounded-full bg-[#f7f6f3] flex items-center justify-center group-hover:bg-[#fff7ed] transition-colors flex-shrink-0">
                        <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:text-[#f97316] transition-colors" />
                    </div>
                </div>
            </div>
        </article>
    );
}
