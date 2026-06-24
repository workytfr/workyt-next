import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface représentant une leçon
 */
export interface ILesson extends Document {
    sectionId: Types.ObjectId; // Référence à la section
    author: Types.ObjectId; // Référence à l'auteur de la leçon
    title: string;
    content: string;
    media?: string[]; // Liste d'URL des fichiers multimédias
    audioUrl?: string; // URL de l'audio TTS généré (stocké sur R2)
    order: number; // Position de la leçon dans la section
    status: 'En attente de correction' | 'Validée'; // Statut de la leçon
    validatedBy?: Types.ObjectId; // Correcteur ayant validé la leçon
    validatedAt?: Date; // Date de validation
    createdAt: Date;
}

/**
 * Schéma Mongoose pour les leçons
 */
const LessonSchema: Schema = new Schema({
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Ajout de l'auteur
    title: { type: String, required: true },
    content: { type: String, required: true },
    media: [{ type: String }], // Liste de fichiers multimédias
    audioUrl: { type: String, default: null }, // URL audio TTS (R2)
    order: { type: Number, required: true },
    status: {
        type: String,
        enum: ['En attente de correction', 'Validée'],
        default: 'En attente de correction'
    },
    validatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // Correcteur ayant validé
    validatedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Lesson: Model<ILesson> = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);

export default Lesson;
