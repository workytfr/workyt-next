import type React from "react";
import {
    ArtsPlastiquesIcon,
    BiologieIcon,
    DroitIcon,
    EducationMusicaleIcon,
    EmcIcon,
    EpsIcon,
    FrancaisIcon,
    GeologieIcon,
    HggspIcon,
    HistoireGeoIcon,
    LanguesIcon,
    LatinGrecIcon,
    MathematiquesIcon,
    NsiIcon,
    PhilosophieIcon,
    PhysiqueChimieIcon,
    SesIcon,
    SiIcon,
    SvtIcon,
    TechnologieIcon,
} from "workyt-icons/react";

/**
 * Icônes de matière, tirées du paquet workyt-icons. Elles prennent la couleur
 * du texte (currentColor), comme les icônes Lucide qu'elles remplacent, et
 * acceptent les mêmes props (className, size).
 */

export type SubjectGlyphKind =
    | "livre" | "maths" | "globe" | "feuille" | "fiole" | "puce" | "langues" | "ampoule"
    | "barres" | "code" | "palette" | "musique" | "halteres" | "rouage" | "temple" | "balance"
    | "cellule" | "montagne" | "colonne" | "citoyens";

export type SubjectGlyphComponent = React.ComponentType<{ className?: string; size?: number | string }>;

const GLYPHS: Record<SubjectGlyphKind, SubjectGlyphComponent> = {
    livre: FrancaisIcon,
    maths: MathematiquesIcon,
    globe: HistoireGeoIcon,
    feuille: SvtIcon,
    fiole: PhysiqueChimieIcon,
    puce: TechnologieIcon,
    langues: LanguesIcon,
    ampoule: PhilosophieIcon,
    barres: SesIcon,
    code: NsiIcon,
    palette: ArtsPlastiquesIcon,
    musique: EducationMusicaleIcon,
    halteres: EpsIcon,
    rouage: SiIcon,
    temple: HggspIcon,
    balance: DroitIcon,
    cellule: BiologieIcon,
    montagne: GeologieIcon,
    colonne: LatinGrecIcon,
    citoyens: EmcIcon,
};

/** Le composant d'icône d'une matière (même usage qu'une icône Lucide) */
export function subjectGlyph(kind: SubjectGlyphKind): SubjectGlyphComponent {
    return GLYPHS[kind];
}
