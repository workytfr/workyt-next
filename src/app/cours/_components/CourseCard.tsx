"use client";

import React from "react";
import { useRouter } from "next/navigation"; // ✅ Importer le router pour la navigation
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ui/profile";
import { BookOpen, GraduationCap, Layers } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

interface Course {
    _id: string;
    title: string;
    description: string;
    matiere: string;
    niveau: string;
    image?: string;
    sections: { _id: string; title: string }[];
    authors: { _id: string; username: string; image?: string }[];
}

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    const router = useRouter(); // ✅ Initialisation du router

    const sectionsToShow = course.sections.slice(0, 3);
    const hasMoreSections = course.sections.length > 3;

    // Fonction pour tronquer un texte trop long
    const truncateText = (text: string, maxLength: number) =>
        text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    return (
        <TooltipProvider>
            <Card className="shadow-md transition-transform transform hover:scale-105 relative">
                {/* Image - Clique sur l'image redirige vers la page du cours */}
                {course.image && (
                    <div
                        className="h-40 w-full overflow-hidden rounded-t-lg cursor-pointer"
                        onClick={() => router.push(`/cours/${course._id}`)}
                    >
                        <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <CardHeader>
                    <div className="flex justify-between items-center">
                        {/* ✅ Clique sur le titre redirige vers la page du cours */}
                        <CardTitle
                            className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition"
                            onClick={() => router.push(`/cours/${course._id}`)}
                        >
                            {course.title}
                        </CardTitle>

                        {/* Badge avec Tooltip pour les sections */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="relative cursor-pointer">
                                    <Badge className="bg-gray-200 text-gray-800 flex items-center gap-1">
                                        <Layers className="w-4 h-4" />
                                        {course.sections.length}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white shadow-md p-2 rounded-md text-sm text-gray-800">
                                <p className="font-semibold text-gray-700 mb-1">Sections :</p>
                                {sectionsToShow.map((section, index) => (
                                    <p key={index} className="truncate">
                                        - {truncateText(section.title, 20)}
                                    </p>
                                ))}
                                {hasMoreSections && <p className="text-gray-500">+ autres...</p>}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                            <BookOpen className="w-4 h-4 mr-1" /> {course.matiere}
                        </Badge>
                        <Badge className="bg-blue-500 text-white">
                            <GraduationCap className="w-4 h-4 mr-1" /> {course.niveau}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-3">{course.description}</p>

                    {/* Auteur */}
                    <div className="flex items-center gap-3 mt-4">
                        <ProfileAvatar
                            username={course.authors[0]?.username}
                            image={course.authors[0]?.image}
                            size="small"
                        />
                        <span className="text-sm text-gray-700">{course.authors[0]?.username}</span>
                    </div>

                    {/* ✅ Clique sur le bouton "Voir le cours" redirige vers la page du cours */}
                    <Button
                        className="w-full mt-4"
                        variant="default"
                        onClick={() => router.push(`/cours/${course._id}`)}
                    >
                        Voir le cours
                    </Button>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
