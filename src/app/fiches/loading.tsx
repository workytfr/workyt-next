import { ListingSkeleton } from "@/components/skeletons/PageSkeletons";

export default function Loading() {
    return <ListingSkeleton variant="fiches" label="Chargement des fiches…" />;
}
