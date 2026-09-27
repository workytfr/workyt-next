import {
    Amphora,
    BookOpenText,
    Brain,
    Castle,
    Cloud,
    Crown,
    Flag,
    Flame,
    FlaskConical,
    GraduationCap,
    InfinityIcon,
    Landmark,
    Leaf,
    Library,
    Map,
    Microscope,
    Mountain,
    Orbit,
    Palette,
    PawPrint,
    ScrollText,
    Shield,
    Sparkle,
    Sparkles,
    Sprout,
    Star,
    Sword,
    Swords,
    Tent,
    WandSparkles,
    type LucideIcon,
} from "lucide-react";

/**
 * Icône de chaque rang (par niveau), à la place des emojis de rankSystem :
 * rendu identique sur tous les appareils, et couleur du rang appliquée.
 */
const RANK_ICONS: Record<number, LucideIcon> = {
    1: Sprout, // Ninja
    2: Library, // Kunoichi
    3: GraduationCap, // Sensei
    4: Star, // Élève
    5: BookOpenText, // Étudiant
    6: Flame, // Professeur
    7: Sparkle, // Renardeau
    8: PawPrint, // Renard
    9: WandSparkles, // Renard Sage
    10: Leaf, // Hockeyeur
    11: Mountain, // Voyageur
    12: Flag, // Québécois
    13: Amphora, // Sphinx
    14: ScrollText, // Scribe
    15: Crown, // Pharaon
    16: Tent, // Nomade
    17: Map, // Explorateur
    18: Swords, // Conquérant
    19: Cloud, // Rêveur
    20: Palette, // Créateur
    21: Orbit, // Visionnaire
    22: Sword, // Écuyer
    23: Shield, // Chevalier
    24: Castle, // Roi
    25: Microscope, // Apprenti Chercheur
    26: FlaskConical, // Savant
    27: Brain, // Génie
    28: Landmark, // Titan
    29: Sparkles, // Archimage
    30: InfinityIcon, // Éternel
};

interface Props {
    level: number;
    color?: string;
    size?: number;
    className?: string;
}

export default function RankIcon({ level, color, size = 16, className = "" }: Props) {
    const Icon = RANK_ICONS[level] ?? Star;
    return <Icon aria-hidden="true" size={size} color={color} strokeWidth={2.2} className={`shrink-0 ${className}`} />;
}
