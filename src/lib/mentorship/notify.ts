import mongoose from 'mongoose';
import Notification, { INotification } from '@/models/Notification';
import User from '@/models/User';
import MentorProfile from '@/models/MentorProfile';
import Mentorship from '@/models/Mentorship';
import { NotificationService } from '@/lib/notificationService';
import { getRolesMap } from '@/lib/roles';

type MentorshipNotificationType = Extract<INotification['type'], `mentorship_${string}`>;

/**
 * Notifications du suivi. Toutes pointent vers le suivi (`relatedEntity`
 * mentorship → /suivi/[id]) ; un échec de notification ne doit jamais faire
 * échouer l'action qui l'a déclenchée.
 */
export async function notify(
  type: MentorshipNotificationType,
  recipientId: string,
  senderId: string,
  mentorshipId: string,
  title: string,
  message: string,
  opts: { dedupeUnread?: boolean } = {}
): Promise<void> {
  try {
    // Un seul « nouveau message » non lu par suivi : dix messages d'affilée
    // ne doivent pas produire dix notifications.
    if (opts.dedupeUnread) {
      const already = await Notification.exists({
        recipient: recipientId,
        type,
        isRead: false,
        'relatedEntity.id': new mongoose.Types.ObjectId(mentorshipId)
      });
      if (already) return;
    }
    await NotificationService.createNotification({
      type,
      recipientId,
      senderId,
      relatedEntityType: 'mentorship',
      relatedEntityId: mentorshipId,
      title,
      message
    });
  } catch (error) {
    console.error('Erreur notification suivi:', error);
  }
}

/** Ids des personnes qui pilotent le dispositif (permission mentorship.manage) */
export async function moderatorIds(limit = 20): Promise<string[]> {
  const roles = await getRolesMap();
  const roleNames = ['Admin'];
  for (const [name, role] of roles) {
    if (role.permissions?.includes('mentorship.manage')) roleNames.push(name);
  }
  const users = await User.find({ role: { $in: roleNames } })
    .select('_id')
    .limit(limit)
    .lean<{ _id: mongoose.Types.ObjectId }[]>();
  return users.map((u) => u._id.toString());
}

export async function notifyModerators(
  senderId: string,
  mentorshipId: string,
  title: string,
  message: string
): Promise<void> {
  const ids = await moderatorIds();
  await Promise.all(ids.map((id) => notify('mentorship_alert', id, senderId, mentorshipId, title, message)));
}

/** Nombre de suivis en charge (actifs ou en pause) par bénévole */
export async function activeLoadByMentor(mentorIds: mongoose.Types.ObjectId[]): Promise<Map<string, number>> {
  const rows = await Mentorship.aggregate([
    { $match: { mentor: { $in: mentorIds }, status: { $in: ['active', 'paused'] } } },
    { $group: { _id: '$mentor', n: { $sum: 1 } } }
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.n as number]));
}

/**
 * Prévient les bénévoles disponibles qu'une demande de leur matière attend.
 * Seulement ceux qui ont de la place : prévenir un bénévole complet, c'est le
 * faire culpabiliser pour rien.
 */
export async function notifyAvailableMentors(
  mentorship: { _id: unknown; student: unknown; subject: string; level: string },
  excludeUserId?: string
): Promise<void> {
  try {
    const profiles = await MentorProfile.find({
      status: 'available',
      charterAcceptedAt: { $exists: true },
      adultDeclared: true,
      $and: [
        { $or: [{ subjects: { $size: 0 } }, { subjects: mentorship.subject }] },
        { $or: [{ levels: { $size: 0 } }, { levels: mentorship.level }] }
      ]
    })
      .select('user maxActive')
      .limit(60)
      .lean<{ user: mongoose.Types.ObjectId; maxActive: number }[]>();

    const load = await activeLoadByMentor(profiles.map((p) => p.user));
    const targets = profiles
      .filter((p) => (load.get(p.user.toString()) || 0) < p.maxActive)
      .map((p) => p.user.toString())
      .filter((id) => id !== excludeUserId && id !== String(mentorship.student))
      .slice(0, 15);

    await Promise.all(
      targets.map((id) =>
        notify(
          'mentorship_request',
          id,
          String(mentorship.student),
          String(mentorship._id),
          'Un élève cherche un bénévole',
          `Nouvelle demande de suivi en ${mentorship.subject} (${mentorship.level}).`
        )
      )
    );
  } catch (error) {
    console.error('Erreur notification bénévoles disponibles:', error);
  }
}
