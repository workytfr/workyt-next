import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { BoostType } from './MushroomTransaction';

export interface IActiveBoost extends Document {
  _id: ObjectId;
  user: ObjectId;
  boostType: BoostType;
  multiplier: number;
  expiresAt: Date;
  createdAt: Date;
}

const ActiveBoostSchema = new Schema<IActiveBoost>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boostType: {
    type: String,
    enum: ['double_points', 'quest_extra', 'lucky_chest'],
    required: true
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

ActiveBoostSchema.index({ user: 1, boostType: 1 });
ActiveBoostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

const ActiveBoost = mongoose.models.ActiveBoost || mongoose.model<IActiveBoost>('ActiveBoost', ActiveBoostSchema);

export default ActiveBoost;
