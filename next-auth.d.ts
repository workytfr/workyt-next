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
        email: string;
    }

    interface Session {
        user: User;
        accessToken?: string;
    }

    interface JWT {
        id: string;
        username: string;
        email: string;
        role: string;
        points: number;
        accessToken: string;
    }
}
