"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  MessageSquare,
  FileText,
  BookOpen,
  Newspaper,
  Search,
  ArrowRight,
  Clock,
  X,
  ExternalLink,
  Loader2,
  Sparkles
} from "lucide-react";

interface SearchResult {
  type: "forum" | "fiches" | "cours" | "blog";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  external?: boolean;
  badge?: string;
  date?: string;
}

const CATEGORIES = [
  { key: "all", label: "Tout", icon: Search },
  { key: "forum", label: "Forum", icon: MessageSquare },
  { key: "fiches", label: "Fiches", icon: FileText },
  { key: "cours", label: "Cours", icon: BookOpen },
  { key: "blog", label: "Blog", icon: Newspaper },
] as const;

const TYPE_CONFIG: Record<string, { icon: typeof Search; color: string; label: string }> = {
  forum: { icon: MessageSquare, color: "text-blue-600 bg-blue-50", label: "Forum" },
  fiches: { icon: FileText, color: "text-emerald-600 bg-emerald-50", label: "Fiche" },
  cours: { icon: BookOpen, color: "text-purple-600 bg-purple-50", label: "Cours" },
  blog: { icon: Newspaper, color: "text-orange-600 bg-orange-50", label: "Blog" },
};

const QUICK_LINKS_PUBLIC = [
  { label: "Voir les cours", url: "/cours", icon: BookOpen, shortcut: "C", external: false },
  { label: "Lire le blog", url: "https://blog.workyt.fr/", icon: Newspaper, shortcut: "B", external: true },
];

const QUICK_LINKS_AUTH = [
  { label: "Poser une question", url: "/forum/creer", icon: MessageSquare, shortcut: "Q", external: false },
  { label: "Partager une fiche", url: "/fiches/creer", icon: FileText, shortcut: "F", external: false },
];

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("workyt-recent-searches") || "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem("workyt-recent-searches", JSON.stringify(recent.slice(0, 5)));
  } catch {}
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("workyt-recent-searches");
}

// Client-side cache to avoid repeated API calls for same queries
const clientCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CLIENT_CACHE_TTL = 60_000; // 1 minute

export default function SearchCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches on open
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      setQuery("");
      setResults([]);
      setCategory("all");
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search with client cache
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cacheKey = `${query}:${category}`;
    const cached = clientCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
      setResults(cached.results);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&category=${category}&limit=8`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          const searchResults = data.results || [];
          setResults(searchResults);
          // Cache the results
          clientCache.set(cacheKey, { results: searchResults, timestamp: Date.now() });
          // Evict old cache entries
          if (clientCache.size > 50) {
            const oldest = clientCache.keys().next().value;
            if (oldest) clientCache.delete(oldest);
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category]);

  const navigate = useCallback(
    (url: string, external?: boolean) => {
      if (query.trim()) saveRecentSearch(query.trim());
      onOpenChange(false);
      if (external) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        router.push(url);
      }
    },
    [query, router, onOpenChange]
  );

  const handleRecentClick = (search: string) => {
    setQuery(search);
  };

  if (!open) return null;

  const groupedResults: Record<string, SearchResult[]> = {};
  results.forEach((r) => {
    if (!groupedResults[r.type]) groupedResults[r.type] = [];
    groupedResults[r.type].push(r);
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-150"
        onClick={() => onOpenChange(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-0 z-[201] flex justify-center pt-[min(20vh,120px)] px-4 pointer-events-none">
        <div className="w-full max-w-[640px] pointer-events-auto">
          <Command
            className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden"
            shouldFilter={false}
            loop
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <Command.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Rechercher dans le forum, fiches, cours, blog..."
                className="flex-1 h-14 bg-transparent text-base outline-none placeholder:text-gray-400"
              />
              {loading && <Loader2 className="w-4 h-4 text-orange-500 animate-spin shrink-0" />}
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); }}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md font-mono hover:bg-gray-200 transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-50 overflow-x-auto">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-orange-100 text-orange-700"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            <Command.List className="max-h-[min(50vh,400px)] overflow-y-auto p-2">
              {/* Empty state when searching */}
              {query.length >= 2 && !loading && results.length === 0 && (
                <Command.Empty className="py-12 text-center">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucun résultat pour &quot;{query}&quot;</p>
                  <p className="text-xs text-gray-400 mt-1">Essayez avec d&apos;autres mots-clés</p>
                </Command.Empty>
              )}

              {/* Results grouped by type */}
              {Object.entries(groupedResults).map(([type, items]) => {
                const config = TYPE_CONFIG[type];
                if (!config) return null;
                return (
                  <Command.Group
                    key={type}
                    heading={
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <config.icon className="w-3.5 h-3.5" />
                        {config.label}
                      </div>
                    }
                  >
                    {items.map((result) => (
                      <Command.Item
                        key={result.id}
                        value={result.id}
                        onSelect={() => navigate(result.url, result.external)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors data-[selected=true]:bg-orange-50 hover:bg-gray-50 group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                          <config.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        {result.external ? (
                          <ExternalLink className="w-4 h-4 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}

              {/* No query: show recent searches + quick links */}
              {query.length < 2 && !loading && (
                <>
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <Command.Group
                      heading={
                        <div className="flex items-center justify-between px-2 py-1.5">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Recherches récentes
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearRecentSearches();
                              setRecentSearches([]);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Effacer
                          </button>
                        </div>
                      }
                    >
                      {recentSearches.map((search) => (
                        <Command.Item
                          key={`recent-${search}`}
                          value={`recent-${search}`}
                          onSelect={() => handleRecentClick(search)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer data-[selected=true]:bg-orange-50 hover:bg-gray-50"
                        >
                          <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                          <span className="text-sm text-gray-600">{search}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* Quick links */}
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Raccourcis
                      </div>
                    }
                  >
                    {[...(session ? QUICK_LINKS_AUTH : []), ...QUICK_LINKS_PUBLIC].map((link) => {
                      const Icon = link.icon;
                      return (
                        <Command.Item
                          key={link.url}
                          value={link.label}
                          onSelect={() => navigate(link.url, link.external)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer data-[selected=true]:bg-orange-50 hover:bg-gray-50 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                            <Icon className="w-4 h-4 text-gray-500 group-hover:text-orange-600 transition-colors" />
                          </div>
                          <span className="flex-1 text-sm text-gray-700">{link.label}</span>
                          <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {link.shortcut}
                          </kbd>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </>
              )}
            </Command.List>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-200/80 px-1.5 py-0.5 rounded text-[10px] font-mono">↑↓</kbd>
                  naviguer
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-200/80 px-1.5 py-0.5 rounded text-[10px] font-mono">↵</kbd>
                  ouvrir
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-gray-200/80 px-1.5 py-0.5 rounded text-[10px] font-mono">esc</kbd>
                  fermer
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Search className="w-3 h-3" />
                Workyt Search
              </div>
            </div>
          </Command>
        </div>
      </div>
    </>
  );
}
