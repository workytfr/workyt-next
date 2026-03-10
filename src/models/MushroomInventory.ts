import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IMushroomInventory extends Document {
  _id: ObjectId;
  user: ObjectId;
  balance: number;
  totalEarned: number;
  totalUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const MushroomInventorySchema = new Schema<IMushroomInventory>({
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
    min: [0, 'Le solde ne peut pas etre negatif']
  },
  totalEarned: {
    type: Number,
    required: true,
    default: 0
  },
  totalUsed: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MushroomInventorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const MushroomInventory = mongoose.models.MushroomInventory || mongoose.model<IMushroomInventory>('MushroomInventory', MushroomInventorySchema);

export default MushroomInventory;
