import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Interface représentant une section
 */
export interface ISection extends Document {
    courseId: ObjectId; // Référence au cours
    title: string;
    order: number; // Position de la section
}

/**
 * Schéma de la section
 */
const SectionSchema: Schema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true }
});

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Section: Model<ISection> = mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);

export default Section;
