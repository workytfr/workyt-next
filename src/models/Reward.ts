import mongoose, { Schema, Document, Model } from 'mongoose';

export type RewardMethod =
    | 'highestPoints'               // Somme des points acquis (PointTransaction)
    | 'mostRevisions'               // Nombre total de fiches créées
    | 'mostRevisionsInCategory';    // Fiches créées dans une matière donnée

export interface IReward extends Document {
    title: string;
    description?: string;
    imageUrl?: string;
    startDate: Date;
    endDate: Date;
    method: RewardMethod;
    category?: string; // ex: 'fr' si method==='mostRevisionsInCategory'
    prize: string;
    createdAt: Date;
}

const RewardSchema = new Schema<IReward>({
    title:       { type: String, required: true },
    description: { type: String },
    imageUrl:    { type: String },
    startDate:   { type: Date,   required: true },
    endDate:     { type: Date,   required: true },
    method:      { type: String, enum: ['highestPoints','mostRevisions','mostRevisionsInCategory'], required: true },
    category:    { type: String },
    prize:       { type: String, required: true },
    createdAt:   { type: Date,   default: Date.now },
});

const Reward: Model<IReward> = mongoose.models.Reward || mongoose.model('Reward', RewardSchema);
export default Reward;
