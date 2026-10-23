"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/Drawer";
import { Skeleton } from "@/components/ui/skeleton";
import CourseSidebar from "./CourseSidebar";
import { countLessons, type Curriculum } from "../courseLinks";

interface CourseContextValue {
    curriculum: Curriculum;
    /** En-têtes d'authentification pour les appels API (brouillons, progression) */
    authHeaders: Record<string, string>;
    readLessons: Set<string>;
    lastLessonId: string | null;
    percentage: number;
    markLessonRead: (lessonId: string, sectionId: string) => void;
}

const CourseContext = createContext<CourseContextValue | null>(null);

export function useCourse() {
    const value = useContext(CourseContext);
    if (!value) throw new Error("useCourse doit être utilisé dans <CourseShell>");
    return value;
}

export function useAuthHeaders() {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken as string | undefined;
    return useMemo((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
}

const STATUS_LABEL: Record<string, string> = {
    en_attente_verification: "À vérifier",
    en_attente_publication: "En attente de publication",
    annule: "Annulé",
};

/**
 * Coque de lecture commune à l'accueil du cours, aux leçons, exercices et quiz :
 * sommaire à gauche (tiroir sur mobile), progression de l'élève.
 *
 * `initialCurriculum` est rendu côté serveur pour un cours publié. Pour un
 * brouillon il vaut null : on le charge avec les droits de l'auteur.
 */
export default function CourseShell({
    courseId,
    initialCurriculum,
    children,
}: {
    courseId: string;
    initialCurriculum: Curriculum | null;
    children: React.ReactNode;
}) {
    const { data: session, status: sessionStatus } = useSession();
    const authHeaders = useAuthHeaders();
    const pathname = usePathname();
    const [draftCurriculum, setDraftCurriculum] = useState<Curriculum | null>(null);
    // Publié : le sommaire vient du serveur (et suit ses revalidations) ; brouillon : chargé ici
    const curriculum = initialCurriculum ?? draftCurriculum;
    const [error, setError] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [readLessons, setReadLessons] = useState<Set<string>>(new Set());
    const [lastLessonId, setLastLessonId] = useState<string | null>(null);
    const pendingRead = useRef<string | null>(null);

    // Brouillon : chargement avec les droits de l'auteur
    useEffect(() => {
        if (initialCurriculum || sessionStatus === "loading") return;
        fetch(`/api/cours/${courseId}/lecture`, { headers: authHeaders })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data) => setDraftCurriculum(data.curriculum))
            .catch(() => setError("Ce cours n'existe pas ou n'est pas encore publié."));
    }, [courseId, initialCurriculum, sessionStatus, authHeaders]);

    // Progression de l'élève connecté
    useEffect(() => {
        if (!session?.user) return;
        fetch(`/api/cours/${courseId}/progress`, { headers: authHeaders })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data?.progress) return;
                setReadLessons(new Set<string>(data.progress.lessonsRead || []));
                setLastLessonId(data.progress.lastLessonId || null);
            })
            .catch(() => {});
    }, [courseId, session?.user, authHeaders]);

    const markLessonRead = useCallback(
        (lessonId: string, sectionId: string) => {
            if (!session?.user || pendingRead.current === lessonId) return;
            pendingRead.current = lessonId;
            setLastLessonId(lessonId);
            fetch(`/api/cours/${courseId}/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({ lessonId, sectionId }),
            })
                .then((res) => {
                    if (res.ok) setReadLessons((prev) => new Set(prev).add(lessonId));
                })
                .catch(() => {})
                .finally(() => {
                    pendingRead.current = null;
                });
        },
        [courseId, session?.user, authHeaders]
    );

    // Le tiroir mobile se referme quand on change de page
    const [drawerPath, setDrawerPath] = useState(pathname);
    if (drawerPath !== pathname) {
        setDrawerPath(pathname);
        setDrawerOpen(false);
    }

    const percentage = useMemo(() => {
        if (!curriculum) return 0;
        const total = countLessons(curriculum);
        if (total === 0) return 0;
        const read = curriculum.sections.reduce(
            (n, s) => n + s.lessons.filter((l) => readLessons.has(l._id)).length,
            0
        );
        return Math.round((read / total) * 100);
    }, [curriculum, readLessons]);

    if (error) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-[var(--wk-paper)] p-6">
                <div className="max-w-md text-center">
                    <p className="font-serif-display text-3xl">Cours introuvable</p>
                    <p className="mt-2 text-[rgba(26,21,18,0.65)]">{error}</p>
                </div>
            </div>
        );
    }

    if (!curriculum) {
        return (
            <div className="mx-auto flex max-w-[1440px] gap-8 bg-[var(--wk-paper)] px-4 py-8 md:px-8">
                <div className="hidden w-72 shrink-0 space-y-3 md:block">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        );
    }

    const value: CourseContextValue = { curriculum, authHeaders, readLessons, lastLessonId, percentage, markLessonRead };
    const unpublished = curriculum.status !== "publie";

    return (
        <CourseContext.Provider value={value}>
            <div className="min-h-[calc(100dvh-80px)] bg-[var(--wk-paper)] text-[var(--wk-ink)]">
                {unpublished && (
                    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900 print:hidden">
                        <b>Mode prévisualisation</b> — ce cours n&apos;est pas encore publié ({STATUS_LABEL[curriculum.status] ?? "non publié"}).
                        Les visiteurs ne le voient pas.
                    </div>
                )}

                <div className="mx-auto flex min-h-[calc(100dvh-80px)] max-w-[1440px] gap-6 px-3 sm:px-5 lg:gap-10 lg:px-8">
                    {/* Sommaire (bureau) */}
                    <aside className="sticky top-[92px] hidden w-72 shrink-0 self-start pt-6 md:block md:pt-8 print:hidden">
                        <CourseSidebar className="max-h-[calc(100dvh-124px)]" />
                    </aside>

                    <div className="min-w-0 flex-1 pb-28 pt-6 md:pb-16 md:pt-8">{children}</div>
                </div>

                {/* Sommaire (mobile) */}
                <div className="md:hidden print:hidden">
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                        <DrawerTrigger asChild>
                            <button
                                className="wk-btn-orange fixed bottom-6 left-4 z-50 !px-4 !py-3 text-sm"
                                aria-label="Ouvrir le sommaire"
                            >
                                <Menu className="h-5 w-5" /> Sommaire
                            </button>
                        </DrawerTrigger>
                        <DrawerContent className="h-[85vh] rounded-t-3xl bg-[var(--wk-paper)] p-0">
                            <DrawerTitle className="sr-only">Sommaire du cours</DrawerTitle>
                            <div className="h-full overflow-hidden p-3">
                                <CourseSidebar className="h-full" />
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>
        </CourseContext.Provider>
    );
}
