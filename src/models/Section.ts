import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose'

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

// Ajout d'un virtual pour peupler les "lessons" associées à une section
SectionSchema.virtual('lessons', {
    ref: 'Lesson',           // Le modèle à peupler
    localField: '_id',       // Champ local de référence
    foreignField: 'sectionId', // Champ dans le modèle Lesson
    options: { sort: { order: 1 } } // Tri optionnel des lessons par ordre croissant
});

SectionSchema.virtual('exercises', {
    ref: 'Exercise',         // Nom du modèle Exercise
    localField: '_id',       // Champ local de la section
    foreignField: 'sectionId', // Champ dans le modèle Exercise
    options: { sort: { order: 1 } } // Tri optionnel
});

SectionSchema.virtual('quizzes', {
    ref: 'Quiz',             // Nom du modèle Quiz
    localField: '_id',       // Champ local de la section
    foreignField: 'sectionId', // Champ dans le modèle Quiz
    options: { sort: { order: 1 } } // Tri optionnel
});

// Activation des virtuals dans les conversions en JSON et objet
SectionSchema.set('toJSON', { virtuals: true });
SectionSchema.set('toObject', { virtuals: true });

/**
 * Vérification de la présence du modèle pour éviter une réinstanciation
 */
const Section: Model<ISection> =
    mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);

export default Section;
