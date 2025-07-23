import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface AdvancedPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    isLoading?: boolean;
}

export default function AdvancedPagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    isLoading = false
}: AdvancedPaginationProps) {
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Informations sur les éléments affichés */}
            <div className="text-sm text-gray-600">
                Affichage de {startItem} à {endItem} sur {totalItems} éléments
            </div>

            {/* Contrôles de pagination */}
            <div className="flex items-center gap-2">
                {/* Éléments par page */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Par page:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Boutons de navigation */}
                <div className="flex items-center gap-1">
                    {/* Première page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1 || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Page précédente */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Numéros de pages */}
                    <div className="flex items-center gap-1">
                        {getVisiblePages().map((page, index) => (
                            <React.Fragment key={index}>
                                {page === '...' ? (
                                    <span className="px-2 text-gray-500">...</span>
                                ) : (
                                    <Button
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onPageChange(page as number)}
                                        disabled={isLoading}
                                        className="w-8 h-8"
                                    >
                                        {page}
                                    </Button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Page suivante */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Dernière page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Aller à la page spécifique */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Aller à:</span>
                <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                            onPageChange(page);
                        }
                    }}
                    className="w-16"
                    disabled={isLoading}
                />
                <span className="text-sm text-gray-600">/ {totalPages}</span>
            </div>
        </div>
    );
} 