import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Un suivi personnalisé entre un élève et un bénévole de l'association.
 *
 * Le document porte à la fois la demande (tant qu'aucun bénévole ne l'a prise,
 * `status: 'pending'` et `mentor: null`) et le suivi lui-même. Garder les deux
 * dans un seul document permet le relais : quand un bénévole passe la main, le
 * suivi retourne en file SANS perdre la conversation, le plan ni les ressources.
 * Le bénévole suivant reprend exactement où l'autre s'est arrêté.
 *
 * ⚠️ Canal privé entre un adulte et un élève souvent mineur : rien n'est jamais
 * supprimé (ni le suivi, ni ses messages). Voir MentorshipMessage.
 */

export type MentorshipStatus = 'pending' | 'active' | 'paused' | 'closed' | 'cancelled';
export type MentorshipFormat = 'ponctuel' | 'suivi';
export type MentorshipGoalType = 'comprendre' | 'moyenne' | 'examen' | 'decrochage' | 'methode';
export type AssignmentKind = 'course' | 'lesson' | 'exercise' | 'quiz' | 'fiche' | 'evaluation';
export type CloseOutcome = 'goal_reached' | 'partial' | 'stopped' | 'no_response';
export type CheckinMood = 'bien' | 'moyen' | 'bloque';

export interface IMentorshipGoal {
  _id: Types.ObjectId;
  title: string;
  done: boolean;
  doneAt?: Date;
  /** Points déjà versés pour cet objectif : décocher puis recocher ne rapporte rien */
  rewarded: boolean;
  createdAt: Date;
}

export interface IMentorshipAssignment {
  _id: Types.ObjectId;
  kind: AssignmentKind;
  /** Id de la ressource ; pour `evaluation`, id du COURS (les évaluations sont tirées au sort) */
  refId: Types.ObjectId;
  title: string;
  url: string;
  note?: string;
  dueAt?: Date;
  assignedAt: Date;
  doneAt?: Date;
  doneSource?: 'auto' | 'student' | 'mentor';
  /** Ressource déjà terminée avant d'être assignée : cochée, mais sans points */
  alreadyDone?: boolean;
  score?: number;
  maxScore?: number;
  rewarded: boolean;
}

export interface IMentorHistoryEntry {
  mentor: Types.ObjectId;
  from: Date;
  to?: Date;
  reason?: 'released' | 'timeout' | 'reassigned' | 'closed';
  note?: string;
}

export interface IMentorship extends Document {
  student: Types.ObjectId;
  mentor: Types.ObjectId | null;
  status: MentorshipStatus;

  // La demande
  format: MentorshipFormat;
  subject: string;
  level: string;
  need: string;
  goalType: MentorshipGoalType;
  availability: string;

  /** Salle temps réel, secrète : seuls les participants la reçoivent */
  roomKey: string;

  mentorHistory: IMentorHistoryEntry[];
  /** Mot laissé au bénévole suivant lors d'un relais */
  handoffNote?: string;

  goals: Types.DocumentArray<IMentorshipGoal & Types.Subdocument>;
  assignments: Types.DocumentArray<IMentorshipAssignment & Types.Subdocument>;
  /** Bloc-notes du bénévole, jamais montré à l'élève, transmis au relais */
  mentorNotes: string;

  lastReadAt: { student?: Date; mentor?: Date };
  lastStudentActivityAt?: Date;
  lastMentorActivityAt?: Date;
  lastMessageAt?: Date;

  matchedAt?: Date;
  pausedAt?: Date;
  closedAt?: Date;

  nextCheckinAt?: Date;
  checkin?: { askedAt?: Date; answeredAt?: Date; mood?: CheckinMood; rewarded?: boolean };

  duoStreak: { current: number; best: number; lastWeekKey?: string };

  closure?: {
    by?: Types.ObjectId;
    outcome?: CloseOutcome;
    summary?: string;
    studentFeedback?: 'helpful' | 'neutral' | 'not_helpful';
  };

  // Marqueurs des relances automatiques (cron), pour ne jamais relancer deux fois
  escalatedAt?: Date;
  mentorReminderAt?: Date;
  studentReminderAt?: Date;
  lastBlockedAlertAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IMentorshipGoal>({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  done: { type: Boolean, default: false },
  doneAt: { type: Date },
  rewarded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const AssignmentSchema = new Schema<IMentorshipAssignment>({
  kind: {
    type: String,
    enum: ['course', 'lesson', 'exercise', 'quiz', 'fiche', 'evaluation'],
    required: true
  },
  refId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, maxlength: 200 },
  url: { type: String, required: true },
  note: { type: String, maxlength: 300 },
  dueAt: { type: Date },
  assignedAt: { type: Date, default: Date.now },
  doneAt: { type: Date },
  doneSource: { type: String, enum: ['auto', 'student', 'mentor'] },
  alreadyDone: { type: Boolean, default: false },
  score: { type: Number },
  maxScore: { type: Number },
  rewarded: { type: Boolean, default: false }
});

const MentorshipSchema = new Schema<IMentorship>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'closed', 'cancelled'],
      default: 'pending'
    },

    format: { type: String, enum: ['ponctuel', 'suivi'], default: 'suivi' },
    subject: { type: String, required: true },
    level: { type: String, required: true },
    need: { type: String, required: true, trim: true, maxlength: 1000 },
    goalType: {
      type: String,
      enum: ['comprendre', 'moyenne', 'examen', 'decrochage', 'methode'],
      required: true
    },
    availability: { type: String, trim: true, maxlength: 200, default: '' },

    roomKey: { type: String, required: true },

    mentorHistory: [
      {
        _id: false,
        mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        from: { type: Date, required: true },
        to: { type: Date },
        reason: { type: String, enum: ['released', 'timeout', 'reassigned', 'closed'] },
        note: { type: String, maxlength: 500 }
      }
    ],
    handoffNote: { type: String, maxlength: 500 },

    goals: { type: [GoalSchema], default: [] },
    assignments: { type: [AssignmentSchema], default: [] },
    mentorNotes: { type: String, maxlength: 5000, default: '' },

    lastReadAt: {
      student: { type: Date },
      mentor: { type: Date }
    },
    lastStudentActivityAt: { type: Date },
    lastMentorActivityAt: { type: Date },
    lastMessageAt: { type: Date },

    matchedAt: { type: Date },
    pausedAt: { type: Date },
    closedAt: { type: Date },

    nextCheckinAt: { type: Date },
    checkin: {
      askedAt: { type: Date },
      answeredAt: { type: Date },
      mood: { type: String, enum: ['bien', 'moyen', 'bloque'] },
      rewarded: { type: Boolean, default: false }
    },

    duoStreak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastWeekKey: { type: String }
    },

    closure: {
      by: { type: Schema.Types.ObjectId, ref: 'User' },
      outcome: { type: String, enum: ['goal_reached', 'partial', 'stopped', 'no_response'] },
      summary: { type: String, maxlength: 1000 },
      studentFeedback: { type: String, enum: ['helpful', 'neutral', 'not_helpful'] }
    },

    escalatedAt: { type: Date },
    mentorReminderAt: { type: Date },
    studentReminderAt: { type: Date },
    lastBlockedAlertAt: { type: Date }
  },
  { timestamps: true }
);

// La file d'attente, du plus ancien au plus récent
MentorshipSchema.index({ status: 1, createdAt: 1 });
// « Mes suivis » côté bénévole et côté élève
MentorshipSchema.index({ mentor: 1, status: 1 });
MentorshipSchema.index({ student: 1, status: 1 });
// Historique d'un bénévole (engagement, badges)
MentorshipSchema.index({ 'mentorHistory.mentor': 1 });

const Mentorship =
  (mongoose.models.Mentorship as mongoose.Model<IMentorship>) ||
  mongoose.model<IMentorship>('Mentorship', MentorshipSchema);

export default Mentorship;
