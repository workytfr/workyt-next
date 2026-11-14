import { LessonContentSkeleton } from "@/components/skeletons/PageSkeletons";

/**
 * Passage d'une leçon à l'autre : le sommaire (layout) reste affiché, seul le
 * contenu est remplacé par son squelette le temps du chargement.
 */
export default function Loading() {
    return <LessonContentSkeleton />;
}
