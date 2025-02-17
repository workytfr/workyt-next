import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IAnswer extends Document {
    user: ObjectId;
    question: ObjectId;
    content: string;
    likes: number;
    likedBy: string[];
    status: 'Proposée' | 'Validée' | 'Meilleure Réponse';
    createdAt: Date;
}

const AnswerSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    status: {
        type: String,
        enum: ['Proposée', 'Validée', 'Meilleure Réponse'],
        default: 'Proposée'
    },
    createdAt: { type: Date, default: Date.now }
});

const Answer = mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema);
export default Answer;
