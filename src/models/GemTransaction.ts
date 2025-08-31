import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IGemTransaction extends Document {
  _id: ObjectId;
  user: ObjectId;
  type: 'conversion' | 'purchase' | 'refund' | 'bonus' | 'partner_offer' | 'reward' | 'admin_grant' | 'admin_deduct';
  points?: number; // Pour les conversions points → gemmes
  gems: number; // Nombre de gemmes gagnées/perdues (positif = gagné, négatif = perdu)
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  partnerId?: ObjectId; // Pour les offres de partenaires
  offerType?: 'free' | 'premium'; // Type d'offre partenaire
  metadata?: {
    itemType?: string; // 'profile_image', 'profile_border', 'username_color', 'partner_offer'
    itemId?: string;
    conversionRate?: number; // Taux de conversion points → gemmes
    partnerName?: string; // Nom du partenaire
    offerDescription?: string; // Description de l'offre
    justification?: string; // Justification pour les offres gratuites
    promoCode?: string; // Code promo utilisé
    adminNote?: string; // Note admin pour les modifications
  };
  createdAt: Date;
  updatedAt: Date;
}

const GemTransactionSchema = new Schema<IGemTransaction>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['conversion', 'purchase', 'refund', 'bonus', 'partner_offer', 'reward', 'admin_grant', 'admin_deduct'], 
    required: true 
  },
  points: { 
    type: Number, 
    min: [0, 'Les points ne peuvent pas être négatifs']
  },
  gems: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'Partner'
  },
  offerType: {
    type: String,
    enum: ['free', 'premium']
  },
  metadata: {
    itemType: String,
    itemId: String,
    conversionRate: Number,
    partnerName: String,
    offerDescription: String,
    justification: String,
    promoCode: String,
    adminNote: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index pour améliorer les performances
GemTransactionSchema.index({ user: 1, createdAt: -1 });
GemTransactionSchema.index({ type: 1, status: 1 });
GemTransactionSchema.index({ partnerId: 1 });

// Middleware pour mettre à jour updatedAt
GemTransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthode statique pour calculer le solde d'un utilisateur
GemTransactionSchema.statics.calculateBalance = async function(userId: ObjectId) {
  const result = await this.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $group: { _id: null, totalGems: { $sum: '$gems' } } }
  ]);
  return result[0]?.totalGems || 0;
};

// Méthode statique pour obtenir l'historique des transactions
GemTransactionSchema.statics.getUserHistory = async function(userId: ObjectId, limit = 50, skip = 0) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('partnerId', 'name logo')
    .lean();
};

const GemTransaction = mongoose.models.GemTransaction || mongoose.model<IGemTransaction>('GemTransaction', GemTransactionSchema);

export default GemTransaction;
