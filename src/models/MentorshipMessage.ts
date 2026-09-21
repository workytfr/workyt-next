import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Un message d'un suivi (voir Mentorship).
 *
 * ⚠️ Contrairement au tchat de clan, le texte est libre : un suivi ne se fait
 * pas avec des phrases toutes faites. Les garde-fous sont donc ailleurs, et ils
 * ne doivent jamais être retirés :
 *  - AUCUNE suppression ni modification, par personne : pas de route DELETE,
 *    pas de TTL. La modération doit pouvoir relire l'échange sur signalement ;
 *  - un message qui contient des coordonnées (téléphone, e-mail, réseau social)
 *    n'est pas distribué : il est conservé avec `status: 'blocked'`, visible de
 *    la seule modération, et la modération est alertée (voir contactFilter).
 */

export type MessageAuthorRole = 'student' | 'mentor' | 'moderator' | 'system';
export type MessageKind = 'text' | 'resource' | 'goal' | 'checkin' | 'checkin_reply' | 'event';

export interface IMentorshipMessage extends Document {
  mentorship: Types.ObjectId;
  /** Absent pour les messages système */
  author?: Types.ObjectId;
  authorRole: MessageAuthorRole;
  kind: MessageKind;
  text: string;

  /** Image jointe, servie uniquement par /api/suivi/[id]/messages/[messageId]/attachment */
  attachment?: { key: string; name: string; mime: string; size: number };

  /** Référence d'un objectif, d'une ressource assignée ou d'une humeur de point d'étape */
  meta?: {
    assignmentId?: Types.ObjectId;
    goalId?: Types.ObjectId;
    mood?: 'bien' | 'moyen' | 'bloque';
    event?: string;
  };

  status: 'visible' | 'blocked';
  blockedReasons?: string[];

  createdAt: Date;
}

const MentorshipMessageSchema = new Schema<IMentorshipMessage>({
  mentorship: { type: Schema.Types.ObjectId, ref: 'Mentorship', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  authorRole: {
    type: String,
    enum: ['student', 'mentor', 'moderator', 'system'],
    required: true
  },
  kind: {
    type: String,
    enum: ['text', 'resource', 'goal', 'checkin', 'checkin_reply', 'event'],
    default: 'text'
  },
  text: { type: String, default: '', maxlength: 2000 },

  attachment: {
    key: { type: String },
    name: { type: String },
    mime: { type: String },
    size: { type: Number }
  },

  meta: {
    assignmentId: { type: Schema.Types.ObjectId },
    goalId: { type: Schema.Types.ObjectId },
    mood: { type: String, enum: ['bien', 'moyen', 'bloque'] },
    event: { type: String }
  },

  status: { type: String, enum: ['visible', 'blocked'], default: 'visible' },
  blockedReasons: [{ type: String }],

  createdAt: { type: Date, default: Date.now }
});

// Le fil d'un suivi, dans l'ordre
MentorshipMessageSchema.index({ mentorship: 1, createdAt: 1 });
// Les messages bloqués, pour la modération
MentorshipMessageSchema.index({ status: 1, createdAt: -1 });

const MentorshipMessage =
  (mongoose.models.MentorshipMessage as mongoose.Model<IMentorshipMessage>) ||
  mongoose.model<IMentorshipMessage>('MentorshipMessage', MentorshipMessageSchema);

export default MentorshipMessage;
