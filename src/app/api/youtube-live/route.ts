import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LiveEvent from "@/models/LiveEvent";
import type { IPlatform } from "@/lib/livePlatforms";

export const dynamic = "force-dynamic";

// Les fetch YouTube ont leur propre cache via { next: { revalidate: 900 } }.

interface LiveStatus {
    status: "live" | "upcoming" | "none";
    videoId?: string;
    title?: string;
    thumbnail?: string;
    scheduledAt?: string;
    source?: "youtube" | "manual";
    platforms?: IPlatform[];
}

async function getManualFallback(): Promise<LiveStatus> {
    try {
        await connectDB();
        const now = new Date();
        const in10d = new Date(now.getTime() + 10 * 24 * 3_600_000);

        // Priorité 1 : un live forcé manuellement ("Démarrer" cliqué)
        const forced = await LiveEvent.findOne({ isActive: true, forceLive: true })
            .lean<{ videoId?: string; title: string; scheduledAt: Date; platforms?: IPlatform[] }>();

        if (forced) {
            return {
                status: "live",
                videoId: forced.videoId,
                title: forced.title,
                thumbnail: forced.videoId
                    ? `https://img.youtube.com/vi/${forced.videoId}/mqdefault.jpg`
                    : undefined,
                scheduledAt: new Date(forced.scheduledAt).toISOString(),
                source: "manual",
                platforms: forced.platforms ?? [],
            };
        }

        // Priorité 2 : un live programmé dans les 10 prochains jours
        const event = await LiveEvent.findOne({
            isActive: true,
            forceLive: false,
            scheduledAt: { $gte: now, $lte: in10d },
        })
            .sort({ scheduledAt: 1 })
            .lean<{ videoId?: string; title: string; scheduledAt: Date; platforms?: IPlatform[] }>();

        if (!event) return { status: "none" };

        const msUntil = new Date(event.scheduledAt).getTime() - now.getTime();
        const status = msUntil <= 0 ? "live" : "upcoming";

        return {
            status,
            videoId: event.videoId,
            title: event.title,
            thumbnail: event.videoId
                ? `https://img.youtube.com/vi/${event.videoId}/mqdefault.jpg`
                : undefined,
            scheduledAt: new Date(event.scheduledAt).toISOString(),
            source: "manual",
            platforms: event.platforms ?? [],
        };
    } catch {
        return { status: "none" };
    }
}

export async function GET(): Promise<NextResponse<LiveStatus>> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
        return NextResponse.json(await getManualFallback());
    }

    try {
        // 1. Chercher un live en cours (100 unités)
        const liveRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&maxResults=1&key=${apiKey}`,
            { next: { revalidate: 900 } }
        );
        const liveData = await liveRes.json();

        if (liveData.items?.length > 0) {
            const item = liveData.items[0];
            const videoId = item.id.videoId;
            const thumbnail =
                item.snippet.thumbnails?.medium?.url ||
                item.snippet.thumbnails?.default?.url;
            return NextResponse.json({
                status: "live",
                videoId,
                title: item.snippet.title,
                thumbnail,
                source: "youtube",
                platforms: [{ type: "youtube", url: `https://www.youtube.com/watch?v=${videoId}` }],
            });
        }

        // 2. Chercher un live programmé à venir (100 unités)
        const upcomingRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=upcoming&type=video&order=date&maxResults=1&key=${apiKey}`,
            { next: { revalidate: 900 } }
        );
        const upcomingData = await upcomingRes.json();

        if (upcomingData.items?.length > 0) {
            const item = upcomingData.items[0];
            const videoId = item.id.videoId;

            // Récupérer l'heure exacte du live (1 unité)
            const videoRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`,
                { next: { revalidate: 900 } }
            );
            const videoData = await videoRes.json();
            const scheduledAt =
                videoData.items?.[0]?.liveStreamingDetails?.scheduledStartTime ?? null;

            if (scheduledAt) {
                const msUntil = new Date(scheduledAt).getTime() - Date.now();
                const hoursUntil = msUntil / 3_600_000;

                // Afficher si le live est dans les 10 prochains jours
                if (hoursUntil > 0 && hoursUntil <= 240) {
                    return NextResponse.json({
                        status: "upcoming",
                        videoId,
                        title: item.snippet.title,
                        thumbnail:
                            item.snippet.thumbnails?.medium?.url ||
                            item.snippet.thumbnails?.default?.url,
                        scheduledAt,
                        source: "youtube",
                        platforms: [{ type: "youtube", url: `https://www.youtube.com/watch?v=${videoId}` }],
                    });
                }
            }
        }

        // YouTube n'a rien trouvé → on vérifie quand même la DB manuelle
        return NextResponse.json(await getManualFallback());
    } catch (err) {
        console.error("[youtube-live] API error, using manual fallback:", err);
        return NextResponse.json(await getManualFallback());
    }
}
