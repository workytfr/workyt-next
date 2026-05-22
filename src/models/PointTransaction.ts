import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPointTransaction extends Document {
    user: Types.ObjectId;
    question?: Types.ObjectId;   // réponse validée sur le forum
    answer?: Types.ObjectId;     // like / unlike de réponse
    revision?: Types.ObjectId;   // création ou like de fiche
    action:               // pour préciser le type exact d'événement
        | 'createRevision'
        | 'likeRevision'
        | 'unlikeRevision'
        | 'createAnswer'
        | 'likeAnswer'
        | 'unlikeAnswer'
        | 'validateAnswer'
        | 'completeQuiz'
        | 'completeEvaluation';
    type: 'gain' | 'perte';
    points: number;
    createdAt: Date;
}

const PointTransactionSchema: Schema = new Schema({
    user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: Schema.Types.ObjectId, ref: 'Question' },
    answer:   { type: Schema.Types.ObjectId, ref: 'Answer' },
    revision: { type: Schema.Types.ObjectId, ref: 'Revision' },
    action:   {
        type: String,
        enum: [
            'createRevision','likeRevision','unlikeRevision',
            'createAnswer','likeAnswer','unlikeAnswer',
            'validateAnswer', 'createQuestion', 'completeQuiz', 'completeEvaluation',
        ],
        required: true
    },
    type:     { type: String, enum: ['gain','perte'], required: true },
    points:   { type: Number, required: true },
    createdAt:{ type: Date, default: Date.now }
});

const PointTransaction = mongoose.models.PointTransaction
    || mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);

export default PointTransaction;
