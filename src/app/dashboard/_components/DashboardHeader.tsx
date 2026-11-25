"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ExternalLink, Menu, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { breadcrumb, flatPages, visibleGroups } from "./dashboardNav";
import { TOGGLE_SIDEBAR_EVENT } from "./DashboardSidebar";
import "../styles/dashboard-theme.css";

// Recherche sans accents ni casse : « evaluations » trouve « Évaluations »
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * En-tête du tableau de bord.
 *
 * — Fil d'Ariane : dit où l'on est (avant : « Tableau de bord » sur toutes les
 *   pages, dans un second <h1> à côté de celui de la page).
 * — Recherche : saute à une page du tableau de bord. L'ancienne envoyait vers
 *   /dashboard/cours?search=…, paramètre que la page ne lisait pas.
 * — Le compte et la déconnexion vivent dans la barre latérale : ils étaient
 *   affichés deux fois. La cloche, elle, n'ouvrait rien et affichait une
 *   pastille permanente : retirée.
 */
export default function DashboardHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const crumbs = breadcrumb(pathname);
  const pages = useMemo(() => flatPages(visibleGroups(session?.user)), [session?.user]);
  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return pages;
    return pages.filter((p) => fold(p.name).includes(q) || fold(p.group).includes(q));
  }, [pages, query]);

  // Ctrl/⌘ K : la recherche, depuis n'importe où dans le tableau de bord
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (!results.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setHighlighted((h) => (h + step + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[Math.min(highlighted, results.length - 1)];
      if (target) go(target.href);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="dash-header">
      <div className="dash-header-left">
        {/* Ouvre la barre latérale (tiroir) sous 1024px */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(TOGGLE_SIDEBAR_EVENT))}
          className="dash-header-menu"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Fil d'Ariane" className="dash-breadcrumb">
          <Link href="/dashboard" className="dash-breadcrumb-root">
            Tableau de bord
          </Link>
          {crumbs.map((crumb, i) => {
            // La vue d'ensemble EST la racine : pas de « Tableau de bord › Vue d'ensemble »
            if (pathname === "/dashboard") return null;
            const last = i === crumbs.length - 1;
            return (
              <span key={crumb.name} className="dash-breadcrumb-step">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#c9c3bb]" aria-hidden="true" />
                {crumb.href && !last ? (
                  <Link href={crumb.href} className="dash-breadcrumb-link">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="dash-breadcrumb-current" aria-current="page">
                    {crumb.name}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="dash-header-right">
        <div ref={boxRef} className="dash-header-search">
          <Search className="dash-header-search-icon h-4 w-4" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="dash-page-search"
            aria-autocomplete="list"
            aria-label="Aller à une page du tableau de bord"
            placeholder="Aller à…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          <kbd className="dash-header-kbd" aria-hidden="true">Ctrl K</kbd>

          {open && (
            <div id="dash-page-search" role="listbox" className="dash-header-results dash-scrollbar">
              {results.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-[#97938e]">Aucune page ne correspond.</p>
              ) : (
                results.map((page, i) => (
                  <button
                    key={page.href}
                    type="button"
                    role="option"
                    aria-selected={i === highlighted}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => go(page.href)}
                    className={cn("dash-menu-item w-full", i === highlighted && "is-highlighted")}
                  >
                    <page.icon className="h-4 w-4 shrink-0 text-[#6b625c]" />
                    <span className="min-w-0 flex-1 truncate text-left">{page.name}</span>
                    <span className="shrink-0 text-xs text-[#97938e]">{page.group}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="dash-button dash-button-secondary dash-button-sm"
          aria-label="Voir le site (nouvel onglet)"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Voir le site</span>
        </Link>
      </div>
    </header>
  );
}
