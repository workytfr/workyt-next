import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

/**
 * Profil scolaire de l'élève
 * Stocke le niveau, la filière, les spécialités et les préférences d'étude
 */
export interface IStudentAcademicProfile extends Document {
    _id: ObjectId;
    userId: ObjectId;

    // Identité académique
    currentGrade: string;          // "6eme", "5eme", ..., "terminale", "bts1", "l1"...
    cycle: 'cycle3' | 'cycle4' | 'lycee' | 'superieur';
    track?: string;                // "generale", "technologique", "professionnelle"
    specialities?: string[];       // ["mathematiques", "physique-chimie", "nsi"]
    options?: string[];            // ["latin", "section-europeenne"]

    // Etablissement (optionnel)
    school?: {
        name: string;
        academy: string;
        department: string;
    };

    // Préférences d'étude
    preferences: {
        dailyStudyTime: number;        // Minutes par jour (défaut: 45)
        preferredStudyDays: string[];   // ["monday", "tuesday", ...]
        pace: 'relaxed' | 'moderate' | 'intensive';
        reminderEnabled: boolean;
    };

    // Examens à venir
    upcomingExams: {
        subject: string;
        date: Date;
        type: 'controle' | 'brevet' | 'bac' | 'partiel' | 'concours';
        curriculumNodeIds: ObjectId[];
    }[];

    createdAt: Date;
    updatedAt: Date;
}

const StudentAcademicProfileSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },

    currentGrade: {
        type: String,
        required: true,
    },
    cycle: {
        type: String,
        enum: ['cycle3', 'cycle4', 'lycee', 'superieur'],
        required: true,
    },
    track: {
        type: String,
        default: undefined,
    },
    specialities: [{ type: String }],
    options: [{ type: String }],

    school: {
        name: { type: String },
        academy: { type: String },
        department: { type: String },
    },

    preferences: {
        dailyStudyTime: { type: Number, default: 45 },
        preferredStudyDays: {
            type: [String],
            default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        pace: {
            type: String,
            enum: ['relaxed', 'moderate', 'intensive'],
            default: 'moderate',
        },
        reminderEnabled: { type: Boolean, default: true },
    },

    upcomingExams: [{
        subject: { type: String, required: true },
        date: { type: Date, required: true },
        type: {
            type: String,
            enum: ['controle', 'brevet', 'bac', 'partiel', 'concours'],
            required: true,
        },
        curriculumNodeIds: [{ type: Schema.Types.ObjectId, ref: 'CurriculumNode' }],
    }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

StudentAcademicProfileSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const StudentAcademicProfile: Model<IStudentAcademicProfile> =
    mongoose.models.StudentAcademicProfile ||
    mongoose.model<IStudentAcademicProfile>('StudentAcademicProfile', StudentAcademicProfileSchema);

export default StudentAcademicProfile;
