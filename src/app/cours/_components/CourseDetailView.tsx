"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, Calendar, ArrowLeft, Play, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import ReportButton from "@/components/ReportButton";
import BookmarkButton from "@/components/BookmarkButton";

interface Section {
    _id: string;
    title: string;
    order: number;
    courseId: string;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    niveau: string;
    matiere: string;
    status: string;
    image?: string;
    sections: Section[];
    authors: Array<{ _id: string; username: string }>;
    createdAt: string;
    updatedAt: string;
}

export default function CourseDetailView() {
    const params = useParams();
    const courseId = params.coursId as string;
    
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!courseId) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/cours/${courseId}`, { cache: "no-store" });
                
                if (!response.ok) {
                    throw new Error(`Erreur ${response.status}: Impossible de récupérer le cours`);
                }

                const data = await response.json();
                
                if (!data.cours) {
                    throw new Error("Cours non trouvé");
                }

                setCourse(data.cours);
            } catch (err) {
                console.error("Erreur lors du chargement du cours :", err);
                setError(err instanceof Error ? err.message : "Une erreur inconnue s'est produite");
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <Skeleton className="h-8 w-32 mb-4" />
                        <Skeleton className="h-12 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, index) => (
                            <Card key={index} className="overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Link href="/cours">
                            <Button className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Retour aux cours
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Cours non trouvé</h2>
                    <p className="text-gray-600 mb-6">Le cours que vous recherchez n&apos;existe pas ou a été supprimé.</p>
                    <Link href="/cours">
                        <Button className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Retour aux cours
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/cours">
                        <Button variant="ghost" className="mb-4 flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Retour aux cours
                        </Button>
                    </Link>
                    
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Image de couverture */}
                        {course.image && (
                            <div className="relative h-64 w-full overflow-hidden">
                                <Image
                                    src={course.image}
                                    alt={course.title}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                            </div>
                        )}
                        
                        <div className="p-6">
                            {/* Titre et badges */}
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                                    <p className="text-gray-600 text-lg">{course.description}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {course.matiere}
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {course.niveau}
                                    </Badge>
                                    <Badge variant={course.status === "publie" ? "default" : "secondary"}>
                                        {course.status}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        <BookmarkButton courseId={course._id} size="sm" />
                                        <ReportButton 
                                            contentId={course._id} 
                                            contentType="course"
                                            variant="button"
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Informations du cours */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <div className="flex items-center gap-2">
                                        {course.authors.map((author, index) => (
                                            <div key={author._id} className="flex items-center gap-1">
                                                <ProfileAvatar
                                                    username={author.username}
                                                    size="small"
                                                    userId={author._id}
                                                    showPoints={false}
                                                />
                                                <UsernameDisplay 
                                                    username={author.username}
                                                    userId={author._id}
                                                />
                                                {index < course.authors.length - 1 && <span>,</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Créé le {new Date(course.createdAt).toLocaleDateString("fr-FR")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{course.sections.length} section{course.sections.length > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections du cours */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sections du cours</h2>
                    
                    {course.sections.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Aucune section disponible pour ce cours.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {course.sections.map((section) => (
                                <Card key={section._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{section.title}</CardTitle>
                                            <Badge variant="outline" className="text-xs">
                                                Section {section.order}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                Cliquez pour voir les leçons
                                            </span>
                                            <Play className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 