import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IOwnedCosmetic extends Document {
  _id: ObjectId;
  user: ObjectId;
  cosmeticType: 'profile_image' | 'profile_border' | 'username_color';
  cosmeticId: string; // ex: 'FoxyPink.webp', 'gold', 'rainbow'
  source: 'purchase' | 'chest' | 'reward' | 'gift'; // comment il a été obtenu
  acquiredAt: Date;
}

const OwnedCosmeticSchema = new Schema<IOwnedCosmetic>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cosmeticType: {
    type: String,
    enum: ['profile_image', 'profile_border', 'username_color'],
    required: true
  },
  cosmeticId: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['purchase', 'chest', 'reward', 'gift'],
    default: 'purchase'
  },
  acquiredAt: {
    type: Date,
    default: Date.now
  }
});

// Un utilisateur ne peut posséder qu'une seule fois chaque cosmétique
OwnedCosmeticSchema.index({ user: 1, cosmeticType: 1, cosmeticId: 1 }, { unique: true });
OwnedCosmeticSchema.index({ user: 1 });

const OwnedCosmetic = mongoose.models.OwnedCosmetic || mongoose.model<IOwnedCosmetic>('OwnedCosmetic', OwnedCosmeticSchema);

export default OwnedCosmetic;
