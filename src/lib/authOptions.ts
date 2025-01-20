// src/utils/authOptions.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.email = user.email;
                token.role = user.role;
                token.points = user.points;
                token.accessToken = generateJWT(user);
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
                badges: [],
                bio: "",
                isAdmin: false,
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