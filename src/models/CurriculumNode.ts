import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Interface représentant un noeud du programme scolaire officiel
 * Couvre : Cycle 3 (6ème), Cycle 4 (5ème-3ème), Lycée (2nde-Term), Supérieur
 */
export interface ICurriculumNode extends Document {
    _id: ObjectId;
    nodeId: string;                // Identifiant unique (ex: "C4-MATH-NC-CL-01")
    version: string;               // Année du programme ("2025-2026")

    // Hiérarchie scolaire
    cycle: 'cycle3' | 'cycle4' | 'lycee' | 'superieur';
    level: string;                 // "6eme", "5eme", ..., "terminale", "bts1", "l1"...
    track?: string;                // "generale", "technologique", "professionnelle", "bts-ndrc", "prepa-mpsi"...
    subject: string;               // "mathematiques", "francais", "physique-chimie"...

    // Contenu pédagogique (arbre)
    theme: string;                 // "Nombres et calculs"
    chapter: string;               // "Calcul littéral"
    subChapter?: string;           // "Développement"

    // Compétences
    skills: {
        skillId: string;           // "C4-MATH-NC-CL-01"
        description: string;       // "Développer avec la distributivité simple"
        difficulty: 1 | 2 | 3 | 4 | 5;
        keywords: string[];
    }[];

    // Métadonnées pédagogiques
    estimatedHours: number;        // Heures recommandées par le BO
    order: number;                 // Ordre dans l'année
    prerequisites: string[];       // nodeIds des noeuds prérequis
    examFrequency: number;         // Fréquence d'apparition aux examens (0-100)

    // Liens vers le contenu Workyt
    linkedContent: {
        fiches: ObjectId[];
        courses: ObjectId[];
        quizzes: ObjectId[];
    };

    // Taux de couverture calculé
    coverage: number;              // % du contenu Workyt disponible (0-100)

    // Source officielle
    sourceReference?: string;      // "BO n°31 du 30 juillet 2020"

    createdAt: Date;
    updatedAt: Date;
}

const SkillSubSchema = new Schema({
    skillId: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: Number, enum: [1, 2, 3, 4, 5], default: 2 },
    keywords: [{ type: String }],
}, { _id: false });

const CurriculumNodeSchema: Schema = new Schema({
    nodeId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    version: {
        type: String,
        required: true,
        default: '2025-2026',
    },

    // Hiérarchie
    cycle: {
        type: String,
        enum: ['cycle3', 'cycle4', 'lycee', 'superieur'],
        required: true,
        index: true,
    },
    level: {
        type: String,
        required: true,
        index: true,
    },
    track: {
        type: String,
        default: undefined,
        index: true,
    },
    subject: {
        type: String,
        required: true,
        index: true,
    },

    // Contenu
    theme: { type: String, required: true },
    chapter: { type: String, required: true },
    subChapter: { type: String, default: undefined },

    // Compétences
    skills: [SkillSubSchema],

    // Métadonnées
    estimatedHours: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    prerequisites: [{ type: String }],
    examFrequency: { type: Number, default: 0, min: 0, max: 100 },

    // Liens Workyt
    linkedContent: {
        fiches: [{ type: Schema.Types.ObjectId, ref: 'Revision' }],
        courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
        quizzes: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }],
    },

    coverage: { type: Number, default: 0, min: 0, max: 100 },
    sourceReference: { type: String, default: undefined },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Index composé pour les requêtes fréquentes
CurriculumNodeSchema.index({ cycle: 1, level: 1, subject: 1 });
CurriculumNodeSchema.index({ version: 1, subject: 1 });
CurriculumNodeSchema.index({ 'skills.skillId': 1 });

// Mise à jour automatique de updatedAt
CurriculumNodeSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const CurriculumNode: Model<ICurriculumNode> =
    mongoose.models.CurriculumNode || mongoose.model<ICurriculumNode>('CurriculumNode', CurriculumNodeSchema);

export default CurriculumNode;
