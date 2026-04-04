import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import authMiddleware from "@/middlewares/authMiddleware";
import Answer from "@/models/Answer";
import Question from "@/models/Question";
import User from "@/models/User";
import PointTransaction from "@/models/PointTransaction";
import { BadgeService } from "@/lib/badgeService";
import { hasPermission } from "@/lib/roles";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // ✅ Récupérer l'ID de la réponse depuis les paramètres GET
        const { searchParams } = new URL(req.url);
        const answerId = searchParams.get("id");

        if (!answerId) {
            return NextResponse.json(
                { success: false, message: "ID de la réponse manquant." },
                { status: 400 }
            );
        }

        // ✅ Authentifier l'utilisateur
        const user = await authMiddleware(req);
        if (!user || !user._id) {
            return NextResponse.json(
                { success: false, message: "Non autorisé. Utilisateur non trouvé." },
                { status: 401 }
            );
        }

        // ✅ Vérifier l'existence de la réponse et peupler la question et son auteur
        const answer = await Answer.findById(answerId).populate({
            path: "question",
            populate: { path: "user", select: "username role _id" }, // ✅ Peupler l'auteur de la question
        });

        if (!answer) {
            return NextResponse.json(
                { success: false, message: "Réponse non trouvée." },
                { status: 404 }
            );
        }

        const question = answer.question;
        if (!question) {
            return NextResponse.json(
                { success: false, message: "Question non trouvée." },
                { status: 404 }
            );
        }

        // ✅ Vérifier si l'utilisateur est autorisé à valider la réponse
        const isOwner = user._id.toString() === question.user._id.toString();
        const isStaff = await hasPermission(user.role, 'forum.validate_answer');

        if (!isOwner && !isStaff) {
            return NextResponse.json(
                { success: false, message: "Seul l'auteur de la question ou un membre du staff peut valider une réponse." },
                { status: 403 }
            );
        }

        // ✅ Vérifier si une autre réponse est déjà marquée comme "Meilleure Réponse"
        const existingBestAnswer = await Answer.findOne({
            question: question._id,
            status: "Meilleure Réponse",
        });

        // ✅ Cas où l'utilisateur est l'auteur de la question → il peut choisir UNE seule "Meilleure Réponse"
        if (isOwner) {
            if (existingBestAnswer) {
                return NextResponse.json(
                    { success: false, message: "Une réponse est déjà validée comme Meilleure Réponse." },
                    { status: 400 }
                );
            }

            // 🔹 Marquer la réponse comme "Meilleure Réponse"
            answer.status = "Meilleure Réponse";
            await answer.save();

            // 🔹 Marquer la question comme "Résolue"
            question.status = "Résolue";
            await question.save();

            // 🔹 Ajouter les points au répondant (avec boost)
            const { addPointsWithBoost } = await import('@/lib/pointsService');
            await addPointsWithBoost(answer.user.toString(), question.points, 'validateAnswer', { question: question._id.toString(), answer: answer._id.toString() });

            // 🔹 Vérifier les badges pour l'auteur de la réponse
            await BadgeService.triggerBadgeCheck(answer.user.toString());

            // 🔹 Mettre à jour la progression des quêtes pour l'auteur de la réponse
            const { QuestService } = await import('@/lib/questService');
            await QuestService.updateQuestProgress(answer.user.toString(), 'forum_answer_validated');

            // 🔹 Notifier l'auteur de la réponse
            const { NotificationService } = await import('@/lib/notificationService');
            await NotificationService.notifyAnswerValidated(
                answer._id.toString(),
                user._id.toString(),
                question.title,
                question.points
            );

            return NextResponse.json(
                { success: true, message: "Réponse désignée comme Meilleure Réponse.", data: answer },
                { status: 200 }
            );
        }

        // ✅ Cas où l'utilisateur est un membre du staff → Il peut valider plusieurs réponses
        if (isStaff) {
            answer.status = "Validée";
            await answer.save();

            // 🔹 Si la question était "Non validée", elle passe en "Validée"
            if (question.status === "Non validée") {
                question.status = "Validée";
                await question.save();
            }

            // 🔹 Ajouter les points au répondant (avec boost)
            const { addPointsWithBoost: addPtsStaff } = await import('@/lib/pointsService');
            await addPtsStaff(answer.user.toString(), question.points, 'validateAnswer', { question: question._id.toString(), answer: answer._id.toString() });

            // 🔹 Vérifier les badges pour l'auteur de la réponse
            await BadgeService.triggerBadgeCheck(answer.user.toString());

            // 🔹 Mettre à jour la progression des quêtes pour l'auteur de la réponse
            const { QuestService } = await import('@/lib/questService');
            await QuestService.updateQuestProgress(answer.user.toString(), 'forum_answer_validated');

            // 🔹 Notifier l'auteur de la réponse
            const { NotificationService } = await import('@/lib/notificationService');
            await NotificationService.notifyAnswerValidated(
                answer._id.toString(),
                user._id.toString(),
                question.title,
                question.points
            );

            return NextResponse.json(
                { success: true, message: "Réponse validée par le staff.", data: answer },
                { status: 200 }
            );
        }
    } catch (error: any) {
        console.error("❌ Erreur lors de la validation de la réponse :", error.message);
        return NextResponse.json(
            { success: false, message: "Impossible de valider la réponse." },
            { status: 500 }
        );
    }
}
