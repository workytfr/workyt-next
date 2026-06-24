import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Assemblée Générale (AG) de l'association.
 * Le pointage des présents permet d'appliquer la règle des absences.
 */
export interface IAssembly extends Document {
    title: string;
    date: Date;
    attendees: Types.ObjectId[];   // adhérents présents (userId)
    closed: boolean;               // une fois clôturée, les absences sont comptabilisées
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AssemblySchema = new Schema<IAssembly>(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        date: { type: Date, required: true },
        attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        closed: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

AssemblySchema.index({ date: -1 });

const Assembly =
    mongoose.models.Assembly ||
    mongoose.model<IAssembly>('Assembly', AssemblySchema);

export default Assembly;
