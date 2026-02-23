import React from "react";
import { getSubjectIconComponent } from "@/data/educationData";

interface SubjectIconProps {
    subject: string;
    size?: number;
    className?: string;
}

export default function SubjectIcon({ subject, size = 20, className = "" }: SubjectIconProps) {
    const IconComponent = getSubjectIconComponent(subject);
    return <IconComponent size={size} className={className} />;
}
