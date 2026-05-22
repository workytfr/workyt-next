"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/skeleton";
import { educationData } from "@/data/educationData";
import FicheEditor from "@/app/fiches/_components/FicheEditor";
import {
    Check,
    CloudOff,
    Sparkles,
    PenLine,
    Send,
    BookOpen,
    ArrowLeft,
    FileUp,
    X,
    Pencil,
    FileText,
    Image as ImageIcon,
    File as FileIcon,
} from "lucide-react";

import { compressImage } from "@/app/fiches/_components/imageCompression";

const DrawModal = dynamic(() => import("@/app/fiches/_components/DrawModal"), { ssr: false });
const PdfComposerModal = dynamic(() => import("@/app/fiches/_components/PdfComposerModal"), { ssr: false });

const DRAFT_KEY = "fiche-creer-draft-v3";
type Draft = {
    title: string;
    content: string;
    subject: string;
    level: string;
};

export default function UploadForm() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState<string>("");
    const [subject, setSubject] = useState("");
    const [level, setLevel] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [online, setOnline] = useState(true);
    const [draftLoaded, setDraftLoaded] = useState(false);

    const [drawOpen, setDrawOpen] = useState(false);
    const [pdfOpen, setPdfOpen] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
                const d: Draft = JSON.parse(raw);
                if (d && (d.title || d.content)) {
                    setTitle(d.title || "");
                    setContent(d.content || "");
                    setSubject(d.subject || "");
                    setLevel(d.level || "");
                    setDraftStatus("saved");
                }
            }
        } catch {}
        setDraftLoaded(true);
    }, []);

    useEffect(() => {
        if (!draftLoaded) return;
        setDraftStatus("saving");
        const t = setTimeout(() => {
            try {
                const draft: Draft = { title, content, subject, level };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                setDraftStatus("saved");
            } catch {
                setDraftStatus("idle");
            }
        }, 800);
        return () => clearTimeout(t);
    }, [title, content, subject, level, draftLoaded]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const update = () => setOnline(navigator.onLine);
        update();
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles = selectedFiles.filter(
            (file) => file.type === "application/pdf" || file.type.startsWith("image/")
        );
        setFiles((prev) => [...prev, ...validFiles]);
        if (validFiles.length < selectedFiles.length) {
            setAlertMessage("Certains fichiers non valides ont été ignorés.");
        }
        e.target.value = "";
    };

    const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

    const handleDrawSave = async (pngUrl: string) => {
        try {
            const res = await fetch(pngUrl);
            const blob = await res.blob();
            const file = new File([blob], `dessin-${Date.now()}.png`, { type: "image/png" });
            setFiles((prev) => [...prev, file]);
            setDrawOpen(false);
        } catch {
            setAlertMessage("Impossible de récupérer le dessin.");
        }
    };

    const handlePdfConfirm = (pdf: File) => {
        setFiles((prev) => [...prev, pdf]);
        setPdfOpen(false);
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-white">
                <Skeleton className="w-48 h-8 rounded" />
                <Skeleton className="w-full max-w-2xl h-16 rounded" />
                <Skeleton className="w-full max-w-2xl h-72 rounded" />
                <Skeleton className="w-32 h-10 rounded" />
            </div>
        );
    }

    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {}
        setTitle("");
        setContent("");
        setSubject("");
        setLevel("");
        setFiles([]);
        setDraftStatus("idle");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !subject || !level) {
            setAlertMessage("Renseigne au moins un titre, une matière et un niveau.");
            return;
        }

        setIsSubmitting(true);

        // Compression côté client des images pour réduire le poids avant envoi serveur
        const optimized = await Promise.all(
            files.map((f) => (f.type.startsWith("image/") ? compressImage(f).catch(() => f) : f)),
        );

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("subject", subject);
        formData.append("level", level);
        optimized.forEach((file) => formData.append("file", file));

        try {
            const token = (session as any)?.accessToken || "";
            const response = await fetch("/api/fiches", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) throw new Error(`Erreur : ${response.statusText}`);
            await response.json();
            setAlertMessage("Fiche publiée avec succès !");
            try {
                localStorage.removeItem(DRAFT_KEY);
            } catch {}
            router.push("/fiches");
        } catch (error) {
            console.error("Erreur lors de la publication :", error);
            setAlertMessage("Une erreur est survenue lors de la publication de la fiche.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white text-black">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
                <Link
                    href="/fiches"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Retour aux fiches
                </Link>

                {/* Hero */}
                <header className="max-w-3xl mx-auto text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                        <Sparkles size={14} /> Partage tes notes avec la communauté
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                        Publier une fiche de révision
                    </h1>
                    <p className="mt-3 text-gray-600 sm:text-lg">
                        Rédige une courte présentation, puis ajoute ta fiche en pièce jointe :
                        <b> dessin</b>, <b>fichier existant</b>, ou <b>texte + LaTeX</b> converti en PDF.
                    </p>
                </header>

                {/* Étapes */}
                <section className="max-w-5xl mx-auto mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Step n={1} icon={<BookOpen size={20} />} title="Décris ta fiche" text="Titre, matière, niveau et une petite intro." />
                        <Step n={2} icon={<PenLine size={20} />} title="Ajoute le contenu" text="En pièce jointe : dessin, fichier importé, ou PDF généré depuis l'éditeur." />
                        <Step n={3} icon={<Send size={20} />} title="Publie" text="Brouillon enregistré automatiquement. Publie quand c'est prêt." />
                    </div>
                </section>

                {/* Formulaire */}
                <form
                    onSubmit={handleSubmit}
                    className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-8 space-y-10"
                >
                    <div className="flex items-center justify-between flex-wrap gap-2 -mt-2">
                        <span className="text-sm text-gray-500">Tout est enregistré dans ton navigateur en continu.</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            {!online && (
                                <span className="inline-flex items-center gap-1 text-amber-700">
                                    <CloudOff size={14} /> Hors ligne
                                </span>
                            )}
                            {online && draftStatus === "saving" && <span>Enregistrement…</span>}
                            {online && draftStatus === "saved" && (
                                <span className="inline-flex items-center gap-1 text-green-700">
                                    <Check size={14} /> Brouillon enregistré
                                </span>
                            )}
                            {draftStatus === "saved" && (
                                <button
                                    type="button"
                                    onClick={clearDraft}
                                    className="ml-2 text-gray-400 hover:text-red-600 underline-offset-2 hover:underline"
                                >
                                    Effacer
                                </button>
                            )}
                        </div>
                    </div>

                    {alertMessage && (
                        <Alert className="bg-red-50 text-red-800 p-4 rounded border border-red-200" role="alert">
                            <div>
                                <AlertTitle>Notification</AlertTitle>
                                <AlertDescription>{alertMessage}</AlertDescription>
                            </div>
                        </Alert>
                    )}

                    {/* Section 1 — Infos */}
                    <section className="space-y-5">
                        <SectionHeader n={1} title="Informations" />

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Titre de la fiche <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Ex. Les théorèmes de Thalès — 3ème"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded bg-white text-black"
                                maxLength={120}
                            />
                            <p className="mt-1 text-xs text-gray-500">{title.length}/120 caractères.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Matière <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded bg-white text-black"
                                >
                                    <option value="" disabled>Choisir une matière</option>
                                    {educationData.subjects.map((s, i) => (
                                        <option key={i} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Niveau <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="level"
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded bg-white text-black"
                                >
                                    <option value="" disabled>Choisir un niveau</option>
                                    {educationData.levels.map((l, i) => (
                                        <option key={i} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 — Présentation */}
                    <section className="space-y-3">
                        <SectionHeader
                            n={2}
                            title="Présentation"
                            subtitle="Une introduction courte qui résume ce que contient la fiche."
                        />
                        <FicheEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Présente ta fiche en quelques lignes : ce qu'elle couvre, pour qui, ce que tu y as mis."
                        />
                    </section>

                    {/* Section 3 — Pièces jointes */}
                    <section className="space-y-5">
                        <SectionHeader
                            n={3}
                            title="Pièces jointes"
                            subtitle="Le vrai contenu de la fiche. Choisis une ou plusieurs façons d'ajouter — tu peux combiner les trois."
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <AttachButton
                                color="orange"
                                icon={<Pencil size={22} />}
                                title="Dessiner"
                                hint="Tableau blanc au stylet ou au doigt"
                                onClick={() => setDrawOpen(true)}
                            />
                            <AttachButton
                                color="blue"
                                icon={<FileUp size={22} />}
                                title="Joindre un fichier"
                                hint="PDF, photos de notes manuscrites…"
                                asLabel
                                htmlFor="file-pick"
                            />
                            <AttachButton
                                color="green"
                                icon={<FileText size={22} />}
                                title="Rédiger un PDF"
                                hint="Texte + formules LaTeX → PDF auto"
                                onClick={() => setPdfOpen(true)}
                            />
                        </div>

                        <input
                            id="file-pick"
                            type="file"
                            multiple
                            accept="application/pdf,image/*"
                            onChange={handleFilePick}
                            hidden
                        />

                        {files.length > 0 ? (
                            <ul className="space-y-2">
                                {files.map((f, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                                    >
                                        <span className="flex items-center gap-2 min-w-0">
                                            <FileBadge file={f} />
                                            <span className="truncate">
                                                {f.name}
                                                <span className="text-gray-400 text-xs ml-2">
                                                    ({Math.round(f.size / 1024)} Ko)
                                                </span>
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 text-gray-500"
                                            aria-label={`Retirer ${f.name}`}
                                        >
                                            <X size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic">
                                Aucune pièce jointe pour l'instant.
                            </p>
                        )}
                    </section>

                    {/* Publier */}
                    <div className="pt-2 border-t border-gray-100">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 text-base font-semibold ${
                                isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-800"
                            } text-white`}
                        >
                            {isSubmitting ? "Envoi en cours…" : "Publier la fiche"}
                        </Button>
                        <p className="mt-3 text-xs text-gray-500 text-center">
                            En publiant, tu acceptes que ta fiche soit visible par toute la communauté Workyt.
                        </p>
                    </div>
                </form>
            </div>

            <DrawModal
                open={drawOpen}
                onClose={() => setDrawOpen(false)}
                onSave={(pngUrl) => handleDrawSave(pngUrl)}
            />
            <PdfComposerModal
                open={pdfOpen}
                onClose={() => setPdfOpen(false)}
                onConfirm={handlePdfConfirm}
                defaultTitle={title}
                subject={subject}
                level={level}
                authorName={(session?.user as any)?.username || (session?.user as any)?.name || undefined}
            />
        </div>
    );
}

function Step({ n, icon, title, text }: { n: number; icon: React.ReactNode; title: string; text: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-sm font-bold">
                    {n}
                </span>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100 text-orange-700">
                    {icon}
                </span>
            </div>
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{text}</p>
        </div>
    );
}

function SectionHeader({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-sm font-semibold shrink-0 mt-0.5">
                {n}
            </span>
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
        </div>
    );
}

const COLORS = {
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
} as const;

function AttachButton({
    color,
    icon,
    title,
    hint,
    onClick,
    asLabel,
    htmlFor,
}: {
    color: keyof typeof COLORS;
    icon: React.ReactNode;
    title: string;
    hint: string;
    onClick?: () => void;
    asLabel?: boolean;
    htmlFor?: string;
}) {
    const className = `flex flex-col items-start gap-2 p-4 border rounded-xl transition-colors text-left cursor-pointer w-full ${COLORS[color]}`;
    const content = (
        <>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm">{icon}</span>
            <span className="font-semibold">{title}</span>
            <span className="text-xs text-gray-600">{hint}</span>
        </>
    );
    if (asLabel && htmlFor) {
        return (
            <label htmlFor={htmlFor} className={className}>
                {content}
            </label>
        );
    }
    return (
        <button type="button" onClick={onClick} className={className}>
            {content}
        </button>
    );
}

function FileBadge({ file }: { file: File }) {
    if (file.type.startsWith("image/")) {
        return <ImageIcon size={16} className="text-blue-500 shrink-0" />;
    }
    if (file.type === "application/pdf") {
        return <FileText size={16} className="text-red-500 shrink-0" />;
    }
    return <FileIcon size={16} className="text-gray-500 shrink-0" />;
}
