import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const authMiddleware = async (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    try {
        // Vérifier si le token est présent dans l'en-tête
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Non autorisé. Aucun token fourni.' });
        }
        // Vérification du token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Token invalide.' });
        }

        // Optionnel : Récupérer l'utilisateur à partir du modèle User
        const user = await User.findById(decoded.id).select('-password'); // Exclure le mot de passe
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
        }

        // Ajouter l'utilisateur à la requête
        (req as any).user = user;
        next();
    } catch (error: any) {
        console.error('Erreur de middleware Auth:', error.message);
        return res.status(401).json({ success: false, message: 'Non autorisé.' });
    }
};

export default authMiddleware;
