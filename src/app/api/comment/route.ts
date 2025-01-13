import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Revision from "@/models/Revision";
import authMiddleware from "@/middlewares/authMiddleware";
import mongoose from "mongoose";

connectDB();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Méthode non autorisée." });
    }

    try {
        const user = await authMiddleware(req as any); // Authentification de l'utilisateur
        const { revisionId, content } = req.body;

        if (!revisionId || !content) {
            return res.status(400).json({ success: false, message: "ID de la fiche et contenu requis." });
        }

        // Vérifier si la fiche existe
        const revision = await Revision.findById(revisionId);
        if (!revision) {
            return res.status(404).json({ success: false, message: "Fiche non trouvée." });
        }

        // Créer un nouveau commentaire
        const newComment = await Comment.create({
            content,
            author: user._id,
            revision: revisionId,
        });

        // Ajouter le commentaire à la fiche
        revision.comments.push(new mongoose.Types.ObjectId(newComment._id as string));
        await revision.save();

        res.status(201).json({ success: true, data: newComment });
    } catch (error: any) {
        console.error("Erreur lors de la création du commentaire :", error.message);
        res.status(500).json({ success: false, message: "Erreur interne du serveur." });
    }
}
