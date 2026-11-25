/**
 * Icônes des contenus Workyt (cours, fiche, quiz, évaluation, forum, exercice…),
 * tirées du paquet workyt-icons. Même usage qu'une icône Lucide (className,
 * size, color) ; strokeWidth est accepté et ignoré.
 */
export {
    ActualitesIcon,
    BlogIcon,
    ChampignonIcon,
    ChronometreIcon,
    ConseilsMethodesIcon,
    CoursIcon,
    CultureIcon,
    DiplomeIcon,
    EleveIcon,
    EvaluationIcon,
    ExerciceIcon,
    FavoriIcon,
    FicheIcon,
    FlammeIcon,
    ForumIcon,
    MedailleIcon,
    ObjectifIcon,
    OrientationScolaireIcon,
    ProgressionIcon,
    QuizIcon,
    TableauIcon,
    type IconProps as WkIconProps,
    type WorkytIcon as WkIconComponent,
} from "workyt-icons/react";

/** Tracés bruts de la flamme en grille 100 (comme les badges de série), pour StreakIndicator qui l'anime */
export const FLAME_PATHS = {
    body: "M50 6C62 24 80 36 80 60A30 30 0 0 1 20 60C20 44 30 36 36 26C38 36 42 40 46 42C46 30 46 18 50 6Z",
    core: "M50 50C57 58 63 63 63 72A13 13 0 0 1 37 72C37 63 43 58 50 50Z",
} as const;
