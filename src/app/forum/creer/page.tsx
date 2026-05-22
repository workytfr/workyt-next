"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/skeleton";
import { educationData } from "@/data/educationData";
import FicheEditor from "@/app/fiches/_components/FicheEditor";
import { compressImage, FORUM_QUESTION_IMAGE_OPTS } from "@/app/fiches/_components/imageCompression";
import { countDrawingsAcross } from "@/app/forum/_components/imageCounting";
import {
    Sparkles,
    BookOpen,
    PenLine,
    Send,
    ArrowLeft,
    Check,
    CloudOff,
    Camera,
    FileUp,
    X,
    AlertTriangle,
    HelpCircle,
} from "lucide-react";
import PointsIcon from "@/components/ui/PointsIcon";

const DRAFT_KEY = "forum-creer-draft-v1";
const MAX_IMAGES = 3;
const MAX_FILES = 5;

type Draft = {
    title: string;
    classLevel: string;
    subject: string;
    whatIDid: string;
    whatINeed: string;
    points: number;
};

export default function ForumPostPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [classLevel, setClassLevel] = useState("");
    const [subject, setSubject] = useState("");
    const [whatIDid, setWhatIDid] = useState<string>("");
    const [whatINeed, setWhatINeed] = useState<string>("");
    const [points, setPoints] = useState<number>(5);
    const [files, setFiles] = useState<File[]>([]);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [online, setOnline] = useState(true);
    const [userPoints, setUserPoints] = useState<number | null>(null);

    // Charger le solde de points
    useEffect(() => {
        if (!session?.user) return;
        const uid = (session.user as any).id;
        if (!uid) return;
        fetch(`/api/users/${uid}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data && typeof data.points === "number") setUserPoints(data.points);
            })
            .catch(() => {});
    }, [session]);

    // Charger brouillon
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
                const d: Draft = JSON.parse(raw);
                if (d && (d.title || d.whatIDid || d.whatINeed)) {
                    setTitle(d.title || "");
                    setClassLevel(d.classLevel || "");
                    setSubject(d.subject || "");
                    setWhatIDid(d.whatIDid || "");
                    setWhatINeed(d.whatINeed || "");
                    setPoints(d.points || 5);
                    setDraftStatus("saved");
                }
            }
        } catch {}
        setDraftLoaded(true);
    }, []);

    // Sauvegarder brouillon
    useEffect(() => {
        if (!draftLoaded) return;
        setDraftStatus("saving");
        const t = setTimeout(() => {
            try {
                const d: Draft = { title, classLevel, subject, whatIDid, whatINeed, points };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
                setDraftStatus("saved");
            } catch {
                setDraftStatus("idle");
            }
        }, 800);
        return () => clearTimeout(t);
    }, [title, classLevel, subject, whatIDid, whatINeed, points, draftLoaded]);

    // Statut connexion
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

    useEffect(() => {
        if (status === "unauthenticated") router.push("/forum");
    }, [status, router]);

    // Calcul du coût (photos attachées + dessins inline)
    const photoCount = useMemo(() => files.filter((f) => f.type.startsWith("image/")).length, [files]);
    const drawingCount = useMemo(() => countDrawingsAcross(whatIDid, whatINeed), [whatIDid, whatINeed]);
    const imageCount = photoCount + drawingCount;
    const photoCost = Math.max(0, imageCount - 1);
    const totalCost = points + photoCost;
    const hasEnoughPoints = userPoints == null || userPoints >= totalCost;
    const quotaExceeded = imageCount > MAX_IMAGES;

    if (status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-white">
                <Skeleton className="w-48 h-8 rounded" />
                <Skeleton className="w-full max-w-2xl h-16 rounded" />
                <Skeleton className="w-full max-w-2xl h-72 rounded" />
            </div>
        );
    }

    const addFiles = async (selected: File[]) => {
        const validTypes = selected.filter(
            (f) =>
                f.type === "application/pdf" ||
                f.type.startsWith("image/") ||
                /\.heic|\.heif$/i.test(f.name),
        );
        if (validTypes.length < selected.length) {
            setAlertMessage("Certains fichiers ne sont pas autorisés (PDF/images uniquement).");
        }

        // Quota images : photos attachées + dessins inline
        const currentPhotoCount = files.filter((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)).length;
        const currentDrawingCount = countDrawingsAcross(whatIDid, whatINeed);
        const currentImageCount = currentPhotoCount + currentDrawingCount;
        const incomingImages = validTypes.filter((f) => f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name));
        const allowedImages = Math.max(0, MAX_IMAGES - currentImageCount);
        const acceptedImages = incomingImages.slice(0, allowedImages);
        const droppedImagesCount = incomingImages.length - acceptedImages.length;

        const otherFiles = validTypes.filter((f) => !(f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)));
        const allFiles = [...acceptedImages, ...otherFiles];

        // Compression photos
        const processed = await Promise.all(
            allFiles.map((f) =>
                f.type.startsWith("image/") || /\.heic|\.heif$/i.test(f.name)
                    ? compressImage(f, FORUM_QUESTION_IMAGE_OPTS).catch(() => f)
                    : Promise.resolve(f),
            ),
        );

        // Quota total
        const totalAfter = files.length + processed.length;
        const final = totalAfter > MAX_FILES ? processed.slice(0, MAX_FILES - files.length) : processed;

        setFiles((prev) => [...prev, ...final]);

        if (droppedImagesCount > 0) {
            setAlertMessage(
                `${droppedImagesCount} photo${droppedImagesCount > 1 ? "s" : ""} ignorée${droppedImagesCount > 1 ? "s" : ""} (max ${MAX_IMAGES}/question).`,
            );
        }
    };

    const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        e.target.value = "";
        await addFiles(selected);
    };

    const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {}
        setTitle("");
        setClassLevel("");
        setSubject("");
        setWhatIDid("");
        setWhatINeed("");
        setPoints(5);
        setFiles([]);
        setDraftStatus("idle");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !subject || !classLevel) {
            setAlertMessage("Renseigne au moins un titre, une matière et un niveau.");
            return;
        }
        if (!whatIDid.trim() || !whatINeed.trim()) {
            setAlertMessage("Les deux sections (« Ce que j'ai fait » et « Ce que je cherche ») doivent être remplies.");
            return;
        }
        if (quotaExceeded) {
            setAlertMessage(`Maximum ${MAX_IMAGES} images au total (photos + dessins). Tu en as ${imageCount}.`);
            return;
        }
        if (!hasEnoughPoints) {
            setAlertMessage(`Il te manque ${totalCost - (userPoints ?? 0)} point(s). Retire des photos/dessins ou baisse ta mise.`);
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("classLevel", classLevel);
        formData.append("subject", subject);
        formData.append("whatIDid", whatIDid);
        formData.append("whatINeed", whatINeed);
        formData.append("points", String(points));
        files.forEach((f) => formData.append("attachments", f));

        try {
            const token = (session as any)?.accessToken || "";
            const response = await fetch("/api/forum/creer", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `Erreur : ${response.statusText}`);
            }
            try {
                localStorage.removeItem(DRAFT_KEY);
            } catch {}
            router.push("/forum");
        } catch (error: any) {
            console.error("Erreur lors de la publication :", error);
            setAlertMessage(error?.message ?? "Une erreur est survenue lors de la publication.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white text-black">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
                <Link
                    href="/forum"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Retour au forum
                </Link>

                {/* Hero */}
                <header className="max-w-3xl mx-auto text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                        <Sparkles size={14} /> Demande de l'aide à la communauté
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                        Poser une question
                    </h1>
                    <p className="mt-3 text-gray-600 sm:text-lg">
                        Plus ta question est claire, plus tu auras de réponses utiles et rapides.
                    </p>
                </header>

                {/* Étapes */}
                <section className="max-w-5xl mx-auto mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Step n={1} icon={<BookOpen size={20} />} title="Décris ta question" text="Titre, matière, niveau pour aider la communauté à te trouver." />
                        <Step n={2} icon={<PenLine size={20} />} title="Précise ton blocage" text="Ce que tu as essayé, et exactement où tu bloques." />
                        <Step n={3} icon={<Send size={20} />} title="Publie" text="Choisis ta mise. Tu récupères les points si personne ne répond." />
                    </div>
                </section>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-8 space-y-10"
                >
                    {/* Status bar */}
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
                                Titre de la question <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Ex. Je bloque sur la dérivée d'une fonction composée"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                                className="w-full p-4 border border-gray-300 rounded bg-white text-black"
                            />
                            <p className="mt-1 text-xs text-gray-500">{title.length}/100 caractères. Un titre précis attire plus de réponses qu'un *"AIDE SVP"*.</p>
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
                                    value={classLevel}
                                    onChange={(e) => setClassLevel(e.target.value)}
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

                    {/* Section 2 — Décrire le problème (2 éditeurs unifiés) */}
                    <section className="space-y-4">
                        <SectionHeader
                            n={2}
                            title="Décris ton problème"
                            subtitle="Les deux sections sont obligatoires — elles aident les autres à comprendre où tu en es."
                        />

                        <div className="rounded-xl border border-gray-200 p-5 space-y-6 bg-gray-50/40">
                            {/* Sous-bloc 1 — Ce que j'ai fait */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700">
                                        <PenLine size={15} />
                                    </span>
                                    <h4 className="font-semibold text-sm uppercase tracking-wide text-blue-900">
                                        Ce que j'ai fait
                                    </h4>
                                    <span className="text-red-500">*</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">
                                    Décris ton raisonnement, tes tentatives, ce que tu as compris. Pas besoin que ce soit parfait.
                                </p>
                                <FicheEditor
                                    value={whatIDid}
                                    onChange={setWhatIDid}
                                    placeholder="Ex. J'ai essayé d'appliquer la formule de dérivation… j'ai trouvé X mais je doute de l'étape Y."
                                />
                            </div>

                            <div className="border-t border-dashed border-gray-300" />

                            {/* Sous-bloc 2 — Ce que je cherche */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-700">
                                        <HelpCircle size={15} />
                                    </span>
                                    <h4 className="font-semibold text-sm uppercase tracking-wide text-orange-900">
                                        Ce que je cherche
                                    </h4>
                                    <span className="text-red-500">*</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">
                                    Pose ta question précisément. Sur quoi bloques-tu ? Que veux-tu comprendre ?
                                </p>
                                <FicheEditor
                                    value={whatINeed}
                                    onChange={setWhatINeed}
                                    placeholder="Ex. Comment passer de l'étape Y à l'étape Z ? Quelle règle dois-je appliquer ?"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 3 — Pièces jointes (avec quota photos) */}
                    <section className="space-y-4">
                        <SectionHeader
                            n={3}
                            title="Pièces jointes"
                            subtitle="PDF de cours, photo de l'énoncé… La 1ʳᵉ photo est gratuite, chaque photo suivante coûte 1 point."
                        />

                        <PhotoQuotaBar
                            imageCount={imageCount}
                            photoCount={photoCount}
                            drawingCount={drawingCount}
                            max={MAX_IMAGES}
                            photoCost={photoCost}
                        />

                        <label
                            htmlFor="forum-file-pick"
                            className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                files.length >= MAX_FILES
                                    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                            }`}
                        >
                            <div className="flex items-center gap-2 text-gray-700">
                                <Camera size={20} />
                                <FileUp size={20} />
                            </div>
                            <span className="text-sm font-medium">
                                {files.length >= MAX_FILES
                                    ? "Maximum atteint"
                                    : "Prendre une photo ou choisir un fichier"}
                            </span>
                            <span className="text-xs text-gray-500">PDF · JPG · PNG · HEIC — max 5 fichiers</span>
                        </label>
                        <input
                            id="forum-file-pick"
                            type="file"
                            multiple
                            accept="application/pdf,image/*,.heic,.heif"
                            capture="environment"
                            onChange={handleFilePick}
                            disabled={files.length >= MAX_FILES}
                            hidden
                        />

                        {files.length > 0 && (
                            <ul className="space-y-2">
                                {files.map((f, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <span className="truncate">
                                            {f.type.startsWith("image/") ? "🖼️" : "📎"} {f.name}
                                            <span className="text-gray-400 text-xs ml-2">
                                                ({Math.round(f.size / 1024)} Ko)
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 text-gray-500"
                                        >
                                            <X size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Section 4 — Mise & coût */}
                    <section className="space-y-3">
                        <SectionHeader
                            n={4}
                            title="Ta mise"
                            subtitle="Plus tu mises, plus ta question attire l'attention. Tu récupères tout si personne ne répond dans les 7 jours."
                        />

                        <PointsTierSelector value={points} onChange={setPoints} />
                        <p className="text-xs text-gray-500 text-center">
                            Tu peux aussi entrer un nombre personnalisé (1–15) :
                            <input
                                type="number"
                                min={1}
                                max={15}
                                value={points}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value || "0", 10);
                                    if (!isNaN(v)) setPoints(Math.max(1, Math.min(15, v)));
                                }}
                                className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                        </p>

                        <CostBlock
                            points={points}
                            imageCount={imageCount}
                            photoCount={photoCount}
                            drawingCount={drawingCount}
                            photoCost={photoCost}
                            totalCost={totalCost}
                            userPoints={userPoints}
                            hasEnoughPoints={hasEnoughPoints}
                        />
                    </section>

                    {/* Publier */}
                    <div className="pt-2 border-t border-gray-100">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !hasEnoughPoints}
                            className={`w-full py-4 text-base font-semibold ${
                                !hasEnoughPoints
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : isSubmitting
                                    ? "bg-gray-500 cursor-not-allowed"
                                    : "bg-black hover:bg-gray-800"
                            } text-white`}
                        >
                            {isSubmitting ? (
                                "Envoi en cours…"
                            ) : (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    Publier la question
                                    <span className="inline-flex items-center gap-1 bg-white/15 rounded px-2 py-0.5 text-sm">
                                        {totalCost} <PointsIcon size={14} />
                                    </span>
                                </span>
                            )}
                        </Button>
                        <p className="mt-3 text-xs text-gray-500 text-center">
                            En publiant, tu acceptes que ta question soit visible par toute la communauté Workyt.
                        </p>
                    </div>
                </form>
            </div>
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

function PhotoQuotaBar({
    imageCount,
    photoCount,
    drawingCount,
    max,
    photoCost,
}: {
    imageCount: number;
    photoCount: number;
    drawingCount: number;
    max: number;
    photoCost: number;
}) {
    let nudge: string | null = null;
    if (imageCount > max) nudge = `Maximum dépassé (${imageCount}/${max}). Retire des photos ou des dessins.`;
    else if (imageCount === max) nudge = "Maximum atteint.";
    else if (imageCount === max - 1) nudge = "Tu peux décrire le reste par écrit — souvent plus clair pour les autres.";

    const detail = [
        photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? "s" : ""}` : null,
        drawingCount > 0 ? `${drawingCount} dessin${drawingCount > 1 ? "s" : ""}` : null,
    ]
        .filter(Boolean)
        .join(" · ");

    const overLimit = imageCount > max;

    return (
        <div className={`rounded-lg border p-3 text-sm ${overLimit ? "bg-red-50 border-red-200" : "bg-orange-50/60 border-orange-100"}`}>
            <div className="flex items-center justify-between mb-1.5">
                <span className={`font-medium inline-flex items-center gap-1.5 ${overLimit ? "text-red-800" : "text-orange-800"}`}>
                    <Camera size={14} /> Images : {imageCount}/{max}
                    {detail && <span className="text-xs font-normal text-gray-600">({detail})</span>}
                </span>
                <span className={`text-xs ${overLimit ? "text-red-700" : "text-orange-700"}`}>
                    {photoCost === 0 ? "1ʳᵉ image gratuite" : `+${photoCost} pt${photoCost > 1 ? "s" : ""} de malus`}
                </span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${overLimit ? "bg-red-100" : "bg-orange-100"}`}>
                <div
                    className={`h-full transition-all ${overLimit ? "bg-red-600" : "bg-gradient-to-r from-orange-400 to-orange-600"}`}
                    style={{ width: `${Math.min(100, (imageCount / max) * 100)}%` }}
                />
            </div>
            {nudge && (
                <p className={`mt-2 text-xs inline-flex items-start gap-1 ${overLimit ? "text-red-700" : "text-orange-700"}`}>
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {nudge}
                </p>
            )}
            <p className="mt-1 text-[11px] text-gray-500">
                Les <b>dessins</b> comptent comme des images.
            </p>
        </div>
    );
}

const TIERS = [
    {
        id: "calme",
        label: "Petite question",
        hint: "Sans urgence",
        values: [1, 3, 5],
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        selectedBg: "bg-emerald-500",
        selectedText: "text-white",
        ring: "ring-emerald-300",
        accent: "text-emerald-600",
    },
    {
        id: "normal",
        label: "Question normale",
        hint: "Standard pour avoir des réponses",
        values: [7, 9, 10],
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        selectedBg: "bg-orange-500",
        selectedText: "text-white",
        ring: "ring-orange-300",
        accent: "text-orange-600",
    },
    {
        id: "urgent",
        label: "Question urgente",
        hint: "Réponse rapide souhaitée",
        values: [12, 14, 15],
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        selectedBg: "bg-red-500",
        selectedText: "text-white",
        ring: "ring-red-300",
        accent: "text-red-600",
    },
];

function PointsTierSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIERS.map((tier) => {
                const isActiveTier = tier.values.includes(value);
                return (
                    <div
                        key={tier.id}
                        className={`rounded-xl border p-3 transition-all ${tier.bg} ${tier.border} ${
                            isActiveTier ? `ring-2 ${tier.ring}` : ""
                        }`}
                    >
                        <div className="mb-2">
                            <h4 className={`font-semibold text-sm ${tier.text}`}>{tier.label}</h4>
                            <p className="text-[11px] text-gray-600 leading-snug">{tier.hint}</p>
                        </div>
                        <div className="flex gap-1.5">
                            {tier.values.map((p) => {
                                const selected = value === p;
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => onChange(p)}
                                        className={`flex-1 px-2 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${
                                            selected
                                                ? `${tier.selectedBg} ${tier.selectedText}`
                                                : `bg-white ${tier.accent} hover:opacity-80 border border-gray-200`
                                        }`}
                                    >
                                        <PointsIcon size={14} /> {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CostBlock({
    points,
    imageCount,
    photoCount,
    drawingCount,
    photoCost,
    totalCost,
    userPoints,
    hasEnoughPoints,
}: {
    points: number;
    imageCount: number;
    photoCount: number;
    drawingCount: number;
    photoCost: number;
    totalCost: number;
    userPoints: number | null;
    hasEnoughPoints: boolean;
}) {
    const remaining = userPoints != null ? userPoints - totalCost : null;
    return (
        <div
            className={`rounded-xl border p-4 ${
                hasEnoughPoints ? "border-gray-200 bg-white" : "border-red-300 bg-red-50"
            }`}
        >
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <PointsIcon size={16} /> Coût de ta publication
            </h4>
            <ul className="text-sm space-y-1.5">
                <li className="flex items-center justify-between">
                    <span className="text-gray-600">Mise sur la question</span>
                    <span className="font-medium inline-flex items-center gap-1">{points} <PointsIcon size={14} /></span>
                </li>
                <li className="flex items-center justify-between">
                    <span className="text-gray-600">
                        Images {imageCount > 0 ? (
                            <span className="text-xs">
                                ({photoCount > 0 && `${photoCount} photo${photoCount > 1 ? "s" : ""}`}
                                {photoCount > 0 && drawingCount > 0 && " + "}
                                {drawingCount > 0 && `${drawingCount} dessin${drawingCount > 1 ? "s" : ""}`}, 1ʳᵉ gratuite)
                            </span>
                        ) : ""}
                    </span>
                    <span className="font-medium inline-flex items-center gap-1">{photoCost} <PointsIcon size={14} /></span>
                </li>
                <li className="border-t border-gray-100 pt-2 flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span className={`inline-flex items-center gap-1 ${hasEnoughPoints ? "text-orange-600" : "text-red-600"}`}>
                        {totalCost} <PointsIcon size={14} />
                    </span>
                </li>
            </ul>
            {userPoints != null && (
                <p className="mt-3 text-xs text-gray-500 inline-flex items-center gap-1 flex-wrap">
                    Ton solde : <b className="inline-flex items-center gap-1">{userPoints} <PointsIcon size={12} /></b>
                    {remaining != null && (
                        <>
                            <span>→</span>
                            {hasEnoughPoints ? (
                                <span className="inline-flex items-center gap-1">
                                    il te restera <b className="inline-flex items-center gap-1">{remaining} <PointsIcon size={12} /></b>
                                </span>
                            ) : (
                                <span className="text-red-600 font-semibold inline-flex items-center gap-1">
                                    il te manque {Math.abs(remaining)} <PointsIcon size={12} />
                                </span>
                            )}
                        </>
                    )}
                </p>
            )}
        </div>
    );
}
