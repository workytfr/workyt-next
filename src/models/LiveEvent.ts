import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface ILiveEvent extends Document {
    _id: ObjectId;
    title: string;
    videoId: string;
    scheduledAt: Date;
    isActive: boolean;
    forceLive: boolean; // admin a cliqué "Démarrer" → affiche EN DIRECT immédiatement
    createdBy: ObjectId;
    createdAt: Date;
}

const LiveEventSchema = new Schema<ILiveEvent>({
    title: {
        type: String,
        required: [true, "Le titre est requis"],
        trim: true,
        maxlength: [150, "Le titre ne peut pas dépasser 150 caractères"],
    },
    videoId: {
        type: String,
        required: [true, "L'ID de la vidéo YouTube est requis"],
        trim: true,
    },
    scheduledAt: {
        type: Date,
        required: [true, "La date du live est requise"],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    forceLive: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

LiveEventSchema.index({ scheduledAt: -1 });
LiveEventSchema.index({ isActive: 1, scheduledAt: 1 });

const LiveEvent =
    mongoose.models.LiveEvent ||
    mongoose.model<ILiveEvent>("LiveEvent", LiveEventSchema);

export default LiveEvent;
