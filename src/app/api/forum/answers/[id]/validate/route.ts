import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import Answer from "@/models/Answer";
import Question from "@/models/Question";
import User from "@/models/User";
import PointTransaction from "@/models/PointTransaction";

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

        // Vérification de l'existence de la réponse et de la question associée
        const answer = await Answer.findById(params.id).populate("question");
        if (!answer) {
            return NextResponse.json(
                { success: false, message: "Réponse non trouvée." },
                { status: 404 }
            );
        }

        const question = await Question.findById(answer.question);
        if (!question) {
            return NextResponse.json(
                { success: false, message: "Question non trouvée." },
                { status: 404 }
            );
        }

        // Vérifier si l'utilisateur est autorisé à valider la réponse
        const isOwner = user._id.toString() === question.user.toString();
        const isStaff = ["Admin", "Correcteur"].includes(user.role);

        if (!isOwner && !isStaff) {
            return NextResponse.json(
                { success: false, message: "Seul l'auteur de la question ou un membre du staff peut valider une réponse." },
                { status: 403 }
            );
        }

        // Vérifier si une autre réponse est déjà marquée comme "Meilleure Réponse"
        const existingBestAnswer = await Answer.findOne({
            question: question._id,
            status: "Meilleure Réponse"
        });

        // Si c'est l'auteur de la question, il peut choisir UNE seule "Meilleure Réponse"
        if (isOwner) {
            if (existingBestAnswer) {
                return NextResponse.json(
                    { success: false, message: "Une réponse est déjà validée comme Meilleure Réponse." },
                    { status: 400 }
                );
            }

            // Mettre à jour le statut de la réponse et de la question
            answer.status = "Meilleure Réponse";
            await answer.save();

            question.status = "Résolue"; // La question passe en Résolue
            await question.save();

            // Attribuer les points mis en jeu au répondant
            await User.findByIdAndUpdate(answer.user, { $inc: { points: question.points } });

            // Enregistrer la transaction de points
            await PointTransaction.create({
                user: answer.user,
                question: question._id,
                answer: answer._id,
                type: "gain",
                points: question.points,
                createdAt: new Date(),
            });

            return NextResponse.json(
                { success: true, message: "Réponse désignée comme Meilleure Réponse.", data: answer },
                { status: 200 }
            );
        }

        // Si c'est un staff ou un admin, il peut marquer plusieurs réponses comme "Validée"
        if (isStaff) {
            answer.status = "Validée";
            await answer.save();

            // Vérifier si la question était "Non validée" et doit passer en "Validée"
            if (question.status === "Non validée") {
                question.status = "Validée";
                await question.save();
            }

            return NextResponse.json(
                { success: true, message: "Réponse validée par le staff.", data: answer },
                { status: 200 }
            );
        }

    } catch (error: any) {
        console.error("Erreur lors de la validation de la réponse :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de valider la réponse.", details: error.message },
            { status: 500 }
        );
    }
}
