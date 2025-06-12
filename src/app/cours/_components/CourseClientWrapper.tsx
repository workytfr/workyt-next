"use client";

import dynamic from "next/dynamic";
import type { FC } from "react";

const CoursePageClient = dynamic(
    () => import("../_components/CoursePageClient"),
    { ssr: false }
);

interface CourseClientWrapperProps {
    params: { coursId: string };
}

const CourseClientWrapper: FC<CourseClientWrapperProps> = ({ params }) => {
    return <CoursePageClient params={params} />;
};

export default CourseClientWrapper;