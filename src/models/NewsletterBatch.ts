import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface INewsletterBatch extends Document {
    weekStart: Date;
    weekEnd: Date;
    status: 'pending' | 'sending' | 'completed';
    globalContent: {
        newCourses: Array<{ title: string; slug: string; matiere: string; niveau: string }>;
        newFiches: Array<{ title: string; slug: string; subject: string; level: string }>;
        blogPosts: Array<{ title: string; link: string; pubDate: string; thumbnail: string }>;
    };
    totalRecipients: number;
    sentCount: number;
    skippedCount: number;
    sentUserIds: ObjectId[];
    errorCount: number;
    sendErrors: Array<{ userId: ObjectId; error: string; timestamp: Date }>;
    createdAt: Date;
    completedAt?: Date;
}

const NewsletterBatchSchema = new Schema<INewsletterBatch>({
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'sending', 'completed'],
        default: 'pending',
    },
    globalContent: {
        newCourses: [{
            title: String,
            slug: String,
            matiere: String,
            niveau: String,
            _id: false,
        }],
        newFiches: [{
            title: String,
            slug: String,
            subject: String,
            level: String,
            _id: false,
        }],
        blogPosts: [{
            title: String,
            link: String,
            pubDate: String,
            thumbnail: String,
            _id: false,
        }],
    },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    sentUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    errorCount: { type: Number, default: 0 },
    sendErrors: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        error: String,
        timestamp: { type: Date, default: Date.now },
        _id: false,
    }],
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
});

NewsletterBatchSchema.index({ weekStart: 1 }, { unique: true });
NewsletterBatchSchema.index({ status: 1 });

const NewsletterBatch = mongoose.models.NewsletterBatch
    || mongoose.model<INewsletterBatch>('NewsletterBatch', NewsletterBatchSchema);

export default NewsletterBatch;
