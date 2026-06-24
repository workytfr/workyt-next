import mongoose, { Schema, Document, Types } from 'mongoose';
import { BOARD_IDS, COLUMN_IDS } from '@/lib/kanban';

export interface IKanbanCardLink {
    type: 'none' | 'course' | 'forum' | 'evaluation';
    refId?: Types.ObjectId;
    label?: string;
    url?: string;
}

export interface IKanbanChecklistItem {
    text: string;
    done: boolean;
}

export type KanbanSourceKind =
    | 'manual'
    | 'evaluation_submission'
    | 'course_review'
    | 'forum_unanswered'
    | 'forum_moderation';

export interface IKanbanSource {
    kind: KanbanSourceKind;
    refId?: Types.ObjectId;
}

export interface IKanbanComment {
    _id: Types.ObjectId;
    kind: 'comment' | 'activity';
    author?: Types.ObjectId;   // requis pour un commentaire, absent pour l'activité (narrée par Foxy)
    text: string;
    foxy?: string;             // émotion du Foxy pour les entrées d'activité
    createdAt: Date;
}

export interface IKanbanCard extends Document {
    board: string;                       // rôle / équipe (voir lib/kanban BOARD_IDS)
    column: 'todo' | 'in_progress' | 'review' | 'done';
    order: number;                       // position dans la colonne
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    labels: string[];                    // ids de LABEL_COLORS
    checklist: IKanbanChecklistItem[];
    assignees: Types.ObjectId[];
    link: IKanbanCardLink;
    dueDate?: Date;
    archived: boolean;
    source: IKanbanSource;
    comments: IKanbanComment[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const KanbanCommentSchema = new Schema<IKanbanComment>({
    kind: { type: String, enum: ['comment', 'activity'], default: 'comment' },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    foxy: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const KanbanCardLinkSchema = new Schema<IKanbanCardLink>(
    {
        type: {
            type: String,
            enum: ['none', 'course', 'forum', 'evaluation'],
            default: 'none',
        },
        refId: { type: Schema.Types.ObjectId },
        label: { type: String, trim: true, maxlength: 300 },
        url: { type: String, trim: true, maxlength: 500 },
    },
    { _id: false }
);

const KanbanCardSchema = new Schema<IKanbanCard>({
    board: {
        type: String,
        enum: BOARD_IDS,
        required: true,
        index: true,
    },
    column: {
        type: String,
        enum: COLUMN_IDS,
        default: 'todo',
    },
    order: { type: Number, default: 0 },
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
    },
    description: {
        type: String,
        trim: true,
        // HTML riche (TipTap) SANS images (retirées à l'enregistrement).
        maxlength: [20000, 'La description est trop longue.'],
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    labels: [{ type: String, trim: true, maxlength: 30 }],
    checklist: [
        new Schema<IKanbanChecklistItem>(
            {
                text: { type: String, trim: true, maxlength: 300, required: true },
                done: { type: Boolean, default: false },
            },
            { _id: false }
        ),
    ],
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    link: {
        type: KanbanCardLinkSchema,
        default: () => ({ type: 'none' }),
    },
    dueDate: { type: Date },
    archived: { type: Boolean, default: false, index: true },
    source: {
        kind: {
            type: String,
            enum: ['manual', 'evaluation_submission', 'course_review', 'forum_unanswered', 'forum_moderation'],
            default: 'manual',
        },
        refId: { type: Schema.Types.ObjectId },
    },
    comments: { type: [KanbanCommentSchema], default: [] },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

KanbanCardSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Récupération rapide des cartes d'un board, triées par colonne/position
KanbanCardSchema.index({ board: 1, column: 1, order: 1 });

// Empêche les doublons de cartes auto-générées (une carte par source.refId/board)
KanbanCardSchema.index(
    { board: 1, 'source.refId': 1 },
    { unique: true, partialFilterExpression: { 'source.refId': { $exists: true } } }
);

const KanbanCard =
    mongoose.models.KanbanCard ||
    mongoose.model<IKanbanCard>('KanbanCard', KanbanCardSchema);

export default KanbanCard;
