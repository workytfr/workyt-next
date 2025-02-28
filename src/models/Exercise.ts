import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Types de niveaux de difficulté
 */
export type DifficultyLevel =
    'Facile 1' | 'Facile 2' |
    'Moyen 1' | 'Moyen 2' |
    'Difficile 1' | 'Difficile 2' |
    'Élite';

/**
 * Interface représentant un exercice
 */
export interface IExercise extends Document {
    sectionId: ObjectId; // Référence à la section
    author: ObjectId; // Auteur de l'exercice
    title: string;
    content: string;
    image?: string; // Image associée (optionnel)
    correction?: {
        text?: string; // Explication de la correction (optionnel)
        image?: string; // Image de la correction (optionnel)
    };
    difficulty: DifficultyLevel; // Niveau de difficulté
}

/**
 * Schéma de l'exercice
 */
const ExerciseSchema: Schema = new Schema({
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Référence à l'auteur
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String }, // URL d'image facultative
    correction: {
        text: { type: String }, // Texte explicatif de la correction (facultatif)
        image: { type: String } // URL d'image de correction (facultatif)
    },
    difficulty: {
        type: String,
        enum: ['Facile 1', 'Facile 2', 'Moyen 1', 'Moyen 2', 'Difficile 1', 'Difficile 2', 'Élite'],
        required: true
    }
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Exercise: Model<IExercise> = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
