import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import jwt from "jsonwebtoken";

// Fonction pour générer un token JWT
function generateJWT(user: any) {
    return jwt.sign(
        { id: user.id || user._id?.toString(), email: user.email, role: user.role , points: user.points, badges: user.badges, bio: user.bio, isAdmin: user.isAdmin },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" } // Expiration dans 30 jours
    );
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
                if (!user) {
                    throw new Error("No user found with this email");
                }

                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    throw new Error("Invalid password");
                }

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
                token.id = user.id || (user as IUser)._id?.toString();
                token.sub = token.id as string;
                token.email = user.email || "";
                token.username = user.username || "Anonymous";
                token.role = user.role || "user";
                token.accessToken = generateJWT(user); // Vous pouvez aussi utiliser un token fourni par un provider
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                ...session.user,
                id: token.sub || "unknown-id",
                username: token.username as string || "Anonymous",
                points: token.points as number || 0,
            };
            (session as any).accessToken = token.accessToken as string;
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
        secret: process.env.NEXTAUTH_SECRET, // ou JWT_SECRET
    },
};

const authHandler = NextAuth(authOptions);

export { authHandler as GET, authHandler as POST };
