"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { evalFileUrl } from "@/lib/evalFile";
import EvaluationIntro from "@/app/evaluation/_components/EvaluationIntro";
import Mascot from "@/components/ui/Mascot";
import {
    Clock,
    Send,
    Loader2,
    AlertTriangle,
    FileText,
    CheckCircle2,
    ExternalLink,
    Camera,
    X,
    Upload,
    ImageIcon,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function EvaluationPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { drawId } = useParams<{ drawId: string }>();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draw, setDraw] = useState<any>(null);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isExpired, setIsExpired] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    // Ne pas réafficher l'intro après un rafraîchissement de page (le chrono, lui, continue).
    useEffect(() => {
        if (!drawId) return;
        if (typeof window !== "undefined" && sessionStorage.getItem(`eval-intro-seen-${drawId}`)) {
            setShowIntro(false);
        }
    }, [drawId]);

    const dismissIntro = useCallback(() => {
        if (typeof window !== "undefined" && drawId) {
            sessionStorage.setItem(`eval-intro-seen-${drawId}`, "1");
        }
        setShowIntro(false);
    }, [drawId]);

    // Form answers
    const [answers, setAnswers] = useState<Record<number, string>>({});

    // Photos de copie (URLs R2 apres upload)
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const deadlineRef = useRef<number>(0);

    // Fetch draw data
    useEffect(() => {
        if (!session?.accessToken || !drawId) return;

        fetch(`/api/evaluations/draws/${drawId}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setDraw(data.draw);
                    setEvaluation(data.evaluation);
                    deadlineRef.current = new Date(data.draw.mustSubmitBefore).getTime();

                    if (data.draw.status === 'submitted' || data.draw.status === 'timeout') {
                        setSubmitted(true);
                    }
                    if (data.draw.isExpired) {
                        setIsExpired(true);
                    }
                }
            })
            .catch(() => setError("Erreur de chargement."))
            .finally(() => setLoading(false));
    }, [session?.accessToken, drawId]);

    // Timer
    useEffect(() => {
        if (!deadlineRef.current || submitted || isExpired) return;

        const interval = setInterval(() => {
            const remaining = deadlineRef.current - Date.now();
            if (remaining <= 0) {
                setTimeLeft(0);
                setIsExpired(true);
                clearInterval(interval);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [submitted, isExpired, draw]);

    // Beforeunload warning
    useEffect(() => {
        if (submitted || isExpired) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [submitted, isExpired]);

    // Upload de fichiers vers R2
    const handleFileUpload = useCallback(async (files: FileList | File[]) => {
        if (!session?.accessToken || uploading) return;

        const fileArray = Array.from(files);
        const remaining = 5 - uploadedFiles.length;
        if (remaining <= 0) {
            setError("Maximum 5 fichiers.");
            return;
        }
        const toUpload = fileArray.slice(0, remaining);

        // Validation cote client
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
        for (const f of toUpload) {
            if (!allowed.includes(f.type)) {
                setError(`Type non autorisé : ${f.name}. Acceptés : JPEG, PNG, WebP, HEIC, PDF.`);
                return;
            }
            if (f.size > 10 * 1024 * 1024) {
                setError(`${f.name} est trop lourd (max 10 Mo).`);
                return;
            }
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            toUpload.forEach((f) => formData.append('files', f));

            const res = await fetch('/api/evaluations/upload?context=submission', {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.accessToken}` },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Erreur upload.");
                return;
            }

            setUploadedFiles((prev) => [...prev, ...data.urls]);
        } catch {
            setError("Erreur réseau lors de l'upload.");
        } finally {
            setUploading(false);
        }
    }, [session?.accessToken, uploading, uploadedFiles.length]);

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Réordonner les pages (l'ordre = ordre de la copie envoyée au correcteur).
    const moveFile = (index: number, dir: -1 | 1) => {
        setUploadedFiles((prev) => {
            const j = index + dir;
            if (j < 0 || j >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[j]] = [next[j], next[index]];
            return next;
        });
    };

    // Drag & drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!session?.accessToken || !drawId || submitting) return;

        const confirmed = window.confirm(
            "Êtes-vous sûr de vouloir soumettre ? Cette action est irréversible."
        );
        if (!confirmed) return;

        setSubmitting(true);
        setError(null);

        try {
            const body: any = { submittedFiles: uploadedFiles };

            if (evaluation.type === "form") {
                body.answers = Object.entries(answers).map(([idx, answer]) => ({
                    questionIndex: parseInt(idx),
                    answer,
                }));
            }

            const res = await fetch(`/api/evaluations/draws/${drawId}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Erreur de soumission.");
                setSubmitting(false);
                return;
            }

            setSubmitted(true);
            setTimeout(() => {
                router.push(`/evaluation/result/${data.submission._id}`);
            }, 2000);
        } catch {
            setError("Erreur réseau.");
            setSubmitting(false);
        }
    }, [session?.accessToken, drawId, answers, uploadedFiles, evaluation, submitting, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (error && !draw) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center py-20">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Évaluation soumise !</h2>
                <p className="text-gray-500 mb-6">Un correcteur la notera bientôt. Redirection...</p>
                <Mascot name="foxy" emotion="amoureux" message="Bravo, ta copie est bien envoyée ! Fier de toi 🎉" />
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="flex flex-col items-center py-20">
                <Clock className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Temps écoulé</h2>
                <p className="text-gray-500 mb-6">
                    Le temps imparti est dépassé. Note automatique : 0/20.
                </p>
                <Mascot name="foxy" emotion="triste" message="Oh non, le temps est écoulé… On se rattrape au prochain tirage 💪" />
                <button
                    onClick={() => router.push("/")}
                    className="mt-6 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                    Retour à l&apos;accueil
                </button>
            </div>
        );
    }

    // Écran d'introduction animé (process + timing) avant de composer
    if (showIntro && evaluation) {
        return (
            <EvaluationIntro
                evaluation={evaluation}
                timeLeftMs={timeLeft || (deadlineRef.current ? deadlineRef.current - Date.now() : 0)}
                onStart={dismissIntro}
            />
        );
    }

    // Timer display
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const isLow = timeLeft < 5 * 60 * 1000;
    const isCritical = timeLeft < 60 * 1000;

    // Phase « dépôt » : les dernières depositMinutes sont réservées au scan + envoi.
    const depositMin = evaluation?.depositMinutes ?? 10;
    const compositionEndMs = deadlineRef.current - depositMin * 60_000;
    const inDeposit = depositMin > 0 && Date.now() >= compositionEndMs && timeLeft > 0;

    return (
        <div>
            {/* Timer bar */}
            <div className={`sticky top-0 z-10 py-3 px-4 rounded-xl mb-6 flex items-center justify-between ${
                isCritical ? "bg-red-100 border border-red-300" :
                isLow ? "bg-amber-100 border border-amber-300" :
                inDeposit ? "bg-indigo-50 border border-indigo-200" :
                "bg-white border border-gray-200"
            }`}>
                <div>
                    <h1 className="font-semibold text-gray-800 text-sm">{evaluation.title}</h1>
                    {inDeposit ? (
                        <p className="text-xs font-medium text-indigo-600">
                            ⏱ Phase de dépôt — scanne et envoie tes copies maintenant
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500">
                            Composition &middot; {evaluation.duration} min
                            {depositMin > 0 && <> · +{depositMin} min de dépôt</>}
                        </p>
                    )}
                </div>
                <div className={`flex items-center gap-2 font-mono text-lg font-bold ${
                    isCritical ? "text-red-600" : isLow ? "text-amber-600" : inDeposit ? "text-indigo-600" : "text-gray-700"
                }`}>
                    <Clock className="w-4 h-4" />
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
            </div>

            {/* Bannière phase dépôt + Foxy */}
            {inDeposit && (
                <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <Mascot
                        name="foxy"
                        emotion="surpris"
                        message="C'est la phase de dépôt ! Prends tes copies en photo (une par page) et envoie-les avant la fin du chrono ⏱"
                    />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Form type */}
            {evaluation.type === "form" && evaluation.questions && (
                <div className="space-y-4">
                    {evaluation.questions
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((q: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex items-start gap-3 mb-3">
                                <span className="w-7 h-7 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{q.questionText}</p>
                                    {q.points > 0 && (
                                        <p className="text-xs text-gray-400 mt-0.5">{q.points} point(s)</p>
                                    )}
                                </div>
                            </div>

                            {q.questionType === "multiple_choice" && q.options?.length > 0 ? (
                                <div className="space-y-2 pl-10">
                                    {q.options.map((opt: string, oi: number) => (
                                        <label
                                            key={oi}
                                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                                answers[idx] === opt
                                                    ? "border-orange-300 bg-orange-50"
                                                    : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${idx}`}
                                                value={opt}
                                                checked={answers[idx] === opt}
                                                onChange={() => setAnswers({ ...answers, [idx]: opt })}
                                                className="accent-orange-500"
                                            />
                                            <span className="text-sm text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : q.questionType === "number" ? (
                                <div className="pl-10">
                                    <input
                                        type="number"
                                        value={answers[idx] || ""}
                                        onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        placeholder="Votre réponse..."
                                    />
                                </div>
                            ) : q.questionType === "file_link" ? (
                                <div className="pl-10">
                                    <input
                                        type="url"
                                        value={answers[idx] || ""}
                                        onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            ) : (
                                <div className="pl-10">
                                    <textarea
                                        value={answers[idx] || ""}
                                        onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-y"
                                        placeholder="Votre réponse..."
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* PDF type - Sujet */}
            {evaluation.type === "pdf" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                    <div className="flex items-start gap-3">
                        <FileText className="w-6 h-6 text-orange-500 shrink-0" />
                        <div>
                            <h3 className="font-semibold text-gray-800">Sujet de l&apos;évaluation</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Téléchargez le sujet, complétez-le sur papier, puis prenez vos copies en photo.
                            </p>
                        </div>
                    </div>

                    {evaluation.pdfUrl && (
                        <a
                            href={evalFileUrl(evaluation.pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Ouvrir le sujet PDF
                        </a>
                    )}
                </div>
            )}

            {/* Zone d'upload photos de copie */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-800">
                        Photos de votre copie
                        {evaluation.type === "pdf" && <span className="text-red-500"> *</span>}
                    </h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Prends chaque feuille en photo (une photo par page){evaluation.type === "form" ? " — optionnel" : ""}.
                    Max 5 pages, 10 Mo chacune. Formats : JPEG, PNG, WebP, HEIC, PDF.
                </p>

                {/* Zone de drop + boutons capture/fichiers */}
                <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        isDragging ? "border-orange-400 bg-orange-50" : "border-gray-300"
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    {/* Entrée caméra dédiée (mobile : ouvre l'appareil photo) */}
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            <p className="text-sm text-gray-500">Upload en cours...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-2">
                            <Upload className="w-8 h-8 text-gray-300" />
                            <p className="hidden text-sm text-gray-600 sm:block">Glisse tes photos ici, ou :</p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    disabled={uploadedFiles.length >= 5}
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                                >
                                    <Camera className="h-4 w-4" /> Prendre une photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadedFiles.length >= 5}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-orange-300 disabled:opacity-50"
                                >
                                    <ImageIcon className="h-4 w-4" /> Choisir des fichiers
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">{uploadedFiles.length}/5 page(s)</p>
                        </div>
                    )}
                </div>

                {/* Aperçu des pages (réordonnables) */}
                {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-xs text-gray-500">
                            Vérifie l&apos;ordre des pages — c&apos;est l&apos;ordre envoyé au correcteur.
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {uploadedFiles.map((url, i) => {
                                const isPdf = /\.pdf(\?|$)/i.test(url);
                                return (
                                    <div key={i} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                                        {isPdf ? (
                                            <div className="flex h-32 items-center justify-center bg-gray-50">
                                                <FileText className="h-8 w-8 text-gray-400" />
                                                <span className="ml-2 text-xs text-gray-500">PDF</span>
                                            </div>
                                        ) : (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={evalFileUrl(url)} alt={`Page ${i + 1}`} className="h-32 w-full object-cover" />
                                        )}
                                        <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                            Page {i + 1}/{uploadedFiles.length}
                                        </span>
                                        <button
                                            onClick={() => removeFile(i)}
                                            title="Supprimer cette page"
                                            className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="absolute inset-x-1 bottom-1 flex items-center justify-between">
                                            <button
                                                onClick={() => moveFile(i, -1)}
                                                disabled={i === 0}
                                                title="Déplacer avant"
                                                className="rounded-md bg-white/90 p-1 shadow-sm transition-opacity hover:bg-white disabled:opacity-30"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5 text-gray-700" />
                                            </button>
                                            <button
                                                onClick={() => moveFile(i, 1)}
                                                disabled={i === uploadedFiles.length - 1}
                                                title="Déplacer après"
                                                className="rounded-md bg-white/90 p-1 shadow-sm transition-opacity hover:bg-white disabled:opacity-30"
                                            >
                                                <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Submit */}
            <div className="mt-6 flex items-center justify-end gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || uploading}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Envoi...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Soumettre
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
