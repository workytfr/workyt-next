"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAuthHeaders } from "./CourseShell";

/**
 * Données d'une page de lecture. Rendues par le serveur pour le contenu publié
 * (`initial`) ; pour un brouillon, chargées avec les droits de l'auteur via
 * /api/cours/[courseId]/lecture?<query>.
 */
export function useReaderData<T>(courseId: string, query: string, initial: T | null) {
    const { status } = useSession();
    const headers = useAuthHeaders();
    const [fetched, setFetched] = useState<{ query: string; data: T | null; error: boolean } | null>(null);

    useEffect(() => {
        if (initial || status === "loading") return;
        let alive = true;
        fetch(`/api/cours/${courseId}/lecture?${query}`, { headers })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((json) => alive && setFetched({ query, data: json as T, error: false }))
            .catch(() => alive && setFetched({ query, data: null, error: true }));
        return () => {
            alive = false;
        };
    }, [courseId, query, initial, status, headers]);

    const own = fetched?.query === query ? fetched : null;
    return { data: initial ?? own?.data ?? null, error: !initial && !!own?.error };
}
