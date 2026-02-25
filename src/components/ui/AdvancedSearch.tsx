import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, X, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";

interface SearchFilters {
    query: string;
    role: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    hasBadges: boolean;
    minPoints: number;
    maxPoints: number;
}

interface AdvancedSearchProps {
    onFiltersChange: (filters: SearchFilters) => void;
    isLoading?: boolean;
    totalResults?: number;
}

export default function AdvancedSearch({ onFiltersChange, isLoading = false, totalResults }: AdvancedSearchProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        role: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
        hasBadges: false,
        minPoints: 0,
        maxPoints: 999999
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
    }, [debouncedQuery, filters.role, filters.sortBy, filters.sortOrder, filters.hasBadges, filters.minPoints, filters.maxPoints]);

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            query: "",
            role: "all",
            sortBy: "createdAt",
            sortOrder: "desc",
            hasBadges: false,
            minPoints: 0,
            maxPoints: 999999
        });
    };

    const hasActiveFilters = filters.query || (filters.role && filters.role !== "all") || filters.hasBadges || filters.minPoints > 0 || filters.maxPoints < 999999;

    return (
        <div className="space-y-4">
            {/* Barre de recherche principale */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Rechercher par nom, email, username..."
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
                    {totalResults} résultat{totalResults !== 1 ? 's' : ''} trouvé{totalResults !== 1 ? 's' : ''}
                </div>
            )}

            {/* Filtres avancés */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Filtre par rôle */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Rôle
                        </label>
                        <Select
                            value={filters.role}
                            onValueChange={(value) => handleFilterChange("role", value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les rôles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les rôles</SelectItem>
                                <SelectItem value="Apprenti">Apprenti</SelectItem>
                                <SelectItem value="Helpeur">Helpeur</SelectItem>
                                <SelectItem value="Rédacteur">Rédacteur</SelectItem>
                                <SelectItem value="Correcteur">Correcteur</SelectItem>
                                <SelectItem value="Modérateur">Modérateur</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
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
                                <SelectItem value="createdAt">Date de création</SelectItem>
                                <SelectItem value="name">Nom</SelectItem>
                                <SelectItem value="points">Points</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
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
                                <SelectItem value="desc">Décroissant</SelectItem>
                                <SelectItem value="asc">Croissant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtre badges */}
                    <div className="flex items-end">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="hasBadges"
                                checked={filters.hasBadges}
                                onChange={(e) => handleFilterChange("hasBadges", e.target.checked)}
                                disabled={isLoading}
                                className="rounded"
                            />
                            <label htmlFor="hasBadges" className="text-sm font-medium text-gray-700">
                                Avec badges
                            </label>
                        </div>
                    </div>

                    {/* Filtre points min */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Points min
                        </label>
                        <Input
                            type="number"
                            value={filters.minPoints}
                            onChange={(e) => handleFilterChange("minPoints", parseInt(e.target.value) || 0)}
                            disabled={isLoading}
                            min="0"
                        />
                    </div>

                    {/* Filtre points max */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Points max
                        </label>
                        <Input
                            type="number"
                            value={filters.maxPoints}
                            onChange={(e) => handleFilterChange("maxPoints", parseInt(e.target.value) || 999999)}
                            disabled={isLoading}
                            min="0"
                        />
                    </div>

                    {/* Bouton réinitialiser */}
                    <div className="flex items-end">
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
                    {filters.role && filters.role !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Rôle: {filters.role}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleFilterChange("role", "all")}
                            />
                        </Badge>
                    )}
                    {filters.hasBadges && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Avec badges
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleFilterChange("hasBadges", false)}
                            />
                        </Badge>
                    )}
                    {(filters.minPoints > 0 || filters.maxPoints < 999999) && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Points: {filters.minPoints} - {filters.maxPoints === 999999 ? '∞' : filters.maxPoints}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => {
                                    handleFilterChange("minPoints", 0);
                                    handleFilterChange("maxPoints", 999999);
                                }}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
} 