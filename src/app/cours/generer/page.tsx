import { redirect } from "next/navigation";

// MaitreRenard AI vit désormais dans le tableau de bord, à côté de Foxy
export default function GenerateCoursePage() {
  redirect("/dashboard/cours/importer?mode=ia");
}
