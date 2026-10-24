"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export interface FicheLiker {
    userId: { _id: string; username: string };
    likedAt: string;
}

/** Ouvre la fenêtre de connexion de la navbar */
const openAuth = () => window.dispatchEvent(new Event("workyt:open-auth"));

/**
 * État du « J'aime » d'une fiche, partagé entre le bouton du panneau latéral et
 * l'encart de fin de fiche. Aimer / retirer son like est optimiste.
 */
export function useFicheLike(
    revisionId: string | undefined,
    initialLikes: number,
    initialLikedBy: FicheLiker[] | undefined,
    ficheAuthorId: string | undefined,
) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken as string | undefined;
    const me = session?.user as { id?: string; username?: string; name?: string } | undefined;
    const isAuthor = !!me?.id && !!ficheAuthorId && me.id === ficheAuthorId;

    const [likes, setLikes] = useState(initialLikes);
    const [hasLiked, setHasLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pop, setPop] = useState(0);

    // La fiche est rafraîchie en arrière-plan (cache statique → valeur réelle)
    const [syncedInitial, setSyncedInitial] = useState(initialLikes);
    if (initialLikes !== syncedInitial) {
        setSyncedInitial(initialLikes);
        if (!loading) setLikes(initialLikes);
    }

    useEffect(() => {
        if (!token || !revisionId) return;
        let cancelled = false;
        fetch(`/api/likes?revisionId=${revisionId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled && data.success) setHasLiked(!!data.hasLiked);
            })
            .catch(() => {
                /* le bouton reste utilisable */
            });
        return () => {
            cancelled = true;
        };
    }, [revisionId, token]);

    const toggle = useCallback(async () => {
        if (!revisionId || loading) return;
        if (!token) return openAuth();
        if (isAuthor) {
            toast("C'est ta fiche ! Les likes viennent des autres élèves 😉");
            return;
        }
        const wasLiked = hasLiked;
        setHasLiked(!wasLiked);
        setLikes((n) => Math.max(0, n + (wasLiked ? -1 : 1)));
        if (!wasLiked) setPop((n) => n + 1);
        setLoading(true);
        try {
            const res = await fetch(
                wasLiked ? `/api/likes?revisionId=${revisionId}` : "/api/likes",
                {
                    method: wasLiked ? "DELETE" : "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: wasLiked ? undefined : JSON.stringify({ revisionId }),
                },
            );
            const data = await res.json().catch(() => ({}));
            if (res.status === 429) throw new Error("Doucement ! Réessaie dans quelques secondes.");
            if (!res.ok || !data.success) throw new Error(data.message || data.error || "Action impossible pour le moment.");
            setLikes(data.likes);
            setHasLiked(!!data.hasLiked);
        } catch (err: any) {
            setHasLiked(wasLiked);
            setLikes((n) => Math.max(0, n + (wasLiked ? 1 : -1)));
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [revisionId, loading, token, isAuthor, hasLiked]);

    // Liste des personnes, la plus récente d'abord, avec soi-même tout de suite
    const likers = useMemo(() => {
        const valid = (initialLikedBy ?? []).filter(
            (l): l is FicheLiker => !!l?.userId && typeof l.userId === "object" && !!l.userId._id && !!l.userId.username,
        );
        const others = valid
            .filter((l) => l.userId._id !== me?.id)
            .sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());
        if (!hasLiked || !me?.id) return others;
        const mine = valid.find((l) => l.userId._id === me.id) ?? {
            userId: { _id: me.id, username: me.username || me.name || "Moi" },
            likedAt: new Date(0).toISOString(),
        };
        return [mine, ...others];
    }, [initialLikedBy, hasLiked, me]);

    return { likes, hasLiked, loading, isAuthor, isLoggedIn: !!token, toggle, likers, pop };
}

export type FicheLikeState = ReturnType<typeof useFicheLike>;
