import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        // Credentials Provider (Email and Password)
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

                // Connect to MongoDB
                await connectDB();

                // Find user in MongoDB
                const user = await User.findOne({ email }).select("+password");
                if (!user) {
                    throw new Error("No user found with this email");
                }

                // Validate password
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    throw new Error("Invalid password");
                }

                // Return user data for the session
                return {
                    id: user._id.toString(), // Convert ObjectId to string
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }: { session: any; token: any }) {
            try {
                // Connect to MongoDB
                await connectDB();

                // Find user by email in MongoDB
                const user = await User.findOne({ email: session.user.email }) as IUser;

                if (user) {
                    session.user = {
                        id: user._id.toString(),
                        username: user.username,
                        role: user.role,
                        points: user.points,
                        badges: user.badges,
                        bio: user.bio,
                        isAdmin: user.isAdmin,
                        name: user.name,
                        email: user.email,
                        image: session.user.image,
                    };
                }

                return session;
            } catch (error) {
                console.error("Error in session callback:", (error as Error).message);
                return {
                    ...session,
                    error: "Failed to retrieve user data",
                };
            }
        },

        async signIn({ user, account }: any) {
            if (account.provider === "google") {
                const { email, name, image } = user;
                const username = email.split("@")[0];

                try {
                    await connectDB();

                    // Check if the user already exists in the database
                    const existingUser = await User.findOne({ email });

                    if (!existingUser) {
                        // Create a new user
                        const newUser = new User({
                            name,
                            email,
                            username,
                            password: "", // Empty password for OAuth users
                            role: "Apprenti",
                            points: 0,
                            badges: [],
                            isAdmin: false,
                            bio: "",
                        });

                        await newUser.save();
                    }

                    return true;
                } catch (error) {
                    console.error("Error in signIn callback:", (error as Error).message);
                    return false;
                }
            }
            return true;
        },
    },
    pages: {
        signIn: "/signin", // Custom sign-in page
    },
    secret: process.env.NEXTAUTH_SECRET, // Secret for signing JWTs and sessions
};

const authHandler = NextAuth(authOptions);

export { authHandler as GET, authHandler as POST };
