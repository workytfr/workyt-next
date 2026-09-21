"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { sharedRemarkPlugins, sharedRehypePlugins } from "@/lib/markdownPlugins";
import "katex/dist/katex.min.css";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileAvatar from "@/components/ui/profile";
import UsernameDisplay from "@/components/ui/UsernameDisplay";
import {
    FileText,
    ArrowLeft,
    BookOpen,
    ChevronRight,
    MessageCircle,
    Lock,
    RefreshCw,
    AlertTriangle,
    HeartHandshake,
    ArrowUpRight,
    PenLine,
    CalendarDays,
} from "lucide-react";
import FileViewer from "@/app/fiches/_components/FileViewer";
import LikedByList from "@/app/fiches/_components/LikedByList";
import CommentsList from "@/app/fiches/_components/CommentsList";
import StatusChanger from "@/app/fiches/_components/StatusChanger";
import DeleteFicheButton from "@/app/fiches/_components/DeleteFicheButton";
import ReportButton from "@/components/ReportButton";
import BookmarkButton from "@/components/BookmarkButton";
import { PAGE_CONTAINER, SubjectLabel, LevelChip } from "@/components/wk/primitives";
import { subjectToSlug, levelToSlug } from "@/utils/subjectSlug";
import { FicheStatusChip, ficheStatusTint } from "./ficheUi";

interface FicheViewProps {
    id: string;
    initialFiche?: any;
}

/** Ouvre la fenêtre de connexion de la navbar (il n'existe pas de page /connexion) */
const openAuth = () => window.dispatchEvent(new Event("workyt:open-auth"));

export default function FicheView({ id, initialFiche }: FicheViewProps) {
    const { data: session } = useSession();
    const currentUser = session?.user || null;

    const [fiche, setFiche] = useState<any>(initialFiche ?? null);
    const [loading, setLoading] = useState(!initialFiche);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    // `silent` : rafraîchissement en arrière-plan (pas de skeleton ni d'erreur visible).
    // Utilisé quand la fiche est déjà pré-rendue côté serveur : la page peut être
    // mise en cache statiquement (generateStaticParams), donc on resynchronise les
    // compteurs dynamiques (likes, commentaires) avec la valeur réelle en base.
    const fetchFiche = async (silent = false) => {
        if (!id) {
            setError("Aucun ID de fiche trouvé.");
            setLoading(false);
            return;
        }

        if (!silent) {
            setLoading(true);
            setError(null);
            setIsRetrying(retryCount > 0);
        }

        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`/api/fiches/${id}?t=${cacheBuster}`, {
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Erreur serveur" }));
                throw new Error(errorData.message || `Erreur ${response.status}: Impossible de récupérer la fiche.`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Erreur lors de la récupération des données.");
            }

            setFiche(data.data);
        } catch (err) {
            console.error("Erreur lors de la récupération de la fiche :", err);
            if (silent) return; // en arrière-plan : on garde la donnée pré-rendue
            const errorMessage = err instanceof Error ? err.message : "Erreur de connexion au serveur";

            if (errorMessage.includes("buffering timed out") || errorMessage.includes("timed out after")) {
                setError("Le serveur de base de données met trop de temps à répondre. Veuillez réessayer.");
            } else {
                setError(errorMessage);
            }
        } finally {
            if (!silent) {
                setLoading(false);
                setIsRetrying(false);
            }
        }
    };

    useEffect(() => {
        // Si la donnée est déjà pré-chargée côté serveur, on affiche instantanément
        // (SEO + paint rapide) puis on rafraîchit silencieusement pour des compteurs
        // likes/commentaires toujours à jour, même si la page est en cache statique.
        if (initialFiche && retryCount === 0) {
            fetchFiche(true);
            return;
        }
        fetchFiche();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, retryCount]);

    const handleRetry = () => {
        setRetryCount(prevCount => prevCount + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--wk-paper)]">
                <div className={`${PAGE_CONTAINER} py-10`}>
                    {isRetrying && (
                        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-[rgba(255,106,26,0.15)]">
                            <div className="h-full w-1/2 animate-pulse bg-[var(--wk-accent)]" />
                        </div>
                    )}
                    <Skeleton className="h-4 w-48 rounded-full" />
                    <Skeleton className="mt-6 h-12 w-2/3 rounded-2xl" />
                    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <Skeleton className="h-[420px] rounded-3xl" />
                        <Skeleton className="h-[260px] rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--wk-paper)]">
                <div className="mx-auto max-w-xl px-4 py-16">
                    <div className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-8 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <AlertTriangle className="h-7 w-7" />
                        </span>
                        <h2 className="font-serif-display mt-4 text-3xl">Une erreur est survenue</h2>
                        <p className="mt-2 text-sm text-[rgba(26,21,18,0.65)]">{error}</p>
                        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                            <button type="button" onClick={handleRetry} className="wk-btn-orange justify-center !py-2.5 text-sm">
                                <RefreshCw className="h-4 w-4" /> Réessayer
                            </button>
                            <Link href="/fiches" className="wk-btn-ghost justify-center !py-2.5 text-sm">
                                <ArrowLeft className="h-4 w-4" /> Retour aux fiches
                            </Link>
                        </div>
                        <ul className="mt-8 space-y-1 border-t border-[rgba(26,21,18,0.06)] pt-6 text-left text-sm text-[rgba(26,21,18,0.6)]">
                            <li>· Vérifie ta connexion internet</li>
                            <li>· Le serveur peut être momentanément surchargé</li>
                            <li>· La fiche a peut-être été supprimée</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    const allowedRoles = ["Helpeur", "Rédacteur", "Correcteur", "Admin"];
    const userHasPermission = allowedRoles.includes(currentUser?.role ?? "");
    const isCreator = currentUser && fiche && currentUser.id === fiche.author._id.toString();
    const isAdmin = currentUser?.role === "Admin";

    // Type du premier fichier joint
    const firstFileUrl = fiche.files?.[0] || "";
    const firstFileBase = firstFileUrl.split("?")[0].toLowerCase();
    const hasPdfFile = fiche.files?.length > 0 && firstFileBase.endsWith(".pdf");
    const hasImageFile =
        fiche.files?.length > 0 &&
        (firstFileBase.endsWith(".jpg") || firstFileBase.endsWith(".jpeg") || firstFileBase.endsWith(".png") || firstFileBase.endsWith(".webp"));

    const card = "rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white";
    const commentsCount = fiche.comments?.length || 0;

    return (
        <div className="min-h-screen bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            {/* ─── En-tête ─── */}
            <header className="border-b border-[rgba(26,21,18,0.08)]">
                <div className={`${PAGE_CONTAINER} pb-8 pt-8 md:pb-10 md:pt-10`}>
                    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-[rgba(26,21,18,0.55)]">
                        <Link href="/" className="hover:text-[var(--wk-accent)]">Accueil</Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link href="/fiches" className="hover:text-[var(--wk-accent)]">Fiches</Link>
                        {fiche.subject && (
                            <>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <Link href={`/fiches/matiere/${subjectToSlug(fiche.subject)}`} className="hover:text-[var(--wk-accent)]">{fiche.subject}</Link>
                            </>
                        )}
                        {fiche.level && (
                            <>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <Link href={`/fiches/niveau/${levelToSlug(fiche.level)}`} className="hover:text-[var(--wk-accent)]">{fiche.level}</Link>
                            </>
                        )}
                    </nav>

                    <div className="mt-6 flex flex-wrap items-center gap-2.5">
                        {fiche.subject && <SubjectLabel subject={fiche.subject} />}
                        {fiche.level && <LevelChip level={fiche.level} />}
                        <FicheStatusChip status={fiche.status} />
                    </div>
                    <h1 className="font-serif-display mt-4 max-w-5xl text-[clamp(1.9rem,4vw,3.25rem)] leading-[1.02]">{fiche.title}</h1>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <div className="flex items-center gap-3">
                            <ProfileAvatar
                                username={fiche.author?.username || "Inconnu"}
                                points={fiche.author?.points || 0}
                                userId={fiche.author?._id}
                                role={fiche.author?.role}
                                size="small"
                            />
                            <div className="leading-tight">
                                <Link href={`/compte/${fiche.author?._id}`} className="hover:underline">
                                    <UsernameDisplay
                                        username={fiche.author?.username || "Inconnu"}
                                        userId={fiche.author?._id}
                                        className="text-sm font-semibold"
                                        role={fiche.author?.role}
                                    />
                                </Link>
                                <span className="flex items-center gap-1 text-xs text-[rgba(26,21,18,0.5)]">
                                    <CalendarDays className="h-3 w-3" />
                                    Publiée le {new Date(fiche.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                        {fiche.courseId && (
                            <Link
                                href={`/cours/${fiche.courseId._id || fiche.courseId}`}
                                className="wk-chip !py-1.5 transition hover:border-[var(--wk-accent)] hover:text-[#c24a0a]"
                            >
                                <BookOpen className="h-3.5 w-3.5" />
                                {fiche.courseId.title || "Voir le cours"}
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className={`${PAGE_CONTAINER} py-8 md:py-10`}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
                    {/* ─── Colonne principale ─── */}
                    <main className="min-w-0 space-y-6">
                        <article className={`${card} overflow-hidden`} style={ficheStatusTint(fiche.status)}>
                            {/* Aperçu image (seulement pour les images, pas les PDF) */}
                            {hasImageFile && (
                                <div className="aspect-video w-full overflow-hidden border-b border-[rgba(26,21,18,0.06)] bg-[var(--wk-paper)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={`/api/file-proxy?ficheId=${fiche._id}&index=0`} alt="Aperçu de la fiche" className="h-full w-full object-contain" />
                                </div>
                            )}
                            {fiche.content ? (
                                <div className="prose max-w-none p-5 text-[rgba(26,21,18,0.88)] prose-headings:font-serif-display prose-headings:font-normal prose-headings:text-[var(--wk-ink)] sm:p-8">
                                    <ReactMarkdown remarkPlugins={sharedRemarkPlugins} rehypePlugins={sharedRehypePlugins as any}>
                                        {fiche.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                !hasImageFile && (
                                    <p className="p-8 text-sm text-[rgba(26,21,18,0.55)]">Cette fiche est un document : il s&apos;affiche juste en dessous.</p>
                                )
                            )}
                        </article>

                        {/* Fichiers attachés (lecteur PDF intégré) */}
                        {fiche.files?.length > 0 && (
                            <section className={`${card} overflow-hidden p-5 sm:p-6`}>
                                <h2 className="font-serif-display mb-4 flex items-center gap-2 text-2xl">
                                    <FileText className="h-5 w-5 text-[var(--wk-accent)]" />
                                    {hasPdfFile ? "Document" : "Fichiers attachés"}
                                    <span className="text-base text-[rgba(26,21,18,0.45)]">({fiche.files.length})</span>
                                </h2>
                                <FileViewer ficheId={fiche._id} files={fiche.files} />
                            </section>
                        )}

                        {/* Commentaires */}
                        <section className={`${card} overflow-hidden p-5 sm:p-6`} aria-label="Commentaires">
                            {!currentUser && (
                                <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl bg-[var(--wk-paper)] p-5 text-center sm:flex-row sm:text-left">
                                    <MessageCircle className="h-5 w-5 shrink-0 text-[rgba(26,21,18,0.45)]" />
                                    <p className="flex-1 text-sm text-[rgba(26,21,18,0.65)]">Connecte-toi pour commenter cette fiche.</p>
                                    <button type="button" onClick={openAuth} className="wk-btn-ink !py-2 text-sm">Se connecter</button>
                                </div>
                            )}
                            <CommentsList
                                revisionId={fiche._id}
                                ficheAuthorId={fiche.author?._id}
                                currentUser={currentUser ? { username: (currentUser as any).username, id: (currentUser as any).id } : null}
                            />
                        </section>
                    </main>

                    {/* ─── Panneau latéral ─── */}
                    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                        <div className={`${card} p-5`}>
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                                    <MessageCircle className="h-4 w-4" />
                                    {commentsCount} commentaire{commentsCount > 1 ? "s" : ""}
                                </span>
                                <div className="flex items-center gap-1">
                                    <BookmarkButton revisionId={fiche._id} size="sm" />
                                    <ReportButton contentId={fiche._id} contentType="revision" variant="dropdown" />
                                </div>
                            </div>
                            <div className="mt-4 border-t border-[rgba(26,21,18,0.06)] pt-4">
                                <LikedByList revisionId={fiche._id} likedBy={fiche.likedBy || []} initialLikes={fiche.likes || 0} />
                            </div>
                        </div>

                        {/* Relecture : réservé à l'équipe et à l'auteur */}
                        {(userHasPermission || isCreator) && (
                            <div className={`${card} p-5`}>
                                <h2 className="flex items-center gap-2 text-sm font-semibold">
                                    <Lock className="h-4 w-4" /> Actions sur la fiche
                                </h2>
                                <div className="mt-4 space-y-4">
                                    {userHasPermission && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgba(26,21,18,0.5)]">Statut</p>
                                            <StatusChanger
                                                ficheId={fiche._id}
                                                currentStatus={fiche.status}
                                                onStatusChange={(newStatus) => setFiche((prev: any) => ({ ...prev, status: newStatus }))}
                                            />
                                        </div>
                                    )}
                                    {(isCreator || isAdmin) && (
                                        <div className="border-t border-[rgba(26,21,18,0.06)] pt-4">
                                            <DeleteFicheButton ficheId={fiche._id} ficheTitle={fiche.title} isCreator={isCreator} isAdmin={isAdmin} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <Link
                            href={`/suivi?${new URLSearchParams({ subject: fiche.subject || "", level: fiche.level || "" })}#demande`}
                            className="group block rounded-3xl bg-[var(--wk-ink)] p-5 text-[var(--wk-paper)] transition hover:-translate-y-0.5"
                        >
                            <HeartHandshake className="h-6 w-6 text-[var(--wk-accent-2)]" />
                            <p className="font-serif-display mt-3 text-2xl leading-tight">Un examen qui approche ?</p>
                            <p className="mt-1.5 text-sm text-white/65">Un bénévole de l&apos;association peut t&apos;aider à réviser. Gratuit.</p>
                            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--wk-accent-2)]">
                                Demander un suivi <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                        </Link>

                        {fiche.subject && (
                            <div className="rounded-3xl bg-[var(--wk-paper-2)] p-5 text-sm">
                                <p className="font-semibold">Continuer en {fiche.subject}</p>
                                <div className="mt-3 flex flex-col gap-2">
                                    <Link href={`/fiches/matiere/${subjectToSlug(fiche.subject)}`} className="inline-flex items-center gap-2 font-medium text-[rgba(26,21,18,0.75)] hover:text-[var(--wk-accent)]">
                                        <FileText className="h-4 w-4" /> Toutes les fiches de {fiche.subject}
                                    </Link>
                                    <Link href="/fiches/creer" className="inline-flex items-center gap-2 font-medium text-[rgba(26,21,18,0.75)] hover:text-[var(--wk-accent)]">
                                        <PenLine className="h-4 w-4" /> Déposer ma propre fiche
                                    </Link>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
