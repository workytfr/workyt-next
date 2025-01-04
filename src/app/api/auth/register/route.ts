import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
        return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    try {
        await connectDB();

        // Vérifie si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création du nouvel utilisateur
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: "Apprenti", // Rôle par défaut
            points: 0, // Points par défaut
            badges: [],
            isAdmin: false,
            bio: "",
        });

        await newUser.save();

        return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
    } catch (error) {
        console.error("Error during registration:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
