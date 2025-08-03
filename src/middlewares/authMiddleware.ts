import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";

const authMiddleware = async (req: NextRequest) => {
    try {
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
        console.error("Erreur dans authMiddleware :", error.message);
        throw error;
    }
};

// Version optionnelle qui ne lance pas d'erreur si aucun token n'est fourni
export const optionalAuthMiddleware = async (req: NextRequest) => {
    try {
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

export default authMiddleware;
