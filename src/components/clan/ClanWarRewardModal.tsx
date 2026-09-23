"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Trophy, Crown, Swords, Sparkles, ArrowUpRight, ArrowDown, X } from 'lucide-react';
import ChestAnimation from '@/components/quests/ChestAnimation';

/**
 * Le butin de fin de guerre, rejoué à la première visite qui suit.
 *
 * Les coffres sont ouverts par la résolution du dimanche à minuit — un joueur
 * absent ne doit rien perdre. Mais ouvrir sans rien montrer, c'est gagner sans
 * le voir : on rejoue donc ici le résultat réellement obtenu, coffre par
 * coffre, avec l'animation habituelle.
 */

interface Loot {
    chestType: string;
    rewardType: string;
    amount?: number;
    cosmeticType?: string;
    cosmeticId?: string;
}

interface Reward {
    clanName: string;
    rivalName?: string;
    outcome: 'win' | 'loss' | 'draw';
    isMvp: boolean;
    daysWon: number;
    rivalDaysWon: number;
    tierName?: string;
    tierDelta: number;
    loot: Loot[];
    points: number;
    leftover: number;
}

const CHEST_LABEL: Record<string, string> = {
    common: 'Coffre commun',
    rare: 'Coffre rare',
    epic: 'Coffre épique',
    legendary: 'Coffre légendaire',
};

/** Type de coffre reconnu par l'animation ; au pire, on retombe sur commun. */
const chestKind = (t: string): 'common' | 'rare' | 'epic' | 'legendary' =>
    (['common', 'rare', 'epic', 'legendary'].includes(t) ? t : 'common') as any;

function lootLabel(l: Loot) {
    if (l.rewardType === 'points') return `${l.amount} points`;
    if (l.rewardType === 'gems') return `${l.amount} gemme${(l.amount ?? 0) > 1 ? 's' : ''}`;
    if (l.rewardType === 'mushrooms') return `${l.amount} champignon${(l.amount ?? 0) > 1 ? 's' : ''}`;
    if (l.rewardType === 'cosmetic') return 'Un cosmétique';
    return 'Récompense';
}

export default function ClanWarRewardModal() {
    const [reward, setReward] = useState<Reward | null>(null);
    const [step, setStep] = useState<'intro' | 'chests' | 'recap'>('intro');
    const [chestIndex, setChestIndex] = useState(0);
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        fetch('/api/clan/rewards')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.reward) setReward(d.reward); })
            .catch(() => {});
    }, []);

    const finish = () => {
        setClosed(true);
        fetch('/api/clan/rewards', { method: 'POST' }).catch(() => {});
    };

    if (!reward || closed) return null;

    const won = reward.outcome === 'win';
    const draw = reward.outcome === 'draw';
    const hasChests = reward.loot.length > 0;

    // Les coffres, un par un, avec l'animation habituelle
    if (step === 'chests' && hasChests) {
        const current = reward.loot[chestIndex];
        return (
            <ChestAnimation
                key={chestIndex}
                chestType={chestKind(current.chestType)}
                reward={{
                    rewardType: current.rewardType,
                    amount: current.amount,
                    cosmeticType: current.cosmeticType,
                    cosmeticId: current.cosmeticId,
                }}
                onClose={() => {
                    if (chestIndex + 1 < reward.loot.length) setChestIndex(chestIndex + 1);
                    else setStep('recap');
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-[var(--wk-paper)]">
                {/* Bandeau du verdict */}
                <div
                    className={`wk-grain relative px-6 py-7 text-center ${
                        won ? 'bg-[var(--wk-accent)] text-white' : draw ? 'bg-[var(--wk-paper-2)]' : 'bg-[var(--wk-ink)] text-[var(--wk-paper)]'
                    }`}
                >
                    <button
                        type="button"
                        onClick={finish}
                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition hover:bg-black/20"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                        {won ? <Trophy className="h-7 w-7" /> : <Swords className="h-7 w-7" />}
                    </span>
                    <p className="font-mono-ui mt-3 text-[11px] uppercase tracking-[0.18em] opacity-75">
                        Guerre des Clans · {reward.tierName}
                    </p>
                    <h2 className="font-serif-display mt-1 text-3xl leading-none">
                        {won ? 'Guerre remportée' : draw ? 'Égalité' : 'Guerre perdue'}
                    </h2>
                    <p className="mt-2 text-sm opacity-85">
                        {reward.clanName} {reward.daysWon} — {reward.rivalDaysWon} {reward.rivalName ?? 'adversaire'}
                    </p>
                    {reward.isMvp && (
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--wk-ink)]">
                            <Crown className="h-3.5 w-3.5 text-[var(--wk-accent)]" /> Meilleur combattant du clan
                        </span>
                    )}
                </div>

                <div className="p-6">
                    {step === 'intro' ? (
                        <>
                            <p className="text-center text-sm text-[rgba(26,21,18,0.68)]">
                                {hasChests
                                    ? `${reward.loot.length} coffre${reward.loot.length > 1 ? 's' : ''} t'attend${reward.loot.length > 1 ? 'ent' : ''}. Les gains sont déjà sur ton compte — il ne reste qu'à les découvrir.`
                                    : draw
                                        ? 'Les deux clans se valent : tu gardes ton rang et reçois une compensation.'
                                        : 'Pas de coffre cette fois, mais ton travail de la semaine est compensé.'}
                            </p>

                            {(reward.points > 0 || reward.leftover > 0) && (
                                <div className="mt-4 space-y-2">
                                    {reward.points > 0 && (
                                        <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm">
                                            <Image src="/badge/points.png" alt="" width={18} height={18} className="object-contain" />
                                            <span>{reward.points} points de compensation</span>
                                        </div>
                                    )}
                                    {reward.leftover > 0 && (
                                        <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm">
                                            <Sparkles className="h-4 w-4 text-[var(--wk-accent)]" />
                                            <span>{reward.leftover} points du trésor non dépensé</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => (hasChests ? setStep('chests') : finish())}
                                className="wk-btn-orange mt-5 w-full justify-center !py-3"
                            >
                                {hasChests ? 'Ouvrir mes coffres' : 'Compris'}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-center text-sm font-semibold">Ton butin de la semaine</p>
                            <ul className="mt-3 space-y-2">
                                {reward.loot.map((l, i) => (
                                    <li key={i} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm">
                                        <Image
                                            src={`/coffre/${chestKind(l.chestType)}_o.png`}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="object-contain"
                                        />
                                        <span className="flex-1">
                                            <b>{lootLabel(l)}</b>
                                            <span className="block text-xs text-[rgba(26,21,18,0.55)]">
                                                {CHEST_LABEL[l.chestType] ?? l.chestType}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                                {reward.leftover > 0 && (
                                    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm">
                                        <Sparkles className="h-5 w-5 text-[var(--wk-accent)]" />
                                        <span>{reward.leftover} points du trésor non dépensé</span>
                                    </li>
                                )}
                            </ul>

                            {reward.tierDelta !== 0 && (
                                <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold">
                                    {reward.tierDelta > 0 ? (
                                        <><ArrowUpRight className="h-4 w-4 text-emerald-600" /> Tu montes d&apos;un rang</>
                                    ) : (
                                        <><ArrowDown className="h-4 w-4 text-[#c2272d]" /> Tu descends d&apos;un rang</>
                                    )}
                                </p>
                            )}

                            <button type="button" onClick={finish} className="wk-btn-ink mt-5 w-full justify-center !py-3">
                                Continuer
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
