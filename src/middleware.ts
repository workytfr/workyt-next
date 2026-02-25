import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;

        // Protection des routes dashboard : accès réservé aux rôles autorisés
        const dashboardRoles = ["Rédacteur", "Correcteur", "Admin", "Modérateur", "Helpeur"];
        if (pathname.startsWith("/dashboard") && !dashboardRoles.includes(token?.role as string)) {
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
