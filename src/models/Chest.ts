import mongoose, { Schema, Document, ObjectId } from 'mongoose';

/**
 * Types de coffres
 */
export type ChestType = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Types de récompenses dans les coffres
 */
export type ChestRewardType = 'points' | 'gems' | 'cosmetic';

/**
 * Interface représentant un coffre
 */
export interface IChest extends Document {
  _id: ObjectId;
  type: ChestType; // Type de coffre
  name: string; // Nom du coffre
  description: string; // Description
  possibleRewards: {
    type: ChestRewardType;
    amount?: number; // Pour points et gems
    cosmeticType?: 'profile_image' | 'profile_border' | 'username_color';
    cosmeticId?: string; // ID du cosmétique spécifique
    weight: number; // Poids pour la probabilité (plus élevé = plus probable)
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChestSchema = new Schema<IChest>({
  type: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  possibleRewards: [{
    type: {
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
    weight: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index
ChestSchema.index({ type: 1, isActive: 1 });

// Middleware pour mettre à jour updatedAt
ChestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Chest = mongoose.models.Chest || mongoose.model<IChest>('Chest', ChestSchema);

export default Chest;

