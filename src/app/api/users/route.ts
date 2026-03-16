import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/users - Récupérer la liste des utilisateurs
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Récupérer les paramètres de requête
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "100");
        const search = searchParams.get("search") || "";

        // Construire la requête
        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        // Récupérer les utilisateurs
        const users = await User.find(query)
            .select("_id name username email")
            .limit(limit)
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            users: users.map(user => ({
                _id: user._id.toString(),
                name: user.name || user.username || "Utilisateur",
                username: user.username || "",
                email: user.email || "",

            })),
            count: users.length,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
