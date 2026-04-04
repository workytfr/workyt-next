'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronRight, Target, Loader2 } from 'lucide-react';

interface SkillResult {
    skillId: string;
    description: string;
    difficulty: number;
    keywords: string[];
    theme: string;
    chapter: string;
    subject: string;
    cycle: string;
    level: string;
}

interface SkillPickerProps {
    selectedSkills: string[];
    onChange: (skills: string[]) => void;
    /** Filtres optionnels pour restreindre la recherche */
    cycle?: string;
    subject?: string;
    level?: string;
    /** Placeholder du champ de recherche */
    placeholder?: string;
    /** Nombre max de compétences sélectionnables (0 = illimité) */
    max?: number;
}

const DIFFICULTY_COLORS = [
    '',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
];

const CYCLE_LABELS: Record<string, string> = {
    cycle3: 'C3',
    cycle4: 'C4',
    lycee: 'Lycée',
    superieur: 'Sup',
};

export default function SkillPicker({
    selectedSkills,
    onChange,
    cycle,
    subject,
    level,
    placeholder = 'Rechercher une compétence...',
    max = 0,
}: SkillPickerProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SkillResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
    const [selectedDetails, setSelectedDetails] = useState<Map<string, SkillResult>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    // Fermer le dropdown en cliquant dehors
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSkills = useCallback(async (searchQuery: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (cycle) params.set('cycle', cycle);
            if (subject) params.set('subject', subject);
            if (level) params.set('level', level);
            params.set('limit', '50');

            const res = await fetch(`/api/curriculum/skills/search?${params}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
                // Auto-expand all themes when searching
                if (searchQuery) {
                    setExpandedThemes(new Set(data.results.map((r: SkillResult) => r.theme)));
                }
            }
        } catch (err) {
            console.error('Erreur recherche compétences:', err);
        } finally {
            setLoading(false);
        }
    }, [cycle, subject, level]);

    // Recherche avec debounce
    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSkills(query), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, open, fetchSkills]);

    // Charger les résultats à l'ouverture
    useEffect(() => {
        if (open && results.length === 0) {
            fetchSkills('');
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleSkill = (skill: SkillResult) => {
        const isSelected = selectedSkills.includes(skill.skillId);
        if (isSelected) {
            onChange(selectedSkills.filter(id => id !== skill.skillId));
            setSelectedDetails(prev => {
                const next = new Map(prev);
                next.delete(skill.skillId);
                return next;
            });
        } else {
            if (max > 0 && selectedSkills.length >= max) return;
            onChange([...selectedSkills, skill.skillId]);
            setSelectedDetails(prev => new Map(prev).set(skill.skillId, skill));
        }
    };

    const removeSkill = (skillId: string) => {
        onChange(selectedSkills.filter(id => id !== skillId));
        setSelectedDetails(prev => {
            const next = new Map(prev);
            next.delete(skillId);
            return next;
        });
    };

    const toggleTheme = (theme: string) => {
        setExpandedThemes(prev => {
            const next = new Set(prev);
            if (next.has(theme)) next.delete(theme);
            else next.add(theme);
            return next;
        });
    };

    // Grouper les résultats par theme > chapter
    const grouped: Record<string, { theme: string; chapters: Record<string, SkillResult[]> }> = {};
    for (const r of results) {
        if (!grouped[r.theme]) grouped[r.theme] = { theme: r.theme, chapters: {} };
        if (!grouped[r.theme].chapters[r.chapter]) grouped[r.theme].chapters[r.chapter] = [];
        grouped[r.theme].chapters[r.chapter].push(r);
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Tags sélectionnés */}
            {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedSkills.map(skillId => {
                        const detail = selectedDetails.get(skillId);
                        return (
                            <span
                                key={skillId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs"
                            >
                                <Target className="w-3 h-3" />
                                <span className="max-w-[200px] truncate">
                                    {detail?.description || skillId}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeSkill(skillId)}
                                    className="ml-0.5 hover:text-orange-900"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Champ de recherche */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        if (!open) setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {loading && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
            </div>

            {/* Dropdown des résultats */}
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[350px] overflow-y-auto">
                    {results.length === 0 && !loading && (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                            {query ? 'Aucune compétence trouvée' : 'Aucun programme importé'}
                        </div>
                    )}

                    {Object.entries(grouped).map(([theme, data]) => (
                        <div key={theme}>
                            {/* Theme header */}
                            <button
                                type="button"
                                onClick={() => toggleTheme(theme)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 sticky top-0 z-10"
                            >
                                {expandedThemes.has(theme) ? (
                                    <ChevronDown className="w-3 h-3" />
                                ) : (
                                    <ChevronRight className="w-3 h-3" />
                                )}
                                {theme}
                            </button>

                            {expandedThemes.has(theme) &&
                                Object.entries(data.chapters).map(([chapter, skills]) => (
                                    <div key={chapter}>
                                        <div className="px-6 py-1 text-xs text-gray-400 font-medium">
                                            {chapter}
                                        </div>
                                        {skills.map(skill => {
                                            const isSelected = selectedSkills.includes(skill.skillId);
                                            const isDisabled = !isSelected && max > 0 && selectedSkills.length >= max;
                                            return (
                                                <button
                                                    key={skill.skillId}
                                                    type="button"
                                                    onClick={() => !isDisabled && toggleSkill(skill)}
                                                    disabled={isDisabled}
                                                    className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-orange-50 transition-colors ${
                                                        isSelected ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                                                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                >
                                                    <span
                                                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold shrink-0 ${
                                                            DIFFICULTY_COLORS[skill.difficulty]
                                                        }`}
                                                    >
                                                        {skill.difficulty}
                                                    </span>
                                                    <span className="flex-1 truncate">{skill.description}</span>
                                                    <span className="text-[10px] text-gray-400 shrink-0">
                                                        {CYCLE_LABELS[skill.cycle] || skill.cycle} · {skill.level}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs shrink-0">
                                                            ✓
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
