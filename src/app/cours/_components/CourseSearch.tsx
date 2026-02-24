"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, FileText, Loader2 } from "lucide-react";
import "./styles/notion-theme.css";

interface SearchResult {
    lessonId: string;
    lessonTitle: string;
    sectionId: string;
    sectionTitle: string;
    snippet: string;
}

interface CourseSearchProps {
    courseId: string;
    onSelectResult: (sectionId: string, lessonId: string) => void;
}

export default function CourseSearch({ courseId, onSelectResult }: CourseSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/cours/${courseId}/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
                setShowResults(true);
            }
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [courseId]);

    const handleChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(value), 300);
    };

    const handleSelect = (result: SearchResult) => {
        onSelectResult(result.sectionId, result.lessonId);
        setShowResults(false);
        setQuery("");
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#e3e2e0] rounded-md focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] placeholder-[#bfbfbf] transition-all"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#9ca3af] hover:text-[#6b6b6b]"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Résultats */}
            {showResults && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e3e2e0] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto notion-scrollbar">
                    {isSearching ? (
                        <div className="flex items-center justify-center p-4 text-[#6b6b6b] text-sm">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Recherche...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-[#9ca3af] text-sm text-center">
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        results.map((result) => (
                            <button
                                key={result.lessonId}
                                onClick={() => handleSelect(result)}
                                className="w-full text-left p-3 hover:bg-[#f7f6f3] border-b border-[#f1f1ef] last:border-b-0 transition-colors"
                            >
                                <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-[#f97316] mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[#37352f] truncate">{result.lessonTitle}</p>
                                        <p className="text-xs text-[#9ca3af] mb-1">{result.sectionTitle}</p>
                                        <p className="text-xs text-[#6b6b6b] line-clamp-2">{result.snippet}</p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
