import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    const { name, email, password, username } = await req.json();

    if (!name || !email || !password || !username) {
        return NextResponse.json({ message: "Tous les champs sont requis" }, { status: 400 });
    }

    try {
        await connectDB();

        // Vérifications préliminaires
        if (password.length < 6) {
            return NextResponse.json({
                message: "Le mot de passe doit contenir au moins 6 caractères"
            }, { status: 400 });
        }

        // Vérification de l'unicité de l'email (insensible à la casse)
        const existingUser = await User.findOne({
            email: { $regex: `^${email}$`, $options: 'i' }
        });
        if (existingUser) {
            return NextResponse.json({
                message: "Un utilisateur avec cet email existe déjà"
            }, { status: 400 });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);

        // Création du nouvel utilisateur
        // Le modèle User se chargera automatiquement de :
        // - Normaliser le username (lowercase, trim, etc.)
        // - Valider le format email et username
        // - Vérifier l'unicité du username
        const newUser = new User({
            name: name.trim(),
            email: email.trim(), // Le modèle convertira automatiquement en lowercase
            username: username.trim(), // Le modèle normalisera automatiquement
            password: hashedPassword,
            role: "Apprenti",
            points: 20,
            badges: [],
            isAdmin: false,
            bio: "",
        });

        // Sauvegarde avec validation automatique
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
            from: '"Workyt" <noreply@workyt.fr>',
            to: email,
            subject: "Bienvenue sur Workyt!",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333; text-align: center;">Bienvenue, ${name} !</h1>
                    <p>Merci de vous être inscrit sur Workyt. Nous sommes ravis de vous accueillir parmi nous.</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Vos informations :</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 5px 0;"><strong>Nom:</strong> ${name}</li>
                            <li style="padding: 5px 0;"><strong>Email:</strong> ${email}</li>
                            <li style="padding: 5px 0;"><strong>Nom d'utilisateur:</strong> ${newUser.username}</li>
                            <li style="padding: 5px 0;"><strong>Rôle:</strong> ${newUser.role}</li>
                            <li style="padding: 5px 0;"><strong>Points de départ:</strong> ${newUser.points}</li>
                        </ul>
                    </div>
                    <p>Nous espérons que vous apprécierez votre expérience d'apprentissage avec nous.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        À bientôt,<br>
                        <strong>L'équipe Workyt</strong>
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({
            message: "Utilisateur créé avec succès et email envoyé",
            user: {
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role,
                points: newUser.points
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur lors de l'inscription:", error);

        // Gestion des erreurs de validation Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message);

            // Si erreur de username déjà pris, génère des suggestions
            if (error.errors.username && error.errors.username.message.includes('déjà pris')) {
                try {
                    const suggestions = await User.generateUsernameSuggestions(username);
                    return NextResponse.json({
                        message: "Ce nom d'utilisateur est déjà pris",
                        suggestions: suggestions,
                        attempted: username.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '').substring(0, 20)
                    }, { status: 400 });
                } catch (suggestionError) {
                    console.error("Erreur génération suggestions:", suggestionError);
                    return NextResponse.json({
                        message: "Ce nom d'utilisateur est déjà pris",
                        attempted: username.toLowerCase().trim()
                    }, { status: 400 });
                }
            }

            // Retourne la première erreur de validation
            return NextResponse.json({
                message: errors[0] || "Erreur de validation des données"
            }, { status: 400 });
        }

        // Erreur de duplicata MongoDB (email ou username unique)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];

            if (field === 'email') {
                return NextResponse.json({
                    message: "Un utilisateur avec cet email existe déjà"
                }, { status: 400 });
            }

            if (field === 'username') {
                try {
                    const suggestions = await User.generateUsernameSuggestions(username);
                    return NextResponse.json({
                        message: "Ce nom d'utilisateur est déjà pris",
                        suggestions: suggestions,
                        attempted: username.toLowerCase().trim()
                    }, { status: 400 });
                } catch (suggestionError) {
                    console.error("Erreur génération suggestions:", suggestionError);
                    return NextResponse.json({
                        message: "Ce nom d'utilisateur est déjà pris"
                    }, { status: 400 });
                }
            }
        }

        // Erreur d'envoi email
        if (error.message && error.message.includes('Mail')) {
            console.error("Erreur envoi email:", error);
            return NextResponse.json({
                message: "Utilisateur créé mais erreur lors de l'envoi de l'email de confirmation",
                user: {
                    username: username.toLowerCase().trim()
                }
            }, { status: 201 }); // 201 car l'utilisateur a été créé
        }

        return NextResponse.json({
            message: "Erreur interne du serveur"
        }, { status: 500 });
    }
}