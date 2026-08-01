"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Users,
    UserPlus,
    UserCheck,
    UserX,
    Search,
    Loader2,
    Swords,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import AvatarDisplay from '@/components/ui/AvatarDisplay';

interface Friend {
    friendshipId: string;
    userId: string;
    username: string;
    points: number;
    role: string;
    heroLevel: number;
    avatar: string | null;
    isOnline: boolean;
    since: string;
}

interface SearchResult {
    userId: string;
    username: string;
    points: number;
    avatar: string | null;
}

type Tab = 'friends' | 'requests' | 'add';

export default function FriendsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('friends');

    const [friends, setFriends] = useState<Friend[]>([]);
    const [received, setReceived] = useState<Friend[]>([]);
    const [sent, setSent] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);

    const load = useCallback(async () => {
        try {
            const [fRes, rRes] = await Promise.all([
                fetch('/api/friends'),
                fetch('/api/friends/requests')
            ]);
            if (fRes.ok) {
                const d = await fRes.json();
                setFriends(d.data.friends);
            }
            if (rRes.ok) {
                const d = await rRes.json();
                setReceived(d.data.received);
                setSent(d.data.sent);
            }
        } catch {
            toast.error('Impossible de charger tes amis');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') load();
        else if (status === 'unauthenticated') setLoading(false);
    }, [status, load]);

    // Recherche débattue : on n'interroge pas le serveur à chaque frappe
    useEffect(() => {
        if (tab !== 'add') return;
        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const d = await res.json();
                    setResults(d.data.results);
                }
            } catch {
                /* silencieux : la recherche est secondaire */
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [query, tab]);

    const sendRequest = async (username: string) => {
        setBusy(username);
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
            setResults((prev) => prev.filter((r) => r.username !== username));
            load();
        } catch {
            toast.error('Une erreur est survenue');
        } finally {
            setBusy(null);
        }
    };

    const respond = async (friendshipId: string, accept: boolean, username: string) => {
        setBusy(friendshipId);
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
            load();
        } catch {
            toast.error('Une erreur est survenue');
        } finally {
            setBusy(null);
        }
    };

    const challenge = async (opponentId: string, username: string) => {
        setBusy(`duel-${opponentId}`);
        try {
            const res = await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opponentId })
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Impossible de lancer le défi');
                return;
            }
            toast.success(`Défi envoyé à ${username} !`);
            router.push(`/defis/${data.challengeId}`);
        } catch {
            toast.error('Une erreur est survenue');
        } finally {
            setBusy(null);
        }
    };

    const remove = async (friendshipId: string, label: string) => {
        setBusy(friendshipId);
        try {
            const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
            if (!res.ok) {
                toast.error('Erreur');
                return;
            }
            toast.success(label);
            load();
        } catch {
            toast.error('Une erreur est survenue');
        } finally {
            setBusy(null);
        }
    };

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="mx-auto max-w-2xl pt-20 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-300" />
                    <h1 className="mt-4 text-2xl font-bold text-gray-900">Mes amis</h1>
                    <p className="mt-2 text-gray-500">Connecte-toi pour retrouver tes amis et les défier.</p>
                    <Link href="/api/auth/signin">
                        <Button className="mt-6">Se connecter</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const tabs: Array<{ id: Tab; label: string; icon: typeof Users; count: number }> = [
        { id: 'friends', label: 'Mes amis', icon: Users, count: friends.length },
        { id: 'requests', label: 'Demandes', icon: UserCheck, count: received.length },
        { id: 'add', label: 'Ajouter', icon: UserPlus, count: 0 }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* En-tête, au format des pages /cours, /fiches et /forum */}
            <header className="border-b border-gray-100 bg-gradient-to-b from-orange-50/30 to-white">
                <div className="mx-auto max-w-[1400px] px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                            <Users className="h-3.5 w-3.5" />
                            Communauté
                        </div>
                        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Mes amis
                        </h1>
                        <p className="text-base leading-relaxed text-gray-500">
                            Ajoute tes camarades pour suivre leur progression, les défier au quiz
                            et vous entraider.
                        </p>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">

                {/* Onglets */}
                <div className="flex gap-2 rounded-2xl border border-white/60 bg-white/70 p-1.5 shadow-sm backdrop-blur">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                                    active
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'text-gray-600 hover:bg-white'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                                {t.count > 0 && (
                                    <span
                                        className={`rounded-full px-1.5 text-xs font-bold ${
                                            active ? 'bg-white/25' : 'bg-red-100 text-red-600'
                                        }`}
                                    >
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {/* ---- Mes amis ---- */}
                        {tab === 'friends' &&
                            (friends.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="Aucun ami pour l'instant"
                                    text="Utilise l'onglet « Ajouter » pour trouver tes camarades."
                                />
                            ) : (
                                friends.map((f) => (
                                    <Row key={f.friendshipId} user={f}>
                                        <span className="text-xs font-semibold text-gray-400">
                                            Niv. {f.heroLevel}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={busy === `duel-${f.userId}`}
                                            onClick={() => challenge(f.userId, f.username)}
                                            title={`Défier ${f.username} au quiz`}
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            {busy === `duel-${f.userId}` ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Swords className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={busy === f.friendshipId}
                                            onClick={() => remove(f.friendshipId, `${f.username} retiré de tes amis`)}
                                            title="Retirer des amis"
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            {busy === f.friendshipId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </Row>
                                ))
                            ))}

                        {/* ---- Demandes ---- */}
                        {tab === 'requests' && (
                            <>
                                {received.length === 0 && sent.length === 0 && (
                                    <EmptyState
                                        icon={UserCheck}
                                        title="Aucune demande"
                                        text="Les demandes que tu reçois apparaîtront ici."
                                    />
                                )}

                                {received.length > 0 && (
                                    <p className="col-span-full px-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                                        Reçues
                                    </p>
                                )}
                                {received.map((r) => (
                                    <Row key={r.friendshipId} user={r}>
                                        <Button
                                            size="sm"
                                            disabled={busy === r.friendshipId}
                                            onClick={() => respond(r.friendshipId, true, r.username)}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {busy === r.friendshipId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserCheck className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={busy === r.friendshipId}
                                            onClick={() => respond(r.friendshipId, false, r.username)}
                                            title="Refuser"
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <UserX className="h-4 w-4" />
                                        </Button>
                                    </Row>
                                ))}

                                {sent.length > 0 && (
                                    <p className="col-span-full px-1 pt-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                                        Envoyées
                                    </p>
                                )}
                                {sent.map((s) => (
                                    <Row key={s.friendshipId} user={s}>
                                        <span className="text-xs italic text-gray-400">En attente</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={busy === s.friendshipId}
                                            onClick={() => remove(s.friendshipId, 'Demande annulée')}
                                            title="Annuler la demande"
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <UserX className="h-4 w-4" />
                                        </Button>
                                    </Row>
                                ))}
                            </>
                        )}

                        {/* ---- Ajouter ---- */}
                        {tab === 'add' && (
                            <>
                                <div className="relative col-span-full">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Rechercher un pseudo (2 caractères minimum)"
                                        className="pl-9"
                                    />
                                    {searching && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                                    )}
                                </div>

                                {query.trim().length >= 2 && !searching && results.length === 0 && (
                                    <EmptyState
                                        icon={Search}
                                        title="Aucun résultat"
                                        text="Vérifie l'orthographe du pseudo. Les personnes déjà dans tes amis n'apparaissent pas ici."
                                    />
                                )}

                                {results.map((r) => (
                                    <Row key={r.userId} user={{ ...r, isOnline: false }}>
                                        <Button
                                            size="sm"
                                            disabled={busy === r.username}
                                            onClick={() => sendRequest(r.username)}
                                        >
                                            {busy === r.username ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-1 h-4 w-4" /> Ajouter
                                                </>
                                            )}
                                        </Button>
                                    </Row>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({
    user,
    children
}: {
    user: {
        userId: string;
        username: string;
        points: number;
        avatar: string | null;
        isOnline?: boolean;
    };
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
            <div className="relative shrink-0">
                {/* Même avatar que partout ailleurs sur le site : photo de profil,
                    contour acheté en gemmes, et à défaut l'avatar généré — jamais
                    une simple initiale. `avatar` sert de valeur de repli le temps
                    que la personnalisation soit chargée. */}
                <AvatarDisplay
                    name={user.username}
                    userId={user.userId}
                    size="lg"
                    fallbackImage={user.avatar ?? undefined}
                />
                {user.isOnline && (
                    <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
                        title="En ligne"
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500">{user.points} points</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">{children}</div>
        </div>
    );
}

function EmptyState({
    icon: Icon,
    title,
    text
}: {
    icon: typeof Users;
    title: string;
    text: string;
}) {
    return (
        <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white/50 p-8 text-center">
            <Icon className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 font-semibold text-gray-700">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
        </div>
    );
}
