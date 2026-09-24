import { Suspense } from "react";
import MascotLoader from "@/components/ui/MascotLoader";
import CourseImporter from "./_components/CourseImporter";

// useSearchParams (choix du mode via ?mode=) impose une frontière Suspense
export default function ImportCoursePage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Suspense fallback={<MascotLoader message="Préparation de l'import…" />}>
        <CourseImporter />
      </Suspense>
    </div>
  );
}
