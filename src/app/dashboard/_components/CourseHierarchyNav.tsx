"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, ArrowLeft, BookOpen, Loader2 } from "lucide-react";

interface CourseData {
    _id: string;
    title: string;
    niveau?: string;
    matiere?: string;
    sections: { _id: string; title: string }[];
}

interface CourseHierarchyNavProps {
    selectedCourseId: string;
    selectedSectionId: string;
    onCourseChange: (courseId: string) => void;
    onSectionChange: (sectionId: string) => void;
    showSectionFilter?: boolean;
}

export default function CourseHierarchyNav({
    selectedCourseId,
    selectedSectionId,
    onCourseChange,
    onSectionChange,
    showSectionFilter = true,
}: CourseHierarchyNavProps) {
    const [courses, setCourses] = useState<CourseData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch courses once on mount
    useEffect(() => {
        async function fetchCourses() {
            try {
                const res = await fetch("/api/courses?limit=100");
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des cours :", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCourses();
    }, []);

    // Local search filter
    const filteredCourses = useMemo(() => {
        if (!searchQuery.trim()) return courses;
        const q = searchQuery.toLowerCase();
        return courses.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.matiere?.toLowerCase().includes(q) ||
                c.niveau?.toLowerCase().includes(q)
        );
    }, [courses, searchQuery]);

    // Selected course object
    const selectedCourse = useMemo(
        () => courses.find((c) => c._id === selectedCourseId) || null,
        [courses, selectedCourseId]
    );

    const handleBack = () => {
        onCourseChange("");
        onSectionChange("");
        setSearchQuery("");
    };

    const handleCourseClick = (courseId: string) => {
        onCourseChange(courseId);
        onSectionChange("");
    };

    const handleSectionClick = (sectionId: string) => {
        onSectionChange(sectionId === selectedSectionId ? "" : sectionId);
    };

    if (loading) {
        return (
            <div className="dash-hierarchy-nav">
                <div className="dash-hierarchy-loading">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Chargement des cours...</span>
                </div>
            </div>
        );
    }

    // State 2: Course selected - show breadcrumb + section chips
    if (selectedCourseId && selectedCourse) {
        return (
            <div className="dash-hierarchy-nav">
                <div className="dash-hierarchy-header">
                    <button className="dash-hierarchy-back" onClick={handleBack}>
                        <ArrowLeft size={16} />
                        <span>Retour aux cours</span>
                    </button>
                    <div className="dash-hierarchy-current">
                        <BookOpen size={16} />
                        <span className="dash-hierarchy-current-title">
                            {selectedCourse.title}
                        </span>
                        {selectedCourse.niveau && (
                            <span className="dash-badge dash-badge-info">
                                {selectedCourse.niveau}
                            </span>
                        )}
                        {selectedCourse.matiere && (
                            <span className="dash-badge dash-badge-primary">
                                {selectedCourse.matiere}
                            </span>
                        )}
                    </div>
                </div>
                {showSectionFilter && selectedCourse.sections.length > 0 && (
                    <div className="dash-hierarchy-sections">
                        <button
                            className={`dash-hierarchy-chip ${selectedSectionId === "" ? "active" : ""}`}
                            onClick={() => onSectionChange("")}
                        >
                            Toutes
                        </button>
                        {selectedCourse.sections.map((section) => (
                            <button
                                key={section._id}
                                className={`dash-hierarchy-chip ${selectedSectionId === section._id ? "active" : ""}`}
                                onClick={() => handleSectionClick(section._id)}
                            >
                                {section.title}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // State 1: No course selected - show search + course grid
    return (
        <div className="dash-hierarchy-nav">
            <div className="dash-hierarchy-search">
                <Search size={16} className="dash-hierarchy-search-icon" />
                <input
                    type="text"
                    placeholder="Rechercher un cours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dash-hierarchy-search-input"
                />
            </div>
            <div className="dash-hierarchy-grid">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <button
                            key={course._id}
                            className="dash-hierarchy-course-card"
                            onClick={() => handleCourseClick(course._id)}
                        >
                            <div className="dash-hierarchy-course-title">
                                {course.title}
                            </div>
                            <div className="dash-hierarchy-course-meta">
                                {course.matiere && (
                                    <span className="dash-hierarchy-course-tag">
                                        {course.matiere}
                                    </span>
                                )}
                                {course.niveau && (
                                    <span className="dash-hierarchy-course-tag">
                                        {course.niveau}
                                    </span>
                                )}
                            </div>
                            <div className="dash-hierarchy-course-count">
                                {course.sections.length} section{course.sections.length !== 1 ? "s" : ""}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="dash-hierarchy-empty">
                        Aucun cours trouvé
                    </div>
                )}
            </div>
        </div>
    );
}
