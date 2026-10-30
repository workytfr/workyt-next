import type { Metadata } from "next";
import BoardKit from "./_components/BoardKit";

export const metadata: Metadata = {
    title: "Tableau blanc en ligne pour réviser : repère, chimie, frise",
    description:
        "Tableau blanc gratuit pensé pour les cours : repère orthonormé et traceur de courbes, cercle trigonométrique, circuits électriques, verrerie de chimie, formules (H₂O, x²), frise chronologique, cahier Seyès et portée.",
    alternates: { canonical: "https://workyt.fr/kits/tableau-blanc" },
};

export default function TableauBlancPage() {
    return (
        <div className="bg-[var(--wk-paper)] text-[var(--wk-ink)]">
            <BoardKit />
        </div>
    );
}
