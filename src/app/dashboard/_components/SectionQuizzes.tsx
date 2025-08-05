"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Trash2, Plus, Loader2, Trophy, Eye } from "lucide-react";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";
import QuizForm from "./QuizForm";

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: Array<{
        question: string;
        questionType: string;
        point: number;
    }>;
    createdAt: string;
}

interface SectionQuizzesProps {
    sectionId: string;
    sectionTitle: string;
    onQuizUpdated?: () => void;
}

export default function SectionQuizzes({ sectionId, sectionTitle, onQuizUpdated }: SectionQuizzesProps) {
    const { data: session } = useSession();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [isViewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);

    // Gestion du Toast
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default");

    const showToast = ({ title, variant }: { title: string; variant?: "default" | "destructive" }) => {
        setToastMessage(title);
        setToastVariant(variant || "default");
        setToastOpen(true);
        setTimeout(() => setToastOpen(false), 3000);
    };

    // Charger les quiz de la section
    useEffect(() => {
        async function fetchQuizzes() {
            if (!session?.accessToken) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/sections/${sectionId}/quizzes`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setQuizzes(data);
                } else {
                    console.error("Erreur lors du chargement des quiz");
                }
            } catch (error) {
                console.error("Erreur lors du chargement des quiz:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchQuizzes();
    }, [session?.accessToken, sectionId]);

    // Supprimer un quiz
    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) return;

        try {
            const res = await fetch(`/api/quizzes/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (res.ok) {
                setQuizzes(prev => prev.filter(quiz => quiz._id !== id));
                showToast({ title: "Quiz supprimé avec succès" });
                onQuizUpdated?.();
            } else {
                const error = await res.json();
                showToast({ title: error.error || "Erreur lors de la suppression", variant: "destructive" });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            showToast({ title: "Erreur lors de la suppression", variant: "destructive" });
        }
    };

    // Sauvegarder un quiz (création ou modification)
    const handleSaveQuiz = async (quizData: any) => {
        try {
            const method = selectedQuiz ? 'PUT' : 'POST';
            const url = selectedQuiz ? `/api/quizzes/${selectedQuiz._id}` : '/api/quizzes';
            
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(quizData),
            });

            if (res.ok) {
                const savedQuiz = await res.json();
                
                if (selectedQuiz) {
                    // Modification
                    setQuizzes(prev => prev.map(q => q._id === selectedQuiz._id ? savedQuiz : q));
                    showToast({ title: "Quiz modifié avec succès" });
                } else {
                    // Création
                    setQuizzes(prev => [savedQuiz, ...prev]);
                    showToast({ title: "Quiz créé avec succès" });
                }
                
                setDialogOpen(false);
                setSelectedQuiz(null);
                onQuizUpdated?.();
            } else {
                const error = await res.json();
                showToast({ title: error.error || "Erreur lors de la sauvegarde", variant: "destructive" });
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du quiz:', error);
            showToast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
        }
    };

    // Voir un quiz
    const handleViewQuiz = async (quizId: string) => {
        try {
            const res = await fetch(`/api/quizzes/${quizId}`, {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (res.ok) {
                const quiz = await res.json();
                setViewingQuiz(quiz);
                setViewDialogOpen(true);
            } else {
                showToast({ title: "Erreur lors du chargement du quiz", variant: "destructive" });
            }
        } catch (error) {
            console.error('Erreur lors du chargement du quiz:', error);
            showToast({ title: "Erreur lors du chargement", variant: "destructive" });
        }
    };

    return (
        <ToastProvider>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Quiz de la section &quot;{sectionTitle}&quot;</h3>
                    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedQuiz(null)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter un quiz
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedQuiz ? "Modifier le quiz" : "Ajouter un nouveau quiz"}
                                </DialogTitle>
                            </DialogHeader>
                            <QuizForm
                                sectionId={sectionId}
                                onSave={handleSaveQuiz}
                                onCancel={() => {
                                    setDialogOpen(false);
                                    setSelectedQuiz(null);
                                }}
                                initialData={selectedQuiz}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Chargement des quiz...
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Aucun quiz dans cette section</p>
                        <p className="text-sm">Cliquez sur &quot;Ajouter un quiz&quot; pour commencer</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quizzes.map((quiz) => (
                            <div key={quiz._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewQuiz(quiz._id)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedQuiz(quiz);
                                                setDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => handleDelete(quiz._id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {quiz.description}
                                </p>
                                
                                <div className="flex gap-2">
                                    <Badge variant="secondary">
                                        {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                                    </Badge>
                                    <Badge variant="outline">
                                        {quiz.questions.reduce((sum, q) => sum + q.point, 0)} points
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Dialog pour voir un quiz */}
                <Dialog open={isViewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Détails du quiz
                            </DialogTitle>
                        </DialogHeader>
                        {viewingQuiz && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{viewingQuiz.title}</h3>
                                    <p className="text-gray-600">{viewingQuiz.description}</p>
                                </div>
                                
                                <div className="space-y-3">
                                    {viewingQuiz.questions.map((question, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium">Question {index + 1}</h4>
                                                <Badge variant="outline">{question.point} points</Badge>
                                            </div>
                                            <p className="text-gray-700 mb-2">{question.question}</p>
                                            <Badge variant="secondary">{question.questionType}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
            
            <ToastViewport>
                <Toast open={toastOpen} onOpenChange={setToastOpen}>
                    <ToastTitle className={toastVariant === "destructive" ? "text-red-600" : ""}>
                        {toastMessage}
                    </ToastTitle>
                    <ToastClose />
                </Toast>
            </ToastViewport>
        </ToastProvider>
    );
} 