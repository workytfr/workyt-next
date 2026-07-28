import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Lien d'amitié entre deux utilisateurs.
 *
 * UNE SEULE ligne par paire (pas une par sens). Conséquence à connaître :
 * pour lister les amis de X il faut un $or sur `requester` ET `recipient`,
 * d'où les deux index composés ci-dessous.
 *
 * L'index unique { requester, recipient } n'empêche PAS la paire inversée
 * (A→B et B→A) : c'est friendService.sendRequest qui vérifie les deux sens
 * avant de créer.
 */
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface IFriendship extends Document {
  requester: Types.ObjectId; // celui qui a envoyé la demande
  recipient: Types.ObjectId; // celui qui la reçoit — seul lui peut répondre
  status: FriendshipStatus;
  respondedAt?: Date;
  createdAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
    required: true
  },
  respondedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Une seule relation par couple orienté
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// « Mes demandes reçues en attente »
FriendshipSchema.index({ recipient: 1, status: 1 });
// « Mes demandes envoyées » + moitié du $or de la liste d'amis
FriendshipSchema.index({ requester: 1, status: 1 });

const Friendship =
  mongoose.models.Friendship || mongoose.model<IFriendship>('Friendship', FriendshipSchema);

export default Friendship;
