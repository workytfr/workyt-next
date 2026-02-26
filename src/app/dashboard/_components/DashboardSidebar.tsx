"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ProfileAvatar from "@/components/ui/profile";
import {
  Home,
  BookOpen,
  FileText,
  Users,
  Settings,
  Library,
  CircleDot,
  Award,
  Layers,
  Store,
  Shield,
  Menu,
  X,
  Plus,
  Sparkles,
  BarChart3,
} from "lucide-react";
import "../styles/dashboard-theme.css";

// Navigation items avec leurs permissions
const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  {
    name: "Cours",
    href: "/dashboard/cours",
    icon: BookOpen,
    children: [
      { name: "Tous les cours", href: "/dashboard/cours" },
      { name: "Créer un cours", href: "/dashboard/cours/nouveau", icon: Plus },
      { name: "Générer avec MaitreRenardAI", href: "/cours/generer", icon: Sparkles, external: true },
    ],
  },
  { name: "Sections", href: "/dashboard/sections", icon: Layers },
  { name: "Leçons", href: "/dashboard/lessons", icon: FileText },
  { name: "Quiz", href: "/dashboard/quizzes", icon: CircleDot },
  { name: "Exercices", href: "/dashboard/exercises", icon: Library },
  { name: "Certificats", href: "/dashboard/certificates", icon: Award },
  { name: "Partenaires", href: "/dashboard/partners", icon: Store, adminOnly: true },
  { name: "Utilisateurs", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Modération", href: "/dashboard/moderation", icon: Shield, moderatorOnly: true },
  { name: "Bénévoles", href: "/dashboard/statistiques", icon: BarChart3, adminOnly: true },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

// Groupement pour l'affichage
const navGroups = [
  {
    title: "Général",
    items: ["Dashboard"],
  },
  {
    title: "Contenu",
    items: ["Cours", "Sections", "Leçons", "Quiz", "Exercices"],
  },
  {
    title: "Administration",
    items: ["Certificats", "Partenaires", "Utilisateurs", "Modération", "Bénévoles"],
  },
  {
    title: "Configuration",
    items: ["Paramètres"],
  },
];

interface NavItemProps {
  item: typeof navItems[0];
  isActive: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function NavItem({ item, isActive, isExpanded, onToggle }: NavItemProps) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {hasChildren ? (
        <>
          <button
            onClick={onToggle}
            className={cn(
              "dash-sidebar-item w-full",
              isActive && "active"
            )}
          >
            <Icon className="dash-sidebar-icon" />
            <span className="flex-1 text-left">{item.name}</span>
            <svg
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "dash-sidebar-item text-sm",
                    child.external && "text-[#f97316] hover:text-[#ea580c]"
                  )}
                >
                  {child.icon && <child.icon className="w-4 h-4" />}
                  <span>{child.name}</span>
                  {child.external && (
                    <svg
                      className="w-3 h-3 ml-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.href}
          className={cn("dash-sidebar-item", isActive && "active")}
        >
          <Icon className="dash-sidebar-icon" />
          <span>{item.name}</span>
        </Link>
      )}
    </div>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Cours"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = session?.user;

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Forcer le mode clair
  useEffect(() => {
    document.body.classList.remove("dark");
    document.body.style.backgroundColor = "white";
    document.body.style.color = "#37352f";
  }, []);

  // Filtrer les éléments selon le rôle
  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== "Admin") {
      return false;
    }
    if (
      item.moderatorOnly &&
      user?.role !== "Admin" &&
      user?.role !== "Modérateur"
    ) {
      return false;
    }
    return true;
  });

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isItemActive = (item: typeof navItems[0]) => {
    if (pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return false;
  };

  return (
    <>
      {/* Bouton menu mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-[#e3e2e0] rounded-lg shadow-sm lg:hidden"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-[#37352f]" />
        ) : (
          <Menu className="w-5 h-5 text-[#37352f]" />
        )}
      </button>

      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "dash-sidebar dash-scrollbar",
          isMobileMenuOpen && "open"
        )}
      >
        {/* Header */}
        <div className="dash-sidebar-header">
          <div className="dash-sidebar-logo flex items-center justify-center overflow-hidden !bg-transparent p-0 shrink-0">
            <Image
              src="/workyt_square.svg"
              alt="Workyt"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="dash-sidebar-title">Workyt Dashboard</span>
        </div>

        {/* Navigation */}
        <nav className="dash-sidebar-nav">
          {navGroups.map((group) => {
            // Filtrer les items du groupe selon les permissions
            const groupItems = group.items
              .map((name) => filteredNavItems.find((item) => item.name === name))
              .filter(Boolean) as typeof navItems;

            if (groupItems.length === 0) return null;

            return (
              <div key={group.title} className="dash-sidebar-section">
                <div className="dash-sidebar-section-title">{group.title}</div>
                <div className="space-y-1 px-2">
                  {groupItems.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={isItemActive(item)}
                      isExpanded={expandedItems.includes(item.name)}
                      onToggle={() => toggleExpanded(item.name)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer avec utilisateur - ProfileAvatar */}
        <div className="dash-sidebar-footer">
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
              <p className="text-xs text-[#9ca3af]">
                {user?.role || "Rédacteur"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
