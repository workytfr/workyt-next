"use client";

import { useEffect, useState } from "react";

/**
 * Avatar réel d'un membre pour le Kanban : utilise la photo de profil
 * personnalisée si elle est active, sinon l'avatar génératif du site
 * (/api/avatar/[id]) — identique à ProfileAvatar.
 *
 * Les personnalisations sont mises en cache (et dédupliquées) au niveau du
 * module pour éviter une requête par carte.
 */

type Resolved = string; // URL de l'image à afficher

const cache = new Map<string, Resolved>();
const inflight = new Map<string, Promise<Resolved>>();

function resolveAvatar(userId: string): Promise<Resolved> {
    if (cache.has(userId)) return Promise.resolve(cache.get(userId)!);
    if (inflight.has(userId)) return inflight.get(userId)!;

    const p = (async () => {
        const fallback = `/api/avatar/${userId}?size=64`;
        try {
            const res = await fetch(`/api/users/${userId}/customization`);
            if (res.ok) {
                const data = await res.json();
                const pi = data?.data?.customization?.profileImage;
                if (data?.success && pi?.isActive && pi?.filename) {
                    const url = `/profile/${pi.filename}`;
                    cache.set(userId, url);
                    return url;
                }
            }
        } catch {
            /* ignore — on retombe sur l'avatar génératif */
        }
        cache.set(userId, fallback);
        return fallback;
    })();

    inflight.set(userId, p);
    p.finally(() => inflight.delete(userId));
    return p;
}

interface Props {
    userId: string;
    username: string;
    /** Diamètre en pixels (défaut 24). */
    size?: number;
    className?: string;
}

export default function KanbanAvatar({ userId, username, size = 24, className = "" }: Props) {
    const [src, setSrc] = useState<string>(() => cache.get(userId) || "");

    useEffect(() => {
        let cancelled = false;
        if (cache.has(userId)) {
            setSrc(cache.get(userId)!);
            return;
        }
        resolveAvatar(userId).then((url) => {
            if (!cancelled) setSrc(url);
        });
        return () => {
            cancelled = true;
        };
    }, [userId]);

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src || `/api/avatar/${userId}?size=64`}
            alt={username}
            width={size}
            height={size}
            style={{ width: size, height: size }}
            className={`rounded-full border-2 border-white object-cover bg-gray-100 ${className}`}
        />
    );
}
