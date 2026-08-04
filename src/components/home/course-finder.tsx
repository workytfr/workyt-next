"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { educationData } from "@/data/educationData";
import { subjectToSlug, levelToSlug } from "@/utils/subjectSlug";

/* Sous-ensemble volontaire : les matières réellement cherchées par les élèves.
   La liste complète (30+) vit dans /cours — ici elle noierait le choix. */
const MATIERES_COURANTES = [
    "Mathématiques",
    "Français",
    "Physique-Chimie",
    "Sciences de la Vie et de la Terre (SVT)",
    "Histoire-Géographie",
    "Anglais",
    "Philosophie",
    "Numérique et Sciences Informatiques (NSI)",
    "Sciences Économiques et Sociales (SES)",
].filter((m) => educationData.subjects.includes(m));

const NIVEAUX_COURANTS = [
    "6ème",
    "5ème",
    "4ème",
    "3ème",
    "Seconde",
    "Première",
    "Terminale",
].filter((n) => educationData.levels.includes(n));

const selectClasses =
    "w-full appearance-none rounded-2xl border border-[rgba(26,21,18,0.12)] bg-white px-4 py-3 pr-9 text-sm font-semibold text-[var(--wk-ink)] shadow-sm transition hover:border-[rgba(26,21,18,0.25)] focus:border-[var(--wk-accent)] focus:outline-none focus:ring-2 focus:ring-[rgba(255,106,26,0.35)]";

export default function CourseFinder() {
    const router = useRouter();
    const [matiere, setMatiere] = useState("");
    const [niveau, setNiveau] = useState("");

    /* On n'envoie que vers des routes qui existent réellement :
       la matière est plus discriminante que le niveau, elle gagne. */
    const href = useMemo(() => {
        if (matiere) {
            const base = `/cours/matiere/${subjectToSlug(matiere)}`;
            return niveau ? `${base}?niveau=${levelToSlug(niveau)}` : base;
        }
        if (niveau) return `/cours/niveau/${levelToSlug(niveau)}`;
        return "/cours";
    }, [matiere, niveau]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                router.push(href);
            }}
            className="rounded-3xl border border-[rgba(26,21,18,0.1)] bg-white/80 p-3 shadow-[0_8px_28px_rgba(26,21,18,0.07)] backdrop-blur"
        >
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <label htmlFor="finder-matiere" className="sr-only">
                        Matière
                    </label>
                    <select
                        id="finder-matiere"
                        value={matiere}
                        onChange={(e) => setMatiere(e.target.value)}
                        className={selectClasses}
                    >
                        <option value="">Toutes les matières</option>
                        {MATIERES_COURANTES.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <Chevron />
                </div>

                <div className="relative flex-1">
                    <label htmlFor="finder-niveau" className="sr-only">
                        Niveau
                    </label>
                    <select
                        id="finder-niveau"
                        value={niveau}
                        onChange={(e) => setNiveau(e.target.value)}
                        className={selectClasses}
                    >
                        <option value="">Tous les niveaux</option>
                        {NIVEAUX_COURANTS.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                    <Chevron />
                </div>

                <button
                    type="submit"
                    className="wk-btn-orange shrink-0 justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wk-ink)]"
                >
                    <Search className="h-4 w-4" />
                    Trouver mes cours
                </button>
            </div>
        </form>
    );
}

function Chevron() {
    return (
        <span
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(26,21,18,0.4)]"
            aria-hidden="true"
        >
            ▾
        </span>
    );
}
