import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Profil d'un bénévole qui accompagne des élèves en suivi.
 *
 * Un bénévole ne peut prendre aucun suivi tant qu'il n'a pas accepté la charte
 * et déclaré être majeur (`charterAcceptedAt`). Le quota (`maxActive`) est le
 * garde-fou principal contre l'épuisement : au-delà, le bénévole n'apparaît
 * plus comme disponible et ne peut plus rien prendre.
 */
export interface IMentorProfile extends Document {
  user: Types.ObjectId;
  /** `paused` : le bénévole se retire temporairement (examens, vacances…) */
  status: 'available' | 'paused';
  maxActive: number;
  /** Vide = toutes les matières / tous les niveaux */
  subjects: string[];
  levels: string[];
  bio: string;
  charterAcceptedAt?: Date;
  adultDeclared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MentorProfileSchema = new Schema<IMentorProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: { type: String, enum: ['available', 'paused'], default: 'available' },
    maxActive: { type: Number, default: 3, min: 1, max: 10 },
    subjects: [{ type: String }],
    levels: [{ type: String }],
    bio: { type: String, trim: true, maxlength: 280, default: '' },
    charterAcceptedAt: { type: Date },
    adultDeclared: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const MentorProfile =
  (mongoose.models.MentorProfile as mongoose.Model<IMentorProfile>) ||
  mongoose.model<IMentorProfile>('MentorProfile', MentorProfileSchema);

export default MentorProfile;
