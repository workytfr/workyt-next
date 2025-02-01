import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import Answer from "@/models/Answer";
import User from "@/models/User";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();

        // Authentification de l'utilisateur
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { success: false, message: "Non autorisé. Utilisateur non trouvé." },
                { status: 401 }
            );
        }

        // Vérification de l'existence de la réponse
        const answer = await Answer.findById(params.id);
        if (!answer) {
            return NextResponse.json(
                { success: false, message: "Réponse non trouvée." },
                { status: 404 }
            );
        }

        // Vérification que l'utilisateur ne like pas sa propre réponse
        if (user._id.toString() === answer.user.toString()) {
            return NextResponse.json(
                { success: false, message: "Vous ne pouvez pas liker votre propre réponse." },
                { status: 400 }
            );
        }

        // Vérifier si l'utilisateur a déjà liké la réponse
        const hasLiked = answer.likedBy.includes(user.username);

        if (hasLiked) {
            answer.likedBy = answer.likedBy.filter((username: string) => username !== user.username);
            answer.likes -= 1;
            await answer.save();

            // Enlever -1 point à l'auteur de la réponse
            await User.findByIdAndUpdate(answer.user, { $inc: { points: -1 } });

            return NextResponse.json(
                { success: true, message: "Like annulé avec succès.", data: answer },
                { status: 200 }
            );
        } else {
            // ✅ Ajouter un like
            answer.likedBy.push(user.username);
            answer.likes += 1;
            await answer.save();

            // Ajouter +1 point à l'auteur de la réponse
            await User.findByIdAndUpdate(answer.user, { $inc: { points: 1 } });

            return NextResponse.json(
                { success: true, message: "Like ajouté avec succès.", data: answer },
                { status: 200 }
            );
        }

    } catch (error: any) {
        console.error("Erreur lors du like/unlike :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de gérer le like/unlike.", details: error.message },
            { status: 500 }
        );
    }
}
