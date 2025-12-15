import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

const authMiddleware = async (req: NextRequest) => {
    try {
        // S'assurer que MongoDB est connecté
        await connectDB();
        
        // Vérifier que la connexion est active
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Connexion à la base de données non disponible.");
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            throw new Error("Non autorisé. Aucun token fourni.");
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new Error("Non autorisé. Aucun token valide.");
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!); // Décodage avec la clé secrète
        if (!decoded || !decoded.id) {
            throw new Error("Token invalide ou champ sub manquant.");
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            throw new Error("Utilisateur non trouvé.");
        }

        return user;
    } catch (error: any) {
        // Ne logger que les erreurs non liées à l'authentification
        if (!error.message.includes("Non autorisé") && !error.message.includes("Token invalide") && !error.message.includes("Utilisateur non trouvé")) {
            console.error("Erreur dans authMiddleware :", error.message);
        }
        throw error;
    }
};

// Version optionnelle qui ne lance pas d'erreur si aucun token n'est fourni
export const optionalAuthMiddleware = async (req: NextRequest) => {
    try {
        // S'assurer que MongoDB est connecté
        await connectDB();
        
        // Vérifier que la connexion est active
        if (mongoose.connection.readyState !== 1) {
            return null;
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return null; // Retourne null au lieu de lancer une erreur
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return null;
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        if (!decoded || !decoded.id) {
            return null;
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return null;
        }

        return user;
    } catch (error: any) {
        // En cas d'erreur, on retourne null au lieu de lancer une erreur
        return null;
    }
};

// Middleware pour vérifier les rôles admin/moderateur
export const moderatorAuthMiddleware = async (req: NextRequest) => {
    try {
        const user = await authMiddleware(req);
        
        if (user.role !== 'Admin' && user.role !== 'Modérateur') {
            throw new Error("Accès non autorisé. Rôle insuffisant.");
        }
        
        return user;
    } catch (error: any) {
        console.error("Erreur dans moderatorAuthMiddleware :", error.message);
        throw error;
    }
};

// Middleware pour vérifier le rôle admin uniquement
export const adminAuthMiddleware = async (req: NextRequest) => {
    try {
        const user = await authMiddleware(req);
        
        if (user.role !== 'Admin') {
            throw new Error("Accès non autorisé. Rôle admin requis.");
        }
        
        return user;
    } catch (error: any) {
        console.error("Erreur dans adminAuthMiddleware :", error.message);
        throw error;
    }
};

export default authMiddleware;
