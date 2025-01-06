import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";

// Connexion à la base de données
connectDB();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url!);

        // Récupérer les paramètres de recherche
        const title = searchParams.get("title") || undefined;
        const status = searchParams.get("status") || undefined;
        const subject = searchParams.get("subject") || undefined;
        const level = searchParams.get("level") || undefined;
        const createdAt = searchParams.get("createdAt") || undefined;
        const dateFrom = searchParams.get("from") || undefined;
        const dateTo = searchParams.get("to") || undefined;

        // Construire le filtre de recherche
        const filter: any = {};

        if (title) {
            filter.title = { $regex: title, $options: "i" }; // Recherche insensible à la casse
        }

        if (status) {
            filter.status = status;
        }

        if (subject) {
            filter.subject = subject;
        }

        if (level) {
            filter.level = level;
        }

        if (createdAt) {
            const now = new Date();

            if (createdAt === "today") {
                const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Début de la journée
                const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // Fin de la journée
                filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
            } else if (createdAt === "week") {
                filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) }; // Dernière semaine
            } else if (createdAt === "month") {
                filter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) }; // Dernier mois
            } else if (createdAt === "year") {
                filter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) }; // Dernière année
            }
        }

        if (dateFrom || dateTo) {
            filter.createdAt = filter.createdAt || {};
            if (dateFrom) {
                filter.createdAt.$gte = new Date(dateFrom); // Date de début
            }
            if (dateTo) {
                filter.createdAt.$lte = new Date(dateTo); // Date de fin
            }
        }

        // Exécuter la requête et sélectionner les champs nécessaires
        const fiches = await Revision.find(filter).select("title subject level status createdAt files");

        // Transformer les résultats pour inclure un seul fichier
        const transformedFiches = fiches.map(fiche => ({
            ...fiche.toObject(),
            files: fiche.files.length > 0 ? fiche.files[0] : null, // Garde uniquement le premier fichier
        }));

        return NextResponse.json({ success: true, data: transformedFiches }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de la recherche :", error);
        return NextResponse.json({ success: false, message: "Erreur lors de la recherche." }, { status: 500 });
    }
}
