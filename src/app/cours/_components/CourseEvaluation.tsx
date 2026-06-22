"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    FileCheck,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Loader2,
    Shuffle,
    AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Mascot from "@/components/ui/Mascot";

interface CourseEvaluationProps {
    courseId: string;
}

export default function CourseEvaluation({ courseId }: CourseEvaluationProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);

    useEffect(() => {
        if (!session?.accessToken) {
            setLoading(false);
            return;
        }

        fetch(`/api/evaluations/status?courseId=${courseId}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((r) => r.json())
            .then((data) => setStatus(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [session?.accessToken, courseId]);

    if (loading) {
        return (
            <Card className="border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-gray-400" />
                        Évaluation
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    if (!session || !status) return null;

    // Pas d'évaluations disponibles
    if (status.reason === 'no_evaluations') {
        return null;
    }

    // Cours non terminé
    if (status.reason === 'course_not_completed') {
        return (
            <Card className="border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-gray-400" />
                        Évaluation du Trimestre
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-4">
                        <AlertTriangle className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                            Terminez toutes les sections du cours pour débloquer l'évaluation.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Vacances
    if (status.reason === 'vacation_period') {
        return (
            <Card className="border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-gray-400" />
                        Évaluation
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-4">
                        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Période de vacances.</p>
                        {status.nextAvailable && (
                            <p className="text-xs text-gray-400 mt-1">
                                Prochaine évaluation : {status.nextAvailable.name}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Déjà tiré ce trimestre
    if (status.reason === 'already_drawn' && status.existingDraw) {
        const draw = status.existingDraw;

        // En cours (timer actif)
        if ((draw.status === 'drawn' || draw.status === 'in_progress') && draw.remainingMs > 0) {
            return <LiveTimerCard draw={draw} />;
        }

        // Corrigé
        if (draw.submissionStatus === 'graded' && draw.grade !== undefined) {
            const gradeColor = draw.grade >= 14 ? 'text-emerald-600' : draw.grade >= 10 ? 'text-amber-600' : 'text-red-500';

            return (
                <Card className="border border-gray-200 rounded-2xl shadow-sm">
                    <CardHeader className="bg-white border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            Résultat du Trimestre
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-center py-2">
                            <p className={`text-3xl font-bold ${gradeColor} mb-1`}>
                                {draw.grade}/20
                            </p>
                            {draw.feedback && (
                                <p className="text-sm text-gray-500 mb-3">{draw.feedback}</p>
                            )}
                            <button
                                onClick={() => router.push(`/evaluation/result/${draw.submissionId}`)}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                Voir le détail
                            </button>
                            {status.nextAvailable && (
                                <p className="text-xs text-gray-400 mt-3">
                                    Prochaine évaluation : {status.nextAvailable.name}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        }

        // Timeout (0/20)
        if (draw.status === 'timeout') {
            return (
                <Card className="border border-red-200 rounded-2xl shadow-sm bg-red-50/50">
                    <CardHeader className="bg-white border-b border-red-100">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            Temps Dépassé
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-center py-2">
                            <p className="text-sm text-gray-600 mb-1">
                                Vous n'avez pas soumis à temps.
                            </p>
                            <p className="text-2xl font-bold text-red-500 mb-3">0/20</p>
                            {status.nextAvailable && (
                                <p className="text-xs text-gray-400">
                                    Prochaine chance : {status.nextAvailable.name}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        }

        // En attente de correction
        return (
            <Card className="border border-blue-200 rounded-2xl shadow-sm bg-blue-50/50">
                <CardHeader className="bg-white border-b border-blue-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        En attente de correction
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-600">
                            Votre évaluation a été soumise. Un correcteur la notera bientôt.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Peut passer l'évaluation
    if (status.canDraw) {
        return (
            <Card className="border border-orange-200 rounded-2xl shadow-sm bg-orange-50/30">
                <CardHeader className="bg-white border-b border-orange-100">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-orange-500" />
                        Évaluation du Trimestre
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Foxy explique avant de se lancer */}
                    <Mascot
                        name="foxy"
                        emotion="joyeux"
                        size="sm"
                        className="mb-4"
                        message="Tu as bossé ce cours 👏 L'évaluation te permet de valider tes acquis du trimestre et de gagner des points. Voici comment ça marche 👇"
                    />

                    {/* À quoi ça sert */}
                    <div className="mb-4 rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                        <p className="text-sm font-semibold text-gray-800 mb-1">À quoi ça sert&nbsp;?</p>
                        <p className="text-sm text-gray-600">
                            Une évaluation notée par un correcteur de Workyt, pour mesurer ce que tu as
                            appris ce trimestre, suivre tes compétences et gagner des points.
                        </p>
                    </div>

                    {/* Comment ça marche : les étapes */}
                    <p className="text-sm font-semibold text-gray-800 mb-2">Comment ça se passe&nbsp;?</p>
                    <ol className="space-y-2 mb-4">
                        {[
                            { t: "Tire au sort un sujet", d: "Le chrono démarre immédiatement et ne se met pas en pause." },
                            { t: "Compose dans le temps imparti", d: "Sur le sujet PDF (papier) ou directement dans le formulaire." },
                            { t: "Rends ta copie", d: "Photographie/scanne tes feuilles et dépose-les avant la fin." },
                            { t: "Reçois ta note", d: "Un correcteur te note sur 20, avec un retour et tes points." },
                        ].map((s, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">{i + 1}</span>
                                <span className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-800">{s.t}.</span> {s.d}
                                </span>
                            </li>
                        ))}
                    </ol>

                    {/* Infos trimestre */}
                    <div className="text-center border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-600 mb-1">
                            Trimestre : <span className="font-medium">{status.currentTrimester?.name} {status.currentTrimester?.schoolYear}</span>
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Tu as droit à <span className="font-semibold">une seule</span> évaluation, tirée au sort parmi {status.evaluationCount} sujet(s).
                        </p>
                        <button
                            onClick={() => router.push(`/evaluation/draw?courseId=${courseId}`)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            <Shuffle className="w-4 h-4" />
                            Tirer mon évaluation
                        </button>
                        <p className="text-xs text-amber-600 mt-3">
                            ⚠️ Une seule chance ce trimestre — ne tire que si tu es prêt·e !
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}

/** Sous-composant avec timer live pour l'évaluation en cours */
function LiveTimerCard({ draw }: { draw: any }) {
    const router = useRouter();
    const [remaining, setRemaining] = useState(draw.remainingMs);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining((prev: number) => {
                const next = prev - 1000;
                if (next <= 0) { clearInterval(interval); return 0; }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return (
        <Card className="border border-amber-200 rounded-2xl shadow-sm bg-amber-50/50">
            <CardHeader className="bg-white border-b border-amber-100">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Évaluation en Cours
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="text-center py-2">
                    <p className="text-sm text-gray-600 mb-2">
                        Vous avez tiré une évaluation ce trimestre.
                    </p>
                    <p className={`text-2xl font-bold mb-3 ${remaining < 60000 ? "text-red-600" : "text-amber-600"}`}>
                        {remaining <= 0
                            ? "Temps écoulé !"
                            : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
                    </p>
                    {remaining > 0 && (
                        <button
                            onClick={() => router.push(`/evaluation/${draw._id}`)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            Continuer
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                    <p className="text-xs text-amber-600 mt-2">
                        Si le temps est dépassé : 0/20 automatique
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
