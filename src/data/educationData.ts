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
        "Informatique"
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
        "Doctorat"
    ]
};
