"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";
import { Pencil, Trash2, Plus, Loader2, Check } from "lucide-react";
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastClose,
} from "@/components/ui/UseToast";
import { useSession } from "next-auth/react";

interface DailyQuiz {
    _id: string;
    date: string;
    question: string;
    answers: string[];
    correctAnswer: number;
    explanation?: string;
    author?: { _id: string; username?: string; email?: string };
}

const EMPTY_FORM = {
    date: "",
    question: "",
    answers: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
};

/** Formate une date ISO en YYYY-MM-DD local, pour les inputs date. */
function toDateInput(iso: string): string {
    const d = new Date(iso);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

function isPublished(iso: string): boolean {
    const quizDay = new Date(iso);
    quizDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return quizDay <= today;
}

export default function DailyQuizPage() {
    const { data: session } = useSession();
    const [quizzes, setQuizzes] = useState<DailyQuiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<DailyQuiz | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [toast, setToast] = useState<{ title: string; error?: boolean } | null>(null);

    const showToast = (title: string, error = false) => setToast({ title, error });

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/daily-quiz");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur de chargement");
            setQuizzes(data.quizzes || []);
        } catch (err: any) {
            showToast(err.message, true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (quiz: DailyQuiz) => {
        setEditing(quiz);
        setForm({
            date: toDateInput(quiz.date),
            question: quiz.question,
            answers: [...quiz.answers],
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation || "",
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const url = editing ? `/api/daily-quiz/${editing._id}` : "/api/daily-quiz";
            const res = await fetch(url, {
                method: editing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: form.date,
                    question: form.question,
                    answers: form.answers,
                    correctAnswer: form.correctAnswer,
                    explanation: form.explanation || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur d'enregistrement");

            showToast(editing ? "Quiz modifié" : "Quiz programmé");
            setDialogOpen(false);
            fetchQuizzes();
        } catch (err: any) {
            showToast(err.message, true);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (quiz: DailyQuiz) => {
        if (!confirm(`Supprimer le quiz du ${toDateInput(quiz.date)} ?`)) return;
        try {
            const res = await fetch(`/api/daily-quiz/${quiz._id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur de suppression");
            showToast("Quiz supprimé");
            fetchQuizzes();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const updateAnswer = (index: number, value: string) => {
        const answers = [...form.answers];
        answers[index] = value;
        setForm({ ...form, answers });
    };

    const formValid =
        form.date &&
        form.question.trim() &&
        form.answers.every((a) => a.trim()) &&
        new Set(form.answers.map((a) => a.trim())).size === 4;

    return (
        <ToastProvider>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Quiz du jour</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Une question par jour, publiée sur Discord par le bot et jouée sur le site
                            pour débloquer la récompense quotidienne.
                        </p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Programmer un quiz
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Aucun quiz programmé. Pensez à en déposer à l&apos;avance : sans quiz publié,
                        la récompense du jour reste accessible sans condition.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Question</TableHead>
                                <TableHead>Bonne réponse</TableHead>
                                <TableHead>Auteur</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quizzes.map((quiz) => {
                                const published = isPublished(quiz.date);
                                return (
                                    <TableRow key={quiz._id}>
                                        <TableCell className="font-mono text-sm">
                                            {toDateInput(quiz.date)}
                                        </TableCell>
                                        <TableCell className="max-w-md truncate">
                                            {quiz.question}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {quiz.answers[quiz.correctAnswer]}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {quiz.author?.username || "—"}
                                        </TableCell>
                                        <TableCell>
                                            {published ? (
                                                <Badge variant="secondary">Publié</Badge>
                                            ) : (
                                                <Badge>Programmé</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={published}
                                                title={
                                                    published
                                                        ? "Un quiz déjà publié ne peut plus être modifié"
                                                        : "Modifier"
                                                }
                                                onClick={() => openEdit(quiz)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={published}
                                                title={
                                                    published
                                                        ? "Un quiz déjà publié ne peut plus être supprimé"
                                                        : "Supprimer"
                                                }
                                                onClick={() => handleDelete(quiz)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? "Modifier le quiz" : "Programmer un quiz"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="text-sm font-medium">Date de publication</label>
                                <input
                                    type="date"
                                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Question</label>
                                <textarea
                                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                                    rows={2}
                                    maxLength={500}
                                    placeholder="Quelle est la capitale de l'Australie ?"
                                    value={form.question}
                                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {form.question.length}/500
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Propositions — cliquez sur la coche pour désigner la bonne réponse
                                </label>
                                <div className="space-y-2 mt-1">
                                    {form.answers.map((answer, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant={form.correctAnswer === i ? "default" : "outline"}
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() => setForm({ ...form, correctAnswer: i })}
                                                title="Désigner comme bonne réponse"
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <input
                                                className="flex-1 px-3 py-2 border rounded-md bg-background"
                                                maxLength={80}
                                                placeholder={`Proposition ${i + 1}`}
                                                value={answer}
                                                onChange={(e) => updateAnswer(i, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    80 caractères maximum par proposition : c&apos;est la limite d&apos;un
                                    bouton Discord.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Explication (optionnelle)
                                </label>
                                <textarea
                                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Affichée sur le site une fois la bonne réponse trouvée."
                                    value={form.explanation}
                                    onChange={(e) =>
                                        setForm({ ...form, explanation: e.target.value })
                                    }
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Annuler
                                </Button>
                                <Button onClick={handleSubmit} disabled={!formValid || saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editing ? "Enregistrer" : "Programmer"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {toast && (
                    <Toast open onOpenChange={() => setToast(null)}>
                        <ToastTitle className={toast.error ? "text-red-600" : undefined}>
                            {toast.title}
                        </ToastTitle>
                        <ToastClose />
                    </Toast>
                )}
                <ToastViewport />
            </div>
        </ToastProvider>
    );
}
