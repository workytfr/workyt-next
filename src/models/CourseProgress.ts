import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';

export interface ICourseProgress extends Document {
    userId: ObjectId;
    courseId: ObjectId;
    lessonsRead: ObjectId[];
    sectionsCompleted: ObjectId[];
    lastLessonId?: ObjectId;
    lastSectionId?: ObjectId;
    lastAccessedAt: Date;
    createdAt: Date;
}

const CourseProgressSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessonsRead: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    sectionsCompleted: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    lastLessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
    lastSectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    lastAccessedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CourseProgress: Model<ICourseProgress> =
    mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);

export default CourseProgress;
