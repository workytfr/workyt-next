import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Inventaire d'équipement RPG d'un utilisateur.
 * Chaque item du catalogue (src/lib/equipment.ts) ne peut être possédé qu'une fois.
 */
export interface IHeroEquipment extends Document {
  user: Types.ObjectId;
  equipmentId: string; // id du catalogue (ex. 'w_iron')
  slot: 'weapon' | 'armor' | 'amulet';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  acquiredAt: Date;
}

const HeroEquipmentSchema = new Schema<IHeroEquipment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipmentId: {
    type: String,
    required: true
  },
  slot: {
    type: String,
    enum: ['weapon', 'armor', 'amulet'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  acquiredAt: {
    type: Date,
    default: Date.now
  }
});

// Un item du catalogue ne peut être possédé qu'une fois par utilisateur
HeroEquipmentSchema.index({ user: 1, equipmentId: 1 }, { unique: true });
HeroEquipmentSchema.index({ user: 1 });

const HeroEquipment = mongoose.models.HeroEquipment || mongoose.model<IHeroEquipment>('HeroEquipment', HeroEquipmentSchema);

export default HeroEquipment;
