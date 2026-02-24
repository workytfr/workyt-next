"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import "./styles/notion-theme.css";

interface CourseBreadcrumbProps {
    courseTitle: string;
    courseId: string;
    sectionTitle?: string;
    contentTitle?: string;
    contentKind?: 'lesson' | 'exercises' | 'quizzes';
    onNavigateToOverview: () => void;
}

export default function CourseBreadcrumb({
    courseTitle,
    courseId,
    sectionTitle,
    contentTitle,
    contentKind,
    onNavigateToOverview,
}: CourseBreadcrumbProps) {
    const kindLabel = contentKind === 'exercises' ? 'Exercices' : contentKind === 'quizzes' ? 'Quiz' : null;

    return (
        <nav className="notion-breadcrumb flex-wrap" aria-label="Breadcrumb">
            <Link
                href="/cours"
                className="flex items-center gap-1 hover:text-[#37352f] transition-colors"
            >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cours</span>
            </Link>

            <ChevronRight className="w-3.5 h-3.5 notion-breadcrumb-separator flex-shrink-0" />

            <button
                onClick={onNavigateToOverview}
                className="hover:text-[#37352f] transition-colors truncate max-w-[200px] sm:max-w-[300px]"
                title={courseTitle}
            >
                {courseTitle}
            </button>

            {sectionTitle && (
                <>
                    <ChevronRight className="w-3.5 h-3.5 notion-breadcrumb-separator flex-shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px]" title={sectionTitle}>
                        {sectionTitle}
                    </span>
                </>
            )}

            {(contentTitle || kindLabel) && (
                <>
                    <ChevronRight className="w-3.5 h-3.5 notion-breadcrumb-separator flex-shrink-0" />
                    <span className="text-[#f97316] font-medium truncate max-w-[200px]" title={contentTitle || kindLabel || ""}>
                        {contentTitle || kindLabel}
                    </span>
                </>
            )}
        </nav>
    );
}
