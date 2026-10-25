import PushToken from '@/models/PushToken';

/**
 * Envoi de notifications push vers l'application mobile, via le service
 * Expo (https://exp.host) : pas de clé Firebase/APNs à gérer ici, Expo s'en
 * charge à partir des identifiants configurés dans le projet EAS de l'app.
 *
 * Toujours silencieux en cas d'échec : une notification push manquée ne
 * doit jamais faire échouer l'action qui l'a déclenchée.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN_RE = /^Expo(nent)?PushToken\[.+\]$/;
/** Expo accepte au plus 100 messages par requête */
const BATCH = 100;

/**
 * Canaux de l'app (lib/push.ts côté workytapp), chacun avec son son embarqué.
 * Android fige le son d'un canal à sa création : ne jamais changer le son
 * d'un canal existant, en créer un nouveau.
 */
export type PushChannel = 'activite' | 'quiz' | 'clan_capitaine' | 'clan_soldat' | 'relance';

const CHANNEL_SOUND: Record<PushChannel, string> = {
    activite: 'default',
    quiz: 'epee.wav',
    clan_capitaine: 'cor.wav',
    clan_soldat: 'tambour.wav',
    relance: 'foxy.wav',
};

/** Réglage de l'élève qui autorise chaque canal (« activite » : toujours) */
const CHANNEL_PREF: Partial<Record<PushChannel, 'quiz' | 'clan' | 'relance'>> = {
    quiz: 'quiz',
    clan_capitaine: 'clan',
    clan_soldat: 'clan',
    relance: 'relance',
};

export interface PushMessage {
    title: string;
    body: string;
    /** Écran de l'app à ouvrir au tap (ex. « /forum/<id> ») */
    url?: string;
    /** Canal, donc son ; « activite » par défaut */
    channel?: PushChannel;
}

export function isExpoPushToken(token: string): boolean {
    return EXPO_TOKEN_RE.test(token);
}

type TokenRow = { token: string; user: { toString(): string }; prefs?: Record<string, boolean> };

/**
 * Envoie un message par membre, à tous ses téléphones, en respectant ses
 * réglages. Renvoie le nombre de membres effectivement joints (au moins un
 * téléphone accepte ce canal).
 */
export async function sendPushMany(items: { userId: string; msg: PushMessage }[]): Promise<number> {
    if (!items.length) return 0;
    try {
        const rows = await PushToken.find({ user: { $in: items.map((i) => i.userId) } })
            .select('token user prefs')
            .lean<TokenRow[]>();
        const byUser = new Map<string, TokenRow[]>();
        for (const r of rows) {
            const key = r.user.toString();
            byUser.set(key, [...(byUser.get(key) ?? []), r]);
        }

        const reached = new Set<string>();
        const messages: { token: string; payload: Record<string, unknown> }[] = [];
        for (const { userId, msg } of items) {
            const channel = msg.channel ?? 'activite';
            const pref = CHANNEL_PREF[channel];
            for (const r of byUser.get(userId) ?? []) {
                if (pref && r.prefs?.[pref] === false) continue;
                reached.add(userId);
                messages.push({
                    token: r.token,
                    payload: {
                        to: r.token,
                        title: msg.title,
                        body: msg.body,
                        data: msg.url ? { url: msg.url } : {},
                        sound: CHANNEL_SOUND[channel],
                        channelId: channel,
                        priority: 'high',
                    },
                });
            }
        }

        for (let i = 0; i < messages.length; i += BATCH) {
            await postBatch(messages.slice(i, i + BATCH));
        }
        return reached.size;
    } catch (error) {
        console.error('[push] envoi impossible:', error);
        return 0;
    }
}

async function postBatch(batch: { token: string; payload: Record<string, unknown> }[]) {
    const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            // Facultatif : jeton d'accès Expo si « Enhanced push security » est activé
            ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(batch.map((m) => m.payload)),
    });
    if (!res.ok) return;

    // Les appareils désinstallés renvoient DeviceNotRegistered : on oublie leur jeton
    const json = (await res.json().catch(() => null)) as { data?: { status: string; details?: { error?: string } }[] } | null;
    const dead = (json?.data ?? [])
        .map((t, i) => (t.status === 'error' && t.details?.error === 'DeviceNotRegistered' ? batch[i]?.token : null))
        .filter((t): t is string => !!t);
    if (dead.length) await PushToken.deleteMany({ token: { $in: dead } });
}

/** Envoie un message à tous les téléphones d'un membre. */
export async function sendPushToUser(userId: string, msg: PushMessage): Promise<void> {
    await sendPushMany([{ userId, msg }]);
}

/** Écran de l'app correspondant à une notification du site */
export function appUrlForNotification(n: { type: string; relatedEntity?: { type?: string; id?: unknown } }): string | undefined {
    const id = n.relatedEntity?.id ? String(n.relatedEntity.id) : '';
    switch (n.relatedEntity?.type) {
        case 'question': return `/forum/${id}`;
        case 'fiche': return `/fiches/${id}`;
        case 'mentorship': return `/suivi/${id}`;
        case 'challenge': return id ? `/defis/${id}` : '/defis';
        case 'clan': return '/clan';
        case 'quest': return '/aventure/quetes';
    }
    if (n.type.startsWith('friend_')) return '/amis';
    if (n.type.startsWith('challenge_')) return '/defis';
    if (n.type === 'quest_completed') return '/aventure/quetes';
    if (n.type === 'clan_result') return '/clan';
    return '/notifications';
}
