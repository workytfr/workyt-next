import mongoose, { Schema, Document, Types } from 'mongoose';
import { GATE_VALUES, ROLE_VALUES } from '@/lib/clanChatTemplates';

/**
 * Un message du tchat de clan.
 *
 * ⚠️ AUCUN texte rédigé par un joueur n'est stocké ici. Un message est une
 * référence à une phrase du catalogue (`template`) plus des emplacements dont
 * toutes les valeurs sont fermées : un membre du même clan, une porte, une
 * unité du catalogue, un rôle. Le texte final est reconstruit à l'affichage
 * par renderChatMessage. C'est ce qui rend le tchat sûr sans modération.
 *
 * Ne JAMAIS ajouter un champ de texte libre à ce schéma. Le tchat étant effacé
 * chaque nuit, il n'existe aucun historique à relire ou à sanctionner : une
 * saisie libre serait un angle mort permanent, sur un public majoritairement
 * mineur.
 *
 * Rien n'est archivé non plus : un message ne vit que la journée de guerre
 * pendant laquelle il a été posté. La lecture filtre toujours sur `season` +
 * `day`, et l'index TTL sur `expiresAt` fait disparaître le document. Deux
 * garde-fous plutôt qu'un, parce que le balayage TTL de MongoDB passe au mieux
 * toutes les 60 secondes : le filtre par journée garantit qu'aucun message
 * d'hier ne réapparaît le matin, même si la purge traîne.
 */

export interface IClanMessage extends Document {
  clan: Types.ObjectId;
  season: string;
  /** Journée de guerre 1..7 — la clé de péremption fonctionnelle */
  day: number;

  user: Types.ObjectId;
  /** Pseudo figé à l'écriture : évite un populate à chaque relève du tchat */
  username: string;

  /** Clé d'une phrase de CHAT_TEMPLATES */
  template: string;
  /** Membre visé par la phrase, s'il y en a un */
  targetUser?: Types.ObjectId;
  targetUsername?: string;
  gate?: string;
  /** Clé d'une unité du catalogue */
  soldier?: string;
  soldierName?: string;
  role?: string;

  createdAt: Date;
  /** Date de suppression automatique par MongoDB */
  expiresAt: Date;
}

const ClanMessageSchema = new Schema<IClanMessage>({
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', required: true },
  season: { type: String, required: true },
  day: { type: Number, required: true, min: 1, max: 7 },

  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },

  template: { type: String, required: true },
  targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
  targetUsername: { type: String },
  // `enum` en dernier rempart : même si un appelant contournait la validation
  // de clanChat, la base refuserait une porte ou un rôle inventés.
  gate: { type: String, enum: GATE_VALUES },
  soldier: { type: String },
  soldierName: { type: String },
  role: { type: String, enum: ROLE_VALUES },

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
