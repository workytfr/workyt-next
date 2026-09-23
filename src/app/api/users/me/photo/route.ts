import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import ProfileCustomization from "@/models/ProfileCustomization";
import { hasPermission } from "@/lib/roles";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { deleteFromR2 } from "@/lib/r2Object";

/**
 * Photo de profil envoyée par le membre.
 *
 * Réservée aux bénévoles (permission `profile.custom_photo`). Une fois active,
 * elle prime sur l'image de profil achetée en boutique et sur l'avatar généré
 * (voir `components/ui/profile.tsx`).
 *
 * POST   { url, key } → enregistre et active la photo (l'ancienne est supprimée de R2)
 * PATCH  { isActive }  → active / désactive sans supprimer le fichier
 * DELETE               → retire la photo et supprime le fichier
 */

async function currentUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    return session.user;
}

/** État de la photo du membre connecté + droit d'en utiliser une. */
export async function GET() {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

        const allowed = await hasPermission(user.role as string, "profile.custom_photo");
        await dbConnect();
        const custom = await ProfileCustomization.findOne({ user: user.id }).select("customPhoto");

        return NextResponse.json({
            success: true,
            allowed,
            customPhoto: {
                url: custom?.customPhoto?.url || "",
                isActive: !!custom?.customPhoto?.isActive,
            },
        });
    } catch (error) {
        console.error("Erreur GET /api/users/me/photo :", error);
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        if (!(await hasPermission(user.role as string, "profile.custom_photo"))) {
            return NextResponse.json(
                { error: "Cette fonctionnalité est réservée aux bénévoles de l'association." },
                { status: 403 },
            );
        }

        const rl = rateLimit(`avatar:${user.id}`, 10, 60 * 60_000);
        if (!rl.success) return rateLimitResponse(rl.retryAfterMs);

        const body = await req.json().catch(() => null);
        const url = String(body?.url ?? "");
        const key = String(body?.key ?? "");
        // On n'accepte que des fichiers déposés par notre propre flux d'upload
        if (!key.startsWith("avatars/") || !url.startsWith("/api/media/avatar/")) {
            return NextResponse.json({ error: "Image invalide." }, { status: 400 });
        }

        await dbConnect();
        const custom = await ProfileCustomization.findOne({ user: user.id });
        const previousKey = custom?.customPhoto?.key;

        const updated = await ProfileCustomization.findOneAndUpdate(
            { user: user.id },
            { $set: { customPhoto: { url, key, isActive: true, updatedAt: new Date() }, updatedAt: new Date() } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        if (previousKey && previousKey !== key) await deleteFromR2(previousKey);

        return NextResponse.json({ success: true, customPhoto: updated.customPhoto });
    } catch (error) {
        console.error("Erreur POST /api/users/me/photo :", error);
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

        const body = await req.json().catch(() => null);
        const isActive = !!body?.isActive;

        await dbConnect();
        const custom = await ProfileCustomization.findOne({ user: user.id });
        if (!custom?.customPhoto?.url) {
            return NextResponse.json({ error: "Aucune photo enregistrée." }, { status: 404 });
        }
        // Réactiver demande toujours le droit ; désactiver reste possible
        if (isActive && !(await hasPermission(user.role as string, "profile.custom_photo"))) {
            return NextResponse.json({ error: "Fonctionnalité réservée aux bénévoles." }, { status: 403 });
        }

        custom.customPhoto.isActive = isActive;
        custom.updatedAt = new Date();
        await custom.save();

        return NextResponse.json({ success: true, customPhoto: custom.customPhoto });
    } catch (error) {
        console.error("Erreur PATCH /api/users/me/photo :", error);
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

        await dbConnect();
        const custom = await ProfileCustomization.findOne({ user: user.id });
        const key = custom?.customPhoto?.key;

        if (custom) {
            custom.customPhoto = { url: "", key: "", isActive: false, updatedAt: new Date() };
            custom.updatedAt = new Date();
            await custom.save();
        }
        await deleteFromR2(key);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erreur DELETE /api/users/me/photo :", error);
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}
