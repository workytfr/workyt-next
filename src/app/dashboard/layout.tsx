import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Sidebar from "./_components/sidebar";
import Header from "./_components/header";
import { authOptions } from "@/lib/authOptions"; // Adapté à votre configuration NextAuth

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    // Récupération de la session côté serveur
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    // Liste des rôles autorisés pour accéder au dashboard
    const allowedRoles = ["Rédacteur", "Correcteur", "Admin"];

    // Vérifie que l'utilisateur existe et que son rôle est autorisé
    if (!session.user || !allowedRoles.includes(session.user.role as string)) {
        redirect("/");
    }

    // Si la vérification est validée, on rend le layout du dashboard
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Barre latérale */}
            <Sidebar />
            {/* Contenu principal */}
            <div className="flex flex-col flex-1">
                <Header />
                <main className="p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
