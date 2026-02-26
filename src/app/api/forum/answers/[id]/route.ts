import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Answer from "@/models/Answer";
import Question from "@/models/Question";
import User from "@/models/User";
import PointTransaction from "@/models/PointTransaction";
import Report from "@/models/Report";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

/**
 * DELETE /api/forum/answers/[id] - Supprimer une réponse (modérateur/admin uniquement)
 * Un modérateur ne peut supprimer que si le contenu est signalé
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Non authentifié." },
                { status: 401 }
            );
        }
        
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Utilisateur non trouvé." },
                { status: 404 }
            );
        }
        
        // Vérifier que l'utilisateur est modérateur ou admin
        if (user.role !== 'Admin' && user.role !== 'Modérateur') {
            return NextResponse.json(
                { success: false, message: "Accès non autorisé. Rôle modérateur requis." },
                { status: 403 }
            );
        }
        
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID de la réponse requis." },
                { status: 400 }
            );
        }
        
        // Récupérer la réponse
        const answer = await Answer.findById(id);
        if (!answer) {
            return NextResponse.json(
                { success: false, message: "Réponse non trouvée." },
                { status: 404 }
            );
        }
        
        // Vérifier qu'il existe un signalement actif pour ce contenu (uniquement pour les modérateurs)
        const isAdmin = user.role === 'Admin';
        if (!isAdmin) {
            const existingReport = await Report.findOne({
                'reportedContent.type': 'forum_answer',
                'reportedContent.id': id,
                status: { $in: ['en_attente', 'en_cours'] }
            });
            
            if (!existingReport) {
                return NextResponse.json(
                    { success: false, message: "Vous ne pouvez supprimer ce contenu que s'il fait l'objet d'un signalement actif." },
                    { status: 403 }
                );
            }
        }
        
        // Si la réponse était validée ou meilleure réponse, retirer les points
        if (answer.status === 'Validée' || answer.status === 'Meilleure Réponse') {
            const question = await Question.findById(answer.question);
            if (question) {
                // Retirer les points à l'auteur de la réponse
                await User.findByIdAndUpdate(answer.user, { $inc: { points: -question.points } });
                
                // Enregistrer la transaction de points (retrait)
                await PointTransaction.create({
                    user: answer.user,
                    question: question._id,
                    answer: answer._id,
                    action: "deleteAnswer",
                    type: "perte",
                    points: -question.points,
                    createdAt: new Date(),
                });
            }
        }
        
        // Supprimer la réponse
        await Answer.findByIdAndDelete(id);
        
        return NextResponse.json(
            { success: true, message: "Réponse supprimée avec succès." },
            { status: 200 }
        );
        
    } catch (error: any) {
        console.error("❌ Erreur lors de la suppression de la réponse:", error.message);
        return NextResponse.json(
            { success: false, message: "Erreur lors de la suppression de la réponse." },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/forum/answers/[id] - Mettre à jour une réponse (modérateur/admin uniquement)
 * Permet de modérer le contenu d'une réponse sans la supprimer
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Non authentifié." },
                { status: 401 }
            );
        }
        
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Utilisateur non trouvé." },
                { status: 404 }
            );
        }
        
        // Vérifier que l'utilisateur est modérateur ou admin
        if (user.role !== 'Admin' && user.role !== 'Modérateur') {
            return NextResponse.json(
                { success: false, message: "Accès non autorisé. Rôle modérateur requis." },
                { status: 403 }
            );
        }
        
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID de la réponse requis." },
                { status: 400 }
            );
        }
        
        const body = await req.json();
        const { content, status } = body;
        
        const answer = await Answer.findById(id);
        if (!answer) {
            return NextResponse.json(
                { success: false, message: "Réponse non trouvée." },
                { status: 404 }
            );
        }
        
        // Mettre à jour les champs autorisés
        if (content !== undefined) {
            answer.content = content;
        }
        if (status !== undefined) {
            answer.status = status;
        }
        
        await answer.save();
        
        return NextResponse.json(
            { success: true, message: "Réponse mise à jour avec succès.", data: answer },
            { status: 200 }
        );
        
    } catch (error: any) {
        console.error("❌ Erreur lors de la mise à jour de la réponse:", error.message);
        return NextResponse.json(
            { success: false, message: "Erreur lors de la mise à jour de la réponse." },
            { status: 500 }
        );
    }
}
