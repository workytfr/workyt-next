// src/utils/authOptions.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

// Fonction pour générer un JWT
function generateJWT(user: any) {
    return jwt.sign(
        {
            id: user.id || user._id?.toString(),
            email: user.email,
            role: user.role,
            points: user.points,
            badges: user.badges,
            bio: user.bio,
            isAdmin: user.isAdmin,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "15d" }
    );
}

// Configuration NextAuth
export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "email@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials || {};
                if (!email || !password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();
                const user = await User.findOne({ email }).select("+password");
                if (!user) throw new Error("No user found with this email");

                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) throw new Error("Invalid password");

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    username: user.username || "",
                    role: user.role,
                    points: user.points || 0,
                    badges: user.badges || [],
                    bio: user.bio || "",
                    isAdmin: user.isAdmin || false,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Si c'est une connexion Discord
            if (account?.provider === "discord") {
                try {
                    await connectDB();
                    
                    // Vérifier si l'utilisateur existe déjà
                    let existingUser = await User.findOne({ 
                        $or: [
                            { email: user.email },
                            { discordId: account.providerAccountId }
                        ]
                    });

                    if (existingUser) {
                        // Mettre à jour l'utilisateur existant avec les infos Discord
                        existingUser.discordId = account.providerAccountId;
                        // Ne pas modifier le nom existant
                        await existingUser.save();
                    } else {
                        // Générer un username valide basé sur le nom Discord
                        const baseUsername = user.name?.toLowerCase()
                            .replace(/\s+/g, '_')           // Remplacer espaces par _
                            .replace(/[^a-z0-9_]/g, '')     // Garder seulement lettres, chiffres, _
                            .replace(/^_+/, '')             // Supprimer underscores au début
                            .replace(/_+/g, '_')            // Remplacer multiples underscores par un seul
                            .substring(0, 15) || 'discorduser';
                        
                        // S'assurer qu'on a au moins un caractère valide
                        const finalBaseUsername = baseUsername.length > 0 ? baseUsername : 'discorduser';
                        
                        // Vérifier si le username est disponible, sinon ajouter des chiffres
                        let finalUsername = finalBaseUsername;
                        let counter = 1;
                        
                        while (await User.findOne({ username: finalUsername })) {
                            finalUsername = `${finalBaseUsername}${counter}`;
                            counter++;
                        }
                        
                        // Créer un nouvel utilisateur
                        const newUser = new User({
                            name: user.name,
                            email: user.email,
                            username: finalUsername,
                            discordId: account.providerAccountId,
                            role: 'user',
                            points: 0,
                            badges: [],
                            bio: '',
                            isAdmin: false,
                            verified: true, // Les comptes Discord sont considérés comme vérifiés
                        });
                        await newUser.save();
                    }
                    
                    return true;
                } catch (error) {
                    console.error('Erreur lors de la connexion Discord:', error);
                    return false;
                }
            }
            
            // Pour les autres providers, autoriser la connexion
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.email = user.email;
                token.role = user.role;
                token.points = user.points;
                token.accessToken = generateJWT(user);
                
                // Si c'est une connexion Discord, récupérer les données utilisateur depuis la DB
                if (account?.provider === "discord") {
                    await connectDB();
                    const dbUser = await User.findOne({ 
                        $or: [
                            { email: user.email },
                            { discordId: account.providerAccountId }
                        ]
                    });
                    
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.username = dbUser.username;
                        token.role = dbUser.role;
                        token.points = dbUser.points;
                        token.badges = dbUser.badges;
                        token.bio = dbUser.bio;
                        token.isAdmin = dbUser.isAdmin;
                        token.accessToken = generateJWT(dbUser);
                    }
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id as string,
                username: token.username as string,
                email: token.email as string,
                role: token.role as string,
                points: token.points as number || 0,
                badges: token.badges as any[] || [],
                bio: token.bio as string || "",
                isAdmin: token.isAdmin as boolean || false,
            };
            session.accessToken = token.accessToken as string;
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
};