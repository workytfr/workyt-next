"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    ArrowLeft,
    ExternalLink,
    Image as ImageIcon,
    Target,
} from "lucide-react";

export default function ResultPage() {
    const { data: session } = useSession();
    const { submissionId } = useParams<{ submissionId: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.accessToken || !submissionId) return;

        fetch(`/api/submissions/${submissionId}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.error) setError(d.error);
                else setData(d);
            })
            .catch(() => setError("Erreur de chargement."))
            .finally(() => setLoading(false));
    }, [session?.accessToken, submissionId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-20">
                <p className="text-red-600">{error || "Données non trouvées."}</p>
            </div>
        );
    }

    const { submission, grade, draw } = data;
    const evaluation = submission.evaluationId;
    const course = submission.courseId;
    const isGraded = submission.status === "graded" && grade;
    const isTimeout = grade?.isAutoGraded;

    const gradeValue = grade?.grade ?? submission.grade;
    const gradeColor = gradeValue >= 14 ? "text-emerald-600" : gradeValue >= 10 ? "text-amber-600" : "text-red-500";

    return (
        <div className="max-w-2xl mx-auto">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'accueil
            </Link>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isTimeout ? "bg-red-100" : isGraded ? "bg-emerald-100" : "bg-blue-100"
                    }`}>
                        {isTimeout ? (
                            <XCircle className="w-6 h-6 text-red-500" />
                        ) : isGraded ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                            <Clock className="w-6 h-6 text-blue-500" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-900">
                            {evaluation?.title || "Évaluation"}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {course?.title || "Cours"} &middot;{" "}
                            {draw?.trimester} {draw?.schoolYear}
                        </p>
                    </div>
                    {gradeValue !== undefined && gradeValue !== null && (
                        <div className="text-right">
                            <p className={`text-3xl font-bold ${gradeColor}`}>{gradeValue}/20</p>
                            {isTimeout && (
                                <p className="text-xs text-red-400">Automatique (timeout)</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* En attente */}
            {!isGraded && !isTimeout && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <p className="text-sm text-blue-700 font-medium">
                            En attente de correction
                        </p>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                        Un correcteur évaluera bientôt votre travail.
                    </p>
                </div>
            )}

            {/* Feedback */}
            {grade?.feedback && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Remarques du correcteur</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{grade.feedback}</p>
                </div>
            )}

            {/* Photos de correction */}
            {grade?.photoLinks?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Photos de correction
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {grade.photoLinks.map((link: string, i: number) => (
                            <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors"
                            >
                                {link.match(/\.pdf$/i) ? (
                                    <div className="flex items-center justify-center h-24 bg-gray-50 gap-2">
                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-500">PDF {i + 1}</span>
                                    </div>
                                ) : (
                                    <img src={link} alt={`Correction ${i + 1}`} className="w-full h-32 object-cover" />
                                )}
                                <div className="text-xs text-center py-1 text-gray-500 bg-gray-50">
                                    Photo {i + 1}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Compétences */}
            {(grade?.validatedCompetencies?.length > 0 || grade?.invalidatedCompetencies?.length > 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Compétences évaluées
                    </h3>
                    <div className="space-y-1.5">
                        {grade.validatedCompetencies.map((c: string) => (
                            <div key={c} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm text-gray-700 font-mono">{c}</span>
                                <span className="text-xs text-emerald-600 ml-auto font-medium">Acquise</span>
                            </div>
                        ))}
                        {grade.invalidatedCompetencies.map((c: string) => (
                            <div key={c} className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-gray-700 font-mono">{c}</span>
                                <span className="text-xs text-red-500 ml-auto font-medium">Non acquise</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Infos soumission */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>
                        <span className="font-medium text-gray-600">Type :</span>{" "}
                        {submission.type === "form" ? "Formulaire" : "PDF"}
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">Temps passé :</span>{" "}
                        {Math.round(submission.timeSpent / 60)} min
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">Soumis le :</span>{" "}
                        {new Date(submission.submittedAt).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                    </div>
                    {grade?.evaluatorId && (
                        <div>
                            <span className="font-medium text-gray-600">Corrigé par :</span>{" "}
                            {(grade.evaluatorId as any)?.username || "Correcteur"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
