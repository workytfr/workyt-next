"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileAvatar from '@/components/ui/profile';
import { toast } from 'sonner';
import {
    Users,
    UserPlus,
    UserCheck,
    Clock,
    Loader2,
    Check
} from 'lucide-react';

type RelationStatus =
    | 'self'
    | 'none'
    | 'friends'
    | 'pending_sent'
    | 'pending_received'
    | 'blocked';

interface FriendPreview {
    friendshipId: string;
    userId: string;
    username: string;
    avatar: string | null;
    heroLevel: number;
    isOnline: boolean;
}

interface ProfileFriendData {
    count: number;
    preview: FriendPreview[];
    relation: RelationStatus;
    friendshipId: string | null;
}

/**
 * Le composant est monté DEUX fois sur la page de profil (pastille de stats +
 * section). Sans cette mutualisation, la même route partirait deux fois.
 * TTL court : les compteurs doivent rester frais après une action.
 */
const TTL_MS = 5_000;
const cache = new Map<string, { at: number; data: ProfileFriendData }>();
const inflight = new Map<string, Promise<ProfileFriendData | null>>();

async function loadProfileFriends(
    userId: string,
    force = false
): Promise<ProfileFriendData | null> {
    if (force) cache.delete(userId);

    const hit = cache.get(userId);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

    const running = inflight.get(userId);
    if (running) return running;

    const p = (async () => {
        try {
            const res = await fetch(`/api/friends/profile/${userId}`);
            if (!res.ok) return null;
            const { data } = await res.json();
            cache.set(userId, { at: Date.now(), data });
            return data as ProfileFriendData;
        } catch {
            return null;
        } finally {
            inflight.delete(userId);
        }
    })();

    inflight.set(userId, p);
    return p;
}

interface Props {
    /** Utilisateur dont on affiche le profil */
    userId: string;
    username: string;
    /** Rendu compact pour la ligne de statistiques (pastille cliquable) */
    variant?: 'pill' | 'section';
}

/**
 * Bloc « amis » d'une page de profil : compteur, bouton d'ajout et aperçu
 * de la liste. Tout vient d'un seul appel à /api/friends/profile/[userId].
 */
export default function ProfileFriends({ userId, username, variant = 'section' }: Props) {
    const [count, setCount] = useState(0);
    const [preview, setPreview] = useState<FriendPreview[]>([]);
    const [relation, setRelation] = useState<RelationStatus>('none');
    const [friendshipId, setFriendshipId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async (force = false) => {
        // Mutualisé entre les deux instances du composant (pastille + section)
        const data = await loadProfileFriends(userId, force);
        if (data) {
            setCount(data.count);
            setPreview(data.preview);
            setRelation(data.relation);
            setFriendshipId(data.friendshipId);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        load();
    }, [load]);

    const addFriend = async () => {
        setBusy(true);
        try {
            const res = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Erreur');
                return;
            }
            toast.success(data.message || `Demande envoyée à ${username}`);
            load(true); // force : le cache contient encore l'état d'avant
        } catch {
            toast.error('Une erreur est survenue');
        } finally {
            setBusy(false);
        }
    };

    const respond = async (accept: boolean) => {
        if (!friendshipId) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/friends/${friendshipId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accept })
            });
            if (!res.ok) {
                const d = await res.json();
                toast.error(d.error || 'Erreur');
                return;
            }
            toast.success(accept ? `Tu es maintenant ami avec ${username} !` : 'Demande refusée');
            load(true); // force : le cache contient encore l'état d'avant
        } catch {
            toast.error('Une erreur est survenue');
        } finally {
            setBusy(false);
        }
    };

    // Pastille compacte pour la ligne de stats du profil
    if (variant === 'pill') {
        return (
            <span className="wk-chip !px-3.5 !py-2 text-sm">
                <Users className="h-4 w-4" />
                {loading ? '—' : `${count} ami${count > 1 ? 's' : ''}`}
            </span>
        );
    }

    const renderAction = () => {
        if (relation === 'self' || relation === 'blocked') return null;

        if (relation === 'friends') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Vous êtes amis
                </span>
            );
        }

        if (relation === 'pending_sent') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4e0] px-3 py-1.5 text-xs font-semibold text-[#9a5d00]">
                    <Clock className="h-3.5 w-3.5" /> Demande envoyée
                </span>
            );
        }

        if (relation === 'pending_received') {
            return (
                <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl bg-[var(--wk-paper)] p-3">
                    <span className="flex-1 text-sm text-[rgba(26,21,18,0.7)]">{username} t&apos;a envoyé une demande</span>
                    <button type="button" disabled={busy} onClick={() => respond(true)} className="wk-btn-ink !px-3.5 !py-1.5 text-sm disabled:opacity-50">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserCheck className="h-4 w-4" /> Accepter</>}
                    </button>
                    <button type="button" disabled={busy} onClick={() => respond(false)} className="rounded-full px-3 py-1.5 text-sm font-semibold text-[rgba(26,21,18,0.55)] hover:bg-white">
                        Refuser
                    </button>
                </div>
            );
        }

        return (
            <button type="button" disabled={busy} onClick={addFriend} className="wk-btn-orange !px-3.5 !py-1.5 text-sm disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Ajouter</>}
            </button>
        );
    };

    return (
        <section className="rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif-display flex items-center gap-2.5 text-2xl">
                    <Users className="h-5 w-5 text-[var(--wk-accent)]" />
                    Amis
                    <span className="text-base text-[rgba(26,21,18,0.45)]">({loading ? '—' : count})</span>
                </h2>
                {!loading && relation !== 'pending_received' && renderAction()}
            </div>
            {!loading && relation === 'pending_received' && <div className="mt-3">{renderAction()}</div>}

            {!loading && preview.length > 0 && (
                <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-3">
                    {preview.map((f) => (
                        <li key={f.friendshipId}>
                            <Link
                                href={`/compte/${f.userId}`}
                                className="group flex flex-col items-center gap-1.5"
                                title={`${f.username} — niveau ${f.heroLevel}`}
                            >
                                <span className="relative">
                                    <span className="block rounded-full ring-2 ring-transparent transition group-hover:ring-[var(--wk-accent)]">
                                        <ProfileAvatar username={f.username} userId={f.userId} image={f.avatar ?? undefined} size="small" showPoints={false} />
                                    </span>
                                    {f.isOnline && (
                                        <span className="absolute bottom-0 right-0 z-20 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" title="En ligne" />
                                    )}
                                </span>
                                <span className="w-full truncate text-center text-xs font-semibold text-[rgba(26,21,18,0.7)] group-hover:text-[var(--wk-ink)]">
                                    {f.username}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && count === 0 && (
                <p className="mt-3 text-sm text-[rgba(26,21,18,0.55)]">Aucun ami pour l&apos;instant.</p>
            )}

            {!loading && relation === 'self' && (
                <Link
                    href="/amis"
                    className="mt-4 inline-block text-sm font-semibold text-[var(--wk-accent)] hover:underline"
                >
                    Gérer mes amis →
                </Link>
            )}
        </section>
    );
}
