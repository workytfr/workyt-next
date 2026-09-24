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
  GraduationCap,
  X,
  Plus,
  Upload,
  BarChart3,
  FileCheck,
  HelpCircle,
  Radio,
  KanbanSquare,
  IdCard,
  CalendarClock,
  HeartHandshake,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import TutorialModal from "./TutorialModal";
import "../styles/dashboard-theme.css";

interface NavChild {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
  roles?: string[];
  adminOnly?: boolean;
  moderatorOnly?: boolean;
}

// Navigation items avec leurs permissions
const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Kanban", href: "/dashboard/kanban", icon: KanbanSquare },
  {
    name: "Suivis",
    href: "/dashboard/suivis",
    icon: HeartHandshake,
    roles: ["Helpeur", "Modérateur", "Admin"],
  },
  {
    name: "Cours",
    href: "/dashboard/cours",
    icon: BookOpen,
    children: [
      { name: "Tous les cours", href: "/dashboard/cours" },
      { name: "Créer un cours", href: "/dashboard/cours/nouveau", icon: Plus },
      { name: "Importer un cours", href: "/dashboard/cours/importer", icon: Upload },
    ],
  },
  { name: "Sections", href: "/dashboard/sections", icon: Layers },
  { name: "Leçons", href: "/dashboard/lessons", icon: FileText },
  { name: "Quiz", href: "/dashboard/quizzes", icon: CircleDot },
  {
    name: "Quiz du jour",
    href: "/dashboard/daily-quiz",
    icon: CalendarClock,
    roles: ["Admin", "Rédacteur", "Correcteur", "Helpeur"],
  },
  { name: "Exercices", href: "/dashboard/exercises", icon: Library },
  {
    name: "Évaluations",
    href: "/dashboard/evaluations",
    icon: FileCheck,
    roles: ["Correcteur", "Helpeur", "Rédacteur", "Admin", "Modérateur"],
    children: [
      { name: "Corrections", href: "/dashboard/evaluations" },
      { name: "Banque", href: "/dashboard/evaluations/manage" },
    ],
  },
  { name: "Certificats", href: "/dashboard/certificates", icon: Award },
  { name: "Programmes", href: "/dashboard/curriculum", icon: GraduationCap, adminOnly: true },
  { name: "Partenaires", href: "/dashboard/partners", icon: Store, adminOnly: true },
  { name: "Lives", href: "/dashboard/lives", icon: Radio, adminOnly: true },
  { name: "Adhérents", href: "/dashboard/adherents", icon: IdCard, adminOnly: true },
  { name: "Utilisateurs", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Modération", href: "/dashboard/moderation", icon: Shield, moderatorOnly: true },
  { name: "Rôles", href: "/dashboard/roles", icon: Shield, adminOnly: true },
  { name: "Bénévoles", href: "/dashboard/statistiques", icon: BarChart3, adminOnly: true },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

// Groupement pour l'affichage : un groupe = une tâche, pas plus de 5 liens.
// « Paramètres » n'est dans aucun groupe : il est en bas, avec le guide.
const navGroups = [
  {
    title: "Général",
    items: ["Dashboard", "Kanban", "Suivis"],
  },
  {
    title: "Contenu",
    items: ["Cours", "Sections", "Leçons", "Exercices"],
  },
  {
    title: "Quiz & évaluations",
    items: ["Quiz", "Quiz du jour", "Évaluations", "Certificats"],
  },
  {
    title: "Communauté",
    items: ["Utilisateurs", "Adhérents", "Bénévoles", "Rôles", "Modération"],
  },
  {
    title: "Site",
    items: ["Programmes", "Partenaires", "Lives"],
  },
];

// Préférences d'affichage, propres à chaque navigateur
const COLLAPSED_KEY = "dash-sidebar-collapsed";
const CLOSED_GROUPS_KEY = "dash-sidebar-closed-groups";

function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* navigation privée : la préférence ne sera simplement pas retenue */
  }
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  /** Barre repliée : icône seule, le nom apparaît au survol */
  railMode?: boolean;
}

function NavItem({ item, isActive, isExpanded, onToggle, railMode }: NavItemProps) {
  const Icon = item.icon;
  // Barre repliée : pas de sous-menu, l'icône mène directement à la page
  const hasChildren = !railMode && item.children && item.children.length > 0;

  return (
    <div>
      {hasChildren ? (
        <>
          <button
            type="button"
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
                    child.external && "text-[#ff6a1a] hover:text-[#ffb547]"
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
          title={railMode ? item.name : undefined}
          aria-label={railMode ? item.name : undefined}
          className={cn("dash-sidebar-item", isActive && "active")}
        >
          <Icon className="dash-sidebar-icon" />
          <span className="dash-sidebar-label">{item.name}</span>
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
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // Barre repliée (icônes seules) et groupes fermés : relus depuis le navigateur
  const [collapsed, setCollapsed] = useState(false);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const user = session?.user;

  // localStorage n'existe qu'après le montage (pas côté serveur)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique d'une préférence navigateur
    setCollapsed(readPref(COLLAPSED_KEY, false));
    setClosedGroups(readPref<string[]>(CLOSED_GROUPS_KEY, []));
    setPrefsLoaded(true);
  }, []);

  // La marge du contenu suit la largeur de la barre (voir dashboard-theme.css)
  useEffect(() => {
    document.documentElement.dataset.dashSidebar = collapsed ? "collapsed" : "open";
    if (prefsLoaded) writePref(COLLAPSED_KEY, collapsed);
  }, [collapsed, prefsLoaded]);

  const toggleGroup = (title: string) => {
    setClosedGroups((prev) => {
      const next = prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title];
      writePref(CLOSED_GROUPS_KEY, next);
      return next;
    });
  };

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Forcer le mode clair
  useEffect(() => {
    document.body.classList.remove("dark");
    document.body.style.backgroundColor = "#fdfaf4";
    document.body.style.color = "#1a1512";
  }, []);

  // Filtrer les éléments selon le rôle
  const filteredNavItems = navItems.filter((item) => {
    if (item.roles && !item.roles.includes(user?.role || '')) {
      return false;
    }
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

  // Sur mobile, la barre ouverte est un tiroir : toujours en version complète
  const railMode = collapsed && !isMobileMenuOpen;
  const settingsItem = filteredNavItems.find((item) => item.name === "Paramètres");

  const isItemActive = (item: NavItem) => {
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
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-[#e6e0d6] rounded-lg shadow-sm lg:hidden"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-[#1a1512]" />
        ) : (
          <Menu className="w-5 h-5 text-[#1a1512]" />
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
          isMobileMenuOpen && "open",
          railMode && "is-collapsed"
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
          <span className="dash-sidebar-title">workyt<small>Tableau de bord</small></span>
          {/* Replier / déplier (grand écran uniquement : sur mobile la barre est un tiroir) */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="dash-sidebar-collapse"
            title={collapsed ? "Déplier le menu" : "Replier le menu"}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="dash-sidebar-nav">
          {navGroups.map((group) => {
            // Filtrer les items du groupe selon les permissions
            const groupItems = group.items
              .map((name) => filteredNavItems.find((item) => item.name === name))
              .filter(Boolean) as NavItem[];

            if (groupItems.length === 0) return null;

            // Le groupe de la page ouverte reste toujours visible
            const hasActive = groupItems.some(isItemActive);
            const isOpen = railMode || hasActive || !closedGroups.includes(group.title);

            return (
              <div key={group.title} className="dash-sidebar-section">
                <button
                  type="button"
                  onClick={() => !hasActive && toggleGroup(group.title)}
                  className="dash-sidebar-section-title dash-sidebar-group-toggle"
                  aria-expanded={isOpen}
                  disabled={hasActive}
                >
                  <span>{group.title}</span>
                  {!hasActive && (
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !isOpen && "-rotate-90")} />
                  )}
                </button>
                {isOpen && (
                  <div className="space-y-1 px-2">
                    {groupItems.map((item) => (
                      <NavItem
                        key={item.href}
                        item={item}
                        isActive={isItemActive(item)}
                        isExpanded={expandedItems.includes(item.name)}
                        onToggle={() => toggleExpanded(item.name)}
                        railMode={railMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Paramètres + guide, toujours en bas */}
        <div className="px-2 pb-2 space-y-1">
          {settingsItem && (
            <NavItem item={settingsItem} isActive={isItemActive(settingsItem)} railMode={railMode} />
          )}
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            title={railMode ? "Guide de démarrage" : undefined}
            aria-label="Guide de démarrage"
            className="dash-sidebar-item w-full group"
          >
            <HelpCircle className="dash-sidebar-icon group-hover:text-[#ff6a1a] transition-colors" />
            <span className="dash-sidebar-label">Guide de démarrage</span>
          </button>
        </div>

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
            <div className="dash-sidebar-label flex-1 min-w-0">
              <p className="text-sm font-medium text-[#fdfaf4] truncate">
                {user?.username || "Utilisateur"}
              </p>
              <p className="text-xs text-[rgba(253,250,244,0.5)]">
                {user?.role || "Rédacteur"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  );
}
