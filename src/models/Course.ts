import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

/**
 * Interface représentant un cours
 */
export interface ICourse extends Document {
    title: string;
    description: string;
    authors: ObjectId[]; // Liste des auteurs du cours
    status: "en_attente_publication" | "en_attente_verification" | "publie" | "annule";
    niveau: string; // Collège, lycée, université...
    matiere: string; // Référence à la matière
    image?: string; // Image de fond du cours (optionnelle)
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Schéma du cours
 */
const CourseSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    authors: [{ type: Schema.Types.ObjectId, ref: "User", required: true }], // Liste des auteurs
    status: {
        type: String,
        enum: ["en_attente_publication", "en_attente_verification", "publie", "annule"],
        default: "en_attente_verification",
    },
    niveau: { type: String, required: true },
    matiere: { type: String, required: true },
    image: { type: String, default: "" }, // Image de fond du cours (optionnelle)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

/**
 * Virtual populate pour aller chercher les "Section"
 * où section.courseId == course._id
 */
CourseSchema.virtual("sections", {
    ref: "Section",         // Le modèle Section
    localField: "_id",      // Sur quoi on matche dans Course
    foreignField: "courseId", // Sur quoi on matche dans Section
});

// Active l'inclusion des virtuals dans le JSON/objet final
CourseSchema.set("toJSON", { virtuals: true });
CourseSchema.set("toObject", { virtuals: true });

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
