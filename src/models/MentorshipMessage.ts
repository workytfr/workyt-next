import mongoose, { Schema, Document, Types } from 'mongoose';
import { SUIVI_BLOCK_TYPES, MAX_BLOCK_TITLE_LENGTH, type SuiviBlockType } from '@/lib/mentorship/config';

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
/**
 * `block` : un bloc pédagogique (définition, méthode, indice…) envoyé par le
 * bénévole — son contenu est dans `text`, son type et son titre dans `meta`.
 * `confused` : l'élève signale qu'il n'a pas compris un bloc (`meta.replyTo`).
 */
export type MessageKind = 'text' | 'resource' | 'goal' | 'checkin' | 'checkin_reply' | 'event' | 'block' | 'confused';

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
    blockType?: SuiviBlockType;
    blockTitle?: string;
    replyTo?: Types.ObjectId;
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
    enum: ['text', 'resource', 'goal', 'checkin', 'checkin_reply', 'event', 'block', 'confused'],
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
    event: { type: String },
    blockType: { type: String, enum: SUIVI_BLOCK_TYPES },
    blockTitle: { type: String, maxlength: MAX_BLOCK_TITLE_LENGTH },
    replyTo: { type: Schema.Types.ObjectId }
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
