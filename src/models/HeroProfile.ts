import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Profil de héros persistant du RPG « Workyt Quest » (Plateau de l'Aventure).
 * Le héros garde niveau, XP et équipement d'un mois à l'autre.
 * Les HP sont restaurés à fond chaque jour (voir lastHpReset).
 */
export interface IHeroProfile extends Document {
  user: Types.ObjectId;
  level: number; // Commence à 1
  xp: number; // XP cumulée (courbe : 50 × niveau^1.5 par niveau)
  hp: number; // HP actuels (restaurés chaque jour)
  lastHpReset: Date; // Dernière réanimation (le héros est tombé à 0)
  lastActiveAt: Date; // Dernier jour de jeu — sert au malus d'inactivité
  equipped: {
    weapon?: string; // equipmentId du catalogue
    armor?: string;
    amulet?: string;
  };
  dungeonKills: number; // Total de monstres vaincus
  /** XP déjà tirée des défis entre amis aujourd'hui — voir MAX_CHALLENGE_XP_PER_DAY */
  challengeXpToday: number;
  /** Jour auquel se rapporte challengeXpToday */
  challengeXpDay: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HeroProfileSchema = new Schema<IHeroProfile>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  hp: {
    type: Number,
    default: 24, // hpMax au niveau 1 = 20 + 4×1
    min: 0
  },
  lastHpReset: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  equipped: {
    weapon: { type: String },
    armor: { type: String },
    amulet: { type: String }
  },
  dungeonKills: {
    type: Number,
    default: 0,
    min: 0
  },
  challengeXpToday: {
    type: Number,
    default: 0,
    min: 0
  },
  challengeXpDay: {
    type: Date,
    default: Date.now
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

HeroProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const HeroProfile = mongoose.models.HeroProfile || mongoose.model<IHeroProfile>('HeroProfile', HeroProfileSchema);

export default HeroProfile;
