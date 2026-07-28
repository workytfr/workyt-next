"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Users,
    UserPlus,
    UserCheck,
    Clock,
    Loader2,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                <Users className="h-3.5 w-3.5" />
                {loading ? '—' : `${count} ami${count > 1 ? 's' : ''}`}
            </span>
        );
    }

    const renderAction = () => {
        if (relation === 'self' || relation === 'blocked') return null;

        if (relation === 'friends') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Check className="h-4 w-4" /> Vous êtes amis
                </span>
            );
        }

        if (relation === 'pending_sent') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Clock className="h-4 w-4" /> Demande envoyée
                </span>
            );
        }

        if (relation === 'pending_received') {
            return (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">t&apos;a envoyé une demande</span>
                    <Button size="sm" disabled={busy} onClick={() => respond(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserCheck className="mr-1 h-4 w-4" /> Accepter</>}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => respond(false)} className="text-gray-500">
                        Refuser
                    </Button>
                </div>
            );
        }

        return (
            <Button size="sm" disabled={busy} onClick={addFriend}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="mr-1 h-4 w-4" /> Ajouter en ami</>}
            </Button>
        );
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Amis
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-sm font-bold text-indigo-700">
                        {loading ? '—' : count}
                    </span>
                </h3>
                {!loading && renderAction()}
            </div>

            {!loading && preview.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                    {preview.map((f) => (
                        <Link
                            key={f.friendshipId}
                            href={`/compte/${f.userId}`}
                            className="group flex w-16 flex-col items-center gap-1"
                            title={`${f.username} — niveau ${f.heroLevel}`}
                        >
                            <span className="relative">
                                {f.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={f.avatar}
                                        alt={f.username}
                                        className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                                        {f.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                {f.isOnline && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                                )}
                            </span>
                            <span className="w-full truncate text-center text-xs text-gray-600">
                                {f.username}
                            </span>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && count === 0 && (
                <p className="mt-3 text-sm text-gray-400">Aucun ami pour l&apos;instant.</p>
            )}

            {!loading && relation === 'self' && (
                <Link
                    href="/amis"
                    className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
                >
                    Gérer mes amis →
                </Link>
            )}
        </div>
    );
}
