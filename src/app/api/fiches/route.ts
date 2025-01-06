import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";
import User from "@/models/User";
import { getToken } from "next-auth/jwt"; // Pour récupérer l'utilisateur via un JWT

// Connexion à la base de données
connectDB();

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.JWT_SECRET });

        if (!token) {
            return NextResponse.json(
                { error: "Non autorisé. Veuillez vous connecter." },
                { status: 401 }
            );
        }

        const data = await req.json();

        // Ajouter l'auteur à la fiche (utilisateur connecté)
        data.author = token.sub; // `sub` contient l'ID utilisateur

        const newFiche = await Revision.create(data); // Création d'une nouvelle fiche

        // Ajouter 10 points à l'utilisateur
        await User.findByIdAndUpdate(token.sub, { $inc: { points: 10 } });

        return NextResponse.json(newFiche, { status: 201 });
    } catch (error) {
        console.error("Erreur lors de la création de la fiche:", error);
        return NextResponse.json({ error: "Erreur lors de la création de la fiche." }, { status: 400 });
    }
}
