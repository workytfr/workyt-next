import mongoose, { Schema, Document, ObjectId } from 'mongoose';

/**
 * Types de récompenses du calendrier
 */
export type CalendarRewardType = 'points' | 'gems' | 'chest';

/**
 * Types de décorations thématiques
 */
export type CalendarTheme = 
  | 'default'
  | 'christmas'      // Noël (sapin, bougie, neige)
  | 'newyear'        // Nouvel An
  | 'chinese_newyear' // Nouvel An chinois (dragon, lanterne)
  | 'eastern'        // Fête orientale (sable, lanterne, dromadaire)
  | 'indian'         // Fêtes indiennes (Diwali)
  | 'japanese'       // Fêtes japonaises
  | 'canadian'       // Fêtes canadiennes
  | 'french_civil'   // Fêtes civiles françaises
  | 'french_cultural'; // Fêtes culturelles françaises

/**
 * Interface représentant un jour du calendrier
 */
export interface ICalendar extends Document {
  _id: ObjectId;
  date: Date; // Date du jour (sans heure)
  reward: {
    type: CalendarRewardType;
    amount?: number; // Points ou diamants à gagner (optionnel pour les coffres)
    chestType?: 'common' | 'rare'; // Type de coffre (si type = 'chest')
  };
  theme: CalendarTheme; // Thème de décoration
  isSpecial: boolean; // Si c'est un jour spécial (fête)
  specialName?: string; // Nom de la fête (ex: "Noël", "Jour de l'An")
  description?: string; // Description de la récompense spéciale
  createdAt: Date;
  updatedAt: Date;
}

const CalendarSchema = new Schema<ICalendar>({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  reward: {
    type: {
      type: String,
      enum: ['points', 'gems', 'chest'],
      required: true
    },
    amount: {
      type: Number,
      min: 0
    },
    chestType: {
      type: String,
      enum: ['common', 'rare']
    }
  },
  theme: {
    type: String,
    enum: [
      'default',
      'christmas',
      'newyear',
      'chinese_newyear',
      'eastern',
      'indian',
      'japanese',
      'canadian',
      'french_civil',
      'french_cultural'
    ],
    default: 'default',
    required: true
  },
  isSpecial: {
    type: Boolean,
    default: false
  },
  specialName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
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

// Index pour optimiser les requêtes
CalendarSchema.index({ date: 1 });
CalendarSchema.index({ isSpecial: 1 });
CalendarSchema.index({ theme: 1 });

// Middleware pour mettre à jour updatedAt
CalendarSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Calendar = mongoose.models.Calendar || mongoose.model<ICalendar>('Calendar', CalendarSchema);

export default Calendar;

