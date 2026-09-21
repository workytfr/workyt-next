import { Metadata } from "next";
import SuiviWorkspace from "../_components/workspace/SuiviWorkspace";

// Espace privé : jamais indexé (voir aussi robots.txt)
export const metadata: Metadata = {
    title: "Mon suivi | Workyt",
    robots: { index: false, follow: false },
};

export default async function SuiviDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <SuiviWorkspace id={id} />;
}
