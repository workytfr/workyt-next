import { NextRequest, NextResponse } from 'next/server';
import { RADIO_STATIONS } from '@/lib/pomodoro/radio';

/**
 * Direct en cours d'une chaîne de la radio lofi. Les directs YouTube changent
 * d'identifiant à chaque redémarrage, et l'intégration « live_stream?channel »
 * n'est plus servie : on lit la page /live de la chaîne (sans clé d'API).
 * Seules les chaînes de RADIO_STATIONS sont acceptées ; résultat gardé 1 h.
 */

const CACHE_MS = 60 * 60_000;
const cache = new Map<string, { at: number; videoId: string; title: string | null }>();

async function resolveLive(channelId: string) {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
        headers: {
            'Accept-Language': 'fr-FR,fr;q=0.9',
            // Évite la page de consentement servie aux visiteurs européens
            Cookie: 'SOCS=CAI',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
        },
        cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const id = html.match(/"currentVideoEndpoint":\{.*?"watchEndpoint":\{"videoId":"([\w-]{11})"/)?.[1];
    if (!id || !/"isLive":true/.test(html)) return null;
    const title = html.match(/"videoPrimaryInfoRenderer":\{"title":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ?? null;
    return { videoId: id, title };
}

export async function GET(req: NextRequest) {
    const channel = req.nextUrl.searchParams.get('channel') ?? '';
    if (!RADIO_STATIONS.some((s) => s.id === channel)) {
        return NextResponse.json({ error: 'Station inconnue' }, { status: 400 });
    }

    const hit = cache.get(channel);
    if (hit && Date.now() - hit.at < CACHE_MS) {
        return NextResponse.json({ videoId: hit.videoId, title: hit.title });
    }

    try {
        const live = await resolveLive(channel);
        if (!live) return NextResponse.json({ error: 'Aucun direct en cours' }, { status: 404 });
        cache.set(channel, { at: Date.now(), ...live });
        return NextResponse.json(live);
    } catch {
        return NextResponse.json({ error: 'YouTube injoignable' }, { status: 502 });
    }
}
