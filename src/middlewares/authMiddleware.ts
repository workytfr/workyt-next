import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";

const authMiddleware = async (req: NextRequest) => {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            console.warn("Aucun token fourni.");
            return null; // Ne pas lancer d'erreur immédiatement
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            console.warn("Token invalide.");
            return null;
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        if (!decoded || !decoded.id) {
            throw new Error("Token invalide.");
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            throw new Error("Utilisateur non trouvé.");
        }

        return user;
    } catch (error: any) {
        console.error("Erreur dans authMiddleware :", error.message);
        return null; // Retourne null au lieu de lancer une erreur en boucle
    }
};

export default authMiddleware;
