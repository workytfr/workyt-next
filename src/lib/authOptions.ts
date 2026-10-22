// src/utils/authOptions.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { rateLimit, getIPFromHeaders } from "@/lib/rateLimit";

// Fonction pour générer un JWT
function generateJWT(user: any) {
    return jwt.sign(
        {
            id: user.id || user._id?.toString(),
            email: user.email,
            role: user.role,
            roles: user.roles || [],
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
            async authorize(credentials, req) {
                const { email, password } = credentials || {};
                // NextAuth accepte un corps JSON : sans ce contrôle, un objet
                // ({"$regex": "^a"}) arriverait tel quel dans le filtre Mongo.
                if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
                    throw new Error("Email and password are required");
                }

                // Rate limit : 10 tentatives / min par IP et 20 / 15 min par email
                const ip = getIPFromHeaders(req?.headers);
                const rlIp = rateLimit(`credentials:${ip}`, 10, 60_000);
                const rlEmail = rateLimit(`credentials-email:${email.trim().toLowerCase()}`, 20, 900_000);
                if (!rlIp.success || !rlEmail.success) {
                    throw new Error("Trop de tentatives, réessaie dans quelques minutes.");
                }

                await connectDB();
                const user = await User.findOne({ email: email.trim() }).select("+password");
                // Même message dans les deux cas : ne pas révéler si l'email existe
                if (!user?.password || !(await bcrypt.compare(password, user.password))) {
                    throw new Error("Identifiants incorrects");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    username: user.username || "",
                    role: user.role,
                    roles: user.roles || [],
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
                    
                    // Un email non vérifié côté Discord ne prouve pas que la
                    // personne le possède : on ne s'en sert ni pour rattacher un
                    // compte existant ni pour en créer un.
                    const discordEmailVerified = (profile as { verified?: boolean } | undefined)?.verified === true;

                    // Vérifier si l'utilisateur existe déjà
                    let existingUser = await User.findOne({ discordId: account.providerAccountId });
                    if (!existingUser && user.email) {
                        if (!discordEmailVerified) return false;
                        existingUser = await User.findOne({ email: user.email });
                    }

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
                            role: 'Apprenti',
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
        async jwt({ token, user, account, trigger }) {
            // update() côté client (après modification du profil) : on relit le nom en base
            if (trigger === "update" && token.id) {
                await connectDB();
                const fresh = await User.findById(token.id).select("username").lean<{ username: string }>();
                if (fresh) token.username = fresh.username;
                return token;
            }
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.email = user.email;
                token.role = user.role;
                token.roles = user.roles || [];
                token.points = user.points;
                token.accessToken = generateJWT(user);

                // Si c'est une connexion Discord, récupérer les données utilisateur depuis la DB
                if (account?.provider === "discord") {
                    await connectDB();
                    // discordId d'abord : c'est l'identité prouvée par Discord
                    const dbUser =
                        (await User.findOne({ discordId: account.providerAccountId })) ||
                        (await User.findOne({ email: user.email }));

                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.username = dbUser.username;
                        token.role = dbUser.role;
                        token.roles = dbUser.roles || [];
                        token.points = dbUser.points;
                        token.badges = dbUser.badges;
                        token.bio = dbUser.bio;
                        token.isAdmin = dbUser.isAdmin;
                        token.accessToken = generateJWT(dbUser);
                    }
                }
            } else if (token.id) {
                // Rôles relus en base toutes les 5 min : sans ça, un admin rétrogradé
                // (ou un compte supprimé) gardait ses droits tant que sa session vivait.
                const now = Date.now();
                if (!token.rolesCheckedAt || now - (token.rolesCheckedAt as number) > 5 * 60_000) {
                    await connectDB();
                    const fresh = await User.findById(token.id)
                        .select("role roles isAdmin")
                        .lean<{ role: string; roles?: string[]; isAdmin?: boolean }>();
                    const changed = !fresh
                        || fresh.role !== token.role
                        || JSON.stringify(fresh.roles || []) !== JSON.stringify(token.roles || [])
                        || !!fresh.isAdmin !== !!token.isAdmin;
                    token.role = fresh?.role ?? "Apprenti";
                    token.roles = fresh ? fresh.roles || [] : [];
                    token.isAdmin = fresh?.isAdmin ?? false;
                    token.rolesCheckedAt = now;
                    // Le JWT Bearer embarque aussi les rôles : on le réémet
                    if (changed) token.accessToken = undefined;
                }
            }
            if (!user && token.id) {
                // Vérifier si le JWT custom est expiré ou proche de l'expiration et le régénérer
                try {
                    const decoded: any = jwt.verify(token.accessToken as string, process.env.JWT_SECRET!);
                    // Régénérer si le token expire dans moins de 2 jours
                    const twoDaysInSeconds = 2 * 24 * 60 * 60;
                    if (decoded.exp && decoded.exp - Math.floor(Date.now() / 1000) < twoDaysInSeconds) {
                        token.accessToken = generateJWT({
                            id: token.id,
                            email: token.email,
                            role: token.role,
                            roles: token.roles,
                            points: token.points,
                            badges: token.badges,
                            bio: token.bio,
                            isAdmin: token.isAdmin,
                        });
                    }
                } catch {
                    // Token expiré ou invalide, le régénérer
                    token.accessToken = generateJWT({
                        id: token.id,
                        email: token.email,
                        role: token.role,
                        roles: token.roles,
                        points: token.points,
                        badges: token.badges,
                        bio: token.bio,
                        isAdmin: token.isAdmin,
                    });
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
                roles: (token.roles as string[]) || [],
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