"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import { sharedRemarkPlugins, sharedRehypePlugins } from "@/lib/markdownPlugins";
import {
    extractMentionIds,
    preprocessMentions,
} from "@/lib/mentionsExtract";
import MentionPill from "./MentionPill";

interface MentionMarkdownProps {
    content: string | null | undefined;
    /** Hint : usernames déjà connus côté client (auteur question + répondants). */
    knownUsers?: Array<{ _id: string; username: string }>;
    className?: string;
}

// Cache global en mémoire pour éviter les fetchs redondants entre composants.
const userCache = new Map<string, { username: string }>();
let inflight: Map<string, Promise<void>> = new Map();

async function fetchUsersBatch(ids: string[]): Promise<void> {
    const missing = ids.filter((id) => !userCache.has(id) && !inflight.has(id));
    if (missing.length === 0) return;

    const promise = (async () => {
        try {
            const res = await fetch("/api/users/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: missing }),
            });
            if (!res.ok) return;
            const data = await res.json();
            for (const u of data.users ?? []) {
                userCache.set(u._id, { username: u.username });
            }
        } catch (err) {
            console.warn("Erreur fetch users batch :", err);
        } finally {
            for (const id of missing) inflight.delete(id);
        }
    })();

    for (const id of missing) inflight.set(id, promise);
    await promise;
}

/**
 * Rendu d'un markdown qui peut contenir des mentions `@[user:id]`.
 * - Résout les usernames au montage via batch fetch
 * - Affiche un MentionPill (avatar + @pseudo) pour chaque mention
 * - Toujours à jour avec le pseudo actuel
 */
export default function MentionMarkdown({ content, knownUsers, className }: MentionMarkdownProps) {
    const [, force] = useState(0);

    // Pré-remplit le cache avec les usernames qu'on connaît déjà
    useEffect(() => {
        if (!knownUsers) return;
        for (const u of knownUsers) {
            if (u?._id && u?.username) {
                userCache.set(String(u._id), { username: u.username });
            }
        }
    }, [knownUsers]);

    const ids = useMemo(() => extractMentionIds(content), [content]);

    useEffect(() => {
        if (ids.length === 0) return;
        const unknown = ids.filter((id) => !userCache.has(id));
        if (unknown.length === 0) return;
        fetchUsersBatch(unknown).then(() => force((n) => n + 1));
    }, [ids]);

    const processed = useMemo(
        () => preprocessMentions(content || "", userCache),
        // userCache est muté de l'extérieur, on force le re-render via `force`
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [content, ids.join(","), userCache.size],
    );

    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={sharedRemarkPlugins}
                rehypePlugins={sharedRehypePlugins as any}
                components={{
                    a: ({ href, children, ...props }) => {
                        // Détection du marqueur ?m=1 ajouté par preprocessMentions
                        if (href && /[?&]m=1(?:&|$)/.test(href)) {
                            const userId = href
                                .replace(/\?.*$/, "")
                                .replace(/^\/compte\//, "");
                            const label = String(children).replace(/^@/, "");
                            return <MentionPill userId={userId} username={label} />;
                        }
                        return (
                            <a href={href} {...props}>
                                {children}
                            </a>
                        );
                    },
                }}
            >
                {processed}
            </ReactMarkdown>
        </div>
    );
}
