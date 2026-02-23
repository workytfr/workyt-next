import mongoose, { Schema, Document, Model } from 'mongoose';

export type BookmarkContentType = 'fiche' | 'forum' | 'cours' | 'exercise';

export interface IBookmark extends Document {
    user: mongoose.Types.ObjectId;
    /** @deprecated Utiliser contentType + refId. Conservé pour compatibilité. */
    revision?: mongoose.Types.ObjectId;
    contentType: BookmarkContentType;
    refId: mongoose.Types.ObjectId;
    collectionName: string;
    createdAt: Date;
}

const BookmarkSchema: Schema<IBookmark> = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    revision: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Revision',
        required: false,
    },
    contentType: {
        type: String,
        enum: ['fiche', 'forum', 'cours', 'exercise'],
        default: 'fiche',
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    collectionName: {
        type: String,
        default: 'Mes favoris',
        trim: true,
        maxlength: 50,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index unique pour éviter les doublons (revision - ancien)
BookmarkSchema.index({ user: 1, revision: 1 }, { unique: true, sparse: true });
// Index unique polymorphique (contentType + refId)
BookmarkSchema.index({ user: 1, contentType: 1, refId: 1 }, { unique: true, sparse: true });
// Index pour la récupération rapide par utilisateur
BookmarkSchema.index({ user: 1, collectionName: 1, createdAt: -1 });
BookmarkSchema.index({ user: 1, contentType: 1, createdAt: -1 });

const Bookmark: Model<IBookmark> =
    mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);

export default Bookmark;
