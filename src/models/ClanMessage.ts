import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Un message du tchat de clan.
 *
 * ⚠️ Rien n'est archivé. Un message ne vit que la journée de guerre pendant
 * laquelle il a été écrit : la lecture filtre toujours sur `season` + `day`,
 * et l'index TTL sur `expiresAt` fait disparaître le document de la base peu
 * après. Deux garde-fous plutôt qu'un, parce que le balayage TTL de MongoDB
 * passe au mieux toutes les 60 secondes : le filtre par journée garantit
 * qu'aucun message d'hier ne réapparaît le matin, même si la purge traîne.
 *
 * Conséquence assumée : il n'y a pas d'historique à modérer a posteriori. Le
 * garde-fou est en amont — quota de messages par jour (voir clanChat.ts).
 */

export interface IClanMessage extends Document {
  clan: Types.ObjectId;
  season: string;
  /** Journée de guerre 1..7 — la clé de péremption fonctionnelle */
  day: number;

  user: Types.ObjectId;
  /** Pseudo figé à l'écriture : évite un populate à chaque relève du tchat */
  username: string;
  text: string;

  createdAt: Date;
  /** Date de suppression automatique par MongoDB */
  expiresAt: Date;
}

/** Longueur maximale d'un message. */
export const MESSAGE_MAX = 300;

const ClanMessageSchema = new Schema<IClanMessage>({
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
  season: { type: String, required: true },
  day: { type: Number, required: true, min: 1, max: 7 },

  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  text: { type: String, required: true, maxlength: MESSAGE_MAX },

  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// La relève du tchat : les messages du jour, du plus ancien au plus récent
ClanMessageSchema.index({ clan: 1, season: 1, day: 1, createdAt: 1 });
// Le quota du jour d'un joueur
ClanMessageSchema.index({ user: 1, season: 1, day: 1 });
// Suppression automatique — expireAfterSeconds: 0 => à l'heure d'expiresAt
ClanMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ClanMessage =
  mongoose.models.ClanMessage ||
  mongoose.model<IClanMessage>('ClanMessage', ClanMessageSchema);

export default ClanMessage;
