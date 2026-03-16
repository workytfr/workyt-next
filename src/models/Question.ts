import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { slugify } from '@/utils/slugify';

export interface IQuestion extends Document {
    user: ObjectId;
    title: string;
    slug: string;
    classLevel: string;
    subject: string;
    description: {
        whatIDid: string;
        whatINeed: string;
    };
    attachments: string[];
    points: number;
    status: 'Non validée' | 'Validée' | 'Résolue';
    createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: { type: String, required: true },
    slug: { type: String, index: true },
    classLevel: { type: String, required: true },
    subject: { type: String, required: true },
    description: {
        whatIDid: { type: String, required: true },
        whatINeed: { type: String, required: true }
    },
    attachments: [{ type: String }],
    points: { type: Number, required: true, min: 1, max: 15 },
    status: {
        type: String,
        enum: ['Non validée', 'Validée', 'Résolue'],
        default: 'Non validée'
    },
    createdAt: { type: Date, default: Date.now }
});

// Auto-génération du slug à partir du titre
QuestionSchema.pre('save', function (next) {
    if (this.isModified('title') || !this.slug) {
        this.slug = slugify(this.title as string);
    }
    next();
});

const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export default Question;
