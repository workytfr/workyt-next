import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, X, RotateCcw, BookOpen, Users, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";

interface SearchFilters {
    query: string;
    status: string;
    niveau: string;
    matiere: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    hasSections: boolean;
    authorId: string;
}

interface CourseAdvancedSearchProps {
    onFiltersChange: (filters: SearchFilters) => void;
    isLoading?: boolean;
    totalResults?: number;
    stats?: {
        total: number;
        published: number;
        pending: number;
        cancelled: number;
        withSections: number;
        byLevel: Record<string, number>;
        bySubject: Record<string, number>;
        recentCourses: number;
        avgSectionsPerCourse: number;
    } | null;
}

export default function CourseAdvancedSearch({ 
    onFiltersChange, 
    isLoading = false, 
    totalResults,
    stats 
}: CourseAdvancedSearchProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        query: "",
        status: "all",
        niveau: "all",
        matiere: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
        hasSections: false,
        authorId: "all"
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
    }, [debouncedQuery, filters.status, filters.niveau, filters.matiere, filters.sortBy, filters.sortOrder, filters.hasSections, filters.authorId]);

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            query: "",
            status: "all",
            niveau: "all",
            matiere: "all",
            sortBy: "createdAt",
            sortOrder: "desc",
            hasSections: false,
            authorId: "all"
        });
    };

    const hasActiveFilters = filters.query || 
        (filters.status && filters.status !== "all") || 
        (filters.niveau && filters.niveau !== "all") || 
        (filters.matiere && filters.matiere !== "all") || 
        filters.hasSections || 
        (filters.authorId && filters.authorId !== "all");

    return (
        <div className="space-y-4">
            {/* Barre de recherche principale */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Rechercher par titre, description..."
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
                    {totalResults} cours trouvé{totalResults !== 1 ? 's' : ''}
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
                                <SelectItem value="publie">Publié</SelectItem>
                                <SelectItem value="en_attente_verification">En attente vérification</SelectItem>
                                <SelectItem value="en_attente_publication">En attente publication</SelectItem>
                                <SelectItem value="annule">Annulé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtre par niveau */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Niveau
                        </label>
                        <Select
                            value={filters.niveau}
                            onValueChange={(value) => handleFilterChange("niveau", value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les niveaux" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les niveaux</SelectItem>
                                <SelectItem value="Débutant">Débutant</SelectItem>
                                <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                                <SelectItem value="Avancé">Avancé</SelectItem>
                                <SelectItem value="Expert">Expert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtre par matière */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Matière
                        </label>
                        <Select
                            value={filters.matiere}
                            onValueChange={(value) => handleFilterChange("matiere", value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Toutes les matières" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les matières</SelectItem>
                                <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                                <SelectItem value="Physique">Physique</SelectItem>
                                <SelectItem value="Chimie">Chimie</SelectItem>
                                <SelectItem value="Informatique">Informatique</SelectItem>
                                <SelectItem value="Biologie">Biologie</SelectItem>
                                <SelectItem value="Histoire">Histoire</SelectItem>
                                <SelectItem value="Géographie">Géographie</SelectItem>
                                <SelectItem value="Français">Français</SelectItem>
                                <SelectItem value="Anglais">Anglais</SelectItem>
                                <SelectItem value="Philosophie">Philosophie</SelectItem>
                                <SelectItem value="Économie">Économie</SelectItem>
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
                                <SelectItem value="title">Titre</SelectItem>
                                <SelectItem value="niveau">Niveau</SelectItem>
                                <SelectItem value="matiere">Matière</SelectItem>
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
                                <SelectItem value="desc">Décroissant</SelectItem>
                                <SelectItem value="asc">Croissant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtre sections */}
                    <div className="flex items-end">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="hasSections"
                                checked={filters.hasSections}
                                onChange={(e) => handleFilterChange("hasSections", e.target.checked)}
                                disabled={isLoading}
                                className="rounded"
                            />
                            <label htmlFor="hasSections" className="text-sm font-medium text-gray-700">
                                Avec sections
                            </label>
                        </div>
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

            {/* Statistiques rapides */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                        <div className="text-xs text-blue-600">Total</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-600">{stats.published}</div>
                        <div className="text-xs text-green-600">Publiés</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                        <div className="text-xs text-yellow-600">En attente</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-purple-600">{stats.withSections}</div>
                        <div className="text-xs text-purple-600">Avec sections</div>
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
                            Statut: {filters.status.replace(/_/g, ' ')}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleFilterChange("status", "all")}
                            />
                        </Badge>
                    )}
                    {filters.niveau && filters.niveau !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Niveau: {filters.niveau}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleFilterChange("niveau", "all")}
                            />
                        </Badge>
                    )}
                    {filters.matiere && filters.matiere !== "all" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Matière: {filters.matiere}
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleFilterChange("matiere", "all")}
                            />
                        </Badge>
                    )}
                    {filters.hasSections && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            Avec sections
                            <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleFilterChange("hasSections", false)}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
} 