import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PomodoroSettings } from '@/lib/pomodoro/settings';

/** Réglages Pomodoro synchronisés entre appareils (site, application mobile). */
export interface IPomodoroPreference extends Document, PomodoroSettings {
    user: Types.ObjectId;
    updatedAt: Date;
}

const PomodoroPreferenceSchema = new Schema<IPomodoroPreference>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    focusMin: Number,
    shortBreakMin: Number,
    longBreakMin: Number,
    cyclesBeforeLong: Number,
    autoStartBreaks: Boolean,
    autoStartFocus: Boolean,
    sound: Boolean,
    notifications: Boolean,
    strictMode: Boolean,
    dailyGoal: Number,
    updatedAt: { type: Date, default: Date.now },
});

const PomodoroPreference = mongoose.models.PomodoroPreference
    || mongoose.model<IPomodoroPreference>('PomodoroPreference', PomodoroPreferenceSchema);

export default PomodoroPreference;
