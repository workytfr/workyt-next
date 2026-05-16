import mongoose, { Schema, Document, ObjectId } from "mongoose";
import type { PlatformType, IPlatform } from "@/lib/livePlatforms";

export type { PlatformType, IPlatform };

export interface ILiveEvent extends Document {
    _id: ObjectId;
    title: string;
    videoId?: string;
    platforms: IPlatform[];
    scheduledAt: Date;
    isActive: boolean;
    forceLive: boolean;
    createdBy: ObjectId;
    createdAt: Date;
}

const PlatformSchema = new Schema<IPlatform>(
    {
        type: {
            type: String,
            enum: ["youtube", "google_meet", "discord", "instagram", "twitch"],
            required: true,
        },
        url: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const LiveEventSchema = new Schema<ILiveEvent>({
    title: {
        type: String,
        required: [true, "Le titre est requis"],
        trim: true,
        maxlength: [150, "Le titre ne peut pas dépasser 150 caractères"],
    },
    videoId: {
        type: String,
        trim: true,
    },
    platforms: {
        type: [PlatformSchema],
        default: [],
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
