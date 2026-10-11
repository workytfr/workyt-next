/**
 * Affiché pendant le chargement d'une page : la navigation répond tout de
 * suite au clic au lieu de rester figée sur la page précédente.
 */
export default function Loading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Chargement">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        </div>
    );
}
