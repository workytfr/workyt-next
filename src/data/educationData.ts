import {
    BookOpen, Calculator, Globe, Leaf, FlaskConical, Cpu, Languages,
    Lightbulb, BarChart3, Code, Music, Palette, Dumbbell, Scale,
    GraduationCap, Heart, Microscope, Building2, Landmark, BookText,
    PenTool, Drama, Clapperboard, Atom, Brain, Users, Briefcase,
    Hammer, Wrench, Compass, type LucideIcon
} from "lucide-react";

// Définition du type pour les données d'éducation
export interface EducationData {
    subjects: string[];
    levels: string[];
}

// Données d'éducation - Toutes les matières scolaires françaises 2025-2026
export const educationData: EducationData = {
    subjects: [
        // Matières générales
        "Français",
        "Mathématiques",
        "Histoire-Géographie",
        "Sciences de la Vie et de la Terre (SVT)",
        "Physique-Chimie",
        "Technologie",
        "Anglais",
        "Espagnol",
        "Allemand",
        "Italien",
        "Philosophie",
        "Économie",
        "Informatique",
        // Matières artistiques et sportives
        "Arts Plastiques",
        "Éducation Musicale",
        "EPS",
        // Enseignements de spécialité lycée
        "Sciences Économiques et Sociales (SES)",
        "Numérique et Sciences Informatiques (NSI)",
        "Humanités, Littérature et Philosophie (HLP)",
        "Sciences de l'Ingénieur (SI)",
        "Géopolitique (HGGSP)",
        "Littérature et Langues (LLCE)",
        "Droit",
        "Management",
        // Sciences
        "Biologie",
        "Géologie",
        // Langues supplémentaires
        "Latin / Grec",
        "Portugais",
        "Chinois",
        "Arabe",
        // EMC
        "Enseignement Moral et Civique (EMC)",
    ],
    levels: [
        "6ème",
        "5ème",
        "4ème",
        "3ème",
        "Seconde",
        "Première",
        "Terminale",
        "BTS",
        "Prépa",
        "Licence 1",
        "Licence 2",
        "Licence 3",
        "Master 1",
        "Master 2",
        "Doctorat",
    ],
};

// Icônes Lucide par matière
export const subjectIconComponents: { [key: string]: LucideIcon } = {
    "Français": BookOpen,
    "Mathématiques": Calculator,
    "Histoire-Géographie": Globe,
    "Sciences de la Vie et de la Terre (SVT)": Leaf,
    "Physique-Chimie": FlaskConical,
    "Technologie": Cpu,
    "Anglais": Languages,
    "Espagnol": Languages,
    "Allemand": Languages,
    "Italien": Languages,
    "Philosophie": Lightbulb,
    "Économie": BarChart3,
    "Informatique": Code,
    "Arts Plastiques": Palette,
    "Éducation Musicale": Music,
    "EPS": Dumbbell,
    "Sciences Économiques et Sociales (SES)": BarChart3,
    "Numérique et Sciences Informatiques (NSI)": Code,
    "Humanités, Littérature et Philosophie (HLP)": BookText,
    "Sciences de l'Ingénieur (SI)": Wrench,
    "Géopolitique (HGGSP)": Landmark,
    "Littérature et Langues (LLCE)": PenTool,
    "Droit": Scale,
    "Management": Briefcase,
    "Biologie": Microscope,
    "Géologie": Compass,
    "Latin / Grec": GraduationCap,
    "Portugais": Languages,
    "Chinois": Languages,
    "Arabe": Languages,
    "Enseignement Moral et Civique (EMC)": Users,
};

// Définition des couleurs pour les matières
export const subjectColors: { [key: string]: string } = {
    "Français": "bg-red-100 text-red-800",
    "Mathématiques": "bg-blue-100 text-blue-800",
    "Histoire-Géographie": "bg-green-100 text-green-800",
    "Sciences de la Vie et de la Terre (SVT)": "bg-yellow-100 text-yellow-800",
    "Physique-Chimie": "bg-purple-100 text-purple-800",
    "Technologie": "bg-pink-100 text-pink-800",
    "Anglais": "bg-indigo-100 text-indigo-800",
    "Espagnol": "bg-teal-100 text-teal-800",
    "Allemand": "bg-orange-100 text-orange-800",
    "Italien": "bg-rose-100 text-rose-800",
    "Philosophie": "bg-cyan-100 text-cyan-800",
    "Économie": "bg-lime-100 text-lime-800",
    "Informatique": "bg-amber-100 text-amber-800",
    "Arts Plastiques": "bg-fuchsia-100 text-fuchsia-800",
    "Éducation Musicale": "bg-violet-100 text-violet-800",
    "EPS": "bg-emerald-100 text-emerald-800",
    "Sciences Économiques et Sociales (SES)": "bg-lime-100 text-lime-800",
    "Numérique et Sciences Informatiques (NSI)": "bg-sky-100 text-sky-800",
    "Humanités, Littérature et Philosophie (HLP)": "bg-rose-100 text-rose-800",
    "Sciences de l'Ingénieur (SI)": "bg-slate-100 text-slate-800",
    "Géopolitique (HGGSP)": "bg-emerald-100 text-emerald-800",
    "Littérature et Langues (LLCE)": "bg-red-100 text-red-800",
    "Droit": "bg-gray-100 text-gray-800",
    "Management": "bg-blue-100 text-blue-800",
    "Biologie": "bg-green-100 text-green-800",
    "Géologie": "bg-amber-100 text-amber-800",
    "Latin / Grec": "bg-stone-100 text-stone-800",
    "Portugais": "bg-teal-100 text-teal-800",
    "Chinois": "bg-red-100 text-red-800",
    "Arabe": "bg-emerald-100 text-emerald-800",
    "Enseignement Moral et Civique (EMC)": "bg-blue-100 text-blue-800",
};

// Définition des couleurs pour les niveaux
export const levelColors: { [key: string]: string } = {
    "6ème": "bg-blue-200 text-blue-800",
    "5ème": "bg-indigo-200 text-indigo-800",
    "4ème": "bg-purple-200 text-purple-800",
    "3ème": "bg-pink-200 text-pink-800",
    "Seconde": "bg-teal-200 text-teal-800",
    "Première": "bg-green-200 text-green-800",
    "Terminale": "bg-yellow-200 text-yellow-800",
    "BTS": "bg-violet-200 text-violet-800",
    "Prépa": "bg-fuchsia-200 text-fuchsia-800",
    "Licence 1": "bg-red-200 text-red-800",
    "Licence 2": "bg-orange-200 text-orange-800",
    "Licence 3": "bg-lime-200 text-lime-800",
    "Master 1": "bg-cyan-200 text-cyan-800",
    "Master 2": "bg-amber-200 text-amber-800",
    "Doctorat": "bg-gray-200 text-gray-800",
};

// Gradients pour les en-têtes de cards par matière
export const subjectGradients: { [key: string]: string } = {
    "Français": "from-red-500 to-rose-400",
    "Mathématiques": "from-blue-500 to-indigo-400",
    "Histoire-Géographie": "from-green-600 to-emerald-400",
    "Sciences de la Vie et de la Terre (SVT)": "from-yellow-500 to-lime-400",
    "Physique-Chimie": "from-purple-500 to-violet-400",
    "Technologie": "from-pink-500 to-fuchsia-400",
    "Anglais": "from-indigo-500 to-blue-400",
    "Espagnol": "from-teal-500 to-cyan-400",
    "Allemand": "from-orange-500 to-amber-400",
    "Italien": "from-rose-500 to-pink-400",
    "Philosophie": "from-cyan-500 to-sky-400",
    "Économie": "from-lime-600 to-green-400",
    "Informatique": "from-amber-500 to-yellow-400",
    "Arts Plastiques": "from-fuchsia-500 to-pink-400",
    "Éducation Musicale": "from-violet-500 to-purple-400",
    "EPS": "from-emerald-500 to-green-400",
    "Sciences Économiques et Sociales (SES)": "from-lime-500 to-emerald-400",
    "Numérique et Sciences Informatiques (NSI)": "from-sky-500 to-blue-400",
    "Humanités, Littérature et Philosophie (HLP)": "from-rose-500 to-red-400",
    "Sciences de l'Ingénieur (SI)": "from-slate-500 to-gray-400",
    "Géopolitique (HGGSP)": "from-emerald-600 to-teal-400",
    "Littérature et Langues (LLCE)": "from-red-500 to-orange-400",
    "Droit": "from-gray-600 to-slate-400",
    "Management": "from-blue-600 to-indigo-400",
    "Biologie": "from-green-500 to-lime-400",
    "Géologie": "from-amber-600 to-orange-400",
    "Latin / Grec": "from-stone-500 to-stone-400",
    "Portugais": "from-teal-600 to-green-400",
    "Chinois": "from-red-600 to-rose-400",
    "Arabe": "from-emerald-500 to-cyan-400",
    "Enseignement Moral et Civique (EMC)": "from-blue-500 to-sky-400",
};

// Ancienne map emoji conservée pour rétrocompatibilité
export const subjectIcons: { [key: string]: string } = {
    "Français": "BookOpen",
    "Mathématiques": "Calculator",
    "Histoire-Géographie": "Globe",
    "Sciences de la Vie et de la Terre (SVT)": "Leaf",
    "Physique-Chimie": "FlaskConical",
    "Technologie": "Cpu",
    "Anglais": "Languages",
    "Espagnol": "Languages",
    "Allemand": "Languages",
    "Italien": "Languages",
    "Philosophie": "Lightbulb",
    "Économie": "BarChart3",
    "Informatique": "Code",
    "Arts Plastiques": "Palette",
    "Éducation Musicale": "Music",
    "EPS": "Dumbbell",
    "Sciences Économiques et Sociales (SES)": "BarChart3",
    "Numérique et Sciences Informatiques (NSI)": "Code",
    "Humanités, Littérature et Philosophie (HLP)": "BookText",
    "Sciences de l'Ingénieur (SI)": "Wrench",
    "Géopolitique (HGGSP)": "Landmark",
    "Littérature et Langues (LLCE)": "PenTool",
    "Droit": "Scale",
    "Management": "Briefcase",
    "Biologie": "Microscope",
    "Géologie": "Compass",
    "Latin / Grec": "GraduationCap",
    "Portugais": "Languages",
    "Chinois": "Languages",
    "Arabe": "Languages",
    "Enseignement Moral et Civique (EMC)": "Users",
};

// Fonction pour obtenir la couleur d'un sujet
export function getSubjectColor(subject: string): string {
    return subjectColors[subject] || "bg-gray-200 text-gray-800";
}

// Fonction pour obtenir la couleur d'un niveau
export function getLevelColor(level: string): string {
    return levelColors[level] || "bg-gray-200 text-gray-800";
}

// Fonction pour obtenir le gradient d'un sujet
export function getSubjectGradient(subject: string): string {
    return subjectGradients[subject] || "from-gray-500 to-gray-400";
}

// Fonction pour obtenir le composant icône d'un sujet
export function getSubjectIconComponent(subject: string): LucideIcon {
    return subjectIconComponents[subject] || BookOpen;
}
