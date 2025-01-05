import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Revision from "@/models/Revision";

// Connexion à la base de données
connectDB();

// Gestionnaire pour les opérations sur toutes les fiches
export async function GET(req: NextRequest) {
    try {
        const fiches = await Revision.find(); // Récupérer toutes les fiches
        return NextResponse.json(fiches, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la récupération des fiches." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const newFiche = await Revision.create(data); // Création d'une nouvelle fiche
        return NextResponse.json(newFiche, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur lors de la création de la fiche." }, { status: 400 });
    }
}
