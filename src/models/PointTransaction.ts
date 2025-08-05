import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IPointTransaction extends Document {
    user: ObjectId;
    question?: ObjectId;   // réponse validée sur le forum
    answer?: ObjectId;     // like / unlike de réponse
    revision?: ObjectId;   // création ou like de fiche
    action:               // pour préciser le type exact d'événement
        | 'createRevision'
        | 'likeRevision'
        | 'unlikeRevision'
        | 'createAnswer'
        | 'likeAnswer'
        | 'unlikeAnswer'
        | 'validateAnswer'
        | 'completeQuiz';
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
            'validateAnswer', 'createQuestion', 'completeQuiz',
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
