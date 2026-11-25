"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import ProfileAvatar from "@/components/ui/profile";
import {
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from "lucide-react";
import { findActive, visibleGroups, type NavItem } from "./dashboardNav";
import "../styles/dashboard-theme.css";

// Le guide (1 400 lignes, framer-motion) ne se charge qu'à l'ouverture
const TutorialModal = dynamic(() => import("./TutorialModal"), { ssr: false });

// Préférences d'affichage, propres à chaque navigateur
const COLLAPSED_KEY = "dash-sidebar-collapsed";
const CLOSED_GROUPS_KEY = "dash-sidebar-closed-groups";

/** L'en-tête ouvre le tiroir mobile par cet évènement (pas de contexte à câbler) */
export const TOGGLE_SIDEBAR_EVENT = "dash:toggle-sidebar";

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

interface NavRowProps {
  item: NavItem;
  /** Page ouverte = cette entrée elle-même (et non un de ses enfants) */
  isCurrent: boolean;
  /** Page ouverte = cette entrée ou l'un de ses enfants */
  inSection: boolean;
  activeChildHref?: string;
  isExpanded: boolean;
  onToggle: () => void;
  /** Barre repliée : icône seule, le nom apparaît au survol */
  railMode: boolean;
}

function NavRow({ item, isCurrent, inSection, activeChildHref, isExpanded, onToggle, railMode }: NavRowProps) {
  const Icon = item.icon;
  const hasChildren = !railMode && !!item.children?.length;

  return (
    <li>
      <div className="relative">
        {/* Le nom mène toujours à la page ; le chevron, lui, ne fait que
            déplier. Avant, « Cours » était un simple bouton : pour ouvrir la
            liste des cours il fallait déplier puis cliquer « Tous les cours ». */}
        <Link
          href={item.href}
          title={railMode ? item.name : undefined}
          aria-label={railMode ? item.name : undefined}
          aria-current={isCurrent ? "page" : undefined}
          className={cn(
            "dash-sidebar-item",
            isCurrent && "active",
            inSection && !isCurrent && "in-section",
            hasChildren && "has-toggle"
          )}
        >
          <Icon className="dash-sidebar-icon" />
          <span className="dash-sidebar-label">{item.name}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Replier ${item.name}` : `Déplier ${item.name}`}
            className="dash-sidebar-subtoggle"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul className="dash-sidebar-children">
          {item.children!.map((child) => {
            const active = child.href === activeChildHref;
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("dash-sidebar-item dash-sidebar-child", active && "active")}
                >
                  {child.icon && <child.icon className="h-4 w-4 shrink-0" />}
                  <span>{child.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  // Sous-menus : ouverts d'office quand on est dans la section, sinon au choix
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialMounted, setTutorialMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Barre repliée (icônes seules) et groupes fermés : relus depuis le navigateur
  const [collapsed, setCollapsed] = useState(false);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  if (tutorialOpen && !tutorialMounted) setTutorialMounted(true);

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

  // Tiroir mobile : ouvert depuis l'en-tête, refermé au changement de page
  useEffect(() => {
    const toggle = () => setIsMobileMenuOpen((open) => !open);
    window.addEventListener(TOGGLE_SIDEBAR_EVENT, toggle);
    return () => window.removeEventListener(TOGGLE_SIDEBAR_EVENT, toggle);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la navigation referme les menus
    setIsMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Tiroir ouvert : la page derrière ne défile plus, Échap referme
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMobileMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [isMobileMenuOpen]);

  // Menu du compte : clic dehors ou Échap
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUserMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  // Forcer le mode clair
  useEffect(() => {
    document.body.classList.remove("dark");
    document.body.style.backgroundColor = "#fdfaf4";
    document.body.style.color = "#1a1512";
  }, []);

  const groups = visibleGroups(user);
  const active = findActive(pathname, groups);

  // Sur mobile, la barre ouverte est un tiroir : toujours en version complète
  const railMode = collapsed && !isMobileMenuOpen;

  return (
    <>
      {/* Voile du tiroir mobile */}
      <div
        className={cn("dash-sidebar-overlay", isMobileMenuOpen && "open")}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn("dash-sidebar", isMobileMenuOpen && "open", railMode && "is-collapsed")}
        aria-label="Navigation du tableau de bord"
      >
        {/* En-tête : fixe, seule la liste défile */}
        <div className="dash-sidebar-header">
          <Link href="/dashboard" className="dash-sidebar-brand" aria-label="Tableau de bord — vue d'ensemble">
            <Image src="/workyt_square.svg" alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
            <span className="dash-sidebar-title">
              workyt<small>Tableau de bord</small>
            </span>
          </Link>
          {/* Replier / déplier (grand écran) */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="dash-sidebar-collapse"
            title={collapsed ? "Déplier le menu" : "Replier le menu"}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          {/* Fermer (tiroir mobile) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="dash-sidebar-close"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="dash-sidebar-nav dash-scrollbar">
          {groups.map((group) => {
            // Le groupe de la page ouverte reste toujours visible
            const hasActive = group.items.some((item) => item === active?.item);
            const isOpen = railMode || hasActive || !closedGroups.includes(group.title);

            return (
              <div key={group.title} className="dash-sidebar-section">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="dash-sidebar-section-title dash-sidebar-group-toggle"
                  aria-expanded={isOpen}
                  // Replier le groupe où l'on se trouve n'aurait aucun effet visible
                  disabled={hasActive}
                >
                  <span>{group.title}</span>
                  {!hasActive && (
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", !isOpen && "-rotate-90")} />
                  )}
                </button>
                {isOpen && (
                  <ul className="dash-sidebar-list">
                    {group.items.map((item) => {
                      const inSection = item === active?.item;
                      return (
                        <NavRow
                          key={item.href}
                          item={item}
                          inSection={inSection}
                          isCurrent={inSection && !active?.child}
                          activeChildHref={inSection ? active?.child?.href : undefined}
                          isExpanded={manualOpen[item.href] ?? inSection}
                          onToggle={() =>
                            setManualOpen((prev) => ({ ...prev, [item.href]: !(prev[item.href] ?? inSection) }))
                          }
                          railMode={railMode}
                        />
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pied : guide + compte, toujours visibles */}
        <div className="dash-sidebar-footer">
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            title={railMode ? "Guide de démarrage" : undefined}
            aria-label="Guide de démarrage"
            className="dash-sidebar-item w-full"
          >
            <HelpCircle className="dash-sidebar-icon" />
            <span className="dash-sidebar-label">Guide de démarrage</span>
          </button>

          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label="Mon compte"
              className="dash-sidebar-user"
            >
              {status === "loading" || !user ? (
                // Session en cours de lecture : pas de faux « Utilisateur · Rédacteur »
                <>
                  <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[rgba(253,250,244,0.1)]" />
                  <span className="dash-sidebar-label h-3 w-24 animate-pulse rounded bg-[rgba(253,250,244,0.1)]" />
                </>
              ) : (
                <>
                  <span className="dash-sidebar-avatar">
                    <ProfileAvatar
                      username={user.username}
                      image={user.image || undefined}
                      userId={user.id}
                      role={user.role}
                      size="small"
                    />
                  </span>
                  <span className="dash-sidebar-label min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold text-[#fdfaf4]">{user.username}</span>
                    <span className="block truncate text-xs text-[rgba(253,250,244,0.5)]">{user.role}</span>
                  </span>
                  <ChevronsUpDown className="dash-sidebar-label h-4 w-4 shrink-0 text-[rgba(253,250,244,0.4)]" />
                </>
              )}
            </button>

            {userMenuOpen && user && (
              <div role="menu" className="dash-sidebar-usermenu">
                {user.email && <p className="truncate px-3 pb-1.5 pt-2 text-xs text-[#97938e]">{user.email}</p>}
                <Link href={`/compte/${user.id}`} role="menuitem" className="dash-menu-item">
                  <User className="h-4 w-4 text-[#6b625c]" />
                  Mon profil
                </Link>
                <Link href="/" role="menuitem" className="dash-menu-item">
                  <ExternalLink className="h-4 w-4 text-[#6b625c]" />
                  Retour au site
                </Link>
                <div className="my-1 h-px bg-[#f0e9dc]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="dash-menu-item w-full text-[#c2272d] hover:!bg-[#fdecec]"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {tutorialMounted && <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />}
    </>
  );
}
