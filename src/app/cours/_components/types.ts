// app/cours/[coursId]/components/types.ts

export interface Lesson {
    _id: string
    title: string
    content?: string
    image?: string
}

export interface Exercise {
    _id: string;
    title: string;
    content: string;
    difficulty: string;
    correction?: {
        text?: string;
        image?: string;
    };
    image?: string;
}

export interface Quiz {
    _id: string
    title: string
    questions?: any[]
}

export interface Section {
    _id: string
    title: string
    order: number
    // Les détails ne sont chargés que si on va chercher la section complète :
    lessons?: Lesson[]
    exercises?: Exercise[]
    quizzes?: Quiz[]
}

export interface Course {
    _id: string
    title: string
    description: string
    matiere: string
    niveau: string
    sections: Section[]
    status: "en_attente_publication" | "en_attente_verification" | "publie" | "annule"
}
