"use client";

import dynamic from "next/dynamic";
import { Suspense, type FC } from "react";

const CoursePageClient = dynamic(
    () => import("../_components/CoursePageClient"),
    { ssr: false }
);

interface CourseClientWrapperProps {
    params: { coursId: string };
}

const CourseClientWrapper: FC<CourseClientWrapperProps> = ({ params }) => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <CoursePageClient params={params} />
        </Suspense>
    );
};

export default CourseClientWrapper;
