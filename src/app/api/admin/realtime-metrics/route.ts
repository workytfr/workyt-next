import { NextRequest, NextResponse } from "next/server";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Métriques temps réel (Admin) : nombre de sockets connectés, mémoire
 * du process et event-loop lag. Permet de savoir concrètement quand upgrader.
 *
 * Les compteurs live sont alimentés par le serveur custom (server.mjs) via
 * globalThis.__forumRealtimeStats. Si l'app tourne sans serveur custom, on
 * renvoie realtimeActive=false.
 */
export async function GET(req: NextRequest) {
    const user = await authMiddleware(req);
    if (!user || !user._id) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    if (user.role !== "Admin") {
        return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }

    const stats = (globalThis as unknown as {
        __forumRealtimeStats?: {
            connections: number;
            totalConnections: number;
            eventLoopLagMs: number;
        };
    }).__forumRealtimeStats;

    const mem = process.memoryUsage();
    const toMB = (n: number) => Math.round((n / 1024 / 1024) * 10) / 10;

    return NextResponse.json({
        realtimeActive: !!stats,
        sockets: {
            connected: stats?.connections ?? 0,
            totalSinceBoot: stats?.totalConnections ?? 0,
        },
        eventLoopLagMs: stats?.eventLoopLagMs ?? 0,
        memory: {
            rssMB: toMB(mem.rss),
            heapUsedMB: toMB(mem.heapUsed),
            heapTotalMB: toMB(mem.heapTotal),
        },
        uptimeSec: Math.round(process.uptime()),
    });
}
