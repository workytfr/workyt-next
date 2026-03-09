import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IStreak extends Document {
  _id: ObjectId;
  user: ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  claimedMilestones: number[]; // paliers deja reclames (ex: [3, 7, 14])
  createdAt: Date;
  updatedAt: Date;
}

const StreakSchema = new Schema<IStreak>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  claimedMilestones: {
    type: [Number],
    default: []
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

StreakSchema.index({ user: 1 });

StreakSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Streak = mongoose.models.Streak || mongoose.model<IStreak>('Streak', StreakSchema);

export default Streak;
