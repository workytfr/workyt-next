import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IPointTransaction extends Document {
    user: ObjectId;
    question?: ObjectId;
    answer?: ObjectId;
    type: 'gain' | 'perte';
    points: number;
    createdAt: Date;
}

const PointTransactionSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: Schema.Types.ObjectId, ref: 'Question' },
    answer: { type: Schema.Types.ObjectId, ref: 'Answer' },
    type: { type: String, enum: ['gain', 'perte'], required: true },
    points: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const PointTransaction = mongoose.models.PointTransaction || mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);
export default PointTransaction;
