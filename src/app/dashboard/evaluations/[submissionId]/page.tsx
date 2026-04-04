"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Loader2,
    Send,
    User,
    Clock,
    FileText,
    ExternalLink,
    CheckCircle2,
    XCircle,
    X,
    Target,
    Camera,
    Upload,
    ImageIcon,
} from "lucide-react";
import "../../styles/dashboard-theme.css";

export default function GradingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { submissionId } = useParams<{ submissionId: string }>();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Grading form
    const [grade, setGrade] = useState<number>(0);
    const [feedback, setFeedback] = useState("");
    const [photoLinks, setPhotoLinks] = useState<string[]>([]);
    const [validated, setValidated] = useState<Set<string>>(new Set());
    const [invalidated, setInvalidated] = useState<Set<string>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!session?.accessToken || !submissionId) return;

        fetch(`/api/submissions/${submissionId}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.error) setError(d.error);
                else {
                    setData(d);
                    if (d.grade) {
                        setGrade(d.grade.grade);
                        setFeedback(d.grade.feedback || "");
                        setPhotoLinks(d.grade.photoLinks || []);
                        setValidated(new Set(d.grade.validatedCompetencies || []));
                        setInvalidated(new Set(d.grade.invalidatedCompetencies || []));
                    }
                }
            })
            .catch(() => setError("Erreur de chargement."))
            .finally(() => setLoading(false));
    }, [session?.accessToken, submissionId]);

    const toggleCompetency = (skillId: string) => {
        const newVal = new Set(validated);
        const newInval = new Set(invalidated);

        if (newVal.has(skillId)) {
            newVal.delete(skillId);
            newInval.add(skillId);
        } else if (newInval.has(skillId)) {
            newInval.delete(skillId);
        } else {
            newVal.add(skillId);
        }

        setValidated(newVal);
        setInvalidated(newInval);
    };

    // Upload photos de correction vers R2
    const handlePhotoUpload = async (files: FileList | File[]) => {
        if (!session?.accessToken || uploading) return;

        const fileArray = Array.from(files);
        const remaining = 10 - photoLinks.length;
        if (remaining <= 0) { setError("Maximum 10 photos."); return; }
        const toUpload = fileArray.slice(0, remaining);

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            toUpload.forEach((f) => formData.append('files', f));

            const res = await fetch('/api/evaluations/upload?context=correction', {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.accessToken}` },
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) {
                setError(result.error || "Erreur upload.");
                return;
            }

            setPhotoLinks((prev) => [...prev, ...result.urls]);
        } catch {
            setError("Erreur réseau lors de l'upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!session?.accessToken || submitting) return;
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/submissions/${submissionId}/grade`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                    grade,
                    feedback,
                    photoLinks,
                    validatedCompetencies: Array.from(validated),
                    invalidatedCompetencies: Array.from(invalidated),
                }),
            });

            const result = await res.json();
            if (!res.ok) {
                setError(result.error || "Erreur de correction.");
                setSubmitting(false);
                return;
            }

            router.push("/dashboard/evaluations");
        } catch {
            setError("Erreur réseau.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-600">{error || "Non trouvé."}</p>
            </div>
        );
    }

    const { submission, draw } = data;
    const evaluation = submission.evaluationId;
    const student = submission.userId;
    const isAlreadyGraded = submission.status === "graded";
    const competencies: string[] = evaluation?.linkedCompetencies || [];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Link
                href="/dashboard/evaluations"
                className="inline-flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#37352f] mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour aux corrections
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche : Réponses */}
                <div className="space-y-4">
                    {/* Info élève */}
                    <div className="dash-card">
                        <div className="dash-card-header flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-[#37352f]">{student?.username || "Inconnu"}</p>
                                <p className="text-xs text-[#6b6b6b]">{student?.email}</p>
                            </div>
                        </div>
                        <div className="dash-card-body grid grid-cols-2 gap-2 text-xs text-[#6b6b6b]">
                            <div>
                                <span className="font-medium">Trimestre :</span> {draw?.trimester} {draw?.schoolYear}
                            </div>
                            <div>
                                <span className="font-medium">Temps passé :</span> {Math.round(submission.timeSpent / 60)} min
                            </div>
                            <div>
                                <span className="font-medium">Type :</span> {submission.type === "form" ? "Formulaire" : "PDF"}
                            </div>
                            <div>
                                <span className="font-medium">Soumis :</span>{" "}
                                {new Date(submission.submittedAt).toLocaleDateString("fr-FR")}
                            </div>
                        </div>
                    </div>

                    {/* Réponses formulaire */}
                    {submission.type === "form" && evaluation?.questions && (
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <span className="font-semibold text-[#37352f] flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#f97316]" />
                                    Réponses
                                </span>
                            </div>
                            <div className="dash-card-body space-y-4">
                                {evaluation.questions
                                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                                    .map((q: any, idx: number) => {
                                    const answer = submission.answers?.find((a: any) => a.questionIndex === idx);
                                    return (
                                        <div key={idx} className="border-b border-[#e3e2e0] pb-3 last:border-0">
                                            <p className="text-sm font-medium text-[#37352f] mb-1">
                                                Q{idx + 1}. {q.questionText}
                                            </p>
                                            <p className="text-sm text-[#6b6b6b] bg-[#f7f6f3] rounded-lg px-3 py-2">
                                                {answer?.answer || <span className="italic text-gray-400">Pas de réponse</span>}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Photos soumises par l'élève */}
                    {submission.submittedFiles?.length > 0 && (
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <span className="font-semibold text-[#37352f] flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-[#f97316]" />
                                    Photos de l&apos;élève ({submission.submittedFiles.length})
                                </span>
                            </div>
                            <div className="dash-card-body">
                                <div className="grid grid-cols-2 gap-3">
                                    {submission.submittedFiles.map((url: string, i: number) => (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-lg overflow-hidden border border-gray-200 hover:border-[#f97316] transition-colors"
                                        >
                                            {url.match(/\.pdf$/i) ? (
                                                <div className="flex items-center justify-center h-28 bg-gray-50 gap-2">
                                                    <FileText className="w-6 h-6 text-gray-400" />
                                                    <span className="text-xs text-gray-500">PDF {i + 1}</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={url}
                                                    alt={`Copie ${i + 1}`}
                                                    className="w-full h-28 object-cover"
                                                />
                                            )}
                                            <div className="text-xs text-center py-1 text-[#6b6b6b] bg-[#f7f6f3]">
                                                Photo {i + 1} — cliquer pour agrandir
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PDF soumis (legacy) */}
                    {submission.type === "pdf" && submission.submittedPdfUrl && !submission.submittedFiles?.length && (
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <span className="font-semibold text-[#37352f]">PDF soumis</span>
                            </div>
                            <div className="dash-card-body">
                                <a
                                    href={submission.submittedPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Ouvrir le PDF
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Colonne droite : Notation */}
                <div className="space-y-4">
                    {/* Note */}
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <span className="font-semibold text-[#37352f]">Notation</span>
                        </div>
                        <div className="dash-card-body space-y-4">
                            <div>
                                <label className="dash-label mb-1 block">Note /20</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={0.5}
                                    value={grade}
                                    onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                                    disabled={isAlreadyGraded}
                                    className="dash-input w-32 text-lg font-bold"
                                />
                            </div>

                            <div>
                                <label className="dash-label mb-1 block">Remarques</label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    disabled={isAlreadyGraded}
                                    rows={4}
                                    className="dash-input w-full resize-y"
                                    placeholder="Remarques pour l'élève..."
                                />
                            </div>

                            {/* Upload photos de correction */}
                            <div>
                                <label className="dash-label mb-1 block">Photos de correction</label>
                                {!isAlreadyGraded && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 hover:border-[#f97316] rounded-lg p-4 text-center cursor-pointer transition-colors mb-3"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp,application/pdf"
                                            onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                                            className="hidden"
                                        />
                                        {uploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-[#f97316] mx-auto" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <Upload className="w-5 h-5 text-gray-400" />
                                                <p className="text-xs text-gray-500">
                                                    Cliquez pour ajouter des photos ({photoLinks.length}/10)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {photoLinks.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {photoLinks.map((url, i) => (
                                            <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200">
                                                {url.match(/\.pdf$/i) ? (
                                                    <div className="flex items-center justify-center h-20 bg-gray-50">
                                                        <FileText className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                ) : (
                                                    <img src={url} alt={`Correction ${i + 1}`} className="w-full h-20 object-cover" />
                                                )}
                                                {!isAlreadyGraded && (
                                                    <button
                                                        onClick={() => setPhotoLinks(photoLinks.filter((_, j) => j !== i))}
                                                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Compétences */}
                    {competencies.length > 0 && (
                        <div className="dash-card">
                            <div className="dash-card-header">
                                <span className="font-semibold text-[#37352f] flex items-center gap-2">
                                    <Target className="w-4 h-4 text-[#f97316]" />
                                    Compétences ({competencies.length})
                                </span>
                            </div>
                            <div className="dash-card-body space-y-2">
                                <p className="text-xs text-[#6b6b6b] mb-2">
                                    Cliquez pour alterner : acquise → non acquise → non évalué
                                </p>
                                {competencies.map((skillId: string) => {
                                    const isVal = validated.has(skillId);
                                    const isInval = invalidated.has(skillId);

                                    return (
                                        <button
                                            key={skillId}
                                            onClick={() => !isAlreadyGraded && toggleCompetency(skillId)}
                                            disabled={isAlreadyGraded}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                                                isVal
                                                    ? "bg-emerald-50 border-emerald-200"
                                                    : isInval
                                                    ? "bg-red-50 border-red-200"
                                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {isVal ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            ) : isInval ? (
                                                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                                            )}
                                            <span className="text-sm font-mono text-[#37352f]">{skillId}</span>
                                            <span className={`text-xs ml-auto font-medium ${
                                                isVal ? "text-emerald-600" : isInval ? "text-red-500" : "text-gray-400"
                                            }`}>
                                                {isVal ? "Acquise" : isInval ? "Non acquise" : "—"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bouton soumettre */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {!isAlreadyGraded && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || uploading}
                            className="dash-button dash-button-primary w-full flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Valider la correction
                                </>
                            )}
                        </button>
                    )}

                    {isAlreadyGraded && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                            <p className="text-sm text-emerald-700 font-medium">
                                Déjà corrigée — Note : {submission.grade}/20
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
