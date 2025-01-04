import { NextApiRequest, NextApiResponse } from 'next';
import authMiddleware from './authMiddleware';

const adminMiddleware = async (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    await authMiddleware(req, res, () => {
        // Vérification du rôle utilisateur
        const user = (req as any).user;
        if (!user || user.role !== 'Admin') {
            return res
                .status(403)
                .json({ success: false, message: 'Accès refusé. Rôle administrateur requis.' });
        }

        // L'utilisateur est un administrateur
        next();
    });
};

export default adminMiddleware;
