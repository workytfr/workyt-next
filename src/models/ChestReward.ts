import mongoose, { Schema, Document, ObjectId } from 'mongoose';

/**
 * Interface représentant une récompense obtenue d'un coffre
 */
export interface IChestReward extends Document {
  _id: ObjectId;
  user: ObjectId; // Utilisateur qui a obtenu la récompense
  chest: ObjectId; // Référence au coffre ouvert
  rewardType: 'points' | 'gems' | 'cosmetic';
  amount?: number; // Pour points et gems
  cosmeticType?: 'profile_image' | 'profile_border' | 'username_color';
  cosmeticId?: string; // ID du cosmétique obtenu
  claimed: boolean; // Si la récompense a été réclamée
  claimedAt?: Date; // Date de réclamation
  createdAt: Date;
}

const ChestRewardSchema = new Schema<IChestReward>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chest: {
    type: Schema.Types.ObjectId,
    ref: 'Chest',
    required: true
  },
  rewardType: {
    type: String,
    enum: ['points', 'gems', 'cosmetic'],
    required: true
  },
  amount: {
    type: Number,
    min: 0
  },
  cosmeticType: {
    type: String,
    enum: ['profile_image', 'profile_border', 'username_color']
  },
  cosmeticId: String,
  claimed: {
    type: Boolean,
    default: false
  },
  claimedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index
ChestRewardSchema.index({ user: 1, claimed: 1 });
ChestRewardSchema.index({ createdAt: -1 });

const ChestReward = mongoose.models.ChestReward || mongoose.model<IChestReward>('ChestReward', ChestRewardSchema);

export default ChestReward;

