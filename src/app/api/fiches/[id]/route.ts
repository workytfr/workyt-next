import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Revision from '@/models/Revision';
import User from '@/models/User';
import authMiddleware from '@/middlewares/authMiddleware';
import adminMiddleware from '@/middlewares/adminMiddleware';

connectDB();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, message: "ID de la fiche requis." });
    }

    // GET : Accessible à tout le monde, même non connecté
    if (method === 'GET') {
        try {
            const fiche = await Revision.findById(id).populate('author comments');
            if (!fiche) {
                return res.status(404).json({ success: false, message: "Fiche non trouvée." });
            }
            return res.status(200).json({ success: true, data: fiche });
        } catch (error) {
            console.error('Erreur GET:', error);
            return res.status(500).json({ success: false, message: "Erreur lors de la récupération." });
        }
    }

    // PUT : Accessible à Admin, Correcteur, Rédacteur ou Auteur de la fiche
    if (method === 'PUT') {
        return authMiddleware(req, res, async (user: any) => {
            try {
                const fiche = await Revision.findById(id);
                if (!fiche) {
                    return res.status(404).json({ success: false, message: "Fiche non trouvée." });
                }

                // Vérifier si l'utilisateur peut modifier cette fiche
                const canEdit =
                    user.role === 'Admin' ||
                    user.role === 'Correcteur' ||
                    user.role === 'Rédacteur' ||
                    fiche.author.toString() === user.id;

                if (!canEdit) {
                    return res.status(403).json({ success: false, message: "Accès refusé. Permission insuffisante." });
                }

                // Mettre à jour la fiche
                const updatedData = req.body;
                const updatedFiche = await Revision.findByIdAndUpdate(id, updatedData, { new: true });

                return res.status(200).json({ success: true, data: updatedFiche });
            } catch (error) {
                console.error('Erreur PUT:', error);
                return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour." });
            }
        });
    }

    // DELETE : Accessible uniquement aux Admins
    if (method === 'DELETE') {
        return adminMiddleware(req, res, async () => {
            try {
                const fiche = await Revision.findByIdAndDelete(id);
                if (!fiche) {
                    return res.status(404).json({ success: false, message: "Fiche non trouvée." });
                }

                // Déduire 10 points de l'auteur de la fiche
                await User.findByIdAndUpdate(fiche.author, { $inc: { points: -10 } });

                return res.status(200).json({ success: true, message: "Fiche supprimée avec succès." });
            } catch (error) {
                console.error('Erreur DELETE:', error);
                return res.status(500).json({ success: false, message: "Erreur lors de la suppression." });
            }
        });
    }

    // Méthode non autorisée
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: `Méthode ${method} non autorisée.` });
}
