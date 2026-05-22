/**
 * Endpoint de nettoyage R2.
 *
 * Auth :
 *   - Cron Vercel : header `Authorization: Bearer ${CRON_SECRET}` (auto-injecté par Vercel)
 *   - Admin manuel : authMiddleware + role Admin
 *
 * Modes :
 *   - GET : statut + dernier log
 *   - POST { dryRun: true }  : compte les orphelins sans supprimer (défaut)
 *   - POST { dryRun: false } : supprime réellement (admin uniquement, jamais via cron)
 *
 * Le cron tourne toujours en dry-run pour rapporter sans rien casser. La suppression
 * effective passe par un déclenchement explicite admin.
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import R2CleanupLog from "@/models/R2CleanupLog";
import { runR2Cleanup } from "@/lib/r2Cleanup";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max (Vercel Pro)

function isCronCall(req: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const auth = req.headers.get("authorization");
    return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        // GET = consultation : admin uniquement
        const user = await authMiddleware(req).catch(() => null);
        if (!user || user.role !== "Admin") {
            return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
        }
        const lastLog = await R2CleanupLog.findOne().sort({ runAt: -1 }).lean();
        const recentLogs = await R2CleanupLog.find().sort({ runAt: -1 }).limit(10).lean();
        return NextResponse.json({ lastLog, recentLogs });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Erreur" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // Auth : cron ou admin
        const cronCall = isCronCall(req);
        let userId: any = null;
        if (!cronCall) {
            const user = await authMiddleware(req).catch(() => null);
            if (!user || user.role !== "Admin") {
                return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
            }
            userId = user._id;
        }

        const body = await req.json().catch(() => ({}));
        // Cron force toujours dry-run. Admin peut désactiver.
        const dryRun = cronCall ? true : body.dryRun !== false;
        const maxDeletions = typeof body.maxDeletions === "number" ? body.maxDeletions : undefined;

        const result = await runR2Cleanup({ dryRun, maxDeletions });

        // Audit
        await R2CleanupLog.create({
            runAt: result.startedAt,
            dryRun: result.dryRun,
            durationMs: result.durationMs,
            scanned: result.scanned,
            referenced: result.referenced,
            orphans: result.orphans,
            deleted: result.deleted,
            bytesFreed: result.bytesFreed,
            skippedRecent: result.skippedRecent,
            sampleOrphans: result.sampleOrphans,
            errorMessages: result.errors,
            triggeredBy: cronCall ? "cron" : "admin",
            triggeredByUserId: userId,
        });

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("R2 cleanup error:", err);
        return NextResponse.json({ error: err?.message ?? "Erreur" }, { status: 500 });
    }
}
