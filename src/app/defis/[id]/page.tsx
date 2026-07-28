"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Swords, Loader2, Check, X, Trophy, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChallengeQuestion {
    index: number;
    question: string;
    answers: string[];
    point: number;
    correctAnswer?: number;
}

interface ChallengeData {
    id: string;
    status: 'pending' | 'active' | 'completed' | 'declined' | 'expired';
    matiere: string | null;
    level: number;
    secondsPerQuestion: number;
    side: 'challenger' | 'opponent';
    total: number;
    answeredCount: number;
    myScore: number;
    myFinished: boolean;
    opponentFinished: boolean;
    opponentScore: number | null;
    winner?: string | null;
    questions: ChallengeQuestion[];
}

export default function ChallengePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [data, setData] = useState<ChallengeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ correct: boolean; answer: number } | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/challenges/${id}`);
            if (!res.ok) {
                toast.error('Défi introuvable');
                router.push('/amis');
                return;
            }
            const json = await res.json();
            setData(json.data);
        } catch {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) load();
    }, [id, load]);

    const respond = async (accept: boolean) => {
        setBusy(true);
        try {
            const res = await fetch(`/api/challenges/${id}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accept })
            });
            if (!res.ok) {
                const d = await res.json();
                toast.error(d.error || 'Erreur');
                return;
            }
            if (accept) {
                toast.success('Duel accepté — à toi de jouer !');
                load();
            } else {
                toast.success('Défi refusé');
                router.push('/amis');
            }
        } finally {
            setBusy(false);
        }
    };

    const answer = async (answerIndex: number) => {
        if (!data || busy) return;
        setBusy(true);
        setSelected(answerIndex);
        try {
            const res = await fetch(`/api/challenges/${id}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index: data.answeredCount, answerIndex })
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json.error || 'Erreur');
                return;
            }

            setFeedback({ correct: json.isCorrect, answer: json.correctAnswer });
            // Laisse le temps de voir la correction avant la question suivante
            setTimeout(async () => {
                setFeedback(null);
                setSelected(null);
                await load();
            }, 1200);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!data) return null;

    const current = data.questions[data.answeredCount];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-4">
            <div className="mx-auto max-w-2xl py-8">
                <Link
                    href="/amis"
                    className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                >
                    <ArrowLeft className="h-4 w-4" /> Mes amis
                </Link>

                <header className="mb-6 rounded-2xl border-2 border-red-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow">
                            <Swords className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-900">Duel de quiz</h1>
                            <p className="text-sm text-gray-500">
                                Niveau {data.level} · {data.total} questions
                                {data.matiere && ` · ${data.matiere}`}
                            </p>
                        </div>
                    </div>
                </header>

                {/* En attente d'acceptation */}
                {data.status === 'pending' && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                        {data.side === 'opponent' ? (
                            <>
                                <p className="mb-4 font-semibold text-gray-800">
                                    Tu as été défié ! Prêt à relever le duel ?
                                </p>
                                <div className="flex justify-center gap-3">
                                    <Button disabled={busy} onClick={() => respond(true)} className="bg-red-600 hover:bg-red-700">
                                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accepter le duel'}
                                    </Button>
                                    <Button variant="ghost" disabled={busy} onClick={() => respond(false)}>
                                        Refuser
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="flex items-center justify-center gap-2 text-gray-500">
                                <Clock className="h-4 w-4" /> En attente de la réponse de ton adversaire…
                            </p>
                        )}
                    </div>
                )}

                {/* En cours */}
                {data.status === 'active' && !data.myFinished && current && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between text-sm font-semibold text-gray-500">
                            <span>Question {data.answeredCount + 1} / {data.total}</span>
                            <span>{data.myScore} pt{data.myScore > 1 ? 's' : ''}</span>
                        </div>
                        <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                                style={{ width: `${(data.answeredCount / data.total) * 100}%` }}
                            />
                        </div>

                        <p className="mb-5 text-lg font-semibold text-gray-900">{current.question}</p>

                        <div className="space-y-2">
                            {current.answers.map((a, i) => {
                                const isPicked = selected === i;
                                const isRight = feedback && feedback.answer === i;
                                const isWrongPick = feedback && isPicked && !feedback.correct;
                                return (
                                    <button
                                        key={i}
                                        disabled={busy || !!feedback}
                                        onClick={() => answer(i)}
                                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors disabled:cursor-not-allowed ${
                                            isRight
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : isWrongPick
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50/40'
                                        }`}
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="flex-1 text-sm text-gray-800">{a}</span>
                                        {isRight && <Check className="h-5 w-5 text-emerald-600" />}
                                        {isWrongPick && <X className="h-5 w-5 text-red-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Terminé de mon côté, en attente de l'adversaire */}
                {data.myFinished && data.status !== 'completed' && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                        <p className="text-2xl font-extrabold text-gray-900">{data.myScore} points</p>
                        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            Ton adversaire n&apos;a pas encore terminé. Tu seras prévenu du résultat.
                        </p>
                    </div>
                )}

                {/* Résultat final */}
                {data.status === 'completed' && (
                    <ResultCard data={data} />
                )}
            </div>
        </div>
    );
}

function ResultCard({ data }: { data: ChallengeData }) {
    const won = data.opponentScore !== null && data.myScore > data.opponentScore;
    const draw = data.opponentScore !== null && data.myScore === data.opponentScore;

    return (
        <div
            className={`rounded-2xl border-2 p-6 text-center shadow-sm ${
                won
                    ? 'border-emerald-300 bg-emerald-50'
                    : draw
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-300 bg-white'
            }`}
        >
            <Trophy
                className={`mx-auto h-10 w-10 ${
                    won ? 'text-emerald-600' : draw ? 'text-amber-500' : 'text-gray-400'
                }`}
            />
            <p className="mt-3 text-xl font-extrabold text-gray-900">
                {won ? 'Victoire !' : draw ? 'Égalité !' : 'Défaite'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-6">
                <div>
                    <p className="text-3xl font-black text-gray-900">{data.myScore}</p>
                    <p className="text-xs font-semibold uppercase text-gray-400">Toi</p>
                </div>
                <span className="text-2xl font-bold text-gray-300">—</span>
                <div>
                    <p className="text-3xl font-black text-gray-900">{data.opponentScore ?? '—'}</p>
                    <p className="text-xs font-semibold uppercase text-gray-400">Adversaire</p>
                </div>
            </div>
            <Link href="/amis">
                <Button className="mt-5" variant="outline">Retour à mes amis</Button>
            </Link>
        </div>
    );
}
