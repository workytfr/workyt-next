"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Home,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import ProfileAvatar from "@/components/ui/profile";
import "../styles/dashboard-theme.css";

export default function DashboardHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/cours?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const user = session?.user;

  return (
    <header className="dash-header">
      {/* Partie gauche - Titre et retour */}
      <div className="dash-header-left">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#6b6b6b] hover:text-[#37352f] transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Accueil</span>
        </Link>
        <span className="text-[#e3e2e0]">|</span>
        <h1 className="dash-header-title">Tableau de bord</h1>
      </div>

      {/* Partie droite - Recherche, notifications, profil */}
      <div className="dash-header-right">
        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="dash-header-search hidden md:block">
          <Search className="dash-header-search-icon w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Bouton voir le site */}
        <Link
          href="/"
          target="_blank"
          className="dash-button dash-button-secondary dash-button-sm hidden sm:flex"
        >
          <ExternalLink className="w-4 h-4" />
          Voir le site
        </Link>

        {/* Notifications */}
        <button className="relative p-2 text-[#6b6b6b] hover:text-[#37352f] hover:bg-[#f7f6f3] rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f97316] rounded-full"></span>
        </button>

        {/* Menu utilisateur avec ProfileAvatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#f7f6f3] transition-colors"
          >
            <ProfileAvatar
              username={user?.username || "Utilisateur"}
              image={user?.image || undefined}
              userId={user?.id}
              role={user?.role}
              size="small"
              showPoints={false}
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[#37352f] leading-tight">
                {user?.username || "Utilisateur"}
              </p>
              <p className="text-xs text-[#9ca3af] leading-tight">
                {user?.role || "Rédacteur"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#6b6b6b]" />
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e3e2e0] rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-4 border-b border-[#e3e2e0] bg-[#f7f6f3]">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      username={user?.username || "Utilisateur"}
                      image={user?.image || undefined}
                      userId={user?.id}
                      role={user?.role}
                      size="small"
                      showPoints={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#37352f] truncate">
                        {user?.username || "Utilisateur"}
                      </p>
                      <p className="text-xs text-[#9ca3af] truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-1">
                  <Link
                    href={`/compte/${user?.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#37352f] hover:bg-[#f7f6f3] rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-[#6b6b6b]" />
                    Mon profil
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
