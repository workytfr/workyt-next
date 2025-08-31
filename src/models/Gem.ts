import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IGem extends Document {
  _id: ObjectId;
  user: ObjectId;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const GemSchema = new Schema<IGem>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  balance: { 
    type: Number, 
    required: true, 
    default: 0,
    min: [0, 'Le solde ne peut pas être négatif']
  },
  totalEarned: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  totalSpent: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware pour mettre à jour updatedAt
GemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Gem = mongoose.models.Gem || mongoose.model<IGem>('Gem', GemSchema);

export default Gem;
