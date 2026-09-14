import { NextRequest, NextResponse } from "next/server";
import authMiddleware from "@/middlewares/authMiddleware";

/**
 * 🚀 GET - Métriques temps réel (Admin) : nombre de sockets connectés, mémoire
 * et event-loop lag du microservice Socket.IO. Permet de savoir concrètement
 * quand upgrader.
 *
 * Les compteurs live sont fournis par le microservice (`socket-server.mjs`) via
 * `GET {REALTIME_SERVICE_URL}/internal/stats`. Si l'app tourne sans le service
 * (env absente ou service injoignable), on renvoie realtimeActive=false.
 */

type RealtimeStats = {
    connections: number;
    totalConnections: number;
    eventLoopLagMs: number;
    uptimeSec: number;
    memory: { rssMB: number; heapUsedMB: number; heapTotalMB: number };
};

async function fetchRealtimeStats(): Promise<RealtimeStats | null> {
    const base = process.env.REALTIME_SERVICE_URL;
    if (!base) return null;
    try {
        const res = await fetch(`${base}/internal/stats`, {
            headers: { "x-internal-secret": process.env.REALTIME_INTERNAL_SECRET || "" },
            signal: AbortSignal.timeout(3000),
            cache: "no-store",
        });
        if (!res.ok) return null;
        return (await res.json()) as RealtimeStats;
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    // authMiddleware lève une exception quand le token est absent/invalide :
    // on la convertit en 401 pour ne pas renvoyer un 500.
    let user;
    try {
        user = await authMiddleware(req);
    } catch {
        user = null;
    }
    if (!user || !user._id) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    if (user.role !== "Admin") {
        return NextResponse.json({ error: "Accès refusé. Réservé aux administrateurs." }, { status: 403 });
    }

    const stats = await fetchRealtimeStats();

    const mem = process.memoryUsage();
    const toMB = (n: number) => Math.round((n / 1024 / 1024) * 10) / 10;

    return NextResponse.json({
        realtimeActive: !!stats,
        sockets: {
            connected: stats?.connections ?? 0,
            totalSinceBoot: stats?.totalConnections ?? 0,
        },
        eventLoopLagMs: stats?.eventLoopLagMs ?? 0,
        memory: stats?.memory ?? {
            rssMB: toMB(mem.rss),
            heapUsedMB: toMB(mem.heapUsed),
            heapTotalMB: toMB(mem.heapTotal),
        },
        uptimeSec: stats?.uptimeSec ?? Math.round(process.uptime()),
    });
}
