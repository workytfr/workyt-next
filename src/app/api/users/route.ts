import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuthMiddleware } from "@/middlewares/authMiddleware";
import { rateLimit, rateLimitResponse, getIP } from "@/lib/rateLimit";

/**
 * GET /api/users — annuaire des membres.
 *
 * ⚠️ HISTORIQUE — À NE JAMAIS RÉOUVRIR.
 * Cette route était PUBLIQUE et renvoyait `email` pour un millier de comptes
 * d'un seul appel, avec une recherche portant elle aussi sur l'email : soit
 * l'annuaire complet des membres — très majoritairement mineurs — accessible
 * sans compte, et un oracle permettant de tester si une adresse est inscrite.
 *
 * Deux modes désormais, et rien entre les deux :
 *
 *   • `?resolve=nom1,nom2` — PUBLIC, mais strictement limité : quelques noms
 *     par appel, et jamais d'email. Sert au seul besoin public réel, associer
 *     l'auteur d'un article du blog à son profil (voir components/home/news).
 *
 *   • `?search=…` — RÉSERVÉ AUX ADMINS, jeton Bearer exigé. C'est le seul
 *     mode qui expose les emails, parce que l'outil de réassignation d'auteur
 *     en a besoin pour distinguer deux homonymes.
 *
 * Un appel sans paramètre ne renvoie plus rien : lister tout le monde n'est
 * le besoin légitime de personne.
 */

/** Noms résolus en une fois — au-delà, c'est de l'énumération. */
const MAX_RESOLVE = 10;

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const resolve = searchParams.get("resolve");
        const search = searchParams.get("search");

        // ------------------------------------------------ mode public : résolution
        if (resolve !== null) {
            const rl = rateLimit(`users-resolve:${getIP(request)}`, 30, 60 * 1000);
            if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

            const names = resolve
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean)
                .slice(0, MAX_RESOLVE);

            if (names.length === 0) {
                return NextResponse.json({ success: true, users: [] });
            }

            // Correspondance EXACTE sur le pseudo ou le nom, insensible à la
            // casse. L'ancienne version rapprochait par sous-chaîne dans les
            // deux sens côté client, ce qui associait « Marie » à « Marie-Anne »
            // — un article pouvait donc pointer vers le profil de quelqu'un
            // d'autre. Ici, à défaut de correspondance exacte, pas de lien.
            const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const patterns = names.map((n) => new RegExp(`^${escape(n)}$`, "i"));

            const users = await User.find({
                $or: [{ username: { $in: patterns } }, { name: { $in: patterns } }],
            })
                .select("_id name username")
                .limit(MAX_RESOLVE);

            return NextResponse.json({
                success: true,
                users: users.map((u) => ({
                    _id: u._id.toString(),
                    name: u.name || u.username || "Utilisateur",
                    username: u.username || "",
                })),
            });
        }

        // ------------------------------------------------ mode admin : recherche
        if (search !== null) {
            try {
                await adminAuthMiddleware(request);
            } catch {
                return NextResponse.json(
                    { success: false, error: "Accès refusé." },
                    { status: 403 }
                );
            }

            const q = search.trim();
            if (q.length < 2) {
                return NextResponse.json({ success: true, users: [] });
            }

            const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 50);
            const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

            const users = await User.find({
                $or: [{ name: rx }, { username: rx }, { email: rx }],
            })
                .select("_id name username email")
                .limit(limit)
                .sort({ createdAt: -1 });

            return NextResponse.json({
                success: true,
                users: users.map((u) => ({
                    _id: u._id.toString(),
                    name: u.name || u.username || "Utilisateur",
                    username: u.username || "",
                    email: u.email || "",
                })),
                count: users.length,
            });
        }

        // Aucun mode demandé : on ne déverse plus l'annuaire.
        return NextResponse.json(
            { success: false, error: "Paramètre `resolve` ou `search` requis." },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
