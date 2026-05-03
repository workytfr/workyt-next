"use client";

import { Suspense, type FC } from "react";
import CoursePageClient from "./CoursePageClient";
import type { Course } from "./types";

interface CourseClientWrapperProps {
    params: { coursId: string };
    initialCours?: Course | null;
}

const CourseClientWrapper: FC<CourseClientWrapperProps> = ({ params, initialCours }) => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <CoursePageClient params={params} initialCours={initialCours} />
        </Suspense>
    );
};

export default CourseClientWrapper;
