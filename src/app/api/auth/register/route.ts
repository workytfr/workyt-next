import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    const { name, email, password, username } = await req.json();

    if (!name || !email || !password || !username) {
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
            username,
            password: hashedPassword,
            role: "Apprenti",
            points: 20,
            badges: [],
            isAdmin: false,
            bio: "",
        });

        await newUser.save();

        // Envoi de l'email de confirmation
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });


        const mailOptions = {
            from: '"Workyt" <noreply@workyt.fr>', // Expéditeur
            to: email, // Destinataire
            subject: "Bienvenue sur Workyt!",
            html: `
                <h1>Bienvenue, ${name} !</h1>
                <p>Merci de vous être inscrit sur Workyt. Nous sommes ravis de vous accueillir parmi nous.</p>
                <p>Voici vos informations :</p>
                <ul>
                    <li><b>Nom:</b> ${name}</li>
                    <li><b>Email:</b> ${email}</li>
                    <li><b>Nom d'utilisateur:</b> ${username}</li>
                </ul>
                <p>Nous espérons que vous apprécierez votre expérience d'apprentissage avec nous.</p>
                <p>À bientôt,<br>L'équipe Workyt</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: "User registered successfully and email sent" }, { status: 201 });
    } catch (error) {
        console.error("Error during registration:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
