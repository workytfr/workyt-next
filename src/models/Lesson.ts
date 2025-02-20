import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Interface représentant une leçon
 */
export interface ILesson extends Document {
    sectionId: ObjectId; // Référence à la section
    title: string;
    content: string;
    media?: string[]; // Images, vidéos, PDF
    order: number;
}

/**
 * Schéma de la leçon
 */
const LessonSchema: Schema = new Schema({
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    media: [{ type: String }], // Tableau d'URLs des médias
    order: { type: Number, required: true }
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Lesson: Model<ILesson> = mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema);

export default Lesson;
