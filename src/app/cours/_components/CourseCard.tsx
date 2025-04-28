"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ui/profile";
import { BookOpen, GraduationCap, Layers, Clock, ArrowRight } from "lucide-react";
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
    const router = useRouter();
    const sectionsToShow = course.sections.slice(0, 3);
    const hasMoreSections = course.sections.length > 3;

    // Fonction pour tronquer un texte trop long
    const truncateText = (text: string, maxLength: number) =>
        text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    // Injecter le CSS pour l'effet de grain seulement une fois
    React.useEffect(() => {
        if (typeof document !== "undefined" && !document.getElementById("grainy-css")) {
            const style = document.createElement("style");
            style.id = "grainy-css";
            style.innerHTML = `
                .grain::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                    opacity: 0.15;
                    mix-blend-mode: overlay;
                    pointer-events: none;
                    z-index: 1;
                    border-radius: inherit;
                }
                .card-shine {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.12) 30%,
                        rgba(255, 255, 255, 0) 60%
                    );
                    border-radius: inherit;
                    z-index: 2;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.5s;
                }
                .hover-card:hover .card-shine {
                    opacity: 1;
                }
                .image-overlay {
                    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 40%);
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 100%;
                    z-index: 2;
                    border-radius: inherit;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    return (
        <TooltipProvider>
            <Card className="shadow-xl rounded-xl transition-all duration-300 transform hover:scale-102 hover:shadow-2xl border border-gray-200 overflow-hidden relative grain hover-card bg-gradient-to-br from-white to-gray-50">
                <div className="card-shine"></div>

                {/* Image avec overlay gradient pour meilleur contraste */}
                {course.image ? (
                    <div
                        className="h-48 w-full overflow-hidden relative cursor-pointer group"
                        onClick={() => router.push(`/cours/${course._id}`)}
                    >
                        <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="image-overlay"></div>

                        {/* Badge niveau sur l'image */}
                        <Badge className="absolute top-3 right-3 bg-blue-600 text-white shadow-md z-10 px-3 py-1 font-medium">
                            <GraduationCap className="w-4 h-4 mr-1" /> {course.niveau}
                        </Badge>
                    </div>
                ) : (
                    <div className="h-24 w-full bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute -inset-[10px] opacity-50 mix-blend-multiply blur-xl">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute rounded-full"
                                        style={{
                                            width: `${Math.floor(Math.random() * 100) + 50}px`,
                                            height: `${Math.floor(Math.random() * 100) + 50}px`,
                                            background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)`,
                                            left: `${Math.floor(Math.random() * 100)}%`,
                                            top: `${Math.floor(Math.random() * 100)}%`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <Badge className="absolute top-3 right-3 bg-blue-600 text-white shadow-md z-10 px-3 py-1 font-medium">
                            <GraduationCap className="w-4 h-4 mr-1" /> {course.niveau}
                        </Badge>
                    </div>
                )}

                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        {/* Titre du cours */}
                        <CardTitle
                            className="text-xl font-bold cursor-pointer hover:text-blue-600 transition line-clamp-2"
                            onClick={() => router.push(`/cours/${course._id}`)}
                        >
                            {course.title}
                        </CardTitle>

                        {/* Badge avec Tooltip pour les sections */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="shrink-0 cursor-pointer bg-gray-100 rounded-full p-2 shadow-sm hover:bg-gray-200 transition">
                                    <Layers className="w-5 h-5 text-gray-700" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white shadow-lg p-3 rounded-lg text-sm text-gray-800 border border-gray-100 max-w-xs">
                                <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    {course.sections.length} Sections
                                </p>
                                <div className="space-y-1 mt-1">
                                    {sectionsToShow.map((section, index) => (
                                        <p key={index} className="flex items-center gap-2 truncate">
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            {truncateText(section.title, 30)}
                                        </p>
                                    ))}
                                    {hasMoreSections && (
                                        <p className="text-blue-500 text-xs font-medium mt-1 italic">
                                            + {course.sections.length - 3} autres sections
                                        </p>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="bg-white border-gray-200 text-gray-700 shadow-sm font-normal flex items-center gap-1 px-3 py-1">
                            <BookOpen className="w-3 h-3" /> {course.matiere}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="pt-1">
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{course.description}</p>

                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                        {/* Auteur */}
                        <div className="flex items-center gap-2">
                            <ProfileAvatar
                                username={course.authors[0]?.username}
                                image={course.authors[0]?.image}
                                size="small"
                            />
                            <span className="text-sm font-medium text-gray-700">{course.authors[0]?.username}</span>
                        </div>

                        {/* Bouton pour voir le cours */}
                        <Button
                            variant="ghost"
                            className="px-3 py-1 h-auto text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium text-sm flex items-center gap-1"
                            onClick={() => router.push(`/cours/${course._id}`)}
                        >
                            Voir <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}