import type { Metadata } from "next";
import LegendeStory from "./_components/LegendeStory";
import { PIECES, PIERRES } from "./_components/story";
import "./legende.css";

/*
 * La Légende de Workyt : conte animé qui explique les monnaies, les clans, le forum,
 * les cours et le blog. Entrée : le bouton « i » à côté du solde sur /compte/[id].
 */
export const metadata: Metadata = {
    title: { absolute: "La Légende de Workyt : la flamme et le renard | Workyt" },
    description: `Un conte pour comprendre les ${PIECES}, les ${PIERRES}, la Guerre des Clans, le forum et les cours de Workyt.`,
    alternates: { canonical: "https://workyt.fr/legende" },
    openGraph: {
        title: "La Légende de Workyt : la flamme et le renard",
        description: `Un conte pour comprendre les ${PIECES}, les ${PIERRES} et tout le royaume de Workyt.`,
        url: "https://workyt.fr/legende",
        siteName: "Workyt",
        locale: "fr_FR",
        type: "article",
    },
};

export default function LegendePage() {
    return <LegendeStory />;
}
