import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import ProfileCustomization from "@/models/ProfileCustomization";
import { hasAnyPermission } from "@/lib/roles";
import { deleteFromR2 } from "@/lib/r2Object";
import { NotificationService } from "@/lib/notificationService";

/**
 * Retrait par la modération de la photo de profil d'un membre (signalement).
 * DELETE /api/users/<id>/photo  — permission `forum.moderate` ou `user.manage`.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }
        if (!(await hasAnyPermission(session.user.role as string, ["forum.moderate", "user.manage"]))) {
            return NextResponse.json({ error: "Droits insuffisants." }, { status: 403 });
        }

        const { userId } = await params;
        if (!mongoose.isValidObjectId(userId)) {
            return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
        }

        await dbConnect();
        const custom = await ProfileCustomization.findOne({ user: userId });
        if (!custom?.customPhoto?.url) {
            return NextResponse.json({ error: "Ce membre n'a pas de photo personnelle." }, { status: 404 });
        }

        const key = custom.customPhoto.key;
        custom.customPhoto = { url: "", key: "", isActive: false, updatedAt: new Date() };
        custom.updatedAt = new Date();
        await custom.save();
        await deleteFromR2(key);

        // On prévient le membre : sans message, il croit à un bug.
        try {
            await NotificationService.createNotification({
                type: "moderation_action",
                recipientId: userId,
                senderId: session.user.id,
                relatedEntityType: "user",
                relatedEntityId: userId,
                title: "Photo de profil retirée",
                message:
                    "Ta photo de profil a été retirée par la modération car elle ne respectait pas les règles de la communauté. Tu peux en envoyer une autre depuis la boutique.",
            });
        } catch (err) {
            console.error("Notification de retrait de photo impossible :", err);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erreur DELETE /api/users/[userId]/photo :", error);
        return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
}
