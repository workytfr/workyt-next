"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Shuffle,
    Loader2,
    AlertTriangle,
    ArrowLeft,
    Clock,
    FileCheck,
} from "lucide-react";
import Link from "next/link";

export default function DrawPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        }>
            <DrawPageContent />
        </Suspense>
    );
}

function DrawPageContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get("courseId");

    const [drawing, setDrawing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [drawResult, setDrawResult] = useState<any>(null);
    const [countdown, setCountdown] = useState<number | null>(null);

    const handleDraw = async () => {
        if (!session?.accessToken || !courseId) return;

        setDrawing(true);
        setError(null);

        try {
            const res = await fetch("/api/evaluations/draw", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ courseId }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erreur lors du tirage.");
                setDrawing(false);
                return;
            }

            setDrawResult(data);

            // Countdown 3, 2, 1 avant redirection
            let count = 3;
            setCountdown(count);
            const interval = setInterval(() => {
                count--;
                if (count <= 0) {
                    clearInterval(interval);
                    router.push(`/evaluation/${data.draw._id}`);
                } else {
                    setCountdown(count);
                }
            }, 1000);
        } catch {
            setError("Erreur réseau. Réessayez.");
            setDrawing(false);
        }
    };

    if (!courseId) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Paramètre courseId manquant.</p>
                <Link href="/" className="text-orange-600 hover:text-orange-700 text-sm mt-2 inline-block">
                    Retour à l'accueil
                </Link>
            </div>
        );
    }

    // Après le tirage : countdown
    if (drawResult && countdown !== null) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileCheck className="w-10 h-10 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {drawResult.evaluation.title}
                </h1>
                <p className="text-gray-500 mb-2">
                    Type : {drawResult.evaluation.type === "form" ? "Formulaire" : "PDF"}
                    {" "}&middot;{" "}
                    Durée : {drawResult.evaluation.duration} min
                </p>
                <div className="mt-8">
                    <p className="text-sm text-gray-500 mb-2">L'évaluation commence dans...</p>
                    <p className="text-6xl font-bold text-orange-500">{countdown}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto">
            <Link
                href={`/cours/${courseId}`}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour au cours
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Shuffle className="w-8 h-8 text-orange-600" />
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Tirage au sort
                </h1>

                <p className="text-sm text-gray-500 mb-6">
                    Une évaluation sera tirée aléatoirement parmi la banque de sujets.
                    Vous n'aurez <span className="font-semibold">qu'une seule chance</span> ce trimestre.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-700 space-y-1">
                            <p><strong>Règles :</strong></p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Un chronomètre démarre dès le tirage</li>
                                <li>Si vous ne soumettez pas à temps → 0/20 automatique</li>
                                <li>Même avec 0/20, vous devez attendre le trimestre suivant</li>
                                <li>Un correcteur notera votre travail</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleDraw}
                    disabled={drawing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                    {drawing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Tirage en cours...
                        </>
                    ) : (
                        <>
                            <Shuffle className="w-4 h-4" />
                            Tirer mon évaluation
                        </>
                    )}
                </button>

                <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Le chronomètre démarre immédiatement après le tirage
                </p>
            </div>
        </div>
    );
}
