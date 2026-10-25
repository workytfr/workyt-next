import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import PushToken from '@/models/PushToken';
import PushNudge from '@/models/PushNudge';
import User from '@/models/User';
import Streak from '@/models/Streak';
import Clan from '@/models/Clan';
import ClanMember from '@/models/ClanMember';
import DailyQuizAttempt from '@/models/DailyQuizAttempt';
import { getDailyQuizForDate, normalizeDate } from '@/lib/dailyQuizService';
import { parisDay, seasonKey } from '@/lib/clanService';
import { sendPushMany, type PushMessage } from '@/lib/expoPush';

/**
 * Relances « à la Duolingo » vers l'application mobile, chacune sur son
 * canal donc avec son son : quiz du jour (épée), capitaine (cor), soldat
 * (tambour), absence (cri de Foxy).
 *
 * Garde-fous, pour inciter sans harceler :
 * - jamais entre 21 h 30 et 8 h (heure de Paris), même si le cron dérape ;
 * - au plus MAX_PER_DAY relances par membre et par jour ;
 * - une même relance n'est jamais envoyée deux fois le même jour
 *   (PushNudge, index unique) : relancer la tâche ne renvoie rien ;
 * - seulement les membres qui ont l'app (jeton push) et ce type activé.
 */

const MAX_PER_DAY = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

const GATE_LABEL: Record<string, string> = { nord: 'Nord', est: 'Est', sud: 'Sud' };

interface Nudge { userId: string; kind: string; msg: PushMessage }

function parisClock(now: Date) {
    const parts = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return {
        day: parisDay(now).toISOString().slice(0, 10),
        minutes: get('hour') * 60 + get('minute'),
    };
}

function quietHours(minutes: number): boolean {
    return minutes < 8 * 60 || minutes >= 21 * 60 + 30;
}

/** Message différent selon le jour, pour ne pas lire toujours la même phrase */
function pick<T>(list: T[], day: string): T {
    return list[Number(day.slice(-2)) % list.length];
}

type Prefs = { quiz: boolean; clan: boolean; relance: boolean };
const PREF_OF: Record<string, keyof Prefs> = { quiz: 'quiz', clan_capitaine: 'clan', clan_soldat: 'clan', relance: 'relance' };

/**
 * Membres ayant au moins un téléphone : dernière ouverture de l'app et
 * relances acceptées (sur au moins un de leurs appareils).
 */
async function appUsers(): Promise<Map<string, { lastOpenAt: Date; prefs: Prefs }>> {
    const allowed = (key: string) => ({ $max: { $ifNull: [`$prefs.${key}`, true] } });
    const rows = await PushToken.aggregate<{ _id: mongoose.Types.ObjectId; lastOpenAt: Date } & Prefs>([
        {
            $group: {
                _id: '$user',
                lastOpenAt: { $max: { $ifNull: ['$lastOpenAt', '$updatedAt'] } },
                quiz: allowed('quiz'),
                clan: allowed('clan'),
                relance: allowed('relance'),
            },
        },
    ]);
    return new Map(rows.map((r) => [r._id.toString(), { lastOpenAt: r.lastOpenAt, prefs: { quiz: r.quiz, clan: r.clan, relance: r.relance } }]));
}

/**
 * Envoie les relances retenues, dans l'ordre de priorité de la liste :
 * chaque membre en reçoit au plus MAX_PER_DAY par jour, toutes tâches confondues.
 */
async function dispatch(all: Nudge[], users: Awaited<ReturnType<typeof appUsers>>, day: string): Promise<number> {
    // Une relance coupée par l'élève ne doit pas compter dans son plafond du jour
    const nudges = all.filter((n) => {
        const pref = PREF_OF[n.msg.channel ?? ''];
        return !pref || users.get(n.userId)?.prefs[pref] !== false;
    });
    if (!nudges.length) return 0;
    const ids = [...new Set(nudges.map((n) => n.userId))];
    const already = await PushNudge.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
        { $match: { day, user: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: '$user', n: { $sum: 1 } } },
    ]);
    const count = new Map(already.map((a) => [a._id.toString(), a.n]));

    const toSend: Nudge[] = [];
    for (const n of nudges) {
        if ((count.get(n.userId) ?? 0) >= MAX_PER_DAY) continue;
        try {
            await PushNudge.create({ user: n.userId, kind: n.kind, day });
        } catch {
            continue; // déjà envoyée aujourd'hui (index unique)
        }
        count.set(n.userId, (count.get(n.userId) ?? 0) + 1);
        toSend.push(n);
    }
    return sendPushMany(toSend.map((n) => ({ userId: n.userId, msg: n.msg })));
}

/**
 * Soir : quiz du jour pas encore réussi, et le clan (capitaine sans ordre
 * du jour, soldats qui n'ont encore rien rapporté).
 * `derniere` : passage de 20 h 30, dernière chance pour le quiz et la série.
 */
export async function runEveningNudges(slot: 'soir' | 'derniere'): Promise<Record<string, unknown>> {
    await connectDB();
    const now = new Date();
    const { day, minutes } = parisClock(now);
    if (quietHours(minutes)) return { skipped: 'heures calmes' };

    const users = await appUsers();
    if (!users.size) return { users: 0 };
    const ids = [...users.keys()];
    const nudges: Nudge[] = [];

    // ── Quiz du jour (et série en danger au dernier passage) ──
    const quiz = await getDailyQuizForDate(now);
    const solved = new Set(
        quiz
            ? (await DailyQuizAttempt.distinct('user', { date: normalizeDate(now), isCorrect: true, user: { $in: ids } }))
                .map((u: mongoose.Types.ObjectId) => u.toString())
            : []
    );

    const today = normalizeDate(now).getTime();
    const yesterday = today - DAY_MS;
    const atRisk = new Map<string, number>();
    if (slot === 'derniere') {
        const streaks = await Streak.find({ user: { $in: ids }, currentStreak: { $gt: 0 } })
            .select('user currentStreak lastActivityDate')
            .lean<{ user: mongoose.Types.ObjectId; currentStreak: number; lastActivityDate?: Date }[]>();
        for (const s of streaks) {
            // Active hier mais pas encore aujourd'hui : la série tombe à minuit
            if (s.lastActivityDate && normalizeDate(s.lastActivityDate).getTime() === yesterday) {
                atRisk.set(s.user.toString(), s.currentStreak);
            }
        }
    }

    for (const userId of ids) {
        const quizPending = !!quiz && !solved.has(userId);
        if (slot === 'soir' && quizPending) {
            nudges.push({
                userId,
                kind: 'quiz',
                msg: {
                    channel: 'quiz',
                    url: '/aventure/quiz',
                    ...pick([
                        { title: '⚔️ Le monstre du jour t’attend', body: 'Une question, 30 secondes, et la récompense du calendrier est à toi.' },
                        { title: '⚔️ Ton épée rouille…', body: 'Le quiz du jour n’est pas encore fait. On le règle maintenant ?' },
                        { title: '⚔️ Quiz du jour : prêt ?', body: 'Bonne réponse = XP pour ton héros et une case du calendrier.' },
                    ], day),
                },
            });
        }
        if (slot === 'derniere' && (quizPending || atRisk.has(userId))) {
            const streak = atRisk.get(userId);
            nudges.push({
                userId,
                kind: 'quiz-derniere',
                msg: {
                    channel: 'quiz',
                    url: quizPending ? '/aventure/quiz' : '/aventure',
                    ...(streak
                        ? { title: `🔥 Ta série de ${streak} jour${streak > 1 ? 's' : ''} s’éteint à minuit`, body: quizPending ? 'Dernière chance : le quiz du jour suffit à la sauver.' : 'Une leçon, une fiche ou un quiz, et elle continue.' }
                        : { title: '⏳ Dernière chance pour le quiz du jour', body: 'Il disparaît à minuit, avec sa récompense.' }),
                },
            });
        }
    }

    // ── Clan : la guerre de la semaine se joue chaque jour jusqu'à minuit ──
    const counts: Record<string, number> = { quiz: nudges.length };
    if (slot === 'soir') {
        const season = seasonKey(now);
        const clans = await Clan.find({ season, resolved: false })
            .select('captain dailyOrder dailyOrderAt')
            .lean<{ _id: mongoose.Types.ObjectId; captain?: mongoose.Types.ObjectId; dailyOrder?: string; dailyOrderAt?: Date }[]>();
        const todayParis = parisDay(now).getTime();
        const orderToday = new Map<string, string | undefined>();
        const captains = new Set<string>();

        for (const c of clans) {
            const ordered = !!c.dailyOrder && !!c.dailyOrderAt && parisDay(c.dailyOrderAt).getTime() === todayParis;
            orderToday.set(c._id.toString(), ordered ? c.dailyOrder : undefined);
            const cap = c.captain?.toString();
            if (cap && users.has(cap) && !ordered) {
                captains.add(cap);
                nudges.push({
                    userId: cap,
                    kind: 'clan-capitaine',
                    msg: {
                        channel: 'clan_capitaine',
                        url: '/clan',
                        title: '📯 Capitaine, tes troupes attendent',
                        body: 'Publie l’ordre du jour : quelle porte attaque-t-on ce soir ?',
                    },
                });
            }
        }

        const idle = await ClanMember.find({
            season,
            clan: { $in: clans.map((c) => c._id) },
            dailyPoints: 0,
            user: { $in: ids },
        }).select('user clan').lean<{ user: mongoose.Types.ObjectId; clan: mongoose.Types.ObjectId }[]>();

        for (const m of idle) {
            const userId = m.user.toString();
            if (captains.has(userId)) continue; // le capitaine a déjà son cor
            const gate = orderToday.get(m.clan.toString());
            nudges.push({
                userId,
                kind: 'clan-soldat',
                msg: {
                    channel: 'clan_soldat',
                    url: '/clan',
                    ...(gate
                        ? { title: '🥁 Le capitaine a sonné l’assaut', body: `Cap sur la porte ${GATE_LABEL[gate] ?? gate}. Chaque point compte avant minuit !` }
                        : { title: '🥁 Ton clan a besoin de toi', body: 'Tu n’as encore rien rapporté aujourd’hui : un quiz ou une leçon, tout compte.' }),
                },
            });
        }
        counts.clan = nudges.length - counts.quiz;
    }

    const reached = await dispatch(nudges, users, day);
    return { slot, candidates: counts, reached };
}

/**
 * Absence : 2, 5 puis 10 jours sans ouvrir l'app ni le site, puis on se tait
 * (un élève qui ne revient pas ne doit pas être harcelé).
 */
const AWAY_STEPS: Record<number, { title: string; body: string }> = {
    2: { title: '🦊 Foxy s’ennuie sans toi', body: 'Ça fait 2 jours ! Une petite leçon de 5 minutes pour reprendre ?' },
    5: { title: '🦊 Ça fait longtemps qu’on n’a pas eu cours…', body: '5 jours sans toi. Ton héros t’attend, et ta place au classement aussi.' },
    10: { title: '🦊 Un dernier petit mot de Foxy', body: 'On ne t’embête plus après celui-ci. Reviens quand tu veux, on garde ta place.' },
};

export async function runInactiveNudges(): Promise<Record<string, unknown>> {
    await connectDB();
    const now = new Date();
    const { day, minutes } = parisClock(now);
    if (quietHours(minutes)) return { skipped: 'heures calmes' };

    const users = await appUsers();
    if (!users.size) return { users: 0 };
    const seen = await User.find({ _id: { $in: [...users.keys()] } })
        .select('lastSeenAt')
        .lean<{ _id: mongoose.Types.ObjectId; lastSeenAt?: Date }[]>();
    const lastSite = new Map(seen.map((u) => [u._id.toString(), u.lastSeenAt]));

    const todayParis = parisDay(now).getTime();
    const nudges: Nudge[] = [];
    for (const [userId, { lastOpenAt: lastOpen }] of users) {
        const site = lastSite.get(userId);
        const last = site && site > lastOpen ? site : lastOpen;
        if (!last) continue;
        const away = Math.round((todayParis - parisDay(last).getTime()) / DAY_MS);
        const step = AWAY_STEPS[away];
        if (!step) continue;
        nudges.push({ userId, kind: `inactif-${away}`, msg: { channel: 'relance', url: '/', ...step } });
    }

    const reached = await dispatch(nudges, users, day);
    return { candidates: nudges.length, reached };
}
