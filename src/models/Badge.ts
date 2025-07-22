import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IBadge extends Document {
  _id: ObjectId;
  slug: string; // identifiant unique, ex: "first_course"
  name: string; // ex: "Premier pas"
  description: string; // ex: "A terminé son premier cours."
  icon: string; // ex: "/badge/premier_pas.svg"
  category: 'progression' | 'engagement' | 'performance' | 'special';
  condition: {
    type: string; // ex: "course_completed", "quiz_score", "forum_post"
    value: number; // ex: 1, 10, 100
  };
  rarity?: 'commun' | 'rare' | 'épique' | 'légendaire';
}

const BadgeSchema = new Schema<IBadge>({
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['progression', 'engagement', 'performance', 'special'], 
    required: true 
  },
  condition: {
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  },
  rarity: {
    type: String,
    enum: ['commun', 'rare', 'épique', 'légendaire'],
    default: 'commun'
  }
});

const Badge = mongoose.models.Badge || mongoose.model<IBadge>('Badge', BadgeSchema);

export default Badge; 