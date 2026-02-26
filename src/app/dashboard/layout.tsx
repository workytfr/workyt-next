import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import DashboardSidebar from "./_components/DashboardSidebar";
import DashboardHeader from "./_components/DashboardHeader";
import { authOptions } from "@/lib/authOptions";
import "./styles/dashboard-theme.css";

export const metadata: Metadata = {
  title: "Dashboard - Workyt",
  description: "Tableau de bord de gestion de Workyt. Gérez vos cours, exercices et leçons.",
  robots: "noindex, nofollow",
};

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
  const allowedRoles = ["Rédacteur", "Correcteur", "Admin", "Modérateur", "Helpeur"];

  // Vérifie que l'utilisateur existe et que son rôle est autorisé
  if (!session.user || !allowedRoles.includes(session.user.role as string)) {
    redirect("/");
  }

  return (
    <div className="dash-layout">
      {/* Barre latérale */}
      <DashboardSidebar />
      
      {/* Contenu principal */}
      <div className="dash-main">
        <DashboardHeader />
        <main className="pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
