import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Interface représentant un signalement
 */
export interface IReport extends Document {
    _id: ObjectId;
    reporter: ObjectId; // Utilisateur qui fait le signalement
    reportedContent: {
        type: 'revision' | 'course' | 'forum_answer' | 'forum_question';
        id: ObjectId; // ID du contenu signalé
    };
    reason: 'erreur_contenu' | 'langage_inapproprie' | 'contenu_incomprehensible' | 'contenu_illisible' | 'spam' | 'harcelement' | 'contenu_offensant' | 'violation_droits' | 'autre';
    description: string; // Description détaillée du signalement
    status: 'en_attente' | 'en_cours' | 'resolu' | 'rejete';
    moderator?: ObjectId; // Modérateur qui traite le signalement
    moderatorNotes?: string; // Notes du modérateur
    questionId?: ObjectId; // ID de la question parente (pour les réponses forum)
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}

/**
 * Schéma Mongoose pour les signalements
 */
const ReportSchema = new Schema<IReport>({
    reporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedContent: {
        type: {
            type: String,
            enum: ['revision', 'course', 'forum_answer', 'forum_question'],
            required: true
        },
        id: {
            type: Schema.Types.ObjectId,
            required: true
        }
    },
    reason: {
        type: String,
        enum: [
            'erreur_contenu',
            'langage_inapproprie', 
            'contenu_incomprehensible',
            'contenu_illisible',
            'spam',
            'harcelement',
            'contenu_offensant',
            'violation_droits',
            'autre'
        ],
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    status: {
        type: String,
        enum: ['en_attente', 'en_cours', 'resolu', 'rejete'],
        default: 'en_attente'
    },
    moderator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    moderatorNotes: {
        type: String,
        maxlength: [2000, 'Les notes du modérateur ne peuvent pas dépasser 2000 caractères']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    },
    questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: false // Uniquement pour les réponses forum
    }
});

// Middleware pour mettre à jour updatedAt
ReportSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    if (this.status === 'resolu' || this.status === 'rejete') {
        this.resolvedAt = new Date();
    }
    next();
});

// Index pour optimiser les requêtes
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ 'reportedContent.type': 1, 'reportedContent.id': 1 });
ReportSchema.index({ reporter: 1 });

const Report = (mongoose.models.Report as Model<IReport>) ||
    mongoose.model<IReport>('Report', ReportSchema);

export default Report;
