// Types centralises pour l'espace cours

// === Entites de base ===

export interface CourseAuthor {
    _id: string;
    username: string;
    image?: string;
}

export interface Lesson {
    _id: string;
    title: string;
    content?: string;
    image?: string;
    order?: number;
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

export interface QuizQuestion {
    question: string;
    questionType: 'QCM' | 'Réponse courte' | 'Vrai/Faux' | 'Association' | 'Texte à trous';
    questionPic?: string;
    answerSelectionType: 'single' | 'multiple';
    answers: string[];
    point: number;
}

export interface Quiz {
    _id: string;
    title: string;
    description?: string;
    questions?: QuizQuestion[];
    questionsCount?: number;
    totalPoints?: number;
    // Proprietes runtime ajoutees cote client
    completed?: boolean;
    score?: number;
    maxScore?: number;
    percentage?: number;
}

export interface Section {
    _id: string;
    title: string;
    order: number;
    lessons?: Lesson[];
    exercises?: Exercise[];
    quizzes?: Quiz[];
}

// === Types de cours ===

/** Cours pour la page listing (avec auteurs, image) */
export interface CourseListing {
    _id: string;
    title: string;
    description: string;
    matiere: string;
    niveau: string;
    image?: string;
    sections: { _id: string; title: string }[];
    authors: CourseAuthor[];
}

/** Cours complet pour la page detail */
export interface Course {
    _id: string;
    title: string;
    description: string;
    matiere: string;
    niveau: string;
    image?: string;
    sections: Section[];
    status: "en_attente_publication" | "en_attente_verification" | "publie" | "annule";
    authors?: CourseAuthor[];
    createdAt?: string;
    updatedAt?: string;
}

// === Discriminated union pour le contenu selectionne ===

export type SelectedContent =
    | { kind: 'lesson'; lesson: Lesson; sectionId: string; sectionTitle: string }
    | { kind: 'exercises'; exercises: Exercise[]; sectionId: string; sectionTitle: string }
    | { kind: 'quizzes'; quizzes: Quiz[]; sectionId: string; sectionTitle: string };

// === Navigation ===

export interface NavigableItem {
    kind: 'lesson' | 'exercises' | 'quizzes';
    sectionId: string;
    sectionTitle: string;
    sectionIndex: number;
    itemIndex: number;
    label: string;
    lesson?: Lesson;
    exercises?: Exercise[];
    quizzes?: Quiz[];
}

// === Resultats quiz ===

export interface QuizCompletionResult {
    score: number;
    maxScore: number;
    percentage: number;
}
