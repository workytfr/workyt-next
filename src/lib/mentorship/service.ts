import crypto from 'crypto';
import mongoose from 'mongoose';
import Mentorship, {
  IMentorship,
  AssignmentKind,
  CheckinMood,
  CloseOutcome,
  MentorshipFormat,
  MentorshipGoalType
} from '@/models/Mentorship';
import MentorshipMessage, { MessageKind } from '@/models/MentorshipMessage';
import MentorProfile from '@/models/MentorProfile';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { educationData } from '@/data/educationData';
import { awardPointsCapped, addPointsWithBoost } from '@/lib/pointsService';
import { QuestService } from '@/lib/questService';
import { BadgeService } from '@/lib/badgeService';
import { emitMentorshipChanged } from '@/lib/realtime/emit';
import { checkForContactDetails } from './contactFilter';
import { readAttachment, uploadAttachment } from './storage';
import { resolveResource, checkCompletion } from './resources';
import { notify, notifyModerators, notifyAvailableMentors, activeLoadByMentor } from './notify';
import type { SuiviUser, SuiviViewerRole } from './access';
import {
  AUTO_DETECTED_KINDS,
  DUO_STREAK_MILESTONES,
  CHECKIN_INTERVAL_DAYS,
  MAX_GOALS,
  MAX_MESSAGE_LENGTH,
  MAX_OPEN_ASSIGNMENTS,
  MAX_OPEN_PER_STUDENT,
  MAX_PENDING_QUEUE,
  POINTS
} from './config';

/**
 * Toutes les actions du suivi personnalisé.
 *
 * Chaque fonction renvoie un `Result` plutôt que de lever : les routes le
 * traduisent tel quel en réponse HTTP. Les effets secondaires (notifications,
 * points, badges, temps réel) ne font jamais échouer l'action principale.
 */

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; status: number; error: string };

const fail = (status: number, error: string): Result<never> => ({ ok: false, status, error });

const DAY = 24 * 60 * 60 * 1000;

function isParticipant(viewer: SuiviViewerRole) {
  return viewer === 'student' || viewer === 'mentor';
}
function isStaff(viewer: SuiviViewerRole) {
  return viewer === 'mentor' || viewer === 'moderator';
}
function isOpen(m: IMentorship) {
  return m.status === 'active' || m.status === 'paused';
}
const id = (v: unknown) => String(v);

/** Diffuse « du nouveau » dans la salle du suivi — jamais de contenu. */
function ping(m: IMentorship) {
  emitMentorshipChanged(m.roomKey);
}

/** Message système (ou d'événement) dans le fil d'un suivi */
async function systemMessage(
  m: IMentorship,
  text: string,
  opts: { kind?: MessageKind; author?: string; authorRole?: 'student' | 'mentor' | 'moderator' | 'system'; meta?: Record<string, unknown> } = {}
) {
  await MentorshipMessage.create({
    mentorship: m._id,
    author: opts.author ? new mongoose.Types.ObjectId(opts.author) : undefined,
    authorRole: opts.authorRole || 'system',
    kind: opts.kind || 'event',
    text,
    meta: opts.meta
  });
}

async function usernameOf(userId: unknown): Promise<string> {
  const u = await User.findById(userId).select('username').lean<{ username: string }>();
  return u?.username || 'Quelqu’un';
}

/** Les points ne doivent jamais faire échouer une action : on journalise et on continue */
async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    console.error(`Erreur suivi (${label}):`, error);
  }
}

// ─────────────────────────────────────────────────────────────
// Demande
// ─────────────────────────────────────────────────────────────

export interface RequestInput {
  format: MentorshipFormat;
  subject: string;
  level: string;
  need: string;
  goalType: MentorshipGoalType;
  availability?: string;
}

export async function createRequest(user: SuiviUser, input: RequestInput): Promise<Result<{ id: string }>> {
  const format = input.format === 'ponctuel' ? 'ponctuel' : 'suivi';
  const need = String(input.need || '').trim();
  const availability = String(input.availability || '').trim().slice(0, 200);

  if (!educationData.subjects.includes(input.subject)) return fail(400, 'Choisis une matière dans la liste.');
  if (!educationData.levels.includes(input.level)) return fail(400, 'Choisis ton niveau dans la liste.');
  if (!['comprendre', 'moyenne', 'examen', 'decrochage', 'methode'].includes(input.goalType)) {
    return fail(400, 'Choisis ton objectif.');
  }
  if (need.length < 20) return fail(400, 'Explique en quelques phrases ce qui te bloque (20 caractères minimum).');
  if (need.length > 1000) return fail(400, 'Ta description est trop longue (1 000 caractères maximum).');

  // Pas de coordonnées dans la demande non plus : elle est lue par des bénévoles
  const contact = checkForContactDetails(`${need}\n${availability}`);
  if (contact.blocked) {
    return fail(422, `Ta demande contient des coordonnées personnelles (${contact.reasons.join(', ')}). Les échanges se font uniquement sur Workyt : retire-les pour continuer.`);
  }

  const open = await Mentorship.countDocuments({ student: user.id, status: { $in: ['pending', 'active', 'paused'] } });
  if (open >= MAX_OPEN_PER_STUDENT) {
    return fail(409, `Tu as déjà ${open} demandes ou suivis en cours. Termine-en un avant d’en ouvrir un autre.`);
  }

  const queue = await Mentorship.countDocuments({ status: 'pending' });
  if (queue >= MAX_PENDING_QUEUE) {
    return fail(503, 'Tous nos bénévoles sont occupés en ce moment et la file d’attente est pleine. Réessaie dans quelques jours — en attendant, le forum reste ouvert à tes questions.');
  }

  const m = await Mentorship.create({
    student: user.id,
    status: 'pending',
    format,
    subject: input.subject,
    level: input.level,
    need,
    goalType: input.goalType,
    availability,
    roomKey: crypto.randomBytes(16).toString('hex'),
    lastStudentActivityAt: new Date()
  });

  // Aucun point pour une demande : on ne gamifie jamais le fait de demander de l'aide.
  void notifyAvailableMentors(m);
  return { ok: true, data: { id: m._id.toString() } };
}

export async function cancelRequest(m: IMentorship, viewer: SuiviViewerRole): Promise<Result> {
  if (viewer !== 'student' && viewer !== 'moderator') return fail(403, 'Action non autorisée.');
  if (m.status !== 'pending') return fail(409, 'Seule une demande en attente peut être annulée.');
  m.status = 'cancelled';
  m.closedAt = new Date();
  await m.save();
  await systemMessage(m, 'Demande annulée.');
  ping(m);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Prise en charge
// ─────────────────────────────────────────────────────────────

/** Le bénévole peut-il prendre un suivi de plus ? */
async function checkMentorCapacity(mentorId: string): Promise<Result> {
  const profile = await MentorProfile.findOne({ user: mentorId }).lean<{
    status: string;
    maxActive: number;
    charterAcceptedAt?: Date;
    adultDeclared: boolean;
  }>();
  if (!profile?.charterAcceptedAt || !profile.adultDeclared) {
    return fail(403, 'La charte du bénévole doit être acceptée avant de prendre un suivi.');
  }
  if (profile.status === 'paused') return fail(409, 'Ce bénévole est en pause.');
  const load = (await activeLoadByMentor([new mongoose.Types.ObjectId(mentorId)])).get(mentorId) || 0;
  if (load >= profile.maxActive) {
    return fail(409, `Quota atteint (${load}/${profile.maxActive} suivis). Termine ou passe la main sur un suivi avant d’en prendre un autre.`);
  }
  return { ok: true };
}

/**
 * Un bénévole prend une demande en file, ou la modération l'attribue.
 * La mise à jour est conditionnée à `status: 'pending'` : deux bénévoles qui
 * cliquent en même temps ne peuvent pas prendre la même demande.
 */
export async function takeRequest(
  m: IMentorship,
  actor: SuiviUser,
  viewer: SuiviViewerRole,
  targetMentorId?: string
): Promise<Result> {
  const byModerator = viewer === 'moderator' && !!targetMentorId;
  const mentorId = byModerator ? targetMentorId! : actor.id;

  if (!byModerator && viewer !== 'candidate') return fail(403, 'Action non autorisée.');
  if (!mongoose.isValidObjectId(mentorId)) return fail(400, 'Bénévole invalide.');
  if (id(m.student) === mentorId) return fail(409, 'On ne peut pas s’accompagner soi-même.');

  // La modération peut réattribuer un suivi en cours ; sinon, seulement une demande en file
  const reassign = byModerator && isOpen(m);
  if (!reassign && m.status !== 'pending') return fail(409, 'Cette demande a déjà été prise.');
  if (reassign && m.mentor && id(m.mentor) === mentorId) return fail(409, 'Ce bénévole suit déjà cet élève.');

  if (byModerator) {
    const target = await User.findById(mentorId).select('role').lean<{ role: string }>();
    const { hasPermission } = await import('@/lib/roles');
    if (!target || !(await hasPermission(target.role, 'mentorship.take'))) {
      return fail(400, 'Cette personne n’a pas le rôle de bénévole accompagnant.');
    }
  }

  const capacity = await checkMentorCapacity(mentorId);
  if (!capacity.ok) return capacity;

  const now = new Date();
  const previousMentor = m.mentor ? id(m.mentor) : null;

  const history = [...m.mentorHistory];
  if (reassign && previousMentor) {
    const last = history[history.length - 1];
    if (last && !last.to) Object.assign(last, { to: now, reason: 'reassigned' });
  }
  history.push({ mentor: new mongoose.Types.ObjectId(mentorId), from: now });

  const updated = await Mentorship.findOneAndUpdate(
    { _id: m._id, status: m.status, mentor: m.mentor ?? null },
    {
      $set: {
        mentor: new mongoose.Types.ObjectId(mentorId),
        status: 'active',
        matchedAt: m.matchedAt || now,
        mentorHistory: history,
        lastMentorActivityAt: now,
        nextCheckinAt: new Date(now.getTime() + CHECKIN_INTERVAL_DAYS * DAY),
        pausedAt: null
      },
      $unset: { mentorReminderAt: 1, escalatedAt: 1, checkin: 1 }
    },
    { new: true }
  );
  if (!updated) return fail(409, 'Cette demande vient d’être prise par quelqu’un d’autre.');

  const mentorName = await usernameOf(mentorId);
  const resumed = updated.mentorHistory.length > 1;
  await systemMessage(
    updated,
    resumed
      ? `${mentorName} reprend le suivi. Tout l’historique est conservé.`
      : `${mentorName} a pris en charge la demande. Bienvenue dans ton suivi !`,
    { meta: { event: 'matched' } }
  );

  await notify(
    'mentorship_matched',
    id(updated.student),
    mentorId,
    id(updated._id),
    resumed ? 'Un nouveau bénévole reprend ton suivi' : 'Un bénévole a pris ta demande',
    `${mentorName} va t’accompagner en ${updated.subject}.`
  );
  if (byModerator) {
    await notify('mentorship_matched', mentorId, actor.id, id(updated._id), 'Un suivi t’a été confié', `Suivi en ${updated.subject} (${updated.level}).`);
  }
  if (reassign && previousMentor) {
    await notify('mentorship_update', previousMentor, actor.id, id(updated._id), 'Suivi réattribué', `Le suivi en ${updated.subject} a été confié à un autre bénévole par la modération.`);
  }

  void safely('badges prise en charge', () => BadgeService.checkAndAwardBadges(id(updated.student)));
  void safely('badges bénévole', () => BadgeService.checkAndAwardBadges(mentorId));
  ping(updated);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────

export interface MessageInput {
  text?: string;
  file?: File | null;
  kind?: 'text' | 'checkin_reply';
  mood?: CheckinMood;
}

export async function postMessage(
  m: IMentorship,
  viewer: SuiviViewerRole,
  user: SuiviUser,
  input: MessageInput
): Promise<Result<{ messageId: string }>> {
  if (viewer === 'candidate') return fail(403, 'Prends d’abord la demande pour écrire à l’élève.');
  if (m.status === 'closed' || m.status === 'cancelled') return fail(409, 'Ce suivi est terminé : la conversation est en lecture seule.');
  // En file, seul l'élève peut compléter sa demande (le bénévole qui la prendra lira tout)
  if (m.status === 'pending' && viewer === 'mentor') return fail(409, 'Cette demande n’est pas encore prise.');

  const text = String(input.text || '').trim();
  if (text.length > MAX_MESSAGE_LENGTH) return fail(400, `Message trop long (${MAX_MESSAGE_LENGTH} caractères maximum).`);
  if (!text && !input.file) return fail(400, 'Message vide.');

  const role = viewer === 'moderator' ? 'moderator' : viewer;
  const kind = input.kind === 'checkin_reply' ? 'checkin_reply' : 'text';

  // ── Garde-fou : pas de coordonnées personnelles ──
  const contact = checkForContactDetails(text);
  if (contact.blocked && viewer !== 'moderator') {
    await MentorshipMessage.create({
      mentorship: m._id,
      author: user.id,
      authorRole: role,
      kind,
      text,
      status: 'blocked',
      blockedReasons: contact.reasons
    });
    // Une alerte au plus toutes les 6 h par suivi : assez pour réagir, sans noyer la modération
    const now = new Date();
    if (!m.lastBlockedAlertAt || now.getTime() - m.lastBlockedAlertAt.getTime() > 6 * 60 * 60 * 1000) {
      m.lastBlockedAlertAt = now;
      await m.save();
      void notifyModerators(
        user.id,
        id(m._id),
        'Message bloqué dans un suivi',
        `${user.username} a tenté d’envoyer des coordonnées (${contact.reasons.join(', ')}) dans un suivi en ${m.subject}.`
      );
    }
    return fail(
      422,
      `Ton message n’a pas été envoyé : il contient des coordonnées (${contact.reasons.join(', ')}). Pour la sécurité de tous, les échanges se font uniquement ici, sur Workyt. Reformule sans ces informations.`
    );
  }

  // ── Pièce jointe ──
  let attachment: { key: string; name: string; mime: string; size: number } | undefined;
  if (input.file) {
    const check = await readAttachment(input.file);
    if (!check.ok) return fail(400, check.error);
    try {
      const key = await uploadAttachment(id(m._id), check.buffer, check.mime);
      attachment = { key, name: check.name, mime: check.mime, size: check.size };
    } catch (error) {
      console.error('Erreur upload pièce jointe suivi:', error);
      return fail(502, 'L’image n’a pas pu être envoyée. Réessaie.');
    }
  }

  // ── Réponse à un point d'étape ──
  let rewardCheckin = false;
  if (kind === 'checkin_reply') {
    if (viewer !== 'student') return fail(403, 'Seul l’élève répond au point d’étape.');
    if (!m.checkin?.askedAt || m.checkin.answeredAt) return fail(409, 'Aucun point d’étape en attente.');
    if (!input.mood || !['bien', 'moyen', 'bloque'].includes(input.mood)) return fail(400, 'Choisis comment ça se passe.');
    m.checkin.answeredAt = new Date();
    m.checkin.mood = input.mood;
    if (!m.checkin.rewarded) {
      m.checkin.rewarded = true;
      rewardCheckin = true;
    }
  }

  const msg = await MentorshipMessage.create({
    mentorship: m._id,
    author: user.id,
    authorRole: role,
    kind,
    text,
    attachment,
    meta: kind === 'checkin_reply' ? { mood: input.mood } : undefined
  });

  const now = new Date();
  m.lastMessageAt = now;
  if (viewer === 'student') {
    m.lastStudentActivityAt = now;
    m.lastReadAt.student = now;
    m.studentReminderAt = undefined;
  } else if (viewer === 'mentor') {
    m.lastMentorActivityAt = now;
    m.lastReadAt.mentor = now;
    m.mentorReminderAt = undefined;
  }
  await m.save();
  ping(m);

  if (rewardCheckin) {
    void safely('points point d’étape', () =>
      addPointsWithBoost(id(m.student), POINTS.checkin, 'mentorshipCheckin', { mentorship: id(m._id) })
    );
  }

  // Notifier l'autre partie (ou les deux, si c'est la modération qui écrit)
  const recipients: string[] = [];
  if (viewer !== 'student') recipients.push(id(m.student));
  if (viewer !== 'mentor' && m.mentor) recipients.push(id(m.mentor));
  const preview = text ? (text.length > 80 ? `${text.slice(0, 80)}…` : text) : 'Image envoyée';
  await Promise.all(
    recipients.map((r) =>
      notify(
        'mentorship_message',
        r,
        user.id,
        id(m._id),
        viewer === 'moderator' ? 'Message de la modération' : `Nouveau message de ${user.username}`,
        kind === 'checkin_reply' ? `Point d’étape : ${input.mood}` : preview,
        { dedupeUnread: viewer !== 'moderator' }
      )
    )
  );

  return { ok: true, data: { messageId: msg._id.toString() } };
}

/** L'élève ou le bénévole a lu le fil : accusé de lecture + notifications soldées */
export async function markRead(m: IMentorship, viewer: SuiviViewerRole, userId: string): Promise<void> {
  if (!isParticipant(viewer)) return;
  const now = new Date();
  await Mentorship.updateOne({ _id: m._id }, { $set: { [`lastReadAt.${viewer}`]: now } });
  await Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
      type: { $in: ['mentorship_message', 'mentorship_resource', 'mentorship_checkin'] },
      'relatedEntity.id': m._id
    },
    { $set: { isRead: true, readAt: now } }
  );
}

// ─────────────────────────────────────────────────────────────
// Plan d'objectifs
// ─────────────────────────────────────────────────────────────

async function rewardGoal(m: IMentorship) {
  const studentId = id(m.student);
  await safely('points objectif', () =>
    awardPointsCapped(studentId, POINTS.goalReached, 'reachMentorshipGoal', POINTS.goalDailyCap, { mentorship: id(m._id) })
  );
  await safely('quête objectif', () => QuestService.updateQuestProgress(studentId, 'mentorship_goal_reached'));
  await safely('badges objectif', () => BadgeService.checkAndAwardBadges(studentId));
}

export async function addGoal(m: IMentorship, viewer: SuiviViewerRole, user: SuiviUser, title: string): Promise<Result> {
  if (!isStaff(viewer)) return fail(403, 'Seul le bénévole pose les objectifs.');
  if (!isOpen(m)) return fail(409, 'Le suivi n’est pas en cours.');
  const clean = String(title || '').trim();
  if (clean.length < 3 || clean.length > 140) return fail(400, 'Un objectif fait entre 3 et 140 caractères.');
  if (m.goals.length >= MAX_GOALS) return fail(409, `${MAX_GOALS} objectifs maximum : mieux vaut peu d’objectifs, bien choisis.`);

  m.goals.push({ title: clean, done: false, rewarded: false, createdAt: new Date() } as never);
  if (viewer === 'mentor') m.lastMentorActivityAt = new Date();
  await m.save();
  const goal = m.goals[m.goals.length - 1];
  await systemMessage(m, `Nouvel objectif : ${clean}`, {
    kind: 'goal', author: user.id, authorRole: viewer === 'mentor' ? 'mentor' : 'moderator', meta: { goalId: goal._id }
  });
  ping(m);
  return { ok: true };
}

export async function updateGoal(
  m: IMentorship,
  viewer: SuiviViewerRole,
  user: SuiviUser,
  goalId: string,
  change: { done?: boolean; title?: string; remove?: boolean }
): Promise<Result> {
  if (!isStaff(viewer)) return fail(403, 'Seul le bénévole valide les objectifs.');
  if (!isOpen(m)) return fail(409, 'Le suivi n’est pas en cours.');
  const goal = m.goals.id(goalId);
  if (!goal) return fail(404, 'Objectif introuvable.');

  if (change.remove) {
    goal.deleteOne();
    await m.save();
    ping(m);
    return { ok: true };
  }

  if (typeof change.title === 'string') {
    const clean = change.title.trim();
    if (clean.length < 3 || clean.length > 140) return fail(400, 'Un objectif fait entre 3 et 140 caractères.');
    goal.title = clean;
  }

  let reward = false;
  if (typeof change.done === 'boolean' && change.done !== goal.done) {
    goal.done = change.done;
    goal.doneAt = change.done ? new Date() : undefined;
    // Décocher ne retire rien (aucune pénalité) ; recocher ne rapporte plus rien
    if (change.done && !goal.rewarded) {
      goal.rewarded = true;
      reward = true;
    }
  }
  if (viewer === 'mentor') m.lastMentorActivityAt = new Date();
  await m.save();

  if (change.done === true) {
    await systemMessage(m, `Objectif atteint : ${goal.title}`, {
      kind: 'goal', author: user.id, authorRole: viewer === 'mentor' ? 'mentor' : 'moderator', meta: { goalId: goal._id, event: 'goal_done' }
    });
    await notify('mentorship_update', id(m.student), user.id, id(m._id), 'Objectif atteint !', goal.title);
  }
  if (reward) await rewardGoal(m);
  ping(m);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Ressources assignées
// ─────────────────────────────────────────────────────────────

async function rewardAssignment(m: IMentorship) {
  const studentId = id(m.student);
  await safely('points ressource', () =>
    awardPointsCapped(studentId, POINTS.assignmentDone, 'completeAssignedResource', POINTS.assignmentDailyCap, { mentorship: id(m._id) })
  );
  await safely('quête ressource', () => QuestService.updateQuestProgress(studentId, 'mentorship_resource_done'));
}

export async function addAssignment(
  m: IMentorship,
  viewer: SuiviViewerRole,
  user: SuiviUser,
  input: { kind: AssignmentKind; refId: string; note?: string; dueAt?: string }
): Promise<Result> {
  if (!isStaff(viewer)) return fail(403, 'Seul le bénévole assigne des ressources.');
  if (!isOpen(m)) return fail(409, 'Le suivi n’est pas en cours.');
  if (!['course', 'lesson', 'exercise', 'quiz', 'fiche', 'evaluation'].includes(input.kind)) return fail(400, 'Type de ressource invalide.');

  const open = m.assignments.filter((a) => !a.doneAt).length;
  if (open >= MAX_OPEN_ASSIGNMENTS) return fail(409, 'Trop de ressources en cours : attends que l’élève en termine quelques-unes.');
  if (m.assignments.some((a) => !a.doneAt && a.kind === input.kind && id(a.refId) === input.refId)) {
    return fail(409, 'Cette ressource est déjà assignée.');
  }

  const resolved = await resolveResource(input.kind, input.refId);
  if (!resolved) return fail(404, 'Ressource introuvable ou non publiée.');

  const note = String(input.note || '').trim().slice(0, 300);
  if (note) {
    const contact = checkForContactDetails(note);
    if (contact.blocked) return fail(422, `La consigne contient des coordonnées (${contact.reasons.join(', ')}).`);
  }

  let dueAt: Date | undefined;
  if (input.dueAt) {
    const d = new Date(input.dueAt);
    const now = Date.now();
    if (isNaN(d.getTime()) || d.getTime() < now - DAY || d.getTime() > now + 90 * DAY) {
      return fail(400, 'Échéance invalide (dans les 90 prochains jours).');
    }
    dueAt = d;
  }

  const now = new Date();
  // Déjà terminée avant l'assignation (leçon lue, cours fini) ? Cochée d'office, sans points.
  const already = AUTO_DETECTED_KINDS.includes(input.kind) && input.kind !== 'quiz' && input.kind !== 'evaluation'
    ? await checkCompletion(input.kind, input.refId, id(m.student))
    : { done: false };

  m.assignments.push({
    kind: input.kind,
    refId: new mongoose.Types.ObjectId(input.refId),
    title: resolved.title,
    url: resolved.url,
    note: note || undefined,
    dueAt,
    assignedAt: now,
    doneAt: already.done ? now : undefined,
    doneSource: already.done ? 'auto' : undefined,
    alreadyDone: already.done,
    rewarded: already.done
  } as never);
  if (viewer === 'mentor') m.lastMentorActivityAt = now;
  await m.save();

  const a = m.assignments[m.assignments.length - 1];
  await systemMessage(m, note, {
    kind: 'resource', author: user.id, authorRole: viewer === 'mentor' ? 'mentor' : 'moderator', meta: { assignmentId: a._id }
  });
  if (!already.done) {
    await notify('mentorship_resource', id(m.student), user.id, id(m._id), 'Nouvelle ressource à faire', `${user.username} t’a proposé : ${resolved.title}`);
  }
  ping(m);
  return { ok: true };
}

export async function updateAssignment(
  m: IMentorship,
  viewer: SuiviViewerRole,
  user: SuiviUser,
  assignmentId: string,
  change: { done?: boolean; remove?: boolean }
): Promise<Result> {
  if (!isOpen(m)) return fail(409, 'Le suivi n’est pas en cours.');
  const a = m.assignments.id(assignmentId);
  if (!a) return fail(404, 'Ressource introuvable.');

  if (change.remove) {
    if (!isStaff(viewer)) return fail(403, 'Seul le bénévole retire une ressource.');
    a.deleteOne();
    await m.save();
    ping(m);
    return { ok: true };
  }

  if (typeof change.done !== 'boolean') return fail(400, 'Rien à modifier.');

  if (viewer === 'student') {
    // L'élève coche lui-même ce qui ne laisse pas de trace (exercice, fiche).
    // Le reste est détecté automatiquement : il ne peut pas se déclarer « fini ».
    if (AUTO_DETECTED_KINDS.includes(a.kind)) {
      return fail(409, 'Cette ressource se valide toute seule quand tu la termines sur Workyt.');
    }
    if (!change.done) return fail(409, 'Demande à ton bénévole si tu veux la rouvrir.');
  } else if (!isStaff(viewer)) {
    return fail(403, 'Action non autorisée.');
  }

  let reward = false;
  if (change.done && !a.doneAt) {
    a.doneAt = new Date();
    a.doneSource = viewer === 'student' ? 'student' : 'mentor';
    if (!a.rewarded) {
      a.rewarded = true;
      reward = true;
    }
  } else if (!change.done && a.doneAt) {
    a.doneAt = undefined;
    a.doneSource = undefined;
  } else {
    return { ok: true };
  }

  const now = new Date();
  if (viewer === 'student') m.lastStudentActivityAt = now;
  if (viewer === 'mentor') m.lastMentorActivityAt = now;
  await m.save();

  if (change.done) {
    const studentName = await usernameOf(m.student);
    await systemMessage(m, `${studentName} a terminé : ${a.title}`, { meta: { assignmentId: a._id, event: 'assignment_done' } });
    if (viewer === 'student' && m.mentor) {
      await notify('mentorship_update', id(m.mentor), user.id, id(m._id), `${studentName} a avancé`, `Ressource terminée : ${a.title}`);
    }
  }
  if (reward) await rewardAssignment(m);
  ping(m);
  return { ok: true };
}

/**
 * Détecte les ressources terminées depuis la dernière visite (quiz faits,
 * leçons lues, cours finis, évaluations rendues). Appelée à l'ouverture d'un
 * suivi, limitée à une passe toutes les 20 s par suivi.
 */
const lastSync = new Map<string, number>();

export async function syncAssignments(m: IMentorship): Promise<boolean> {
  if (!isOpen(m)) return false;
  const key = id(m._id);
  const now = Date.now();
  if ((lastSync.get(key) || 0) > now - 20_000) return false;
  lastSync.set(key, now);
  if (lastSync.size > 5000) lastSync.clear();

  const open = m.assignments.filter((a) => !a.doneAt && AUTO_DETECTED_KINDS.includes(a.kind));
  if (!open.length) return false;

  const studentId = id(m.student);
  const studentName = await usernameOf(m.student);
  let changed = false;
  let rewards = 0;

  for (const a of open) {
    const res = await checkCompletion(a.kind, id(a.refId), studentId, a.assignedAt);
    if (!res.done) continue;
    a.doneAt = new Date();
    a.doneSource = 'auto';
    if (typeof res.score === 'number') a.score = res.score;
    if (typeof res.maxScore === 'number') a.maxScore = res.maxScore;
    if (!a.rewarded) {
      a.rewarded = true;
      rewards++;
    }
    changed = true;
    const score = typeof res.score === 'number' && res.maxScore ? ` (${res.score}/${res.maxScore})` : '';
    await systemMessage(m, `${studentName} a terminé : ${a.title}${score}`, { meta: { assignmentId: a._id, event: 'assignment_done' } });
  }

  if (!changed) return false;
  m.lastStudentActivityAt = new Date();
  await m.save();
  for (let i = 0; i < rewards; i++) await rewardAssignment(m);
  if (m.mentor) {
    await notify('mentorship_update', id(m.mentor), studentId, key, `${studentName} a avancé`, 'Des ressources de son suivi viennent d’être terminées.', { dedupeUnread: true });
  }
  ping(m);
  return true;
}

// ─────────────────────────────────────────────────────────────
// Cycle de vie : notes, pause, relais, clôture
// ─────────────────────────────────────────────────────────────

export async function updateNotes(m: IMentorship, viewer: SuiviViewerRole, notes: string): Promise<Result> {
  if (!isStaff(viewer)) return fail(403, 'Action non autorisée.');
  const clean = String(notes || '').slice(0, 5000);
  m.mentorNotes = clean;
  await m.save();
  return { ok: true };
}

export async function setPaused(m: IMentorship, viewer: SuiviViewerRole, user: SuiviUser, paused: boolean): Promise<Result> {
  if (!isStaff(viewer)) return fail(403, 'Seul le bénévole met un suivi en pause.');
  if (paused && m.status !== 'active') return fail(409, 'Seul un suivi en cours peut être mis en pause.');
  if (!paused && m.status !== 'paused') return fail(409, 'Ce suivi n’est pas en pause.');

  const now = new Date();
  m.status = paused ? 'paused' : 'active';
  m.pausedAt = paused ? now : undefined;
  if (!paused) {
    // À la reprise, on repart d'une page propre pour les relances automatiques
    m.lastMentorActivityAt = now;
    m.nextCheckinAt = new Date(now.getTime() + CHECKIN_INTERVAL_DAYS * DAY);
  }
  await m.save();
  await systemMessage(m, paused ? 'Suivi mis en pause.' : 'Le suivi reprend.', { meta: { event: paused ? 'paused' : 'resumed' } });
  await notify('mentorship_update', id(m.student), user.id, id(m._id), paused ? 'Ton suivi est en pause' : 'Ton suivi reprend', `Suivi en ${m.subject}.`);
  ping(m);
  return { ok: true };
}

/**
 * Remet le suivi en file sans rien perdre. Utilisé quand le bénévole passe la
 * main (`released`) et par le relais automatique du cron (`timeout`).
 */
export async function releaseToQueue(
  m: IMentorship,
  reason: 'released' | 'timeout',
  note: string,
  actorId?: string
): Promise<Result> {
  if (!isOpen(m) || !m.mentor) return fail(409, 'Ce suivi n’est pas en cours.');
  const previousMentor = id(m.mentor);
  const now = new Date();

  const last = m.mentorHistory[m.mentorHistory.length - 1];
  if (last && !last.to) {
    last.to = now;
    last.reason = reason;
    last.note = note || undefined;
  }
  m.markModified('mentorHistory');
  m.mentor = null;
  m.status = 'pending';
  m.handoffNote = note || undefined;
  m.pausedAt = undefined;
  m.checkin = undefined;
  m.mentorReminderAt = undefined;
  m.escalatedAt = undefined;
  await m.save();

  await systemMessage(
    m,
    reason === 'timeout'
      ? 'Ton bénévole n’a pas pu répondre ces derniers jours. Ta demande repasse en priorité dans la file : un autre bénévole reprendra le suivi avec tout l’historique.'
      : 'Ton bénévole a dû passer la main. Ta demande repasse dans la file : un autre bénévole reprendra le suivi avec tout l’historique.',
    { meta: { event: reason } }
  );
  await notify('mentorship_update', id(m.student), actorId || previousMentor, id(m._id), 'Ton suivi change de bénévole', 'Un autre bénévole va reprendre ton suivi, sans rien perdre de ce que vous avez fait.');
  if (reason === 'timeout') {
    await notify('mentorship_update', previousMentor, previousMentor, id(m._id), 'Suivi remis en file', `Sans réponse de ta part depuis plusieurs jours, le suivi en ${m.subject} a été confié à la file. Aucun souci : ça arrive.`);
    await notifyModerators(previousMentor, id(m._id), 'Relais automatique', `Un suivi en ${m.subject} est revenu en file faute de réponse du bénévole.`);
  }
  void notifyAvailableMentors(m, previousMentor);
  ping(m);
  return { ok: true };
}

export async function releaseByMentor(m: IMentorship, viewer: SuiviViewerRole, user: SuiviUser, note: string): Promise<Result> {
  if (!isStaff(viewer)) return fail(403, 'Action non autorisée.');
  const clean = String(note || '').trim().slice(0, 500);
  if (viewer === 'mentor' && clean.length < 10) {
    return fail(400, 'Laisse quelques mots au bénévole suivant : où en est l’élève, ce qui marche avec lui.');
  }
  return releaseToQueue(m, 'released', clean, user.id);
}

export async function closeMentorship(
  m: IMentorship,
  viewer: SuiviViewerRole,
  user: SuiviUser,
  input: { outcome?: CloseOutcome; summary?: string; feedback?: 'helpful' | 'neutral' | 'not_helpful' }
): Promise<Result> {
  if (viewer === 'candidate') return fail(403, 'Action non autorisée.');
  if (!isOpen(m)) return fail(409, 'Ce suivi n’est pas en cours.');

  const summary = String(input.summary || '').trim().slice(0, 1000);
  let outcome: CloseOutcome | undefined = input.outcome;

  if (isStaff(viewer)) {
    if (!outcome || !['goal_reached', 'partial', 'stopped', 'no_response'].includes(outcome)) {
      return fail(400, 'Indique comment se termine le suivi.');
    }
    if (summary.length < 10) return fail(400, 'Écris un court bilan pour l’élève (10 caractères minimum).');
  } else {
    // L'élève peut arrêter quand il veut, sans avoir à se justifier
    outcome = 'stopped';
  }
  const contact = checkForContactDetails(summary);
  if (contact.blocked) return fail(422, `Le bilan contient des coordonnées (${contact.reasons.join(', ')}).`);

  const now = new Date();
  const last = m.mentorHistory[m.mentorHistory.length - 1];
  if (last && !last.to) {
    last.to = now;
    last.reason = 'closed';
  }
  m.markModified('mentorHistory');
  m.status = 'closed';
  m.closedAt = now;
  m.closure = {
    by: new mongoose.Types.ObjectId(user.id),
    outcome,
    summary: summary || undefined,
    studentFeedback: viewer === 'student' && input.feedback ? input.feedback : undefined
  };
  await m.save();

  await systemMessage(m, summary ? `Suivi terminé. Bilan : ${summary}` : 'Suivi terminé.', { meta: { event: 'closed' } });
  const others = [id(m.student), m.mentor ? id(m.mentor) : null].filter((x): x is string => !!x && x !== user.id);
  await Promise.all(
    others.map((r) => notify('mentorship_update', r, user.id, id(m._id), 'Suivi terminé', `Le suivi en ${m.subject} est terminé.`))
  );

  void safely('badges clôture élève', () => BadgeService.checkAndAwardBadges(id(m.student)));
  if (m.mentor) void safely('badges clôture bénévole', () => BadgeService.checkAndAwardBadges(id(m.mentor)));
  ping(m);
  return { ok: true };
}

/** Après la clôture, l'élève peut dire si le suivi l'a aidé (une seule fois) */
export async function giveFeedback(m: IMentorship, viewer: SuiviViewerRole, feedback: string): Promise<Result> {
  if (viewer !== 'student') return fail(403, 'Action non autorisée.');
  if (m.status !== 'closed') return fail(409, 'Le suivi n’est pas terminé.');
  if (!['helpful', 'neutral', 'not_helpful'].includes(feedback)) return fail(400, 'Avis invalide.');
  if (m.closure?.studentFeedback) return fail(409, 'Tu as déjà donné ton avis.');
  m.closure = { ...(m.closure || {}), studentFeedback: feedback as 'helpful' | 'neutral' | 'not_helpful' };
  await m.save();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Profil bénévole
// ─────────────────────────────────────────────────────────────

export async function saveMentorProfile(
  user: SuiviUser,
  input: { status?: string; maxActive?: number; subjects?: string[]; levels?: string[]; bio?: string; acceptCharter?: boolean; adultDeclared?: boolean }
): Promise<Result> {
  const update: Record<string, unknown> = {};
  if (input.status === 'available' || input.status === 'paused') update.status = input.status;
  if (typeof input.maxActive === 'number') update.maxActive = Math.max(1, Math.min(10, Math.round(input.maxActive)));
  if (Array.isArray(input.subjects)) update.subjects = input.subjects.filter((s) => educationData.subjects.includes(s)).slice(0, 20);
  if (Array.isArray(input.levels)) update.levels = input.levels.filter((l) => educationData.levels.includes(l)).slice(0, 20);
  if (typeof input.bio === 'string') {
    const bio = input.bio.trim().slice(0, 280);
    const contact = checkForContactDetails(bio);
    if (contact.blocked) return fail(422, `Ta présentation contient des coordonnées (${contact.reasons.join(', ')}).`);
    update.bio = bio;
  }
  if (input.acceptCharter) {
    if (!input.adultDeclared) return fail(400, 'Il faut être majeur pour accompagner des élèves en suivi.');
    update.charterAcceptedAt = new Date();
    update.adultDeclared = true;
  }
  await MentorProfile.findOneAndUpdate({ user: user.id }, { $set: update, $setOnInsert: { user: user.id } }, { upsert: true });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Série du binôme (appelée chaque semaine par le cron)
// ─────────────────────────────────────────────────────────────

/** Clé ISO de semaine, ex. « 2026-W38 » */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Fait avancer (ou retomber) la série de chaque binôme pour la semaine écoulée.
 * La série avance si l'élève a fait quelque chose ET que le bénévole a répondu.
 * Elle retombe à zéro sinon, sans aucune pénalité de points. Un suivi en pause
 * est gelé. Idempotent grâce à `lastWeekKey`.
 */
export async function advanceDuoStreaks(now: Date = new Date()): Promise<{ advanced: number; reset: number }> {
  // La semaine évaluée = les 7 jours qui précèdent le passage (lundi 00h20,
  // heure de Paris). On ne recalcule pas « lundi minuit » : le serveur tourne
  // en UTC et le cron en Europe/Paris, le calcul tomberait une semaine trop tôt.
  // La clé est prise au milieu de la semaine, loin de toute frontière de fuseau.
  const weekEnd = now;
  const weekStart = new Date(now.getTime() - 7 * DAY);
  const weekKey = isoWeekKey(new Date(now.getTime() - 3.5 * DAY));

  const mentorships = await Mentorship.find({
    status: 'active',
    mentor: { $ne: null },
    matchedAt: { $lt: weekEnd },
    'duoStreak.lastWeekKey': { $ne: weekKey }
  });

  let advanced = 0;
  let reset = 0;
  for (const m of mentorships) {
    const studentActive = !!m.lastStudentActivityAt && m.lastStudentActivityAt >= weekStart;
    const mentorActive = !!m.lastMentorActivityAt && m.lastMentorActivityAt >= weekStart;

    if (studentActive && mentorActive) {
      m.duoStreak.current += 1;
      m.duoStreak.best = Math.max(m.duoStreak.best, m.duoStreak.current);
      advanced++;
    } else {
      m.duoStreak.current = 0;
      reset++;
    }
    m.duoStreak.lastWeekKey = weekKey;
    await m.save();

    const current = m.duoStreak.current;
    if (studentActive && mentorActive && DUO_STREAK_MILESTONES.includes(current)) {
      const members = [id(m.student), id(m.mentor)];
      await systemMessage(m, `Série du binôme : ${current} semaines d’affilée ! Bravo à vous deux.`, { meta: { event: 'duo_streak' } });
      for (const member of members) {
        await safely('points série binôme', () =>
          addPointsWithBoost(member, POINTS.duoStreakMilestone, 'mentorshipDuoStreak', { mentorship: id(m._id) })
        );
        await safely('badges série binôme', () => BadgeService.checkAndAwardBadges(member));
        await notify('mentorship_update', member, members.find((x) => x !== member)!, id(m._id), `Série du binôme : ${current} semaines`, 'Vous tenez le rythme ensemble. Continuez !');
      }
      ping(m);
    }
  }
  return { advanced, reset };
}
