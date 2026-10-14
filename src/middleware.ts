import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getUserRoles, type RoleSubject } from "@/lib/userRoles";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;

        // Protection des routes dashboard : bloqué si l'on n'a aucun rôle autre
        // qu'"Apprenti" (rôle par défaut), rôles secondaires compris.
        // Les permissions fines sont vérifiées côté API via hasPermission().
        if (pathname.startsWith("/dashboard") && getUserRoles(token as RoleSubject).every((r) => r === "Apprenti")) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Les routes dashboard nécessitent une session
                if (pathname.startsWith("/dashboard")) {
                    return !!token;
                }

                // Les routes API protégées nécessitent une session
                if (pathname.startsWith("/api/dashboard")) {
                    return !!token;
                }

                // Toutes les autres routes matchées passent
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/dashboard/:path*",
    ],
};
