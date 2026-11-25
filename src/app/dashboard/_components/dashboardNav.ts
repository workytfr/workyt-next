import { hasRole } from "@/lib/userRoles";
import {
  Home,
  BookOpen,
  FileText,
  Users,
  Library,
  CircleDot,
  Award,
  Layers,
  Store,
  Shield,
  GraduationCap,
  Plus,
  Upload,
  BarChart3,
  FileCheck,
  Radio,
  KanbanSquare,
  IdCard,
  CalendarClock,
  HeartHandshake,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

/**
 * Plan du tableau de bord — une seule source pour la barre latérale, le fil
 * d'Ariane de l'en-tête et la recherche de pages. Avant, la liste vivait dans
 * la barre latérale seule : l'en-tête affichait « Tableau de bord » partout et
 * la recherche renvoyait vers une page qui ne lisait pas sa requête.
 */

export interface NavChild {
  name: string;
  href: string;
  icon?: LucideIcon;
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
  /** Rôles autorisés ; absent = tout le staff */
  roles?: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const ADMIN = ["Admin"];

// Un groupe = une tâche, pas plus de 5 liens.
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Général",
    items: [
      { name: "Vue d'ensemble", href: "/dashboard", icon: Home },
      { name: "Kanban", href: "/dashboard/kanban", icon: KanbanSquare },
      { name: "Suivis", href: "/dashboard/suivis", icon: HeartHandshake, roles: ["Helpeur", "Modérateur", "Admin"] },
    ],
  },
  {
    title: "Contenu",
    items: [
      {
        name: "Cours",
        href: "/dashboard/cours",
        icon: BookOpen,
        children: [
          { name: "Créer un cours", href: "/dashboard/cours/nouveau", icon: Plus },
          { name: "Importer un cours", href: "/dashboard/cours/importer", icon: Upload },
        ],
      },
      { name: "Sections", href: "/dashboard/sections", icon: Layers },
      { name: "Leçons", href: "/dashboard/lessons", icon: FileText },
      { name: "Exercices", href: "/dashboard/exercises", icon: Library },
    ],
  },
  {
    title: "Quiz & évaluations",
    items: [
      { name: "Quiz", href: "/dashboard/quizzes", icon: CircleDot },
      {
        name: "Quiz du jour",
        href: "/dashboard/daily-quiz",
        icon: CalendarClock,
        roles: ["Admin", "Rédacteur", "Correcteur", "Helpeur"],
      },
      {
        name: "Évaluations",
        href: "/dashboard/evaluations",
        icon: FileCheck,
        roles: ["Correcteur", "Helpeur", "Rédacteur", "Admin", "Modérateur"],
        children: [{ name: "Banque d'épreuves", href: "/dashboard/evaluations/manage" }],
      },
      { name: "Certificats", href: "/dashboard/certificates", icon: Award },
    ],
  },
  {
    title: "Communauté",
    items: [
      { name: "Utilisateurs", href: "/dashboard/users", icon: Users, roles: ADMIN },
      { name: "Adhérents", href: "/dashboard/adherents", icon: IdCard, roles: ADMIN },
      { name: "Bénévoles", href: "/dashboard/statistiques", icon: BarChart3, roles: ADMIN },
      { name: "Rôles", href: "/dashboard/roles", icon: KeyRound, roles: ADMIN },
      { name: "Modération", href: "/dashboard/moderation", icon: Shield, roles: ["Admin", "Modérateur"] },
    ],
  },
  {
    title: "Site",
    items: [
      { name: "Programmes", href: "/dashboard/curriculum", icon: GraduationCap, roles: ADMIN },
      { name: "Partenaires", href: "/dashboard/partners", icon: Store, roles: ADMIN },
      { name: "Lives", href: "/dashboard/lives", icon: Radio, roles: ADMIN },
    ],
  },
];

/** Pages sans entrée dans la barre : leur nom pour le fil d'Ariane */
const EXTRA_TITLES: { pattern: RegExp; parent: string; name: string }[] = [
  { pattern: /^\/dashboard\/cours\/seo/, parent: "/dashboard/cours", name: "Référencement" },
  { pattern: /^\/dashboard\/cours\/[^/]+\/gestion/, parent: "/dashboard/cours", name: "Gestion du cours" },
  { pattern: /^\/dashboard\/evaluations\/(?!manage)[^/]+/, parent: "/dashboard/evaluations", name: "Correction" },
  { pattern: /^\/dashboard\/lessons\/editor\//, parent: "/dashboard/lessons", name: "Éditeur" },
  { pattern: /^\/dashboard\/admin\/cleanup/, parent: "/dashboard", name: "Nettoyage" },
];

type SessionUser = Parameters<typeof hasRole>[0];

/** Groupes visibles pour cet utilisateur (les groupes vides disparaissent) */
export function visibleGroups(user: SessionUser): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || hasRole(user, ...item.roles)),
  })).filter((group) => group.items.length > 0);
}

const under = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

/**
 * Entrée correspondant à la page ouverte. Le préfixe le plus long gagne :
 * `/dashboard/cours/nouveau` est « Créer un cours », `/dashboard/cours/42/gestion`
 * retombe sur « Cours ». L'ancienne comparaison stricte n'allumait rien sur
 * les sous-pages.
 */
export function findActive(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  let best: { item: NavItem; child?: NavChild; len: number } | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      if (under(pathname, item.href) && (!best || item.href.length > best.len)) {
        best = { item, len: item.href.length };
      }
      for (const child of item.children ?? []) {
        if (under(pathname, child.href) && (!best || child.href.length > best.len)) {
          best = { item, child, len: child.href.length };
        }
      }
    }
  }
  return best;
}

export interface Crumb {
  name: string;
  href?: string;
}

/** Fil d'Ariane de la page ouverte, dernier élément = page courante (sans lien) */
export function breadcrumb(pathname: string): Crumb[] {
  const active = findActive(pathname);
  const extra = EXTRA_TITLES.find((e) => e.pattern.test(pathname));

  if (extra) {
    const parent = findActive(extra.parent);
    const crumbs: Crumb[] = [];
    if (parent && parent.item.href !== "/dashboard") crumbs.push({ name: parent.item.name, href: parent.item.href });
    crumbs.push({ name: extra.name });
    return crumbs;
  }
  if (!active) return [{ name: "Tableau de bord" }];
  if (active.child) return [{ name: active.item.name, href: active.item.href }, { name: active.child.name }];
  return [{ name: active.item.name }];
}

export interface PageEntry {
  name: string;
  href: string;
  group: string;
  icon: LucideIcon;
}

/** Liste à plat pour la recherche de pages */
export function flatPages(groups: NavGroup[]): PageEntry[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => [
      { name: item.name, href: item.href, group: group.title, icon: item.icon },
      ...(item.children ?? []).map((child) => ({
        name: child.name,
        href: child.href,
        group: item.name,
        icon: child.icon ?? item.icon,
      })),
    ])
  );
}
