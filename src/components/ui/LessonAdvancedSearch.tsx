import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, X, RotateCcw } from "lucide-react";

interface SearchFilters {
    query: string;
    status: string;
    courseId: string;
    sectionId: string;
    authorId: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    hasMedia: boolean;
}

interface LessonAdvancedSearchProps {
    onFiltersChange: (filters: SearchFilters) => void;
    isLoading?: boolean;
    totalResults?: number;
    stats?: any;
    courses?: any[];
    sections?: any[];
}

export default function LessonAdvancedSearch({
    onFiltersChange,
    isLoading = false,
    totalResults,
}: LessonAdvancedSearchProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        status: "all",
        courseId: "all",
        sectionId: "all",
        authorId: "all",
        sortBy: "order",
        sortOrder: "asc",
        hasMedia: false
    });

    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce pour la recherche
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(filters.query);
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.query]);

    useEffect(() => {
        onFiltersChange({ ...filters, query: debouncedQuery });
    }, [debouncedQuery, filters.status, filters.sortBy, filters.sortOrder, filters.hasMedia]);

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            query: "",
            status: "all",
            courseId: "all",
            sectionId: "all",
            authorId: "all",
            sortBy: "order",
            sortOrder: "asc",
            hasMedia: false
        });
    };

    const hasActiveFilters = filters.query ||
        (filters.status && filters.status !== "all") ||
        filters.hasMedia;

    return (
        <div className="space-y-4">
            {/* Barre de recherche principale */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Rechercher par titre, contenu..."
                        value={filters.query}
                        onChange={(e) => handleFilterChange("query", e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    disabled={isLoading}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                </Button>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={clearFilters}
                        disabled={isLoading}
                        size="sm"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Effacer
                    </Button>
                )}
            </div>

            {/* Résultats */}
            {totalResults !== undefined && (
                <div className="text-sm text-gray-600">
                    {totalResults} leçon{totalResults !== 1 ? 's' : ''} trouvée{totalResults !== 1 ? 's' : ''}
                </div>
            )}

            {/* Filtres avancés */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Filtre par statut */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Statut
                        </label>
                        <Select
                            value={filters.status}
                            onValueChange={(value) => handleFilterChange("status", value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les statuts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="Validée">Validée</SelectItem>
                                <SelectItem value="En attente de correction">En attente de correction</SelectItem>
                                <SelectItem value="En cours de rédaction">En cours de rédaction</SelectItem>
                                <SelectItem value="Brouillon">Brouillon</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tri */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Trier par
                        </label>
                        <Select
                            value={filters.sortBy}
                            onValueChange={(value) => handleFilterChange("sortBy", value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="order">Ordre</SelectItem>
                                <SelectItem value="title">Titre</SelectItem>
                                <SelectItem value="createdAt">Date de création</SelectItem>
                                <SelectItem value="updatedAt">Date de modification</SelectItem>
                                <SelectItem value="status">Statut</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ordre de tri */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Ordre
                        </label>
                        <Select
                            value={filters.sortOrder}
                            onValueChange={(value) => handleFilterChange("sortOrder", value as "asc" | "desc")}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Croissant</SelectItem>
                                <SelectItem value="desc">Décroissant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtre média */}
                    <div className="flex items-end gap-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="hasMedia"
                                checked={filters.hasMedia}
                                onChange={(e) => handleFilterChange("hasMedia", e.target.checked)}
                                disabled={isLoading}
                                className="rounded"
                            />
                            <label htmlFor="hasMedia" className="text-sm font-medium text-gray-700">
                                Avec média
                            </label>
                        </div>
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            disabled={isLoading}
                            size="sm"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Réinitialiser
                        </Button>
                    </div>
                </div>
            )}

            {/* Indicateurs de filtres actifs */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.query && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Recherche: {filters.query}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleFilterChange("query", "")}
                            />
                        </Badge>
                    )}
                    {filters.status && filters.status !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Statut: {filters.status}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleFilterChange("status", "all")}
                            />
                        </Badge>
                    )}
                    {filters.hasMedia && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Avec média
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleFilterChange("hasMedia", false)}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
