import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { awardPointsOnce } from "@/lib/pointsService";

const VERIFY_POINTS = 13; // Points gagnés par le correcteur qui vérifie un cours

/**
 * 🚀 POST - Marquer un cours comme vérifié (Réservé aux Correcteurs et Admins)
 *
 * Effets :
 *  - statut : en_attente_verification → en_attente_publication
 *  - verifiedBy / verifiedAt renseignés (traçabilité du correcteur)
 *  - +13 points pour le correcteur (une seule fois par cours)
 *
 * Règle anti-conflit : un correcteur ne peut pas vérifier un cours
 * dont il est auteur (pas de juge et partie).
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        // 🔒 Authentification
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
        }

        // 🔒 Seuls les Correcteurs et Admins peuvent vérifier un cours
        if (session.user.role !== "Correcteur" && session.user.role !== "Admin") {
            return NextResponse.json(
                { error: "Accès refusé. Seuls les correcteurs peuvent vérifier un cours." },
                { status: 403 }
            );
        }

        const { id } = await params;
        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ error: "Cours non trouvé." }, { status: 404 });
        }

        // 🚦 Le cours doit être en attente de vérification
        if (course.status !== "en_attente_verification") {
            return NextResponse.json(
                { error: "Ce cours n'est pas en attente de vérification." },
                { status: 400 }
            );
        }

        // ⚖️ Anti-conflit : pas de vérification de son propre cours
        const userId = session.user.id;
        const isAuthor = course.authors.some(
            (authorId: any) => authorId.toString() === userId
        );
        if (isAuthor) {
            return NextResponse.json(
                { error: "Vous ne pouvez pas vérifier un cours dont vous êtes auteur." },
                { status: 403 }
            );
        }

        // ✅ Vérification
        course.status = "en_attente_publication";
        course.verifiedBy = new Types.ObjectId(userId);
        course.verifiedAt = new Date();
        course.updatedAt = new Date();
        await course.save();

        // 🏆 Points du correcteur (une seule fois par cours)
        const awarded = await awardPointsOnce(userId, VERIFY_POINTS, "verifyCourse", {
            course: course._id.toString(),
        });

        return NextResponse.json(
            {
                message: "Cours vérifié avec succès. Il est maintenant en attente de publication.",
                course,
                pointsAwarded: awarded,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Erreur lors de la vérification du cours :", error.message);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}
