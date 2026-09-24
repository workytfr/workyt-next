import React from "react";
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
    /** Ce qu'on compte, au pluriel (« éléments » par défaut, ex. « cours ») */
    itemLabel?: string;
    /** Choix proposés pour « Par page » */
    pageSizes?: number[];
}

// Charte : pastilles rondes, page courante en encre, survol papier 2
const navBtn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[#e6e0d6] bg-white px-2 text-sm text-[#1a1512] transition-colors hover:bg-[#f5efe3] disabled:pointer-events-none disabled:opacity-40";

export default function AdvancedPagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    isLoading = false,
    itemLabel = "éléments",
    pageSizes = [5, 10, 20, 50],
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

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-[rgba(26,21,18,0.08)] bg-white p-3 sm:flex-row sm:px-5">
            {/* Informations sur les éléments affichés */}
            <div className="text-sm text-[#6b625c]">
                <span className="font-medium text-[#1a1512]">{startItem}–{endItem}</span> sur {totalItems} {itemLabel}
            </div>

            {/* Boutons de navigation */}
            <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                    className={`${navBtn} hidden sm:inline-flex`}
                    aria-label="Première page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className={navBtn}
                    aria-label="Page précédente"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {getVisiblePages().map((page, index) =>
                    page === '...' ? (
                        <span key={`dots-${index}`} className="px-1 text-[#97938e]">…</span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page as number)}
                            disabled={isLoading}
                            aria-current={currentPage === page ? "page" : undefined}
                            className={
                                currentPage === page
                                    ? "inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#1a1512] px-2 text-sm font-medium text-[#fdfaf4]"
                                    : navBtn
                            }
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className={navBtn}
                    aria-label="Page suivante"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                    className={`${navBtn} hidden sm:inline-flex`}
                    aria-label="Dernière page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </nav>

            {/* Éléments par page */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-[#6b625c]">Par page</span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                    disabled={isLoading}
                >
                    <SelectTrigger className="h-8 w-20 rounded-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizes.map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
