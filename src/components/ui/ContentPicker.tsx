'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, BookOpen, FileText, HelpCircle } from 'lucide-react';

interface ContentResult {
    _id: string;
    title: string;
    type: 'course' | 'quiz' | 'fiche';
}

interface ContentPickerProps {
    /** Type de contenu à chercher */
    contentType: 'course' | 'quiz' | 'fiche';
    /** Callback quand un contenu est sélectionné */
    onSelect: (item: ContentResult) => void;
    /** Placeholder */
    placeholder?: string;
}

const TYPE_CONFIG = {
    course: { label: 'Cours', icon: BookOpen, color: 'text-blue-600' },
    quiz: { label: 'Quiz', icon: HelpCircle, color: 'text-purple-600' },
    fiche: { label: 'Fiche', icon: FileText, color: 'text-green-600' },
};

export default function ContentPicker({ contentType, onSelect, placeholder }: ContentPickerProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ContentResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const config = TYPE_CONFIG[contentType];
    const Icon = config.icon;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchContent = useCallback(async (searchQuery: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: contentType });
            if (searchQuery) params.set('q', searchQuery);
            const res = await fetch(`/api/curriculum/content-search?${params}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            }
        } catch (err) {
            console.error('Erreur recherche contenu:', err);
        } finally {
            setLoading(false);
        }
    }, [contentType]);

    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchContent(query), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, open, fetchContent]);

    useEffect(() => {
        if (open && results.length === 0) {
            fetchContent('');
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = (item: ContentResult) => {
        onSelect(item);
        setOpen(false);
        setQuery('');
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Icon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${config.color}`} />
                <input
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        if (!open) setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder || `Rechercher un ${config.label.toLowerCase()}...`}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {loading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
                    {results.length === 0 && !loading && (
                        <div className="px-4 py-4 text-center text-sm text-gray-500">
                            {query ? 'Aucun résultat' : `Aucun ${config.label.toLowerCase()} trouvé`}
                        </div>
                    )}
                    {results.map(item => (
                        <button
                            key={item._id}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                            <span className="flex-1 truncate text-gray-700">{item.title}</span>
                            <code className="text-[10px] text-gray-400 shrink-0">{item._id.slice(-6)}</code>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
