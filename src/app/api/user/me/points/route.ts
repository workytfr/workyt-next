import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Récupère les points de l'utilisateur actuellement connecté
export async function GET() {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

        const user = await User.findOne({ email: session.user.email }).select("points");
        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    points: user.points || 0,
                    userId: user._id.toString()
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors de la récupération des points:", error);
        return NextResponse.json(
            { error: "Erreur serveur interne" },
            { status: 500 }
        );
    }
}

