import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        username: string;
        role: string;
        points: number;
        badges: string[];
        bio: string;
        isAdmin: boolean;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    }

    interface Session {
        user: User;
    }
}