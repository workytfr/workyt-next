import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import User from '@/models/User';

/**
 * Service des amitiés.
 *
 * Règle centrale : une paire = une ligne. Toute vérification d'existence doit
 * donc tester les DEUX sens, sinon A→B et B→A coexistent et la liste d'amis
 * affiche des doublons.
 */

/** Plafond de demandes en attente sortantes — anti-arrosage du site */
const MAX_PENDING_SENT = 50;

const oid = (id: string) => new mongoose.Types.ObjectId(id);

export interface FriendSummary {
  friendshipId: string;
  userId: string;
  username: string;
  points: number;
  role: string;
  heroLevel: number;
  avatar: string | null;
  isOnline: boolean;
  since: Date;
}

/** Fenêtre de présence : au-delà, l'utilisateur est considéré hors ligne */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Relation existante entre deux utilisateurs, quel que soit le sens.
 */
export async function findFriendship(a: string, b: string) {
  await dbConnect();
  return Friendship.findOne({
    $or: [
      { requester: oid(a), recipient: oid(b) },
      { requester: oid(b), recipient: oid(a) }
    ]
  });
}

/**
 * Les deux utilisateurs sont-ils amis ? (utilisé plus tard par les défis)
 */
export async function areFriends(a: string, b: string): Promise<boolean> {
  const rel = await findFriendship(a, b);
  return rel?.status === 'accepted';
}

/**
 * Envoie une demande d'ami à un utilisateur identifié par son pseudo.
 */
export async function sendRequest(
  fromId: string,
  username: string
): Promise<{ success: boolean; message?: string; friendshipId?: string; toUserId?: string }> {
  await dbConnect();

  const target = await User.findOne({
    username: { $regex: `^${username.trim()}$`, $options: 'i' }
  })
    .select('_id username')
    .lean<{ _id: any; username: string }>();

  if (!target) {
    return { success: false, message: 'Utilisateur introuvable' };
  }

  const toId = target._id.toString();
  if (toId === fromId) {
    return { success: false, message: 'Tu ne peux pas t\'ajouter toi-même' };
  }

  const existing = await findFriendship(fromId, toId);
  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, message: `Tu es déjà ami avec ${target.username}` };
    }
    if (existing.status === 'blocked') {
      return { success: false, message: 'Demande impossible' };
    }
    if (existing.status === 'pending') {
      // La cible nous avait déjà demandé : on accepte au lieu de créer un doublon
      if (existing.requester.toString() === toId) {
        existing.status = 'accepted';
        existing.respondedAt = new Date();
        await existing.save();
        return {
          success: true,
          message: `Vous êtes maintenant amis avec ${target.username} !`,
          friendshipId: existing._id.toString(),
          toUserId: toId
        };
      }
      return { success: false, message: 'Demande déjà envoyée' };
    }
    // 'declined' : on autorise une nouvelle tentative en réinitialisant la ligne
    existing.requester = oid(fromId);
    existing.recipient = oid(toId);
    existing.status = 'pending';
    existing.respondedAt = undefined;
    existing.createdAt = new Date();
    await existing.save();
    return { success: true, friendshipId: existing._id.toString(), toUserId: toId };
  }

  const pendingSent = await Friendship.countDocuments({
    requester: oid(fromId),
    status: 'pending'
  });
  if (pendingSent >= MAX_PENDING_SENT) {
    return {
      success: false,
      message: 'Trop de demandes en attente. Attends des réponses avant d\'en envoyer d\'autres.'
    };
  }

  try {
    const created = await Friendship.create({
      requester: oid(fromId),
      recipient: oid(toId),
      status: 'pending'
    });
    return { success: true, friendshipId: created._id.toString(), toUserId: toId };
  } catch (err: any) {
    // Course : l'index unique a tranché
    if (err?.code === 11000) return { success: false, message: 'Demande déjà envoyée' };
    throw err;
  }
}

/**
 * Accepte ou refuse une demande. Seul le destinataire peut répondre.
 */
export async function respondToRequest(
  friendshipId: string,
  userId: string,
  accept: boolean
): Promise<{ success: boolean; message?: string; requesterId?: string }> {
  await dbConnect();

  const rel = await Friendship.findById(friendshipId);
  if (!rel) return { success: false, message: 'Demande introuvable' };

  if (rel.recipient.toString() !== userId) {
    return { success: false, message: 'Cette demande ne t\'est pas adressée' };
  }
  if (rel.status !== 'pending') {
    return { success: false, message: 'Cette demande a déjà été traitée' };
  }

  rel.status = accept ? 'accepted' : 'declined';
  rel.respondedAt = new Date();
  await rel.save();

  return { success: true, requesterId: rel.requester.toString() };
}

/**
 * Supprime une amitié ou annule une demande. Les deux parties peuvent le faire.
 */
export async function removeFriend(
  friendshipId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  await dbConnect();

  const deleted = await Friendship.findOneAndDelete({
    _id: friendshipId,
    $or: [{ requester: oid(userId) }, { recipient: oid(userId) }]
  });

  if (!deleted) return { success: false, message: 'Relation introuvable' };
  return { success: true };
}

/**
 * Étapes communes aux listes : joint User, HeroProfile et l'avatar en UNE
 * agrégation. Une boucle de findOne par ami serait un N+1 immédiat, d'autant
 * que l'avatar vit dans ProfileCustomization et non sur User.
 */
function friendLookupStages(otherIdField: string) {
  return [
    {
      $lookup: {
        from: 'users',
        localField: otherIdField,
        foreignField: '_id',
        as: 'u',
        pipeline: [{ $project: { username: 1, points: 1, role: 1, lastSeenAt: 1 } }]
      }
    },
    { $unwind: '$u' },
    {
      $lookup: {
        from: 'heroprofiles',
        localField: otherIdField,
        foreignField: 'user',
        as: 'hero',
        pipeline: [{ $project: { level: 1 } }]
      }
    },
    {
      $lookup: {
        from: 'profilecustomizations',
        localField: otherIdField,
        foreignField: 'user',
        as: 'custom',
        pipeline: [{ $project: { profileImage: 1, customPhoto: 1 } }]
      }
    }
  ];
}

/** Photo perso d'abord, puis image de profil de la boutique. */
function avatarOf(custom: any): string | null {
  if (custom?.customPhoto?.isActive && custom.customPhoto.url) return custom.customPhoto.url;
  const img = custom?.profileImage;
  return img?.isActive && img?.filename ? `/profile/${img.filename}` : null;
}

function shapeFriend(doc: any, now: number): FriendSummary {
  return {
    friendshipId: doc._id.toString(),
    userId: doc.u._id.toString(),
    username: doc.u.username,
    points: doc.u.points ?? 0,
    role: doc.u.role ?? 'Apprenti',
    heroLevel: doc.hero?.[0]?.level ?? 1,
    avatar: avatarOf(doc.custom?.[0]),
    isOnline: doc.u.lastSeenAt
      ? now - new Date(doc.u.lastSeenAt).getTime() < ONLINE_WINDOW_MS
      : false,
    since: doc.respondedAt ?? doc.createdAt
  };
}

/**
 * Liste des amis acceptés, paginée.
 */
export async function listFriends(
  userId: string,
  page = 1,
  limit = 30
): Promise<{ friends: FriendSummary[]; total: number }> {
  await dbConnect();

  const me = oid(userId);
  const match = {
    status: 'accepted',
    $or: [{ requester: me }, { recipient: me }]
  };

  const [rows, total] = await Promise.all([
    Friendship.aggregate([
      { $match: match },
      { $sort: { respondedAt: -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      // L'ami, c'est « l'autre » : on le calcule avant les $lookup
      {
        $addFields: {
          otherId: { $cond: [{ $eq: ['$requester', me] }, '$recipient', '$requester'] }
        }
      },
      ...friendLookupStages('otherId')
    ]),
    Friendship.countDocuments(match)
  ]);

  const now = Date.now();
  return { friends: rows.map((r: any) => shapeFriend(r, now)), total };
}

/**
 * Demandes reçues en attente.
 */
export async function listPendingReceived(userId: string): Promise<FriendSummary[]> {
  await dbConnect();

  const rows = await Friendship.aggregate([
    { $match: { recipient: oid(userId), status: 'pending' } },
    { $sort: { createdAt: -1 } },
    { $limit: 50 },
    { $addFields: { otherId: '$requester' } },
    ...friendLookupStages('otherId')
  ]);

  const now = Date.now();
  return rows.map((r: any) => shapeFriend(r, now));
}

/**
 * Demandes envoyées encore en attente (pour pouvoir les annuler).
 */
export async function listPendingSent(userId: string): Promise<FriendSummary[]> {
  await dbConnect();

  const rows = await Friendship.aggregate([
    { $match: { requester: oid(userId), status: 'pending' } },
    { $sort: { createdAt: -1 } },
    { $limit: 50 },
    { $addFields: { otherId: '$recipient' } },
    ...friendLookupStages('otherId')
  ]);

  const now = Date.now();
  return rows.map((r: any) => shapeFriend(r, now));
}

export type RelationStatus =
  | 'self'
  | 'none'
  | 'friends'
  | 'pending_sent'
  | 'pending_received'
  | 'blocked';

/**
 * Tout ce dont la page de profil a besoin, en UNE requête HTTP :
 * le nombre d'amis, un aperçu de la liste, et la relation du visiteur avec
 * la personne consultée (qui pilote l'état du bouton).
 */
export async function getProfileFriendInfo(
  viewerId: string | null,
  targetId: string
): Promise<{
  count: number;
  preview: FriendSummary[];
  relation: RelationStatus;
  friendshipId: string | null;
}> {
  await dbConnect();

  const target = oid(targetId);
  const countFilter = {
    status: 'accepted',
    $or: [{ requester: target }, { recipient: target }]
  };

  const [count, previewRows, relation] = await Promise.all([
    Friendship.countDocuments(countFilter),
    Friendship.aggregate([
      { $match: countFilter },
      { $sort: { respondedAt: -1, createdAt: -1 } },
      { $limit: 8 },
      {
        $addFields: {
          otherId: { $cond: [{ $eq: ['$requester', target] }, '$recipient', '$requester'] }
        }
      },
      ...friendLookupStages('otherId')
    ]),
    viewerId && viewerId !== targetId ? findFriendship(viewerId, targetId) : Promise.resolve(null)
  ]);

  let status: RelationStatus = 'none';
  let friendshipId: string | null = null;

  if (!viewerId) {
    status = 'none';
  } else if (viewerId === targetId) {
    status = 'self';
  } else if (relation) {
    friendshipId = (relation as any)._id.toString();
    const rel = relation as any;
    if (rel.status === 'accepted') status = 'friends';
    else if (rel.status === 'blocked') status = 'blocked';
    else if (rel.status === 'pending') {
      status = rel.requester.toString() === viewerId ? 'pending_sent' : 'pending_received';
    }
    // 'declined' → on retombe sur 'none' : une nouvelle demande est possible
  }

  const now = Date.now();
  return {
    count,
    preview: (previewRows as any[]).map((r) => shapeFriend(r, now)),
    relation: status,
    friendshipId
  };
}

/**
 * Recherche d'utilisateurs à ajouter.
 * Exclut soi-même et toute personne avec qui une relation existe déjà.
 */
export async function searchUsers(
  userId: string,
  query: string
): Promise<Array<{ userId: string; username: string; points: number; avatar: string | null }>> {
  await dbConnect();

  const q = query.trim();
  if (q.length < 2) return [];

  // Échappe les métacaractères : sinon un '(' saisi par l'utilisateur casse la regex
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const related = await Friendship.find({
    $or: [{ requester: oid(userId) }, { recipient: oid(userId) }]
  })
    .select('requester recipient')
    .lean();

  const excluded = new Set<string>([userId]);
  for (const r of related as any[]) {
    excluded.add(r.requester.toString());
    excluded.add(r.recipient.toString());
  }

  const users = await User.aggregate([
    { $match: { username: { $regex: safe, $options: 'i' } } },
    { $limit: 30 },
    { $project: { username: 1, points: 1 } },
    {
      $lookup: {
        from: 'profilecustomizations',
        localField: '_id',
        foreignField: 'user',
        as: 'custom',
        pipeline: [{ $project: { profileImage: 1, customPhoto: 1 } }]
      }
    }
  ]);

  return users
    .filter((u: any) => !excluded.has(u._id.toString()))
    .slice(0, 10)
    .map((u: any) => {
      return {
        userId: u._id.toString(),
        username: u.username,
        points: u.points ?? 0,
        avatar: avatarOf(u.custom?.[0])
      };
    });
}
