// Définition du type pour les données d'éducation
export interface EducationData {
    subjects: string[];
    levels: string[];
}

// Données d'éducation
export const educationData: EducationData = {
    subjects: [
        "Français",
        "Mathématiques",
        "Histoire-Géographie",
        "Sciences de la Vie et de la Terre (SVT)",
        "Physique-Chimie",
        "Technologie",
        "Anglais",
        "Espagnol",
        "Allemand",
        "Philosophie",
        "Économie",
        "Informatique",
    ],
    levels: [
        "6ème",
        "5ème",
        "4ème",
        "3ème",
        "Seconde",
        "Première",
        "Terminale",
        "Licence 1",
        "Licence 2",
        "Licence 3",
        "Master 1",
        "Master 2",
        "Doctorat",
    ],
};

// Définition des couleurs pour les matières
export const subjectColors: { [key: string]: string } = {
    Français: "bg-red-100 text-red-800",
    Mathématiques: "bg-blue-100 text-blue-800",
    "Histoire-Géographie": "bg-green-100 text-green-800",
    "Sciences de la Vie et de la Terre (SVT)": "bg-yellow-100 text-yellow-800",
    "Physique-Chimie": "bg-purple-100 text-purple-800",
    Technologie: "bg-pink-100 text-pink-800",
    Anglais: "bg-indigo-100 text-indigo-800",
    Espagnol: "bg-teal-100 text-teal-800",
    Allemand: "bg-orange-100 text-orange-800",
    Philosophie: "bg-cyan-100 text-cyan-800",
    Économie: "bg-lime-100 text-lime-800",
    Informatique: "bg-amber-100 text-amber-800",
};

// Définition des couleurs pour les niveaux
export const levelColors: { [key: string]: string } = {
    "6ème": "bg-blue-200 text-blue-800",
    "5ème": "bg-indigo-200 text-indigo-800",
    "4ème": "bg-purple-200 text-purple-800",
    "3ème": "bg-pink-200 text-pink-800",
    Seconde: "bg-teal-200 text-teal-800",
    Première: "bg-green-200 text-green-800",
    Terminale: "bg-yellow-200 text-yellow-800",
    "Licence 1": "bg-red-200 text-red-800",
    "Licence 2": "bg-orange-200 text-orange-800",
    "Licence 3": "bg-lime-200 text-lime-800",
    "Master 1": "bg-cyan-200 text-cyan-800",
    "Master 2": "bg-amber-200 text-amber-800",
    Doctorat: "bg-gray-200 text-gray-800",
};

// Fonction pour obtenir la couleur d'un sujet
export function getSubjectColor(subject: string): string {
    return subjectColors[subject] || "bg-gray-200 text-gray-800"; // Retourne une couleur par défaut si non défini
}

// Fonction pour obtenir la couleur d'un niveau
export function getLevelColor(level: string): string {
    return levelColors[level] || "bg-gray-200 text-gray-800"; // Retourne une couleur par défaut si non défini
}