import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export type MushroomTransactionType = 'earn' | 'use';
export type MushroomSource = 'quest' | 'chest' | 'streak' | 'event' | 'calendar' | 'admin';
export type BoostType = 'double_points' | 'quest_extra' | 'lucky_chest';

export interface IMushroomTransaction extends Document {
  _id: ObjectId;
  user: ObjectId;
  type: MushroomTransactionType;
  amount: number;
  source: MushroomSource;
  boostType?: BoostType;
  createdAt: Date;
}

const MushroomTransactionSchema = new Schema<IMushroomTransaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'use'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  source: {
    type: String,
    enum: ['quest', 'chest', 'streak', 'event', 'calendar', 'admin'],
    required: true
  },
  boostType: {
    type: String,
    enum: ['double_points', 'quest_extra', 'lucky_chest']
  },
  createdAt: { type: Date, default: Date.now }
});

MushroomTransactionSchema.index({ user: 1, createdAt: -1 });

const MushroomTransaction = mongoose.models.MushroomTransaction || mongoose.model<IMushroomTransaction>('MushroomTransaction', MushroomTransactionSchema);

export default MushroomTransaction;
