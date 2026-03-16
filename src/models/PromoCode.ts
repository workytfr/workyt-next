import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IPromoCode extends Document {
  _id: ObjectId;
  code: string;
  partnerId: ObjectId;
  offerType: 'free' | 'premium';
  // Attribution
  assignedTo?: ObjectId;
  assignedAt?: Date;
  // Utilisation
  isUsed: boolean;
  usedAt?: Date;
  // Métadonnées
  createdAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  offerType: {
    type: String,
    enum: ['free', 'premium'],
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour chercher rapidement un code disponible pour un partenaire
PromoCodeSchema.index({ partnerId: 1, offerType: 1, assignedTo: 1 });
// Index pour vérifier si un user a déjà un code (global)
PromoCodeSchema.index({ assignedTo: 1 });
// Index unique sur le code
PromoCodeSchema.index({ code: 1 }, { unique: true });

const PromoCode = mongoose.models.PromoCode || mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);

export default PromoCode;
