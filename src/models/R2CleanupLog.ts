import mongoose, { Schema, Document, Model } from "mongoose";

export interface IR2CleanupLog extends Document {
    runAt: Date;
    dryRun: boolean;
    durationMs: number;
    scanned: number;
    referenced: number;
    orphans: number;
    deleted: number;
    bytesFreed: number;
    skippedRecent: number;
    sampleOrphans: string[];
    errorMessages: string[];
    triggeredBy: "cron" | "admin";
    triggeredByUserId?: mongoose.Types.ObjectId;
}

const R2CleanupLogSchema: Schema = new Schema(
    {
        runAt: { type: Date, default: Date.now, index: true },
        dryRun: { type: Boolean, required: true },
        durationMs: Number,
        scanned: Number,
        referenced: Number,
        orphans: Number,
        deleted: Number,
        bytesFreed: Number,
        skippedRecent: Number,
        sampleOrphans: [String],
        errors: [String],
        triggeredBy: { type: String, enum: ["cron", "admin"], required: true },
        triggeredByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: false },
);

const R2CleanupLog: Model<IR2CleanupLog> =
    mongoose.models.R2CleanupLog || mongoose.model<IR2CleanupLog>("R2CleanupLog", R2CleanupLogSchema);

export default R2CleanupLog;
