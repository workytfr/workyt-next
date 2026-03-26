"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileCheck, Plus, ChevronRight, Heart, X, Upload, Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import MDEditor from "@uiw/react-md-editor";
import TimeAgo from "@/components/ui/TimeAgo";
import { buildIdSlug } from "@/utils/slugify";
import ProfileAvatar from "@/components/ui/profile";
import { canSubmitFicheForCourse, getFicheSubmissionBlockedReason } from "@/data/educationData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";

interface FichePreview {
    _id: string;
    title: string;
    slug?: string;
    likes: number;
    status: string;
    author: { _id: string; username: string; image?: string };
    subject: string;
    level: string;
    createdAt: string;
    comments?: string[];
}

interface CourseFichesSectionProps {
    courseId: string;
    courseTitle: string;
    courseMatiere: string;
    courseNiveau: string;
}

export default function CourseFichesSection({
    courseId,
    courseTitle,
    courseMatiere,
    courseNiveau,
}: CourseFichesSectionProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [fiches, setFiches] = useState<FichePreview[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Vérifier si le dépôt de fiches est autorisé pour cette matière/niveau
    const canSubmitFiche = canSubmitFicheForCourse(courseMatiere, courseNiveau);
    const blockReason = canSubmitFiche ? null : getFicheSubmissionBlockedReason(courseMatiere, courseNiveau);

    const fetchFiches = async () => {
        try {
            const res = await fetch(`/api/fiches/by-course?courseId=${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setFiches(data.data || []);
                setTotal(data.total || 0);
            }
        } catch { /* silently fail */ } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiches();
    }, [courseId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Vérifiée":
                return "bg-green-100 text-green-700";
            case "Certifiée":
                return "bg-blue-100 text-blue-700";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    return (
        <>
            <div className="mt-12 pt-8 border-t border-[#e3e2e0]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[#37352f]">
                                Fiches de révision
                            </h3>
                            <p className="text-sm text-[#9ca3af]">
                                {total > 0
                                    ? `${total} fiche${total > 1 ? "s" : ""} pour ce cours`
                                    : "Aucune fiche pour le moment"}
                            </p>
                        </div>
                    </div>
                    {session?.user && (
                        canSubmitFiche ? (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Déposer une fiche</span>
                                <span className="sm:hidden">Fiche</span>
                            </button>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        disabled
                                        className="px-4 py-2.5 bg-gray-200 text-gray-400 text-sm font-medium rounded-xl cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Lock className="w-4 h-4" />
                                        <span className="hidden sm:inline">Déposer une fiche</span>
                                        <span className="sm:hidden">Fiche</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                    <p>{blockReason || "Le dépôt de fiches n'est pas disponible pour cette combinaison matière/niveau."}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    )}
                </div>

                {/* Fiches list */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-20 bg-[#f7f6f3] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : fiches.length > 0 ? (
                    <div className="space-y-3">
                        {fiches.map((fiche, index) => (
                            <motion.div
                                key={fiche._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => router.push(`/fiches/${buildIdSlug(fiche._id, fiche.title)}`)}
                                className="group flex items-center gap-4 p-4 bg-[#f7f6f3] hover:bg-[#efeeeb] rounded-xl cursor-pointer transition-colors"
                            >
                                <div className="flex-shrink-0">
                                    <ProfileAvatar
                                        username={fiche.author.username}
                                        userId={fiche.author._id}
                                        size="small"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#37352f] truncate group-hover:text-orange-600 transition-colors">
                                        {fiche.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-[#9ca3af]">
                                        <span>{fiche.author.username}</span>
                                        <span><TimeAgo date={fiche.createdAt} /></span>
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-3 h-3" />
                                            {fiche.likes}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(fiche.status)}`}>
                                    {fiche.status}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:text-orange-500 transition-colors" />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-[#f7f6f3] rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3">
                            <FileCheck className="w-6 h-6 text-[#9ca3af]" />
                        </div>
                        <p className="text-sm text-[#6b6b6b] mb-1">
                            Aucune fiche de révision pour ce cours
                        </p>
                        <p className="text-xs text-[#9ca3af]">
                            Soyez le premier à partager vos fiches !
                        </p>
                    </div>
                )}

                {/* CTA non connecté */}
                {!session?.user && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl text-center">
                        <p className="text-sm text-orange-700">
                            Connectez-vous pour déposer une fiche de révision
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de dépôt */}
            {showModal && (
                <CreateFicheModal
                    courseId={courseId}
                    courseMatiere={courseMatiere}
                    courseNiveau={courseNiveau}
                    onClose={() => setShowModal(false)}
                    onCreated={() => {
                        setShowModal(false);
                        setLoading(true);
                        fetchFiches();
                    }}
                />
            )}
        </>
    );
}

// Modal de création de fiche
function CreateFicheModal({
    courseId,
    courseMatiere,
    courseNiveau,
    onClose,
    onCreated,
}: {
    courseId: string;
    courseMatiere: string;
    courseNiveau: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const { data: session } = useSession();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState<string | undefined>("");
    const [subject, setSubject] = useState(courseMatiere);
    const [level, setLevel] = useState(courseNiveau);
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles = selectedFiles.filter(
            (file) => file.type === "application/pdf" || file.type.startsWith("image/")
        );
        setFiles(validFiles);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !subject || !level) {
            setError("Veuillez remplir le titre, la matière et le niveau.");
            return;
        }

        setSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content || "");
        formData.append("subject", subject);
        formData.append("level", level);
        formData.append("courseId", courseId);
        files.forEach((file) => formData.append("file", file));

        try {
            const token = (session as any)?.accessToken || "";
            const res = await fetch("/api/fiches", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Erreur lors de la création.");
            }

            onCreated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#e3e2e0]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Upload className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#37352f]">Déposer une fiche</h2>
                            <p className="text-xs text-[#9ca3af]">Liée à ce cours</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#f7f6f3] rounded-lg transition-colors">
                        <X className="w-5 h-5 text-[#6b6b6b]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Titre */}
                    <div>
                        <label className="block text-sm font-medium text-[#37352f] mb-1.5">
                            Titre de la fiche *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Résumé du chapitre 3 — Les fonctions"
                            className="w-full px-4 py-2.5 border border-[#e3e2e0] rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        />
                    </div>

                    {/* Contenu */}
                    <div>
                        <label className="block text-sm font-medium text-[#37352f] mb-1.5">
                            Contenu (optionnel)
                        </label>
                        <div data-color-mode="light">
                            <MDEditor
                                value={content}
                                onChange={setContent}
                                height={200}
                                highlightEnable={false}
                            />
                        </div>
                    </div>

                    {/* Matière et niveau */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-[#37352f] mb-1.5">
                                Matière
                            </label>
                            <div className="w-full px-4 py-2.5 border border-[#e3e2e0] rounded-xl text-sm bg-[#f7f6f3] text-[#6b6b6b]">
                                {subject}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#37352f] mb-1.5">
                                Niveau
                            </label>
                            <div className="w-full px-4 py-2.5 border border-[#e3e2e0] rounded-xl text-sm bg-[#f7f6f3] text-[#6b6b6b]">
                                {level}
                            </div>
                        </div>
                    </div>

                    {/* Fichiers */}
                    <div>
                        <label className="block text-sm font-medium text-[#37352f] mb-1.5">
                            Fichiers (PDF ou images)
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="application/pdf,image/*"
                            onChange={handleFileChange}
                            className="w-full text-sm text-[#6b6b6b] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:font-medium file:text-sm hover:file:bg-orange-100 file:cursor-pointer"
                        />
                        {files.length > 0 && (
                            <p className="text-xs text-[#9ca3af] mt-1">
                                {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-[#e3e2e0] text-[#6b6b6b] text-sm font-medium rounded-xl hover:bg-[#f7f6f3] transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Publier la fiche
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
